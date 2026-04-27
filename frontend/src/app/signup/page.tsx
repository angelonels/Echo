import { AuthShell } from "@/components/auth/auth-shell"

export default function SignupPage() {
  return <AuthShell mode="signup" clerkEnabled={Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)} />
}
