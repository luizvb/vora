import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
      <div className="flex items-center gap-3 mb-6">
        <Compass className="w-12 h-12 text-primary" />
        <h1 className="text-5xl font-bold tracking-tight">VORA</h1>
      </div>
      <p className="max-w-2xl mb-10 text-xl text-muted-foreground">
        The Vocal Oracle. Transforming raw sales transcripts into actionable coaching insights in under 60 seconds.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg" className="px-8 text-lg font-medium">
          <Link href="/onboarding">Get Started</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-24 max-w-4xl w-full text-left">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-primary">For Reps</h3>
          <p className="text-muted-foreground">
            Identify why deals stall and get objective feedback to close more.
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-primary">For Managers</h3>
          <p className="text-muted-foreground">
            Audit compliance and coach your team at scale without listening to every call.
          </p>
        </div>
      </div>
    </div>
  );
}
