"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createAgent, updateAgent } from "@/lib/api/echo"
import {
  createAgentSchema,
  type AgentDetail,
  type CreateAgentValues,
} from "@/lib/api/schemas"

export function AgentForm({ initialValues }: { initialValues?: AgentDetail }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const form = useForm<CreateAgentValues>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: initialValues
      ? {
          name: initialValues.name,
          description: initialValues.description,
          greetingMessage: initialValues.greetingMessage,
          primaryColor: initialValues.primaryColor,
          launcherPosition: initialValues.launcherPosition,
        }
      : {
          name: "",
          description: "",
          greetingMessage: "",
          primaryColor: "#11b5a4",
          launcherPosition: "right",
        },
  })
  const primaryColor = useWatch({
    control: form.control,
    name: "primaryColor",
  })

  function onSubmit(values: CreateAgentValues) {
    startTransition(async () => {
      if (initialValues) {
        await updateAgent(initialValues.id, values)
        router.refresh()
        return
      }

      const result = await createAgent(values)
      router.push(`/agents/${result.id}`)
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="Agent name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Support Command" />
        </Field>
        <Field label="Primary color" error={form.formState.errors.primaryColor?.message}>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(event) => {
                form.setValue("primaryColor", event.target.value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }}
              className="h-10 w-12 cursor-pointer rounded-xl border border-white/10 bg-transparent"
            />
            <Input
              {...form.register("primaryColor")}
              placeholder="#11b5a4"
              className="border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </Field>
      </div>

      <Field label="Description" error={form.formState.errors.description?.message}>
        <textarea
          {...form.register("description")}
          className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[var(--echo-accent)] focus:ring-2 focus:ring-[rgba(17,181,164,0.18)]"
          placeholder="Handles support, warranty, and technician scheduling questions."
        />
      </Field>

      <Field
        label="Greeting message"
        error={form.formState.errors.greetingMessage?.message}
      >
        <textarea
          {...form.register("greetingMessage")}
          className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[var(--echo-accent)] focus:ring-2 focus:ring-[rgba(17,181,164,0.18)]"
          placeholder="Hi, I am Echo. Ask me about warranty terms, visits, and product support."
        />
      </Field>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium text-white">Launcher position</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["right", "left"] as const).map((position) => (
            <label
              key={position}
              className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 transition hover:border-white/20"
            >
              <span className="capitalize">{position}</span>
              <input
                type="radio"
                value={position}
                {...form.register("launcherPosition")}
                className="size-4 accent-[var(--echo-accent)]"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          size="lg"
          className="rounded-2xl bg-[var(--echo-accent)] px-5 text-slate-950 hover:bg-[var(--echo-accent-strong)]"
          disabled={pending}
        >
          {pending
            ? initialValues
              ? "Saving..."
              : "Creating..."
            : initialValues
              ? "Save changes"
              : "Create agent"}
        </Button>
        {initialValues ? (
          <span className="text-sm text-muted-foreground">
            Public key: {initialValues.publicAgentKey}
          </span>
        ) : null}
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-white">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </label>
  )
}
