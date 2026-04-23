import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { LandingPage } from "@/components/landing/landing-page"

export default async function HomePage() {
  const session = await auth()

  if (session.userId) {
    redirect("/app")
  }

  return <LandingPage />
}
