"use client"

import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion, useInView, useMotionValue, useTransform, useSpring } from "motion/react"
import { useState, useRef, useEffect, useCallback } from "react"
import {
  ArrowRight,
  ChatCenteredText,
  Check,
  FileText,
  CaretRight,
  Quotes,
  ArrowUpRight,
  Cursor,
} from "@phosphor-icons/react"

import { EchoLogo } from "@/components/branding/echo-logo"
import { fadeUp, fadeUpSlow, scaleIn, scaleInSpring, stagger, staggerSlow, tabPanel, slideInLeft, slideInRight, revealLine } from "@/lib/animations/variants"
import { cn } from "@/lib/utils"
import { heroDocuments, heroQualityMetrics, navItems, operatorCards, securityCards, workflow, featureHighlights, testimonialQuotes } from "./landing-content"

/* ═══════════════════════════════════════════════════════════════
   Preview tab data
   ═══════════════════════════════════════════════════════════════ */

const previewTabs = {
  Knowledge: {
    eyebrow: "Versioned corpus",
    title: "Documents move from upload to ready with visible processing state.",
    body: <KnowledgePreview />,
  },
  Playground: {
    eyebrow: "Builder-only evidence",
    title: "Test real customer questions with citations, confidence, and trace access.",
    body: <PlaygroundPreview />,
  },
  Widget: {
    eyebrow: "Visitor-safe answers",
    title: "A clean website widget hides debug internals while preserving traces.",
    body: <WidgetPreview />,
  },
  Analytics: {
    eyebrow: "Support friction",
    title: "Fallbacks, low confidence, feedback, and repeated questions become product signals.",
    body: <AnalyticsPreview />,
  },
} as const

type PreviewTab = keyof typeof previewTabs

/* ═══════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════ */

export function LandingPage() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#f4eddf] text-[#18140f]">
      <BackgroundSystem />
      <LandingNavbar />
      <HeroSection />
      <LogoMarquee />
      <WorkflowStrip />
      <ProductPreviewTabs />
      <FeatureHighlightsGrid />
      <SoloOperatorsSection />
      <KnowledgeBaseSection />
      <PlaygroundSection />
      <WidgetSection />
      <AnalyticsSection />
      <TestimonialsSection />
      <SecuritySection />
      <FinalCTA />
      <LandingFooter />
    </main>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Background
   ═══════════════════════════════════════════════════════════════ */

function BackgroundSystem() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 echo-noise opacity-70" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(197,111,69,0.18),transparent_28%),radial-gradient(circle_at_82%_8%,rgba(15,118,110,0.18),transparent_26%),radial-gradient(circle_at_68%_78%,rgba(95,75,139,0.11),transparent_34%),linear-gradient(180deg,rgba(255,250,240,0.76),rgba(244,237,223,0.94)_42%,rgba(235,223,203,0.96))]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-24 bg-gradient-to-b from-[#fffaf0]/75 to-transparent" />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Navbar
   ═══════════════════════════════════════════════════════════════ */

function LandingNavbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 px-4 py-4"
    >
      <div
        className={cn(
          "mx-auto flex h-14 max-w-[1180px] items-center justify-between rounded-full border px-3 transition-all duration-500 sm:px-5",
          scrolled
            ? "border-[#2c2118]/12 bg-[#fffaf0]/92 shadow-[0_18px_60px_-38px_rgba(70,52,33,0.5),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl"
            : "border-[#2c2118]/8 bg-[#fffaf0]/72 shadow-[0_8px_30px_-18px_rgba(70,52,33,0.25)] backdrop-blur-xl",
        )}
      >
        <EchoLogo imageClassName="h-9" />
        <nav className="hidden items-center gap-7 text-sm text-[#6f6253] md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative transition-colors duration-300 hover:text-[#18140f] after:absolute after:bottom-[-4px] after:left-0 after:h-[1.5px] after:w-0 after:bg-[#0f766e] after:transition-all after:duration-300 hover:after:w-full"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-[#44372a] transition-colors duration-300 hover:text-[#0f766e]"
          >
            Sign in
          </Link>
          <MotionLink href="/signup" className="h-10 px-4">
            Start free
          </MotionLink>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid size-10 place-items-center rounded-full border border-[#2c2118]/10 bg-[#18140f]/5 text-[#18140f] transition-colors hover:bg-[#18140f]/10 md:hidden"
          aria-label="Toggle navigation menu"
        >
          <motion.span
            animate={open ? { rotate: 45 } : { rotate: 0 }}
            className="relative h-0.5 w-5 bg-current"
          >
            <span
              className={cn(
                "absolute left-0 h-0.5 w-5 bg-current transition-all duration-300",
                open ? "top-0 -rotate-90" : "top-[-7px]",
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-[7px] h-0.5 w-5 bg-current transition-all duration-300",
                open ? "opacity-0" : "opacity-100",
              )}
            />
          </motion.span>
        </button>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden md:hidden"
          >
            <div className="mx-auto mt-2 grid max-w-[1180px] gap-2 rounded-3xl border border-[#2c2118]/10 bg-[#fffaf0]/95 p-3 shadow-[0_24px_70px_-45px_rgba(70,52,33,0.55)]">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-[#2c2118]/10 bg-[#18140f]/5 px-4 py-3 text-sm text-[#31271d] transition-colors active:bg-[#18140f]/10"
                >
                  {item.label}
                </a>
              ))}
              <Link href="/login" className="rounded-2xl px-4 py-3 text-sm text-[#5e5142]">
                Sign in
              </Link>
              <MotionLink href="/signup" className="justify-center">
                Start free
              </MotionLink>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </motion.header>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Hero
   ═══════════════════════════════════════════════════════════════ */

