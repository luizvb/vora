'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, UserRole } from '../context/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OnboardingPage() {
  const router = useRouter();
  const { setRole } = useUser();
  const [selected, setSelected] = useState<UserRole>(null);

  const handleRoleSelection = (role: UserRole) => {
    setRole(role);
    setSelected(role);
    console.log('Role selected:', role);
  };

  if (selected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
        <CheckCircle2 className="w-20 h-20 text-accent mb-6 animate-in zoom-in duration-500" />
        <h1 className="text-4xl font-bold mb-4">You're all set!</h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-md text-center">
          As a {selected === 'SALES_REP' ? 'Sales Rep' : 'Sales Manager'}, we've tailored the coaching engine for you.
        </p>
        <Button asChild size="lg">
          <Link href="/analyze">Start Analysis</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
      <h1 className="text-3xl font-bold mb-12 text-center">Who are you?</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Card 
          className="cursor-pointer border-2 border-transparent hover:border-primary transition-all duration-300 p-6 group flex flex-col items-center text-center"
          onClick={() => handleRoleSelection('SALES_REP')}
        >
          <CardHeader className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">I am a Sales Rep</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-lg">
              Focus on self-improvement, personal coaching, and closing more deals.
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer border-2 border-transparent hover:border-primary transition-all duration-300 p-6 group flex flex-col items-center text-center"
          onClick={() => handleRoleSelection('SALES_MANAGER')}
        >
          <CardHeader className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">I am a Sales Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-lg">
              Focus on team auditing, compliance, and strategic coaching insights.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
