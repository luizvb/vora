'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@/app/context/UserContext';
import { Button } from '@/components/ui/button';
import { Terminal, Shield, Target, Lightbulb, ChevronRight } from 'lucide-react';

interface Log {
  id: string;
  agent: 'Linguistics' | 'Sales' | 'Coach' | 'Analyst';
  message: string;
  timestamp: string;
}

export function AgentMonitor({ onComplete }: { onComplete: () => void }) {
  const { role } = useUser();
  const [logs, setLogs] = useState<Log[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const linguisticsLogs = [
    "Scanning for filler words...",
    "Pace detected: 145 words per minute",
    "Sentence complexity analysis in progress...",
    "Clarity Index: 9.4/10",
  ];

  const salesLogs = [
    "Identifying closing signals...",
    "Objection detected at line 42",
    "Trial close attempt found: Success",
    "Analyzing 'The Ask' effectiveness...",
  ];

  const coachLogs = [
    "Rapport building assessment...",
    "Listening vs. talking ratio calculation...",
    "Empathy markers identified...",
    "Personal growth suggestions generated...",
  ];

  const analystLogs = [
    "ROI figures verification...",
    "Business impact mapping...",
    "Value proposition strength score...",
    "Strategic alignment check...",
  ];

  useEffect(() => {
    let currentLogIndex = 0;
    const allLogsTemplates = [
      ...linguisticsLogs.map(m => ({ agent: 'Linguistics' as const, message: m })),
      ...salesLogs.map(m => ({ agent: 'Sales' as const, message: m })),
      ...coachLogs.map(m => ({ agent: 'Coach' as const, message: m })),
      ...analystLogs.map(m => ({ agent: 'Analyst' as const, message: m })),
    ].sort(() => Math.random() - 0.5);

    const interval = setInterval(() => {
      if (currentLogIndex < allLogsTemplates.length) {
        const template = allLogsTemplates[currentLogIndex];
        const newLog: Log = {
          id: Math.random().toString(36).substring(7),
          ...template,
          timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setLogs(prev => [...prev, newLog]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsFinished(true), 1000);
      }
    }, 450); // 15 logs * 450ms = ~6.7 seconds

    return () => clearInterval(interval);
  }, [role]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'Linguistics': return <Target className="w-3 h-3" />;
      case 'Sales': return <Shield className="w-3 h-3" />;
      case 'Coach': return <Lightbulb className="w-3 h-3" />;
      case 'Analyst': return <ChevronRight className="w-3 h-3" />;
      default: return null;
    }
  };

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'Linguistics': return 'text-indigo-400';
      case 'Sales': return 'text-emerald-400';
      case 'Coach': return 'text-amber-400';
      case 'Analyst': return 'text-rose-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Agent Monitor</span>
          <div className="flex gap-1.5 ml-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 animate-pulse"></div>
          </div>
        </div>
        
        <div 
          ref={logContainerRef}
          className="p-6 h-80 overflow-y-auto font-mono text-xs space-y-2 scroll-smooth"
        >
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
              <div className={`flex items-center gap-1.5 font-bold uppercase tracking-tight shrink-0 ${getAgentColor(log.agent)}`}>
                {getAgentIcon(log.agent)}
                <span>{log.agent}</span>
              </div>
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))}
          {!isFinished && logs.length < 15 && (
            <div className="flex gap-3 animate-pulse">
              <span className="text-slate-600">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
              <span className="text-slate-500">_</span>
            </div>
          )}
        </div>
      </div>

      {isFinished && (
        <div className="flex justify-center animate-in fade-in zoom-in-95 duration-500">
          <Button 
            onClick={onComplete}
            className="group h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
          >
            View Full Report
            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      )}
    </div>
  );
}
