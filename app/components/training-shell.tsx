"use client"

import type { ReactNode } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface TrainingShellProps {
  email: string
  title?: string
  children?: ReactNode
}

export function TrainingShell({
  email,
  title = "Training Dashboard",
  children,
}: TrainingShellProps) {
  const { signOut, isLoading, user } = useAuth()
  const effectiveEmail = user?.email ?? email
  const metadataDisplayName = user?.user_metadata?.display_name
  const displayName =
    typeof metadataDisplayName === "string" ? metadataDisplayName : undefined

  return (
    <SidebarProvider>
      <AppSidebar
        email={effectiveEmail}
        displayName={displayName}
        onSignOut={signOut}
        isSigningOut={isLoading}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-1 data-vertical:h-4 data-vertical:self-auto"
            />
            <p className="font-heading text-sm font-medium text-muted-foreground">
              Training
            </p>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-6">
          <Card className="border-border/70 bg-card/90 shadow-xl shadow-foreground/5">
            <CardHeader>
              <CardTitle className="text-2xl">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {children ?? (
                <>
                  <p>Signed in as {effectiveEmail}.</p>
                  <p>
                    This route is protected server-side and unlocked only when your
                    Supabase session is valid.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
