"use client"

import { Loader2, LogOut } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardShellProps {
  email: string
}

export function DashboardShell({ email }: DashboardShellProps) {
  const { signOut, isLoading } = useAuth()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-10 lg:px-10">
        <header className="mb-8 flex items-center justify-between">
          <p className="font-heading text-base font-medium text-muted-foreground">
            🏔️ ChatPT
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              className="gap-2"
              onClick={signOut}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              Sign out
            </Button>
          </div>
        </header>

        <Card className="border-border/70 bg-card/90 shadow-xl shadow-foreground/5">
          <CardHeader>
            <CardTitle className="text-2xl">Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Signed in as {email}.</p>
            <p>
              This route is protected server-side and unlocked only when your
              Supabase session is valid.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
