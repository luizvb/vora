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

export function AgentMonitor({ 
  transcript, 
  onComplete 
}: { 
  transcript: string;
  onComplete: (reportId: string) => void 
}) {
  const { role } = useUser();
  const [logs, setLogs] = useState<Log[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const startStreaming = async () => {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript,
            userId: 'user_007', 
            tenantId: 'tenant_default',
            sessionId: crypto.randomUUID()
          })
        });

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
                // Save the report to PGlite
                const id = await createReport("user_007", role, transcript, data.report);
                setReportId(id);
                setIsFinished(true);
                return;
              }

              if (data.error) {
                console.error("Stream error:", data.error);
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
        console.error("Streaming failed:", error);
        setIsFinished(true);
      }
    };

    startStreaming();
  }, [transcript, role]);

  const mapAgentName = (name: string): Log['agent'] => {
    const n = name.toLowerCase();
    if (n === 'sales') return 'Sales';
    if (n === 'coach') return 'Coach';
    if (n === 'linguistics') return 'Linguistics';
    if (n === 'analyst') return 'Analyst';
    if (n === 'supervisor') return 'Supervisor';
    return 'Supervisor';
  };

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
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Real-time Agent Monitor</span>
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
          {!isFinished && (
            <div className="flex gap-3 animate-pulse">
              <span className="text-slate-600">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
              <span className="text-slate-500">_</span>
            </div>
          )}
        </div>
      </div>

      {isFinished && reportId && (
        <div className="flex justify-center animate-in fade-in zoom-in-95 duration-500">
          <Button 
            onClick={() => onComplete(reportId)}
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
