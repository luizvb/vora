'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Trophy, 
  Target, 
  Mic2, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Zap,
  Ear
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/app/context/UserContext';
import { getReportById, Report } from '@/lib/report-service';

export default function DashboardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { role } = useUser();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getReportById(id);
      setReport(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium tracking-wide">Scanning database for insights...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-4">
        <div className="p-4 rounded-full bg-red-500/10 text-red-400 mb-6">
          <AlertCircle className="w-16 h-16" />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-slate-100">Report Not Found</h1>
        <p className="text-slate-400 mb-8 text-center max-w-md">We couldn't find the requested report. It might have been deleted or doesn't exist.</p>
        <Button variant="outline" onClick={() => router.push('/analyze')} className="border-slate-800 text-slate-300 hover:bg-slate-900">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Analysis
        </Button>
      </div>
    );
  }

  // Circular Gauge Component
  const CircularGauge = ({ value }: { value: number }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    
    return (
      <div className="relative flex items-center justify-center w-48 h-48">
        <svg className="transform -rotate-90 w-48 h-48">
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-slate-800"
          />
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: offset }}
            strokeLinecap="round"
            className="text-indigo-500 transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-white">{value}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Score</span>
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 bg-slate-950 min-h-screen pb-20 pt-10 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 bg-slate-900/40 border border-slate-800/50 p-10 rounded-[32px] backdrop-blur-sm shadow-2xl">
          <div className="space-y-6 text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                {role === 'SALES_MANAGER' ? 'Manager View' : 'Representative View'}
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                Analysis Complete
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">
              VORA <span className="text-indigo-500">Results</span> Dashboard
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
              Based on our agent scan, your call shows high engagement but needs focus on technical closing signals.
            </p>
            <div className="flex items-center gap-4 pt-4 justify-center md:justify-start">
              <Button onClick={() => router.push('/analyze')} variant="outline" className="border-slate-800 hover:bg-slate-800 h-11 px-6 rounded-xl font-bold text-slate-300">
                <ArrowLeft className="w-4 h-4 mr-2" /> New Scan
              </Button>
              <Button className="bg-white hover:bg-slate-200 text-black h-11 px-6 rounded-xl font-bold">
                Download PDF
              </Button>
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-center gap-4 bg-slate-950/50 p-6 rounded-[24px] border border-slate-800/50">
            <CircularGauge value={report.overallScore} />
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-400/10 px-3 py-1 rounded-lg">
              <TrendingUp className="w-4 h-4" />
              +12% vs last call
            </div>
          </div>
        </div>

        {/* Linguistic Breakdown Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-slate-800/50 p-8 rounded-[24px] group hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                <Mic2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Filler Words</p>
                <p className="text-2xl font-black text-white">{report.linguisticStats.fillerWords}</p>
              </div>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, (report.linguisticStats.fillerWords / 50) * 100)}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-3 font-medium tracking-wide">Industry average: 12 per 10m</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/50 p-8 rounded-[24px] group hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tone Analysis</p>
                <p className="text-2xl font-black text-white">{report.linguisticStats.tone}</p>
              </div>
            </div>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`flex-1 h-2 rounded-full ${i <= 4 ? 'bg-blue-500' : 'bg-slate-800'}`} />
                ))}
            </div>
            <p className="text-xs text-slate-400 mt-3 font-medium tracking-wide">94% Confidence matched</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/50 p-8 rounded-[24px] group hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                <Ear className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Talk Ratio</p>
                <p className="text-2xl font-black text-white">{report.linguisticStats.talkTime}% / {100 - report.linguisticStats.talkTime}%</p>
              </div>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                <div className="bg-indigo-500 h-full" style={{ width: `${report.linguisticStats.talkTime}%` }} />
            </div>
            <div className="flex justify-between mt-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">You</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Customer</span>
            </div>
          </div>
        </div>

        {/* Feedback Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xl font-bold text-white tracking-tight">Winning Moments</h3>
            </div>
            {report.pros.map((pro, i) => (
              <div key={i} className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-2xl space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </div>
                <p className="text-emerald-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" /> Insight
                </p>
                <blockquote className="text-slate-300 font-medium italic border-l-2 border-emerald-500/30 pl-4 py-1">
                  "{pro.quote}"
                </blockquote>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {pro.analysis}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-indigo-400" />
              <h3 className="text-xl font-bold text-white tracking-tight">Growth Areas</h3>
            </div>
            {report.cons.map((con, i) => (
              <div key={i} className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-2xl space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                    <Target className="w-12 h-12 text-indigo-400" />
                </div>
                <p className="text-indigo-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-indigo-400" /> Focus Needed
                </p>
                <blockquote className="text-slate-300 font-medium italic border-l-2 border-indigo-500/30 pl-4 py-1">
                  "{con.quote}"
                </blockquote>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {con.analysis}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Plan Section */}
        <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[32px] space-y-8 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Target className="w-7 h-7 text-indigo-500" /> Action Plan
              </h2>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Top 3 priorities for your next call</p>
            </div>
            <div className="hidden sm:flex -space-x-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                        A{i}
                    </div>
                ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {report.actionPlan.map((action, i) => (
              <div key={i} className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl relative group hover:bg-slate-900/50 transition-all duration-300">
                <div className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${action.priority === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {action.priority}
                </div>
                <div className="text-indigo-500 font-black text-4xl opacity-20 mb-2">0{i+1}</div>
                <h4 className="text-white font-bold mb-2 pr-12">{action.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {action.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
