import { redirect } from "next/navigation";

export default function AnalyzeRedirect() {
  redirect("/dashboard?role=sales&view=coach-call");
}
