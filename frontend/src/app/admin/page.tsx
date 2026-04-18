"use client"

import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { LineChart, LayoutDashboard, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AdminPage() {
  const [triggering, setTriggering] = useState<boolean>(false);

  const firePipeline = async () => {
     setTriggering(true);
     try {
       await fetch('http://localhost:3001/analytics/trigger', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ step: 'full' })
       });
     } catch (e) {}
     
     // Quick delay to let DB settle before SWR ticks
     setTimeout(() => {
        setTriggering(false);
     }, 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 font-sans selection:bg-indigo-500/30 w-full">
      <header className="max-w-7xl mx-auto w-full flex justify-between items-center py-6 mb-8 mt-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)] border border-indigo-400/20">
            <LineChart className="w-5 h-5 text-white" />
          </div>
          <div>
             <h1 className="text-2xl font-bold tracking-tight text-white/90">Intelligence Dashboard</h1>
             <p className="text-xs text-zinc-400 font-medium tracking-wide">Map-Reduce Workload Overview</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
             onClick={firePipeline}
             disabled={triggering}
             className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg transition-all active:scale-95 disabled:opacity-50"
          >
             <RefreshCw className={`w-3.5 h-3.5 ${triggering ? 'animate-spin text-indigo-400' : ''}`} />
             {triggering ? 'Running Pipeline...' : 'Force Analysis'}
          </button>
          
          <Link href="/">
             <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400 font-semibold px-4 py-2.5 bg-zinc-900/50 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                Live Widget
             </div>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full">
         <AnalyticsDashboard />
      </main>
    </div>
  );
}
