import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress';
import { buildApiUrl } from '@/lib/api';

export function IngestionDropzone() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && uploadState !== 'uploading') {
      setFile(acceptedFiles[0]);
      setUploadState('idle');
      setProgress(0);
    }
  }, [uploadState]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: uploadState === 'uploading'
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploadState('uploading');
    setProgress(10); // Start progress slightly

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Fake progress for visual feedback since XMLHttpRequest is painful
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 85));
      }, 500);

      const response = await fetch(buildApiUrl('upload'), {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      if (response.ok) {
        setUploadState('success');
        setTimeout(() => {
           setUploadState('idle');
           setFile(null);
        }, 3000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      setUploadState('error');
    }
  };

  return (
    <div className="bg-zinc-950/40 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-indigo-400" />
          Ingest Knowledge
        </h2>
        
        {file && uploadState === 'idle' && (
          <button
            onClick={handleUpload}
            className="text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-full transition-all shadow-md active:scale-95"
          >
            Process Document
          </button>
        )}
      </div>

      <div 
        {...getRootProps()} 
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out px-6 py-8 flex flex-col items-center justify-center text-center cursor-pointer group
          ${isDragActive ? 'border-indigo-400 bg-indigo-500/5' : 'border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50'}
          ${uploadState === 'uploading' ? 'pointer-events-none opacity-80' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {uploadState === 'uploading' ? (
          <div className="space-y-4 w-full flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-xs text-zinc-400 font-medium">
                <span>Chunking & Embedding</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full">
                <ProgressTrack className="h-2 bg-zinc-800">
                  <ProgressIndicator className="bg-indigo-500 transition-all duration-500 ease-out" />
                </ProgressTrack>
              </Progress>
            </div>
          </div>
        ) : uploadState === 'success' ? (
          <div className="space-y-2 flex flex-col items-center text-emerald-400">
            <CheckCircle className="w-10 h-10 mb-1" />
            <p className="text-sm font-semibold">Ingestion Complete</p>
          </div>
        ) : uploadState === 'error' ? (
          <div className="space-y-2 flex flex-col items-center text-red-500">
            <AlertCircle className="w-10 h-10 mb-1" />
            <p className="text-sm font-semibold">Failed to process document</p>
          </div>
        ) : file ? (
          <div className="space-y-2 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-200">{file.name}</p>
            <p className="text-xs text-zinc-500 font-medium">Ready for indexing</p>
          </div>
        ) : (
          <div className="space-y-3 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-zinc-800/50 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform border border-zinc-700/50">
              <UploadCloud className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-300">Drag & drop or <span className="text-indigo-400">browse</span></p>
              <p className="text-xs text-zinc-500 mt-1">Supports PDF & Plain Text files</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
