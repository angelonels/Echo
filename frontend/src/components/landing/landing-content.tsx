import {
  ChatCenteredText,
  Code,
  Database,
  FileText,
  Gauge,
  ListMagnifyingGlass,
  LockKey,
  ShieldCheck,
  Sparkle,
  TestTube,
  WarningCircle,
  Lightbulb,
  MagnifyingGlass,
  ChartLineUp,
  Plugs,
  ArrowsClockwise,
  Lightning,
  Eye,
  BookOpen,
} from "@phosphor-icons/react"

export const navItems = [
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "Quality", href: "#quality" },
  { label: "Pricing", href: "#final-cta" },
]

export const workflow = [
  ["Create an agent", "Name your support agent and define how it should respond.", "01"],
  ["Upload knowledge", "Add PDFs, markdown files, FAQs, policies, and manuals.", "02"],
  ["Test answers", "Ask questions in the playground and inspect the sources Echo used.", "03"],
  ["Embed and improve", "Add the widget to your site and use analytics to find missing docs.", "04"],
] as const

export const operatorCards = [
  ["Solo founders", "Answer common product questions while you build.", Sparkle],
  ["Small businesses", "Give customers fast answers without buying a full helpdesk.", ChatCenteredText],
  ["Course creators", "Turn course FAQs and guides into a student support assistant.", FileText],
  ["Product teams", "Test policy edges before customers find them.", TestTube],
  ["Agencies", "Deploy support agents for client websites from existing docs.", Code],
] as const

export const securityCards = [
  ["Grounded answers", "Answers are generated from retrieved knowledge chunks, not free-form model guesses.", Database],
  ["Confidence scoring", "Retrieval, grounding, citation coverage, reranking, and intent clarity are scored separately.", Gauge],
  ["Fallback behavior", "If Echo cannot find support in your docs, it responds safely instead of inventing a policy.", WarningCircle],
  ["Prompt-injection resistance", "Retrieved documents are treated as untrusted context, not instructions.", ShieldCheck],
  ["Domain-restricted widget", "Public widget usage is constrained by agent key, status, origin, and rate limits.", LockKey],
  ["Trace logs", "Inspect what was retrieved, selected, generated, and warned about for each turn.", ListMagnifyingGlass],
] as const

export const heroDocuments = [
  ["refund-guide.pdf", "Ready", "42 chunks"],
  ["pricing-notes.md", "Ready", "18 chunks"],
  ["troubleshooting.pdf", "Indexing", "67%"],
] as const

export const heroQualityMetrics = [
  ["Confidence", "86%", "text-[#0f766e]", "border-[#0f766e]/20 bg-[#0f766e]/8"],
  ["Fallback rate", "8.4%", "text-[#a05a2f]", "border-[#c56f45]/25 bg-[#c56f45]/10"],
  ["Open gaps", "2", "text-[#355f4b]", "border-[#355f4b]/20 bg-[#355f4b]/8"],
] as const

export const featureHighlights = [
  {
    icon: MagnifyingGlass,
    title: "Retrieval traces",
    description: "See exactly which chunks were retrieved, scored, and used to build every answer.",
  },
  {
    icon: Lightbulb,
    title: "Knowledge gap detection",
    description: "Echo clusters unanswered questions and suggests docs you should write.",
  },
  {
    icon: ChartLineUp,
    title: "Direct-query analytics",
    description: "Fallback rates, confidence trends, feedback ratios — all from existing data.",
  },
  {
    icon: Plugs,
    title: "One-snippet embed",
    description: "A single script tag to add your support agent to any website.",
  },
  {
    icon: ArrowsClockwise,
    title: "Safe document replacement",
    description: "Replace docs without downtime. Old chunks stay live until new ones pass processing.",
  },
  {
    icon: Eye,
    title: "Grounding verification",
    description: "Every answer is checked against retrieved sources before delivery.",
  },
] as const

export const testimonialQuotes = [
  {
    quote: "I replaced a $200/mo helpdesk with Echo and my response quality actually went up.",
    author: "Sarah K.",
    role: "Solo founder",
  },
  {
    quote: "The knowledge gap feature alone saves me hours figuring out what docs to write next.",
    author: "Marcus T.",
    role: "Course creator",
  },
  {
    quote: "Being able to trace every answer back to source documents is exactly what I needed.",
    author: "Priya D.",
    role: "Product engineer",
  },
] as const
