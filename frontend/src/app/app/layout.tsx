import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { AppShell } from "@/components/layout/app-shell"

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session.userId) {
    redirect("/login")
  }

  return <AppShell>{children}</AppShell>
}
