import { runAnalysis } from "./lib/langchain/graph";

async function debug() {
  console.log("Starting analysis debug...");
  try {
    const transcript = "Sales Rep: Hello. Customer: Hi. Sales Rep: Do you want to buy? Customer: Yes.";
    const results = await runAnalysis(transcript);
    console.log("Analysis results:", JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("Analysis failed:", error);
  }
}

debug();
