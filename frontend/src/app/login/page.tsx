import { AuthShell } from "@/components/auth/auth-shell"

export default function LoginPage() {
  return <AuthShell mode="login" clerkEnabled={Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)} />
}
