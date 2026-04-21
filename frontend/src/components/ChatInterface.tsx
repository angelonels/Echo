"use client"

import React, { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Bot, Send, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EchoMessage } from "@/hooks/useEchoChat"

interface ChatInterfaceProps {
  agentName: string
  messages: EchoMessage[]
  isStreaming: boolean
  sendMessage: (query: string) => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export function ChatInterface({
  agentName,
  messages,
  isStreaming,
  sendMessage,
  messagesEndRef,
}: ChatInterfaceProps) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isStreaming) return
    sendMessage(query)
    setQuery("")
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[rgba(7,16,26,0.88)] shadow-[0_32px_110px_-60px_rgba(17,181,164,0.4)]">
      <div className="flex items-center justify-between border-b border-white/8 bg-white/4 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-white/8 bg-[var(--echo-panel)]">
            <Bot className="size-5 text-[var(--echo-accent)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">{agentName}</h2>
            <div className="mt-1 flex items-center gap-2 text-xs text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Playground ready
            </div>
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
          internal testing
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 lg:p-6">
        <div className="space-y-5 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-[26px] p-4 text-[15px] leading-relaxed shadow-sm sm:max-w-[76%] ${
                    msg.role === "user"
                      ? "rounded-br-md bg-[var(--echo-accent)] text-slate-950"
                      : "rounded-bl-md border border-white/8 bg-[var(--echo-panel)] text-zinc-200"
                  }`}
                >
                  <div>{msg.text}</div>
                  {msg.role === "bot" && (msg.confidenceScore || msg.retrievalStrategy) ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      {msg.confidenceScore ? (
                        <span className="rounded-full bg-white/6 px-2.5 py-1">
                          confidence {msg.confidenceScore.toFixed(2)}
                        </span>
                      ) : null}
                      {msg.retrievalStrategy ? (
                        <span className="rounded-full bg-white/6 px-2.5 py-1">
                          {msg.retrievalStrategy.toLowerCase()}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isStreaming ? (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-[26px] rounded-bl-md border border-white/8 bg-[var(--echo-panel)] px-4 py-3 text-zinc-300">
                <Sparkles className="size-4 animate-pulse text-[var(--echo-accent)]" />
                <span className="text-sm">Synthesizing grounded response…</span>
              </div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-white/8 bg-[rgba(7,16,26,0.92)] p-4 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about warranty, scheduling, returns, or escalation rules..."
            className="h-14 w-full rounded-2xl border-white/10 bg-white/5 pl-5 pr-16 text-zinc-100 placeholder:text-zinc-500"
            disabled={isStreaming}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!query.trim() || isStreaming}
            className="absolute right-2 h-10 w-10 rounded-xl bg-[var(--echo-accent)] text-slate-950 hover:bg-[var(--echo-accent-strong)]"
          >
            <Send className="translate-x-0.5 translate-y-[1px]" />
          </Button>
        </form>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[rgba(17,181,164,0.08)] blur-3xl" />
    </div>
  )
}
