"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { DumbbellIcon, LibraryBigIcon, RouteIcon, SettingsIcon } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/components/auth-provider"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface TrainingShellProps {
  email: string
  title?: string
  hideTitleOnMobile?: boolean
  children?: ReactNode
}

export function TrainingShell({
  email,
  title = "Training Dashboard",
  hideTitleOnMobile = false,
  children,
}: TrainingShellProps) {
  const pathname = usePathname()
  const { signOut, isLoading, user } = useAuth()
  const effectiveEmail = user?.email ?? email
  const metadataDisplayName = user?.user_metadata?.display_name
  const displayName =
    typeof metadataDisplayName === "string" ? metadataDisplayName : undefined
  const MobileHeaderIcon =
    pathname === "/training/exercises"
      ? LibraryBigIcon
      : pathname === "/training/sessions"
        ? RouteIcon
      : pathname === "/training/settings"
        ? SettingsIcon
        : DumbbellIcon

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
            <p className="flex items-center gap-1.5 font-heading text-sm font-medium text-muted-foreground">
              <MobileHeaderIcon className="size-4 md:hidden" />
              {title}
            </p>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-6">
          <div className="space-y-6">
            <h1
              className={`text-xl font-semibold sm:text-2xl ${
                hideTitleOnMobile ? "hidden sm:block" : ""
              }`}
            >
              {title}
            </h1>
            {children ?? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Signed in as {effectiveEmail}.</p>
                <p>
                  This route is protected server-side and unlocked only when your
                  Supabase session is valid.
                </p>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
