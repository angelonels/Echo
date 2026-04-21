"use client"

import { ChatInterface } from "@/components/ChatInterface"
import { XRayTracePanel } from "@/components/XRayTracePanel"
import { useEchoChat } from "@/hooks/useEchoChat"
import type { PlaygroundConversation } from "@/lib/api/schemas"

export function PlaygroundWorkspace({
  agentId,
  agentName,
  conversation,
}: {
  agentId: string
  agentName: string
  conversation: PlaygroundConversation
}) {
  const { messages, isStreaming, xrayState, sendMessage, messagesEndRef } = useEchoChat(
    agentId,
    conversation
  )

  return (
    <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
      <ChatInterface
        agentName={agentName}
        messages={messages}
        isStreaming={isStreaming}
        sendMessage={sendMessage}
        messagesEndRef={messagesEndRef}
      />
      <XRayTracePanel xrayState={xrayState} />
    </div>
  )
}
