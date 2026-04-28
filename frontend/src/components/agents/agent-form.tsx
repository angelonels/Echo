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
            welcomeMessage: initialValues.welcomeMessage ?? initialValues.greetingMessage ?? "",
            fallbackMessage:
              initialValues.fallbackMessage ??
              "I do not have enough information from the available support docs to answer that confidently.",
            baseInstructions:
              initialValues.baseInstructions ?? "Answer only from uploaded documents. Do not invent policies.",
            status: initialValues.status,
            retrievalMode: initialValues.retrievalMode ?? "auto",
            temperature: initialValues.temperature ?? 0.2,
            maxContextChunks: initialValues.maxContextChunks ?? 6,
          }
        : {
            name: "",
            description: "",
            welcomeMessage: "Hi. Ask me anything about this product.",
            fallbackMessage:
              "I do not have enough information from the available support docs to answer that confidently.",
            baseInstructions: "Answer only from uploaded documents. Do not invent policies.",
            status: "active",
            retrievalMode: "auto",
            temperature: 0.2,
            maxContextChunks: 6,
          },
  })
  const temperature = useWatch({
    control: form.control,
    name: "temperature",
  })

  function onSubmit(values: CreateAgentValues) {
    startTransition(async () => {
      if (initialValues) {
        await updateAgent(initialValues.id, values)
        router.refresh()
        return
      }

      const result = await createAgent(values)
        router.push(`/app/agents/${result.id}`)
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="Agent name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Support Command" />
        </Field>
        <Field label="Retrieval mode" error={form.formState.errors.retrievalMode?.message}>
          <select
            {...form.register("retrievalMode")}
            className="h-11 rounded-md border border-input bg-card px-3 text-sm outline-none"
          >
            <option value="auto">Auto</option>
            <option value="naive">Naive</option>
            <option value="multi_query">Multi-query</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </Field>
      </div>

      <Field label="Description" error={form.formState.errors.description?.message}>
        <textarea
          {...form.register("description")}
          className="min-h-24 w-full rounded-md border border-input bg-card px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          placeholder="Handles support, warranty, and technician scheduling questions."
        />
      </Field>

      <Field
        label="Welcome message"
        error={form.formState.errors.welcomeMessage?.message}
      >
        <textarea
          {...form.register("welcomeMessage")}
          className="min-h-24 w-full rounded-md border border-input bg-card px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          placeholder="Hi, I am Echo. Ask me about warranty terms, visits, and product support."
        />
      </Field>

      <Field label="Fallback message" error={form.formState.errors.fallbackMessage?.message}>
        <textarea
          {...form.register("fallbackMessage")}
          className="min-h-24 w-full rounded-md border border-input bg-card px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
        />
      </Field>

      <Field label="Base instructions" error={form.formState.errors.baseInstructions?.message}>
        <textarea
          {...form.register("baseInstructions")}
          className="min-h-28 w-full rounded-md border border-input bg-card px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
        />
      </Field>

      <div className="grid gap-5 lg:grid-cols-2">
        <Field label={`Temperature (${temperature})`} error={form.formState.errors.temperature?.message}>
          <Input type="number" step="0.1" min="0" max="2" {...form.register("temperature")} />
        </Field>
        <Field label="Max context chunks" error={form.formState.errors.maxContextChunks?.message}>
          <Input type="number" min="1" max="20" {...form.register("maxContextChunks")} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          size="lg"
          className="rounded-md px-5"
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
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </label>
  )
}
