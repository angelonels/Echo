"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { clearSession } from "@/lib/auth/session"
import { cn } from "@/lib/utils"

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter()

  function handleLogout() {
    clearSession()
    router.replace("/")
    router.refresh()
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className={cn("justify-start gap-2 text-zinc-300 hover:bg-white/8 hover:text-white", className)}
      onClick={handleLogout}
    >
      <LogOut className="size-4" />
      Logout
    </Button>
  )
}
