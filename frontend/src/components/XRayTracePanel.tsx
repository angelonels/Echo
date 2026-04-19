import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Search, ShieldCheck, Sparkles, Binary, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { XRayEventContent } from '@/hooks/useEchoChat';

interface XRayTracePanelProps {
  xrayState: XRayEventContent;
}

export function XRayTracePanel({ xrayState }: XRayTracePanelProps) {
  return (
    <Card className="flex flex-col h-full bg-zinc-950/60 border-zinc-800/80 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
      <CardHeader className="border-b border-zinc-800/50 bg-zinc-900/30 p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Binary className="w-4 h-4 text-emerald-400" />
            Execution Trace
          </CardTitle>
          <Badge variant="outline" className="bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 hover:text-emerald-300 border-emerald-400/20 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md">
            Live
          </Badge>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4 lg:p-6">
        <div className="space-y-6 pb-6">
          
          {xrayState.status === 'idle' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-40 text-center space-y-3 mt-10">
              <Sparkles className="w-8 h-8 text-zinc-700" />
              <p className="text-xs text-zinc-500 font-medium tracking-wide">Awaiting pipeline execution...</p>
            </motion.div>
          )}

          {xrayState.status === 'initializing' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span className="text-sm font-medium tracking-wide text-zinc-300">Initializing Graph...</span>
            </motion.div>
          )}

          <AnimatePresence>
            {(xrayState.status === 'expanding' || xrayState.queries) && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 text-xs uppercase text-zinc-500 font-semibold tracking-widest px-1">
                  <Search className="w-3.5 h-3.5 text-indigo-400" />
                  <span>1. Query Expansion</span>
                </div>
                {xrayState.queries ? (
                  <Accordion className="w-full">
                    <AccordionItem value="queries" className="border-zinc-800/50 bg-zinc-900/40 rounded-xl overflow-hidden px-1">
                      <AccordionTrigger className="text-sm text-zinc-300 hover:no-underline py-3 px-3 hover:bg-zinc-800/30 rounded-lg transition-colors">
                        View Parallax Queries ({xrayState.queries.length})
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3 space-y-2">
                        {xrayState.queries.map((q, i) => (
                          <div key={i} className="text-xs bg-zinc-950/50 text-zinc-400 px-3 py-2 rounded-lg border border-zinc-800">
                            {q}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <div className="text-xs text-indigo-400/80 animate-pulse pl-7 font-medium">Generating semantic variations...</div>
                )}
              </motion.div>
            )}

            {(xrayState.status === 'retrieved' || xrayState.docs) && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3 mt-6"
              >
                <div className="flex items-center gap-2 text-xs uppercase text-zinc-500 font-semibold tracking-widest px-1">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>2. RRF Hybrid Retrieval</span>
                </div>
                {xrayState.docs ? (
                  <div className="space-y-3">
                    {xrayState.docs.map((doc, i) => (
                      <Card key={i} className="bg-zinc-900/40 border-zinc-800/50 overflow-hidden">
                        <CardHeader className="py-2 px-3 border-b border-zinc-800/50 bg-black/20 flex flex-row items-center justify-between">
                          <span className="text-[10px] font-mono text-cyan-400/80">Result {i+1}</span>
                          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] py-0">
                            {doc.score} RRF
                          </Badge>
                        </CardHeader>
                        <CardContent className="p-3 text-xs leading-relaxed text-zinc-400 line-clamp-3">
                          {doc.content}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-cyan-400/80 animate-pulse pl-7 font-medium">Executing parallel vector & keyword search...</div>
                )}
              </motion.div>
            )}

            {(xrayState.status === 'grading' || xrayState.passedGrading !== undefined || xrayState.status === 'generating' || xrayState.status === 'done') && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3 mt-6"
              >
                <div className="flex items-center gap-2 text-xs uppercase text-zinc-500 font-semibold tracking-widest px-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3. Context Skeptic Eval</span>
                </div>
                {xrayState.passedGrading !== undefined ? (
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    xrayState.passedGrading 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {xrayState.passedGrading ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                    <div className="text-sm font-medium leading-tight">
                      {xrayState.passedGrading 
                        ? 'Grounding established. Authorizing generation.' 
                        : 'Insufficient context. Denying generation to prevent hallucination.'}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400/80 animate-pulse pl-7 font-medium">Evaluating node relevance...</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
      </ScrollArea>
    </Card>
  );
}