function HeroSection() {
  return (
    <section className="relative mx-auto grid min-h-[calc(100dvh-88px)] max-w-[1240px] gap-12 px-5 pb-24 pt-14 md:pt-20 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:px-6">
      <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-[620px]">
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2 rounded-full border border-[#2c2118]/10 bg-[#fffaf0]/72 px-3 py-1.5 text-[13px] text-[#0f766e] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
        >
          <span className="relative size-2 rounded-full bg-[#0f766e]">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#0f766e]/40" />
          </span>
          AI support agents from your own docs
        </motion.div>
        <motion.h1
          variants={fadeUpSlow}
          className="mt-7 max-w-[10ch] text-[2.8rem] font-semibold leading-[0.96] tracking-[-0.045em] text-[#18140f] sm:text-[4.45rem] lg:text-[5.35rem]"
        >
          Turn your{" "}
          <span className="relative inline-block">
            <span className="relative z-10">support docs</span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-[0.08em] left-0 right-0 z-0 h-[0.12em] origin-left rounded-full bg-[#0f766e]/20"
            />
          </span>{" "}
          into a website AI agent.
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="mt-7 max-w-[58ch] text-base leading-8 text-[#5f5245] sm:text-lg"
        >
          Upload PDFs, FAQs, manuals, and policies. Echo creates a document-grounded support assistant you can test, embed, monitor, and improve over time.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row">
          <MotionLink href="/signup">
            Start building free
            <ArrowRight size={18} weight="bold" />
          </MotionLink>
          <MotionLink href="#product" variant="secondary">
            See how it works
          </MotionLink>
        </motion.div>
        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3 text-sm text-[#65594b]">
          {["No code widget", "Document-grounded answers", "Quality loop"].map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 rounded-full border border-[#2c2118]/10 bg-[#fffaf0]/55 px-3 py-2 transition-colors duration-300 hover:bg-[#fffaf0]/80"
            >
              <Check size={14} weight="bold" className="text-[#0f766e]" />
              {item}
            </span>
          ))}
        </motion.div>
      </motion.div>
      <HeroProductDemo />
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Hero product demo card
   ═══════════════════════════════════════════════════════════════ */

function HeroProductDemo() {
  const reduceMotion = useReducedMotion()
  const floating = reduceMotion ? {} : { y: [0, -8, 0] }

  return (
    <motion.div variants={scaleInSpring} initial="hidden" animate="visible" className="relative">
      {/* Glow behind card */}
      <div className="pointer-events-none absolute -inset-8 bg-[radial-gradient(ellipse_at_center,rgba(15,118,110,0.08),transparent_70%)] echo-glow" />

      <motion.div
        animate={floating}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-[2.4rem] border border-[#2c2118]/10 bg-[#fffaf0]/88 p-2 shadow-[0_34px_120px_-78px_rgba(92,64,38,0.62)] md:p-2.5"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(197,111,69,0.12),transparent_34%),radial-gradient(circle_at_88%_20%,rgba(15,118,110,0.14),transparent_30%)]" />
        <div className="relative rounded-[1.85rem] border border-[#2c2118]/10 bg-[#fbf4e7]/96 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)]">
          {/* Agent header */}
          <div className="flex items-center justify-between border-b border-[#2c2118]/10 pb-4">
            <div>
              <p className="text-sm font-semibold text-[#18140f]">Atlas Support Agent</p>
              <p className="mt-1 font-mono text-[11px] text-[#817464]">agent_pub_7kq9m2</p>
            </div>
            <span className="relative rounded-full border border-[#0f766e]/18 bg-[#0f766e]/8 px-3 py-1 text-xs font-medium text-[#0f766e] echo-pulse-ring">
              Ready
            </span>
          </div>

          <div className="grid gap-4 pt-5">
            {/* Documents section */}
            <div className="rounded-[1.35rem] border border-[#2c2118]/10 bg-[#f1e3ce]/62 p-4">
              <PanelLabel icon={FileText}>Knowledge files</PanelLabel>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {heroDocuments.map(([name, status, meta], index) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + index * 0.1 }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="rounded-2xl border border-[#2c2118]/10 bg-[#fffaf0]/74 p-3 transition-shadow duration-300 hover:shadow-[0_8px_24px_-12px_rgba(70,52,33,0.2)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-xs font-medium text-[#31271d]">{name}</p>
                      <span className={cn("text-[10px] font-medium", status === "Ready" ? "text-[#0f766e]" : "text-[#245c63]")}>
                        {status}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#2c2118]/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: status === "Ready" ? "100%" : "67%" }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                        className="h-full rounded-full bg-gradient-to-r from-[#0f766e] via-[#67b99a] to-[#c56f45]"
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-[#817464]">{meta}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Chat section */}
            <div className="rounded-[1.35rem] border border-[#2c2118]/10 bg-[#fffaf0]/74 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <PanelLabel icon={ChatCenteredText}>Playground question</PanelLabel>
                <div className="flex flex-wrap gap-1.5">
                  {["Hybrid", "3 sources", "Trace"].map((item) => (
                    <span
                      key={item}
                      className="shrink-0 whitespace-nowrap rounded-full border border-[#2c2118]/10 bg-[#18140f]/5 px-2.5 py-1.5 text-[10px] leading-none text-[#6d604f]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[1.15rem] border border-[#2c2118]/10 bg-[#f5ead8] p-3">
                <div className="max-w-[78%] rounded-2xl rounded-tl-md bg-[#18140f]/7 p-3 text-sm leading-6 text-[#31271d]">
                  Can I get a refund after 20 days?
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.15 }}
                  className="ml-auto mt-3 max-w-[88%] rounded-2xl rounded-tr-md border border-[#0f766e]/14 bg-[#0f766e]/8 p-3 text-sm leading-6 text-[#173b35]"
                >
                  Standard refunds are available within 14 days. After 20 days, the uploaded policy does not describe a standard refund option.
                </motion.div>
              </div>
            </div>

            {/* Metrics row */}
            <div className="grid gap-3 md:grid-cols-4">
              {heroQualityMetrics.map(([label, value, color, tone], index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.35 + index * 0.1 }}
                  className={cn("rounded-2xl border p-3", tone)}
                >
                  <p className="text-xs text-[#6d604f]">{label}</p>
                  <AnimatedCounter value={value} className={cn("mt-1 font-mono text-2xl font-semibold", color)} delay={1.5 + index * 0.15} />
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.75 }}
                className="rounded-2xl border border-[#5f4b8b]/18 bg-[#5f4b8b]/8 p-3"
              >
                <p className="text-xs font-semibold text-[#4b3c74]">Knowledge gap</p>
                <p className="mt-1 text-xs leading-5 text-[#5f5245]">Refund processing timeline</p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Logo marquee (social proof)
   ═══════════════════════════════════════════════════════════════ */

function LogoMarquee() {
  const words = ["Solo founders", "Indie hackers", "Small businesses", "Course creators", "Product teams", "Agencies", "Educators", "Developers"]

  return (
    <section className="relative overflow-hidden border-y border-[#2c2118]/8 py-5">
      <div className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#f4eddf] to-transparent" />
      <div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#f4eddf] to-transparent" />
      <div className="echo-marquee flex items-center gap-8 whitespace-nowrap">
        {[...words, ...words].map((word, index) => (
          <span key={`${word}-${index}`} className="flex items-center gap-3 text-sm text-[#7a6a57]">
            <span className="size-1.5 rounded-full bg-[#0f766e]/40" />
            {word}
          </span>
        ))}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Workflow strip
   ═══════════════════════════════════════════════════════════════ */

function WorkflowStrip() {
  return (
    <Section
      id="workflow"
      eyebrow="Workflow"
      title="From documents to deployed support agent"
      copy="Create an agent, upload your knowledge, test grounded answers, and publish a clean website widget in minutes."
    >
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="relative mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-[1.15fr_0.95fr_1.05fr_0.9fr]"
      >
        {workflow.map(([title, copy], index) => (
          <motion.article
            key={title}
            variants={fadeUp}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
            className="group relative min-h-[188px] cursor-default rounded-[1.6rem] border border-[#2c2118]/10 bg-[#fffaf0]/56 p-5 shadow-[0_24px_70px_-54px_rgba(70,52,33,0.42),inset_0_1px_0_rgba(255,255,255,0.85)] transition-shadow duration-500 hover:shadow-[0_28px_80px_-50px_rgba(70,52,33,0.5)]"
          >
            <div className="grid size-12 place-items-center rounded-2xl border border-[#0f766e]/16 bg-[#0f766e]/8 font-mono text-xs text-[#0f766e] transition-colors duration-300 group-hover:bg-[#0f766e]/14">
              0{index + 1}
            </div>
            {/* Connecting line */}
            {index < 3 ? (
              <div className="absolute right-0 top-10 hidden h-px w-4 bg-gradient-to-r from-[#0f766e]/20 to-transparent lg:block" />
            ) : null}
            <h3 className="mt-7 text-lg font-semibold text-[#18140f]">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#6d604f]">{copy}</p>
          </motion.article>
        ))}
      </motion.div>
    </Section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Product preview tabs
   ═══════════════════════════════════════════════════════════════ */

function ProductPreviewTabs() {
  const [active, setActive] = useState<PreviewTab>("Knowledge")
  const current = previewTabs[active]

  return (
    <Section
      id="product"
      eyebrow="Product preview"
      title="Everything you need to build, test, and improve your support AI"
      copy="A real builder flow for docs, playground testing, widget deployment, analytics, and knowledge gaps."
    >
      <div className="mt-12 overflow-hidden rounded-[2.2rem] border border-[#2c2118]/10 bg-[#fffaf0]/70 p-2 shadow-[0_34px_100px_-72px_rgba(70,52,33,0.46)]">
        <div className="flex gap-1.5 overflow-x-auto rounded-[1.65rem] border border-[#2c2118]/10 bg-[#eee0ca]/72 p-1.5">
          {(Object.keys(previewTabs) as PreviewTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActive(tab)}
              className={cn(
                "relative h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors duration-300",
                active === tab ? "text-[#fffaf0]" : "text-[#6d604f] hover:text-[#18140f]",
              )}
            >
              {active === tab ? (
                <motion.span
                  layoutId="active-tab"
                  className="absolute inset-0 rounded-full bg-[#0f766e]"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              ) : null}
              <span className="relative">{tab}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-6 p-5 lg:p-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0f766e]">
              {current.eyebrow}
            </p>
            <h3 className="mt-3 text-2xl font-semibold leading-tight text-[#18140f] md:text-3xl">
              {current.title}
            </h3>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={active} {...tabPanel} className="min-h-[220px]">
              {current.body}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Feature highlights grid (NEW)
   ═══════════════════════════════════════════════════════════════ */

function FeatureHighlightsGrid() {
  return (
    <section className="relative mx-auto max-w-[1200px] px-5 py-24 lg:px-6 lg:py-32">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
        <motion.p variants={fadeUp} className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
          Capabilities
        </motion.p>
        <motion.h2 variants={fadeUp} className="mx-auto mt-4 max-w-2xl text-center text-4xl font-semibold leading-tight tracking-[-0.035em] text-[#18140f] md:text-5xl">
          More than a chatbot
        </motion.h2>
        <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-xl text-center text-base leading-8 text-[#6d604f]">
          Every piece of the support pipeline — retrieval, generation, grounding, analytics — is observable and improvable.
        </motion.p>
      </motion.div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featureHighlights.map(({ icon: Icon, title, description }, index) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
            whileHover={{ y: -4 }}
            className="group relative overflow-hidden rounded-[1.6rem] border border-[#2c2118]/10 bg-[#fffaf0]/56 p-6 shadow-[0_20px_60px_-48px_rgba(70,52,33,0.35),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-500 hover:shadow-[0_28px_80px_-50px_rgba(70,52,33,0.5)]"
          >
            {/* Subtle gradient on hover */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0f766e]/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative">
              <div className="grid size-12 place-items-center rounded-2xl border border-[#0f766e]/16 bg-[#0f766e]/8 transition-colors duration-300 group-hover:bg-[#0f766e]/14">
                <Icon size={22} weight="duotone" className="text-[#0f766e]" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[#18140f]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#6d604f]">{description}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Solo operators
   ═══════════════════════════════════════════════════════════════ */

function SoloOperatorsSection() {
  return (
    <Section
      eyebrow="Solo-user first"
      title="Made for people who do support without a support team"
      copy="Echo is built for solo founders, indie hackers, small businesses, educators, and product builders who already have support knowledge scattered across docs but need a simple way to make it useful."
    >
      <div className="mt-12 grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-[1.15fr_0.9fr_1fr]">
        {operatorCards.map(([title, copy, Icon], index) => (
          <motion.article
            key={String(title)}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ y: -4, transition: { duration: 0.3 } }}
            className={cn(
              "group flex min-h-[190px] flex-col rounded-[1.6rem] border border-[#2c2118]/10 bg-[#fffaf0]/56 p-6 shadow-[0_24px_70px_-54px_rgba(70,52,33,0.38),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-500 hover:shadow-[0_28px_80px_-50px_rgba(70,52,33,0.5)]",
              index === 3 ? "lg:col-span-2" : "",
            )}
          >
            <div className="grid size-12 place-items-center rounded-2xl border border-[#0f766e]/16 bg-[#0f766e]/8 transition-colors duration-300 group-hover:bg-[#0f766e]/14">
              <Icon size={24} weight="duotone" className="text-[#0f766e]" />
            </div>
            <h3 className="mt-auto pt-8 text-xl font-semibold text-[#18140f]">{String(title)}</h3>
            <p className="mt-3 text-sm leading-6 text-[#6d604f]">{String(copy)}</p>
          </motion.article>
        ))}
      </div>
    </Section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Feature split sections
   ═══════════════════════════════════════════════════════════════ */

function KnowledgeBaseSection() {
  return (
    <SplitSection
      eyebrow="Knowledge base"
      title="Ground your agent in real support knowledge"
      copy="Upload your existing support docs. Echo extracts, chunks, embeds, and indexes them so your agent can answer from the material you trust."
      visual={<PipelineVisual />}
    />
  )
}

function PlaygroundSection() {
  return (
    <SplitSection
      eyebrow="Playground"
      title="Test before you publish"
      copy="Use the playground to ask real customer questions, inspect retrieved sources, and understand why Echo answered the way it did."
      reverse
      visual={<PlaygroundInspection />}
    />
  )
}

function WidgetSection() {
  return (
    <SplitSection
      eyebrow="Website widget"
      title="Add Echo to your website with one snippet"
      copy="Publish your agent as a lightweight website widget. Visitors get clean answers, while you get conversations, analytics, and quality signals in your dashboard."
      visual={<WidgetInstallVisual />}
    />
  )
}

/* ═══════════════════════════════════════════════════════════════
   Analytics section
   ═══════════════════════════════════════════════════════════════ */

function AnalyticsSection() {
  return (
    <Section
      eyebrow="Quality loop"
      title="See what your customers keep asking"
      copy="Echo tracks fallbacks, low-confidence answers, repeated questions, and feedback so you can improve your docs over time."
    >
      <div className="mt-12 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Fallback rate", "8.4%", "rose"],
            ["Average confidence", "0.81", "cyan"],
            ["Open knowledge gaps", "5", "violet"],
            ["Top question", "Refund timing", "emerald"],
          ].map(([label, value, tone]) => (
            <MetricCard key={label} label={label} value={value} tone={tone} />
          ))}
        </div>
        <QuestionCluster />
      </div>
    </Section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Testimonials (NEW)
   ═══════════════════════════════════════════════════════════════ */

function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % testimonialQuotes.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative mx-auto max-w-[1200px] px-5 py-24 lg:px-6 lg:py-32">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center">
        <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
          From builders
        </motion.p>
        <motion.h2 variants={fadeUp} className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.035em] text-[#18140f] md:text-5xl">
          What people are saying
        </motion.h2>
      </motion.div>

      <div className="relative mt-14">
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={activeIndex}
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-3xl rounded-[2.2rem] border border-[#2c2118]/10 bg-[#fffaf0]/70 p-8 text-center shadow-[0_24px_80px_-60px_rgba(70,52,33,0.4)] md:p-12"
          >
            <Quotes size={36} weight="fill" className="mx-auto text-[#0f766e]/20" />
            <p className="mt-6 text-xl font-medium leading-relaxed text-[#18140f] md:text-2xl">
              &ldquo;{testimonialQuotes[activeIndex].quote}&rdquo;
            </p>
            <div className="mt-6">
              <p className="text-sm font-semibold text-[#18140f]">{testimonialQuotes[activeIndex].author}</p>
              <p className="text-sm text-[#6d604f]">{testimonialQuotes[activeIndex].role}</p>
            </div>
          </motion.blockquote>
        </AnimatePresence>

        {/* Dots */}
        <div className="mt-8 flex justify-center gap-2">
          {testimonialQuotes.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                activeIndex === index ? "w-8 bg-[#0f766e]" : "w-2 bg-[#2c2118]/15 hover:bg-[#2c2118]/30",
              )}
              aria-label={`View testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Security section
   ═══════════════════════════════════════════════════════════════ */

function SecuritySection() {
  return (
    <Section
      id="quality"
      eyebrow="Grounding and safety"
      title="Designed to avoid confident nonsense"
      copy="Echo is built around retrieval, confidence scoring, fallbacks, and source inspection so your support agent knows when it should not answer."
    >
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr]">
        {securityCards.map(([title, copy, Icon], index) => (
          <motion.article
            key={String(title)}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -3 }}
            className="group rounded-[1.6rem] border border-[#2c2118]/10 bg-[#fffaf0]/54 p-6 transition-all duration-500 hover:shadow-[0_20px_60px_-48px_rgba(70,52,33,0.4)]"
          >
            <div className="grid size-10 place-items-center rounded-xl border border-[#0f766e]/16 bg-[#0f766e]/8 transition-colors duration-300 group-hover:bg-[#0f766e]/14">
              <Icon size={22} weight="duotone" className="text-[#0f766e]" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-[#18140f]">{String(title)}</h3>
            <p className="mt-3 text-sm leading-6 text-[#6d604f]">{String(copy)}</p>
          </motion.article>
        ))}
      </div>
    </Section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Final CTA
   ═══════════════════════════════════════════════════════════════ */

function FinalCTA() {
  return (
    <section id="final-cta" className="relative mx-auto max-w-[1200px] px-5 py-24 lg:px-6 lg:py-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative overflow-hidden rounded-[2.3rem] border border-[#2c2118]/10 bg-[#18140f] p-8 text-center shadow-[0_34px_100px_-70px_rgba(70,52,33,0.72)] md:p-14"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#fffaf0]/45 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(197,111,69,0.18),transparent_42%),radial-gradient(circle_at_82%_36%,rgba(15,118,110,0.16),transparent_36%)]" />
        {/* Subtle grid overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,250,240,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,250,240,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative mx-auto max-w-3xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-4xl font-semibold leading-tight tracking-[-0.035em] text-[#fffaf0] md:text-6xl"
          >
            Build your support agent today
          </motion.h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#d8c7ad]">
            Upload your docs, test the answers, embed the widget, and start learning what your customers need.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <MotionLink href="/signup" className="bg-[#fffaf0] text-[#18140f] hover:bg-[#eadcc7]">
              Start building free
            </MotionLink>
            <MotionLink href="#product" variant="secondary">
              See how it works
            </MotionLink>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm text-[#d8c7ad]">
            {["Docs", "Agent", "Widget", "Insights"].map((item, index) => (
              <span key={item} className="inline-flex items-center gap-3">
                {index > 0 ? <ArrowRight size={14} className="text-[#7a6a57]" /> : null}
                {item}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Footer
   ═══════════════════════════════════════════════════════════════ */

function LandingFooter() {
  const columns = {
    Product: ["Agents", "Knowledge Base", "Widget", "Analytics"],
    Resources: ["Docs", "Demo", "Changelog", "Security"],
    Company: ["About", "Contact", "GitHub"],
    Legal: ["Privacy", "Terms"],
  }

  return (
    <footer className="relative border-t border-[#2c2118]/10 px-5 py-12">
      <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-[1.2fr_2fr] lg:px-6">
        <div>
          <EchoLogo imageClassName="h-10" />
          <p className="mt-5 max-w-sm text-sm leading-6 text-[#6d604f]">
            AI support agents from your docs, with traceable answers and knowledge-gap detection built in.
          </p>
          <p className="mt-6 text-xs text-[#9b8d7a]">&copy; {new Date().getFullYear()} Echo. All rights reserved.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {Object.entries(columns).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-[#18140f]">{title}</h3>
              <div className="mt-4 grid gap-3">
                {links.map((link) => (
                  <a
                    key={link}
                    href="#final-cta"
                    className="text-sm text-[#756856] transition-colors duration-300 hover:text-[#0f766e]"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Shared layout components
   ═══════════════════════════════════════════════════════════════ */

function Section({
  id,
  eyebrow,
  title,
  copy,
  children,
}: {
  id?: string
  eyebrow: string
  title: string
  copy: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="relative mx-auto max-w-[1200px] px-5 py-24 lg:px-6 lg:py-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
      >
        <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
          {eyebrow}
        </motion.p>
        <motion.div variants={fadeUp} className="mt-4 grid gap-5 lg:grid-cols-[0.9fr_0.8fr] lg:items-end">
          <h2 className="text-4xl font-semibold leading-tight tracking-[-0.035em] text-[#18140f] md:text-5xl">
            {title}
          </h2>
          <p className="text-base leading-8 text-[#6d604f]">{copy}</p>
        </motion.div>
        {children}
      </motion.div>
    </section>
  )
}

function SplitSection({
  eyebrow,
  title,
  copy,
  visual,
  reverse,
}: {
  eyebrow: string
  title: string
  copy: string
  visual: React.ReactNode
  reverse?: boolean
}) {
  return (
    <section className="relative mx-auto grid max-w-[1200px] gap-10 px-5 py-24 lg:grid-cols-2 lg:items-center lg:px-6 lg:py-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className={reverse ? "lg:order-2" : ""}
      >
        <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
          {eyebrow}
        </motion.p>
        <motion.h2
          variants={fadeUp}
          className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.035em] text-[#18140f] md:text-5xl"
        >
          {title}
        </motion.h2>
        <motion.p variants={fadeUp} className="mt-6 max-w-[62ch] text-base leading-8 text-[#6d604f]">
          {copy}
        </motion.p>
      </motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={scaleIn}
      >
        {visual}
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Preview content for tabs
   ═══════════════════════════════════════════════════════════════ */

function KnowledgePreview() {
  return (
    <div className="rounded-[1.6rem] border border-[#2c2118]/10 bg-[#fbf4e7] p-4">
      <div className="grid grid-cols-[1fr_100px_100px] gap-3 rounded-2xl bg-[#18140f]/5 px-4 py-3 text-xs text-[#817464]">
        <span>Document</span>
        <span>Status</span>
        <span>Chunks</span>
      </div>
      {[
        ["refund_policy.pdf", "Ready", "42"],
        ["pricing_faq.md", "Ready", "18"],
        ["troubleshooting.pdf", "Indexing", "67%"],
      ].map(([doc, status, chunks]) => (
        <div
          key={doc}
          className="grid grid-cols-[1fr_100px_100px] gap-3 border-b border-[#2c2118]/10 px-4 py-5 text-sm transition-colors duration-300 hover:bg-[#18140f]/[0.02]"
        >
          <span className="text-[#31271d]">{doc}</span>
          <span className={status === "Ready" ? "text-[#0f766e]" : "text-[#245c63]"}>{status}</span>
          <span className="font-mono text-[#6d604f]">{chunks}</span>
        </div>
      ))}
    </div>
  )
}

function PlaygroundPreview() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.78fr]">
      <div className="rounded-[1.6rem] border border-[#2c2118]/10 bg-[#fbf4e7] p-4">
        <div className="max-w-[82%] rounded-2xl rounded-tl-md bg-[#18140f]/7 p-4 text-sm text-[#31271d]">
          Can I get a refund after 20 days?
        </div>
        <div className="ml-auto mt-3 max-w-[90%] rounded-2xl rounded-tr-md border border-[#0f766e]/12 bg-[#0f766e]/8 p-4 text-sm leading-6 text-[#173b35]">
          Standard refunds are available within 14 days. After 20 days, the uploaded policy does not describe a standard refund option.
        </div>
      </div>
      <div className="rounded-[1.6rem] border border-[#2c2118]/10 bg-[#fbf4e7] p-4">
        <p className="text-sm font-semibold text-[#0f766e]">Sources</p>
        {["Refund Policy.pdf, page 2", "Terms.md, Refunds section", "Confidence 0.84"].map((item) => (
          <div
            key={item}
            className="mt-3 rounded-2xl border border-[#2c2118]/10 bg-[#fffaf0]/72 px-3 py-3 text-xs text-[#5f5245] transition-colors duration-300 hover:bg-[#fffaf0]"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

function WidgetPreview() {
  return (
    <div className="grid gap-4">
      <pre className="whitespace-pre-wrap break-words rounded-[1.6rem] border border-[#2c2118]/10 bg-[#18140f] p-5 font-mono text-[13px] leading-7 text-[#eadcc7]">
        {`<script
  src="https://cdn.echo.dev/widget.js"
  data-agent-key="agent_pub_xxx">
</script>`}
      </pre>
      <div className="rounded-[1.6rem] border border-[#2c2118]/10 bg-[#fbf4e7] p-4">
        <div className="ml-auto max-w-[72%] rounded-2xl bg-[#18140f]/7 p-3 text-sm text-[#31271d]">
          How do I reset my password?
        </div>
        <div className="mt-3 max-w-[78%] rounded-2xl bg-[#0f766e]/10 p-3 text-sm leading-6 text-[#173b35]">
          You can reset your password from Account Settings, Security, then Reset Password.
        </div>
      </div>
    </div>
  )
}

function AnalyticsPreview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        ["Fallback rate", "8.4%"],
        ["Average confidence", "0.81"],
        ["Top question", "Refund timing"],
        ["Open knowledge gaps", "5"],
      ].map(([label, value]) => (
        <MetricCard key={label} label={label} value={value} tone="cyan" />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Visual components
   ═══════════════════════════════════════════════════════════════ */

function PipelineVisual() {
  const stages = ["Upload", "Extract", "Chunk", "Embed", "Retrieve"]
  return (
    <div className="rounded-[2rem] border border-[#2c2118]/10 bg-[#fffaf0]/64 p-6 shadow-[0_24px_80px_-60px_rgba(70,52,33,0.45)]">
      <div className="grid gap-3">
        {stages.map((stage, index) => (
          <motion.div
            key={stage}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ x: 4, transition: { duration: 0.2 } }}
            className="group flex items-center gap-4 rounded-2xl border border-[#2c2118]/10 bg-[#fbf4e7] p-4 transition-colors duration-300 hover:bg-[#f5ead8]"
          >
            <div className="grid size-10 place-items-center rounded-xl bg-[#0f766e]/8 font-mono text-sm text-[#0f766e] transition-colors duration-300 group-hover:bg-[#0f766e]/14">
              {index + 1}
            </div>
            <span className="font-medium text-[#31271d]">{stage}</span>
            <div className="ml-auto h-1.5 w-28 overflow-hidden rounded-full bg-[#2c2118]/10">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 + index * 0.1, duration: 0.7 }}
                className="h-full rounded-full bg-[#0f766e]"
              />
            </div>
          </motion.div>
        ))}
      </div>
      <p className="mt-5 text-sm leading-6 text-[#6d604f]">
        Every answer starts with your docs, not the model&apos;s imagination.
      </p>
    </div>
  )
}

function PlaygroundInspection() {
  return (
    <div className="rounded-[2rem] border border-[#2c2118]/10 bg-[#fffaf0]/64 p-5 shadow-[0_24px_80px_-60px_rgba(70,52,33,0.45),inset_0_1px_0_rgba(255,255,255,0.85)]">
      <div className="flex items-center justify-between border-b border-[#2c2118]/10 pb-4">
        <div>
          <p className="text-sm font-semibold text-[#18140f]">Playground turn</p>
          <p className="mt-1 text-xs text-[#817464]">Builder-only source inspection</p>
        </div>
        <span className="rounded-full border border-[#0f766e]/20 bg-[#0f766e]/8 px-3 py-1 text-xs font-medium text-[#0f766e]">
          Hybrid retrieval
        </span>
      </div>

      <div className="grid gap-5 pt-5 lg:grid-cols-[minmax(0,1.25fr)_220px]">
        <div className="space-y-4">
          <div className="max-w-[82%] rounded-2xl border border-[#2c2118]/10 bg-[#18140f]/7 p-4 text-sm leading-6 text-[#31271d]">
            Can I get a refund after 20 days?
          </div>
          <div className="ml-auto max-w-[90%] rounded-2xl border border-[#0f766e]/15 bg-[#0f766e]/8 p-5 text-sm leading-7 text-[#173b35]">
            Standard refunds are available within 14 days of purchase. After 20 days, the uploaded
            policy does not describe a standard refund option.
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Confidence", "0.84"],
              ["Retrieval", "Hybrid"],
              ["Trace", "View details"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[#2c2118]/10 bg-[#fbf4e7] p-3 transition-colors duration-300 hover:bg-[#f5ead8]">
                <p className="text-[11px] text-[#817464]">{label}</p>
                <p className="mt-1 text-sm font-medium text-[#31271d]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border border-[#2c2118]/10 bg-[#fbf4e7] p-4">
          <p className="text-sm font-semibold text-[#0f766e]">Sources</p>
          <div className="mt-4 grid gap-3">
            {[
              ["Refund Policy.pdf", "page 2", "0.91"],
              ["Terms.md", "Refunds section", "0.76"],
            ].map(([name, location, score]) => (
              <div key={name} className="rounded-xl border border-[#2c2118]/10 bg-[#fffaf0]/70 p-3 transition-colors duration-300 hover:bg-[#fffaf0]">
                <p className="text-sm font-medium text-[#31271d]">{name}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#817464]">
                  <span>{location}</span>
                  <span className="font-mono text-[#0f766e]">{score}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

function WidgetInstallVisual() {
  return (
    <div className="rounded-[2rem] border border-[#2c2118]/10 bg-[#fffaf0]/64 p-5">
      <WidgetPreview />
      <div className="mt-4 flex flex-wrap gap-2">
        {["Domain allowlist", "Anonymous sessions", "Feedback buttons", "Mobile-ready", "Rate-limited"].map((item) => (
          <span
            key={item}
            className="rounded-full border border-[#2c2118]/10 bg-[#18140f]/5 px-3 py-1 text-xs text-[#6d604f] transition-colors duration-300 hover:bg-[#18140f]/10"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function QuestionCluster() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#2c2118]/10 bg-[#fffaf0]/64 p-6">
      <div className="grid gap-3 md:grid-cols-3">
        {["How long does a refund take?", "When will I get my refund?", "Refund processing time?"].map(
          (question, index) => (
            <motion.div
              key={question}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl border border-[#2c2118]/10 bg-[#fbf4e7] p-4 text-sm text-[#5f5245] transition-shadow duration-300 hover:shadow-[0_8px_24px_-12px_rgba(70,52,33,0.2)]"
            >
              {question}
            </motion.div>
          ),
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.38 }}
        className="mt-5 rounded-2xl border border-[#0f766e]/18 bg-[#0f766e]/8 p-5"
      >
        <p className="text-sm font-semibold text-[#0f766e]">Knowledge gap detected</p>
        <p className="mt-3 text-sm leading-6 text-[#5f5245]">
          Echo found refund eligibility in your docs, but not refund processing time.
        </p>
        <p className="mt-4 text-sm text-[#173b35]">
          Suggested FAQ: How long do refunds take after approval?
        </p>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Utility components
   ═══════════════════════════════════════════════════════════════ */

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  const toneClass =
    tone === "rose"
      ? "text-[#be123c]"
      : tone === "amber"
        ? "text-[#a05a2f]"
        : tone === "violet"
          ? "text-[#5f4b8b]"
          : tone === "emerald"
            ? "text-[#2f855a]"
            : "text-[#0f766e]"

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="rounded-[1.35rem] border border-[#2c2118]/10 bg-[#fffaf0]/58 p-5 transition-shadow duration-300 hover:shadow-[0_12px_32px_-16px_rgba(70,52,33,0.25)]"
    >
      <p className="text-sm text-[#817464]">{label}</p>
      <p className={cn("mt-3 font-mono text-3xl font-semibold", toneClass)}>{value}</p>
    </motion.div>
  )
}

function AnimatedCounter({ value, className, delay = 0 }: { value: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const isInView = useInView(ref, { once: true })
  const [displayValue, setDisplayValue] = useState("0")

  useEffect(() => {
    if (!isInView) return

    const numericMatch = value.match(/^([\d.]+)(.*)$/)
    if (!numericMatch) {
      const timer = setTimeout(() => setDisplayValue(value), delay * 1000)
      return () => clearTimeout(timer)
    }

    const target = parseFloat(numericMatch[1])
    const suffix = numericMatch[2]
    const duration = 1200
    const startTime = Date.now() + delay * 1000

    const frame = () => {
      const now = Date.now()
      if (now < startTime) {
        requestAnimationFrame(frame)
        return
      }
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = target * eased

      if (value.includes(".")) {
        setDisplayValue(current.toFixed(value.split(".")[1]?.replace(/\D/g, "").length || 1) + suffix)
      } else {
        setDisplayValue(Math.round(current) + suffix)
      }

      if (progress < 1) requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)
  }, [isInView, value, delay])

  return (
    <p ref={ref} className={className}>
      {displayValue}
    </p>
  )
}

function PanelLabel({ icon: Icon, children }: { icon: typeof FileText; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#817464]">
      <Icon size={15} weight="duotone" className="text-[#0f766e]" />
      {children}
    </div>
  )
}

function MotionLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string
  children: React.ReactNode
  variant?: "primary" | "secondary"
  className?: string
}) {
  const childrenArray = Array.isArray(children) ? children : [children]
  const icon = childrenArray.find((child) => typeof child !== "string")
  const label = childrenArray.filter((child) => typeof child === "string")

  return (
    <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} className="inline-flex">
      <Link
        href={href}
        className={cn(
          "group inline-flex h-12 items-center justify-center gap-3 rounded-full px-5 text-sm font-semibold transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          variant === "primary"
            ? "bg-[#18140f] text-[#fffaf0] hover:bg-[#0f766e]"
            : "border border-[#2c2118]/12 bg-[#fffaf0]/64 text-[#31271d] hover:bg-[#fffaf0]",
          className,
        )}
      >
        <span>{label}</span>
        {icon ? (
          <span className="grid size-7 place-items-center rounded-full bg-[#fffaf0]/16 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
            {icon}
          </span>
        ) : null}
      </Link>
    </motion.div>
  )
}
