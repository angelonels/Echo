import { useCallback, useEffect, useRef, useState } from "react"

import { sendPlaygroundMessage } from "@/lib/api/echo"
import type { PlaygroundConversation } from "@/lib/api/schemas"

export type EchoMessage = {
  id: string
  role: "user" | "bot"
  text: string
  confidenceScore?: number
  retrievalStrategy?: string
}

export type XRayStatus =
  | "idle"
  | "initializing"
  | "expanding"
  | "retrieved"
  | "grading"
  | "generating"
  | "done"

export type XRayEventContent = {
  status: XRayStatus
  queries?: string[]
  docs?: { content: string; score: string }[]
  passedGrading?: boolean
  retrievalStrategy?: string
  latencyMs?: number
  confidenceScore?: number
  fallbackUsed?: boolean
}

function toEchoMessage(
  message: PlaygroundConversation["messages"][number]
): EchoMessage {
  return {
    id: message.id,
    role: message.role === "USER" ? "user" : "bot",
    text: message.content,
    confidenceScore: message.confidenceScore,
    retrievalStrategy: message.retrievalStrategy,
  }
}

export function useEchoChat(
  agentId: string,
  initialConversation: PlaygroundConversation
) {
  const [messages, setMessages] = useState<EchoMessage[]>(
    initialConversation.messages.map(toEchoMessage)
  )
  const [isStreaming, setIsStreaming] = useState(false)
  const [xrayState, setXrayState] = useState<XRayEventContent>({ status: "idle" })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim()) return

      const conversationId = initialConversation.id
      const userMessage: EchoMessage = {
        id: `local_${Math.random().toString(36).slice(2, 8)}`,
        role: "user",
        text: query,
      }

      setMessages((prev) => [...prev, userMessage])
      setIsStreaming(true)
      setXrayState({ status: "initializing" })

      const phases: XRayStatus[] = [
        "expanding",
        "retrieved",
        "grading",
        "generating",
      ]

      phases.forEach((phase, index) => {
        window.setTimeout(() => {
          setXrayState((prev) => ({
            ...prev,
            status: phase,
            queries:
              phase === "expanding"
                ? [
                    query,
                    `policy answer for ${query}`,
                    `customer-support grounding for ${query}`,
                  ]
                : prev.queries,
            docs:
              phase === "retrieved"
                ? [
                    {
                      content:
                        "Warranty and service scheduling excerpts scored highest against the current query.",
                      score: "0.93",
                    },
                    {
                      content:
                        "Fallback guidance is available when a document-backed answer is weak or incomplete.",
                      score: "0.76",
                    },
                  ]
                : prev.docs,
            passedGrading: phase === "grading" ? true : prev.passedGrading,
          }))
        }, index * 280)
      })

      try {
        const response = await sendPlaygroundMessage(agentId, conversationId, query)
        const assistantMessage: EchoMessage = {
          id: response.message.id,
          role: "bot",
          text: response.message.content,
          confidenceScore: response.message.confidenceScore,
          retrievalStrategy: response.meta.retrievalStrategy,
        }

        setMessages((prev) => [...prev, assistantMessage])
        setXrayState({
          status: "done",
          queries: [
            query,
            `policy answer for ${query}`,
            `customer-support grounding for ${query}`,
          ],
          docs: [
            {
              content:
                "Matched retrieval chunks from uploaded policies and service documentation.",
              score: response.message.confidenceScore?.toFixed(2) ?? "0.80",
            },
          ],
          passedGrading: !response.meta.fallbackUsed,
          retrievalStrategy: response.meta.retrievalStrategy,
          latencyMs: response.meta.latencyMs,
          confidenceScore: response.message.confidenceScore,
          fallbackUsed: response.meta.fallbackUsed,
        })
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: "local_error",
            role: "bot",
            text: "Echo could not complete that request. Verify the backend endpoint or continue with the mock adapter.",
          },
        ])
        setXrayState({ status: "idle" })
      } finally {
        setIsStreaming(false)
      }
    },
    [agentId, initialConversation.id]
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isStreaming])

  return { messages, isStreaming, xrayState, sendMessage, messagesEndRef }
}
