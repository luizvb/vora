'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';

interface AnalyzeFormProps {
  onAnalyze: (transcript: string) => void;
}

export function AnalyzeForm({ onAnalyze }: AnalyzeFormProps) {
  const [transcript, setTranscript] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transcript.trim()) {
      onAnalyze(transcript);
    }
  };

  const handleFileUpload = (file: File) => {
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setTranscript(text);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a .txt file');
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
          flex flex-col items-center justify-center gap-3
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          accept=".txt"
          className="hidden"
        />
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <Upload className="w-6 h-6" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Drop your transcript here</p>
          <p className="text-xs text-muted-foreground mt-1">Supports .txt files</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-4 text-muted-foreground">
          <FileText className="w-4 h-4" />
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Or paste your transcript here..."
          className="w-full h-48 bg-slate-900/50 border border-border rounded-xl p-4 pl-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={!transcript.trim()}
        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
      >
        Analyze Transcript
      </Button>
    </form>
  );
}
