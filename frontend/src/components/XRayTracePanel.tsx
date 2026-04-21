"use client"

import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Binary,
  CheckCircle2,
  Database,
  Search,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { XRayEventContent } from "@/hooks/useEchoChat"

export function XRayTracePanel({ xrayState }: { xrayState: XRayEventContent }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[rgba(7,16,26,0.88)] shadow-[0_32px_100px_-62px_rgba(15,140,240,0.42)]">
      <CardHeader className="border-b border-white/8 bg-white/4 p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-200">
            <Binary className="size-4 text-[var(--echo-accent)]" />
            Retrieval trace
          </CardTitle>
          <Badge
            variant="outline"
            className="border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300"
          >
            Live
          </Badge>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4 lg:p-6">
        <div className="space-y-6 pb-6">
          {xrayState.status === "idle" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-10 flex h-40 flex-col items-center justify-center space-y-3 text-center"
            >
              <Sparkles className="size-8 text-zinc-700" />
              <p className="text-xs font-medium tracking-wide text-zinc-500">
                Awaiting a playground request...
              </p>
            </motion.div>
          ) : null}

          {xrayState.status === "initializing" ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 p-3"
            >
              <div className="size-4 animate-spin rounded-full border-2 border-[var(--echo-accent)] border-t-transparent" />
              <span className="text-sm font-medium tracking-wide text-zinc-300">
                Initializing retrieval graph...
              </span>
            </motion.div>
          ) : null}

          <AnimatePresence>
            {xrayState.status === "expanding" || xrayState.queries ? (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  <Search className="size-3.5 text-[var(--echo-accent)]" />
                  <span>1. Query expansion</span>
                </div>
                {xrayState.queries ? (
                  <div className="space-y-2 rounded-xl border border-white/8 bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      query set ({xrayState.queries.length})
                    </div>
                    {xrayState.queries.map((query, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-white/8 bg-[rgba(2,10,16,0.62)] px-3 py-2 text-xs text-zinc-400"
                      >
                        {query}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="animate-pulse pl-7 text-xs font-medium text-[var(--echo-accent)]/80">
                    Generating semantic variations...
                  </div>
                )}
              </motion.div>
            ) : null}

            {xrayState.status === "retrieved" || xrayState.docs ? (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6 space-y-3"
              >
                <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  <Database className="size-3.5 text-sky-400" />
                  <span>2. Retrieval</span>
                </div>
                {xrayState.docs ? (
                  <div className="space-y-3">
                    {xrayState.docs.map((doc, index) => (
                      <Card key={index} className="overflow-hidden border-white/8 bg-white/5">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-white/8 bg-black/15 px-3 py-2">
                          <span className="text-[10px] font-mono text-sky-300">Result {index + 1}</span>
                          <Badge
                            variant="outline"
                            className="border-[var(--echo-accent)]/20 bg-[var(--echo-accent)]/10 py-0 text-[10px] text-[var(--echo-accent)]"
                          >
                            {doc.score} RRF
                          </Badge>
                        </CardHeader>
                        <CardContent className="line-clamp-4 p-3 text-xs leading-relaxed text-zinc-400">
                          {doc.content}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="animate-pulse pl-7 text-xs font-medium text-sky-400/80">
                    Executing hybrid vector and keyword retrieval...
                  </div>
                )}
              </motion.div>
            ) : null}

            {xrayState.status === "grading" ||
            xrayState.passedGrading !== undefined ||
            xrayState.status === "generating" ||
            xrayState.status === "done" ? (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6 space-y-3"
              >
                <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  <ShieldCheck className="size-3.5 text-emerald-400" />
                  <span>3. Confidence gate</span>
                </div>
                {xrayState.passedGrading !== undefined ? (
                  <div
                    className={`flex items-start gap-3 rounded-xl border p-4 ${
                      xrayState.passedGrading
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border-red-500/20 bg-red-500/10 text-red-300"
                    }`}
                  >
                    {xrayState.passedGrading ? (
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                    ) : (
                      <XCircle className="mt-0.5 size-5 shrink-0" />
                    )}
                    <div className="text-sm font-medium leading-tight">
                      {xrayState.passedGrading
                        ? "Grounding established. Authorizing answer generation."
                        : "Confidence is too low. Recommend fallback or escalation."}
                    </div>
                  </div>
                ) : (
                  <div className="animate-pulse pl-7 text-xs font-medium text-emerald-400/80">
                    Evaluating relevance and confidence...
                  </div>
                )}
              </motion.div>
            ) : null}

            {xrayState.status === "done" ? (
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-zinc-300">
                <div className="flex flex-wrap gap-3">
                  {xrayState.retrievalStrategy ? (
                    <span>strategy: {xrayState.retrievalStrategy.toLowerCase()}</span>
                  ) : null}
                  {xrayState.latencyMs ? <span>latency: {xrayState.latencyMs}ms</span> : null}
                  {xrayState.confidenceScore ? (
                    <span>confidence: {xrayState.confidenceScore.toFixed(2)}</span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </Card>
  )
}
