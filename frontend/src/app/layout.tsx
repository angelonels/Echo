import type { Metadata } from "next"
import { Manrope, Space_Grotesk } from "next/font/google"

import "./globals.css"

const bodyFont = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
})

const headingFont = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Echo",
  description:
    "Echo is an AI support platform for small companies, with grounded document answers, playground testing, analytics, and widget setup.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  )
}
