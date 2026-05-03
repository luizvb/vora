import { expect, test, type Page } from "@playwright/test";

const reportId = "33333333-3333-4333-8333-333333333333";

async function mockAnalyze(page: Page) {
  await page.route("**/api/analyze", async (route) => {
    const body = [
      event({ agent: "supervisor", status: "Routing to coach..." }),
      event({ agent: "coach", status: "Analyzing transcript..." }),
      event({ agent: "supervisor", status: "Routing to linguistics..." }),
      event({ agent: "linguistics", status: "Analyzing transcript..." }),
      event({
        done: true,
        report: {
          id: reportId,
          userId: "00000000-0000-0000-0000-000000000001",
          transcript: "E2E transcript",
          overallScore: 88,
          pros: [
            { quote: "Clear framing", analysis: "The session framed the real issue clearly." },
          ],
          cons: [
            { quote: "Sharper ask needed", analysis: "The next step should be more concrete." },
          ],
          linguisticStats: { fillerWords: 1, tone: "Steady", talkTime: 54 },
          actionPlan: [
            { title: "Name the ask", description: "State the decision you need in one sentence.", priority: "high" },
          ],
          agentDetails: [
            { agent: "coach", feedback: "Strong coaching signal.", metrics: { rapportScore: 0.9 } },
          ],
          createdAt: new Date().toISOString(),
        },
      }),
    ].join("");

    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body,
    });
  });
}

function event(payload: Record<string, unknown>) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

test.describe("CaaSy", () => {
  test.beforeEach(async ({ page }) => {
    await mockAnalyze(page);
    await page.goto("/");
    await page.evaluate(() => window.localStorage.removeItem("caasy-e2e-reports"));
  });

  test("access page lets authenticated users open the dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Welcome, E2E User")).toBeVisible();
    await page.getByRole("button", { name: /open dashboard/i }).click();

    await expect(page).toHaveURL(/\/dashboard\?role=individual&view=home/);
    await expect(page.getByText("Your CaaSy coaching dashboard")).toBeVisible();
    await expect(page.getByRole("complementary").getByText("E2E User")).toBeVisible();
  });

  test("dashboard renders only real empty state before any session is saved", async ({ page }) => {
    await page.goto("/dashboard?role=individual&view=home");

    await expect(page.getByText("Start your first coaching session to build a private performance history.")).toBeVisible();
    await expect(page.getByRole("main").getByRole("button", { name: "Coach my Call", exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByRole("button", { name: "Coach Me", exact: true })).toBeVisible();
    await expect(page.getByText("Pipeline Intelligence")).toHaveCount(0);
  });

  test("coach my call analyzes a transcript, saves history, and opens report detail", async ({ page }) => {
    await page.goto("/dashboard?role=individual&view=coach-call");

    await expect(page.getByRole("heading", { name: "Improve your next sales call." })).toBeVisible();
    await page.locator("main textarea").fill("Seller: What outcome matters? Buyer: Scope clarity.");
    await expect(page.getByRole("button", { name: "Analyze Transcript" })).toBeEnabled();
    await page.getByRole("button", { name: "Analyze Transcript" }).click();

    await expect(page.getByText("CaaSy is coaching")).toBeVisible();
    await expect(page.getByText("View Coaching Report")).toBeVisible();
    await page.getByRole("button", { name: /view coaching report/i }).click();

    await expect(page).toHaveURL(new RegExp(`/dashboard/${reportId}`));
    await expect(page.getByText("CaaSy Sales Call Coaching Report")).toBeVisible();
    await expect(page.getByText("Clear framing")).toBeVisible();

    await page.goto("/dashboard?role=individual&view=my-sessions");
    await expect(page.getByText("Name the ask")).toBeVisible();
  });

  test("coach me behaves like a chat session and saves a coaching report", async ({ page }) => {
    await page.goto("/dashboard?role=individual&view=coach-me");

    await expect(page.getByText("Private coaching session")).toBeVisible();
    await page.locator("main textarea").fill("I need to ask for scope clarity without sounding defensive.");
    await expect(page.getByLabel("Start coaching session")).toBeEnabled();
    await page.getByLabel("Start coaching session").click();

    await expect(page.getByText("CaaSy is coaching")).toBeVisible();
    await expect(page.getByText("View Coaching Report")).toBeVisible();
    await page.getByRole("button", { name: /view coaching report/i }).click();

    await expect(page.getByText("CaaSy Personal Coaching Report")).toBeVisible();
    await expect(page.getByText("Session input")).toBeVisible();
    await expect(page.getByText("I need to ask for scope clarity without sounding defensive.")).toBeVisible();
  });

  test("unknown views show coming soon", async ({ page }) => {
    await page.goto("/dashboard?role=individual&view=unknown");

    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  test("mobile layout exposes the stripped-down coaching actions", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/dashboard?role=individual&view=home");

    await expect(page.getByText("Sales and personal coaching.")).toBeVisible();
    await expect(page.getByRole("button", { name: /coach my call/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /coach me/i })).toBeVisible();
  });
});
