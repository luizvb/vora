'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@/app/context/UserContext';
import { Button } from '@/components/ui/button';
import { Terminal, Shield, Target, Lightbulb, ChevronRight, UserCog } from 'lucide-react';
import { createReport } from '@/lib/report-service';

interface Log {
  id: string;
  agent: 'Linguistics' | 'Sales' | 'Coach' | 'Analyst' | 'Supervisor';
  message: string;
  timestamp: string;
}

const mapAgentName = (name: string): Log['agent'] => {
  const n = name.toLowerCase();
  if (n === 'sales') return 'Sales';
  if (n === 'coach') return 'Coach';
  if (n === 'linguistics') return 'Linguistics';
  if (n === 'analyst') return 'Analyst';
  if (n === 'supervisor') return 'Supervisor';
  return 'Supervisor';
};

export function AgentMonitor({ 
  transcript, 
  onComplete,
  mode = "coach_call",
}: { 
  transcript: string;
  onComplete: (reportId: string) => void;
  mode?: "coach_call" | "coach_me";
}) {
  const { role, user } = useUser();
  const [logs, setLogs] = useState<Log[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const startStreaming = async () => {
      try {
        if (!user) {
          throw new Error("You must be signed in to start a coaching session.");
        }

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript,
            userId: user.id,
            sessionId: crypto.randomUUID()
          })
        });

        if (!response.ok) {
          throw new Error(`Analysis request failed with status ${response.status}.`);
        }

        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.done) {
                const id = await createReport(user.id, role, transcript, data.report, mode);
                setReportId(id);
                setIsFinished(true);
                return;
              }

              if (data.error) {
                setErrorMessage(data.error);
                setIsFinished(true);
                return;
              }

              const newLog: Log = {
                id: Math.random().toString(36).substring(7),
                agent: mapAgentName(data.agent),
                message: data.status,
                timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              };
              setLogs(prev => [...prev, newLog]);
            } catch (e) {
              console.error("Error parsing stream chunk", e);
            }
          }
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "The coaching session failed.");
        setIsFinished(true);
      }
    };

    startStreaming();
  }, [mode, transcript, role, user]);

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
      case 'Supervisor': return <UserCog className="w-3 h-3" />;
      default: return null;
    }
  };

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'Linguistics': return 'text-indigo-400';
      case 'Sales': return 'text-emerald-400';
      case 'Coach': return 'text-amber-400';
      case 'Analyst': return 'text-rose-400';
      case 'Supervisor': return 'text-purple-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="overflow-hidden rounded-[11px] border border-[#E4E9ED] bg-white">
        <div className="flex items-center gap-2 border-b border-[#E4E9ED] bg-[#F5F9FF] px-4 py-2">
          <Terminal className="w-4 h-4 text-[#607080]" />
          <span className="font-mono text-xs uppercase tracking-widest text-[#607080]">CaaSy is coaching</span>
          <div className="flex gap-1.5 ml-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-[#DCE4EA]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#DCE4EA]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 animate-pulse"></div>
          </div>
        </div>
        
        <div 
          ref={logContainerRef}
          className="p-6 h-80 overflow-y-auto font-mono text-xs space-y-2 scroll-smooth"
        >
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="shrink-0 text-[#9AABB8]">[{log.timestamp}]</span>
              <div className={`flex items-center gap-1.5 font-bold uppercase tracking-tight shrink-0 ${getAgentColor(log.agent)}`}>
                {getAgentIcon(log.agent)}
                <span>{log.agent}</span>
              </div>
              <span className="text-[#2E4050]">{log.message}</span>
            </div>
          ))}
          {!isFinished && (
            <div className="flex gap-3 animate-pulse">
              <span className="text-[#9AABB8]">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
              <span className="text-[#607080]">_</span>
            </div>
          )}
        </div>
      </div>

      {isFinished && reportId && (
        <div className="flex justify-center animate-in fade-in zoom-in-95 duration-500">
          <Button 
            onClick={() => onComplete(reportId)}
            className="group h-12 rounded-[9px] bg-[#1D8A5E] px-8 text-white shadow-none hover:bg-[#16744F]"
          >
            View Coaching Report
            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      )}

      {isFinished && errorMessage && (
        <div className="rounded-[11px] border border-[#C03030]/20 bg-[#FDF0F0] p-4 text-sm leading-6 text-[#C03030]">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
