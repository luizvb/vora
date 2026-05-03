import { CaasyDashboard } from "@/components/caasy/CaasyDashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; view?: string }>;
}) {
  const params = await searchParams;
  return <CaasyDashboard initialRole={params.role} initialView={params.view} />;
}
