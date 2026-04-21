import { FrictionBarList } from "./FrictionBarList"
import { SentimentAreaChart } from "./SentimentAreaChart"
import { VolumeStatCards } from "./VolumeStatCards"
import type {
  AnalyticsSummary,
  ConversationSummary,
  TopQuestion,
} from "@/lib/api/schemas"

export function AnalyticsDashboard({
  summary,
  questions,
  conversations,
}: {
  summary: AnalyticsSummary
  questions: TopQuestion[]
  conversations: ConversationSummary[]
}) {
  const sentimentTotal =
    summary.sentiment.positive + summary.sentiment.neutral + summary.sentiment.negative

  const chartData = [
    { time: "Positive", sentiment: summary.sentiment.positive },
    { time: "Neutral", sentiment: summary.sentiment.neutral },
    { time: "Negative", sentiment: summary.sentiment.negative },
  ]

  const questionData = questions.map((question) => ({
    name: question.question,
    count: question.count,
  }))

  return (
    <div className="space-y-6">
      <VolumeStatCards
        sentiment={summary.avgConfidence}
        interactions={summary.totalMessages}
        fallbackRate={summary.fallbackRate}
        totalConversations={summary.totalConversations}
      />

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <FrictionBarList data={questionData} />
        <SentimentAreaChart data={chartData} total={sentimentTotal} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-6">
          <h3 className="text-lg font-semibold text-white">Top questions</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Repeated customer intents worth improving in the knowledge base.
          </p>
          <div className="mt-5 space-y-3">
            {questions.length ? (
              questions.map((question) => (
                <div
                  key={question.question}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
                >
                  <span className="max-w-[80%] text-sm text-zinc-200">
                    {question.question}
                  </span>
                  <span className="rounded-full bg-white/6 px-2.5 py-1 text-xs text-zinc-300">
                    {question.count}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 p-6 text-sm text-muted-foreground">
                No question volume yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-6">
          <h3 className="text-lg font-semibold text-white">Recent conversations</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Snapshot of recent widget and playground sessions.
          </p>
          <div className="mt-5 space-y-3">
            {conversations.length ? (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="grid gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-4 sm:grid-cols-[1fr_auto_auto]"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{conversation.id}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {conversation.source.toLowerCase()}
                      {" · "}
                      {new Date(conversation.lastMessageAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-zinc-300">
                    {conversation.messageCount} messages
                  </div>
                  <div className="text-sm text-zinc-300">
                    avg {conversation.avgConfidence.toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 p-6 text-sm text-muted-foreground">
                No conversation history yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
