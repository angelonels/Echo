import Link from "next/link"
import { Code2, Globe2, PaintBucket } from "lucide-react"

import { getAgent, getWidgetConfig } from "@/lib/api/echo"

export default async function AgentWidgetPage({
  params,
}: {
  params: { agentId: string }
}) {
  const { agentId } = params
  const [agent, widget] = await Promise.all([getAgent(agentId), getWidgetConfig(agentId)])

  const embedCode = `<script src="https://cdn.echo.ai/widget.js"></script>
<script>
  EchoWidget.init({
    agentKey: "${agent.publicAgentKey}",
    primaryColor: "${widget.theme.primaryColor}",
    position: "${widget.theme.position}"
  })
</script>`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--echo-accent)]">
            Widget setup
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
            Publish {agent.name} to the web with a clean integration path.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-400">
            Keep the widget brand-aligned, restrict allowed domains, and hand engineering a single
            embed snippet rather than a vague setup flow.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/agents/${agentId}`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Config
          </Link>
          <Link
            href={`/agents/${agentId}/analytics`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Analytics
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-6">
            <div className="flex items-center gap-3">
              <PaintBucket className="size-5 text-[var(--echo-accent)]" />
              <h3 className="text-lg font-semibold text-white">Theme settings</h3>
            </div>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm text-zinc-500">Primary color</div>
                <div className="mt-2 flex items-center gap-3">
                  <span
                    className="size-5 rounded-full border border-white/10"
                    style={{ backgroundColor: widget.theme.primaryColor }}
                  />
                  <span className="text-sm text-zinc-200">{widget.theme.primaryColor}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm text-zinc-500">Launcher position</div>
                <div className="mt-2 text-sm text-zinc-200 capitalize">{widget.theme.position}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-6">
            <div className="flex items-center gap-3">
              <Globe2 className="size-5 text-[var(--echo-accent)]" />
              <h3 className="text-lg font-semibold text-white">Allowed domains</h3>
            </div>
            <div className="mt-5 space-y-3">
              {agent.allowedDomains.map((domain) => (
                <div
                  key={domain}
                  className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-zinc-200"
                >
                  {domain}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-6">
          <div className="flex items-center gap-3">
            <Code2 className="size-5 text-[var(--echo-accent)]" />
            <h3 className="text-lg font-semibold text-white">Embed snippet</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Ready for frontend or CMS placement. Replace the CDN host if your delivery path changes.
          </p>
          <pre className="mt-5 overflow-x-auto rounded-[24px] border border-white/8 bg-[#081018] p-5 text-xs leading-6 text-zinc-300">
            {embedCode}
          </pre>
          <div className="mt-5 rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-zinc-300">
            <div className="font-medium text-white">Greeting message</div>
            <p className="mt-2 leading-7">{widget.greetingMessage}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
