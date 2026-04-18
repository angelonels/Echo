"use client";

import { useEffect, useState } from "react";
import { useEchoChat } from "@/hooks/useEchoChat";
import { ChatInterface } from "@/components/ChatInterface";
import { XRayTracePanel } from "@/components/XRayTracePanel";
import { IngestionDropzone } from "@/components/IngestionDropzone";

export default function Home() {
  const [threadId, setThreadId] = useState<string>("");

  useEffect(() => {
    // Generate or retrieve thread ID for checkpointer
    const stored = localStorage.getItem("echo_thread_id");
    if (stored) {
      setThreadId(stored);
    } else {
      const newId = crypto.randomUUID();
      localStorage.setItem("echo_thread_id", newId);
      setThreadId(newId);
    }
  }, []);

  const { messages, isStreaming, xrayState, sendMessage, messagesEndRef } = useEchoChat(threadId);

  if (!threadId) return null; // Avoid hydration flash

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center p-4 sm:p-8 font-sans selection:bg-indigo-500/30">
      <header className="max-w-7xl w-full flex justify-between items-center py-6 mb-8 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white/90">Echo</h1>
        </div>
        <div className="hidden sm:flex text-xs uppercase tracking-widest text-zinc-500 font-semibold px-4 py-2 bg-zinc-900/50 rounded-full border border-zinc-800">
          Admin Environment
        </div>
      </header>

      <main className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-[750px]">
        {/* LEFT COLUMN: Upload & Chat */}
        <div className="lg:col-span-7 flex flex-col h-full space-y-6">
          <IngestionDropzone />
          
          <div className="flex-1 min-h-0 bg-transparent rounded-3xl relative z-10 w-full">
            <div className="absolute inset-x-4 inset-y-0 bg-indigo-500/5 blur-3xl -z-10 rounded-full" />
            <ChatInterface 
              messages={messages} 
              isStreaming={isStreaming} 
              sendMessage={sendMessage} 
              messagesEndRef={messagesEndRef} 
            />
          </div>
        </div>

        {/* RIGHT COLUMN: X-Ray Panel */}
        <div className="lg:col-span-5 flex flex-col h-[750px]">
          <XRayTracePanel xrayState={xrayState} />
        </div>
      </main>
    </div>
  );
}
