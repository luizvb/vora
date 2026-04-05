'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  History, 
  BarChart3, 
  Settings, 
  MessageSquare,
  ChevronRight,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import { getDb } from '@/lib/db';
import { useRouter, usePathname } from 'next/navigation';

export function Sidebar() {
  const [reports, setReports] = useState<any[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadReports() {
      const db = await getDb();
      if (!db) return;
      
      const result = await db.query('SELECT id, "overallScore", "createdAt" FROM "Report" ORDER BY "createdAt" DESC LIMIT 20');
      setReports(result.rows);
    }
    
    loadReports();
    
    // Refresh periodically if we are on dashboard
    const interval = setInterval(loadReports, 10000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (id: string) => pathname.includes(`/dashboard/${id}`);

  return (
    <div className="w-72 h-full bg-slate-950 border-r border-slate-800 flex flex-col hidden md:flex">
      {/* Header */}
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl tracking-tight text-white italic">VORA</span>
        </div>
        
        <button 
          onClick={() => router.push('/analyze')}
          className="w-full h-11 bg-white hover:bg-slate-200 text-black rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> New Analysis
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        {/* Menu Section */}
        <div className="space-y-1">
          <p className="px-2 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Platform</p>
          <button 
            onClick={() => router.push('/analyze')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${pathname === '/analyze' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'}`}
          >
            <Search className="w-4 h-4" /> Scan Transcript
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-900 opacity-50 cursor-not-allowed">
            <BarChart3 className="w-4 h-4" /> Global Metrics
          </button>
        </div>

        {/* History Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Recent Sessions</p>
            <History className="w-3 h-3 text-slate-600" />
          </div>
          
          <div className="space-y-1">
            {reports.length === 0 ? (
              <p className="px-3 py-4 text-xs text-slate-600 italic">No previous scans found.</p>
            ) : (
              reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => router.push(`/dashboard/${report.id}`)}
                  className={`w-full group flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive(report.id) ? 'bg-slate-900 border border-slate-800' : 'hover:bg-slate-900/50'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${isActive(report.id) ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {report.overallScore}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className={`text-xs font-bold truncate ${isActive(report.id) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                      Session {report.id.substring(0, 6)}
                    </p>
                    <p className="text-[10px] text-slate-600 font-medium">
                      {new Date(report.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${isActive(report.id) ? 'text-indigo-400 translate-x-0' : 'text-slate-700 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer / Profile */}
      <div className="p-4 border-t border-slate-800/50">
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-slate-900/50 border border-slate-800/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white">
            LN
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Luiz Neto</p>
            <p className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-tighter">Pro Account</p>
          </div>
          <Settings className="w-4 h-4 text-slate-600 hover:text-slate-300 cursor-pointer transition-colors" />
        </div>
      </div>
    </div>
  );
}
