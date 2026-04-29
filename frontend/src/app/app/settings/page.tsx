export default function AppSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-2 text-muted-foreground">Account, defaults, and workspace-level preferences for Echo.</p>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
        Account settings are Clerk-owned. Product defaults can be added here after Phase 3.
      </div>
    </div>
  )
}
