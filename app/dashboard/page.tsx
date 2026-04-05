'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/analyze');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500 font-mono text-xs uppercase tracking-widest">
      Redirecting to analysis...
    </div>
  );
}
