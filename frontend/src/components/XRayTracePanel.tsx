"use client"

import { useState } from "react"
import { BarChart3, Braces, FileSearch, Gauge } from "lucide-react"

import { XRayEventContent } from "@/hooks/useEchoChat"
import { cn } from "@/lib/utils"

const tabs = [
  { id: "sources", label: "Sources", icon: FileSearch },
  { id: "trace", label: "Trace", icon: Braces },
  { id: "prompt", label: "Prompt", icon: Gauge },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
] as const

export function XRayTracePanel({ xrayState }: { xrayState: XRayEventContent }) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("sources")

  return (
    <aside className="flex min-h-[620px] flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Inspector</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Citations, trace metadata, prompt shape, and confidence signals.
            </p>
          </div>
          <span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
            {xrayState.status}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-2 rounded-md border px-2 text-xs font-medium transition",
                  activeTab === tab.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-secondary"
                )}
              >
                <Icon className="size-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === "sources" ? <SourcesTab xrayState={xrayState} /> : null}
        {activeTab === "trace" ? <TraceTab xrayState={xrayState} /> : null}
        {activeTab === "prompt" ? <PromptTab /> : null}
        {activeTab === "metrics" ? <MetricsTab xrayState={xrayState} /> : null}
      </div>
    </aside>
  )
}

function SourcesTab({ xrayState }: { xrayState: XRayEventContent }) {
  const sources = xrayState.citations?.length
    ? xrayState.citations.map((citation) => ({
        title: citation.documentTitle,
        content: citation.excerpt,
        score: xrayState.confidenceScore?.toFixed(2) ?? "0.00",
      }))
    : xrayState.docs?.map((doc) => ({
        title: "Retrieved chunk",
        content: doc.content,
        score: doc.score,
      }))

  if (!sources?.length) {
    return <EmptyState copy="Ask a playground question to inspect retrieved sources." />
  }

  return (
    <div className="space-y-3">
      {sources.map((source, index) => (
        <div key={`${source.title}-${index}`} className="rounded-md border border-border bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{source.title}</p>
            <span className="rounded-md bg-secondary px-2 py-1 text-xs">score {source.score}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{source.content}</p>
        </div>
      ))}
    </div>
  )
}

function TraceTab({ xrayState }: { xrayState: XRayEventContent }) {
  return (
    <div className="space-y-3">
      <TraceRow label="Trace ID" value={xrayState.traceId ?? "pending"} />
      <TraceRow label="Strategy" value={xrayState.retrievalStrategy ?? "pending"} />
      <TraceRow label="Expanded queries" value={xrayState.queries?.join(" | ") ?? "pending"} />
      <TraceRow label="Fallback" value={xrayState.fallbackUsed === undefined ? "pending" : String(xrayState.fallbackUsed)} />
    </div>
  )
}

function PromptTab() {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <p className="text-sm font-medium">Phase 3 prompt contract</p>
      <pre className="mt-3 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
{`Use only supplied context.
Return a structured response.
Require citations for grounded answers.
Fallback when context is insufficient.`}
      </pre>
    </div>
  )
}

function MetricsTab({ xrayState }: { xrayState: XRayEventContent }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Metric label="Confidence" value={xrayState.confidenceScore?.toFixed(2) ?? "0.00"} />
      <Metric label="Latency" value={xrayState.latencyMs ? `${xrayState.latencyMs}ms` : "pending"} />
      <Metric label="Grounding" value={xrayState.passedGrading === undefined ? "pending" : xrayState.passedGrading ? "passed" : "failed"} />
      <Metric label="Status" value={xrayState.status} />
    </div>
  )
}

function TraceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium">{value}</p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  )
}

function EmptyState({ copy }: { copy: string }) {
  return (
    <div className="flex min-h-72 items-center justify-center rounded-md border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
      {copy}
    </div>
  )
}
