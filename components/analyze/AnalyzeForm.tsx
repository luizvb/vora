'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';

interface AnalyzeFormProps {
  onAnalyze: (transcript: string) => void;
  uploadTitle?: string;
  uploadSubtitle?: string;
  placeholder?: string;
  submitLabel?: string;
}

export function AnalyzeForm({
  onAnalyze,
  uploadTitle = 'Drop your transcript here',
  uploadSubtitle = 'Supports .txt files',
  placeholder = 'Or paste your transcript here...',
  submitLabel = 'Analyze Transcript',
}: AnalyzeFormProps) {
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-[11px] p-8 transition-all cursor-pointer
          flex flex-col items-center justify-center gap-3
          ${isDragging ? 'border-[#3B8FD4] bg-[#EBF4FF]' : 'border-[#DCE4EA] bg-[#F5F9FF] hover:border-[#3B8FD4]/60'}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          accept=".txt"
          className="hidden"
        />
        <div className="rounded-full bg-[#EBF4FF] p-3 text-[#1E4A6E]">
          <Upload className="w-6 h-6" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#1A2530]">{uploadTitle}</p>
          <p className="mt-1 text-xs text-[#607080]">{uploadSubtitle}</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-4 text-[#9AABB8]">
          <FileText className="w-4 h-4" />
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={placeholder}
          className="h-48 w-full resize-none rounded-[11px] border border-[#DCE4EA] bg-white p-4 pl-12 text-sm text-[#1A2530] transition-all placeholder:text-[#9AABB8] focus:border-[#3B8FD4] focus:outline-none"
        />
      </div>

      <Button
        type="submit"
        disabled={!transcript.trim()}
        className="h-12 w-full rounded-[9px] bg-[#1E4A6E] text-base font-semibold text-white shadow-none hover:bg-[#2B6CB0]"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
