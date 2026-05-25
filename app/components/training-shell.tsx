"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DumbbellIcon,
  LibraryBigIcon,
  MessageSquareIcon,
  RouteIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
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
      : pathname === "/training/program"
        ? LibraryBigIcon
      : pathname === "/training/sessions"
        ? RouteIcon
      : pathname === "/training/settings"
        ? SettingsIcon
        : DumbbellIcon
  const mobileNavItems = [
    {
      label: "Training",
      href: "/training",
      icon: RouteIcon,
      isActive: pathname === "/training",
    },
    {
      label: "Program",
      href: "/training/program",
      icon: DumbbellIcon,
      isActive:
        pathname.startsWith("/training/program") ||
        pathname.startsWith("/training/sessions") ||
        pathname.startsWith("/training/exercises"),
    },
    {
      label: "Chat",
      href: "/training/chat",
      icon: MessageSquareIcon,
      isActive: pathname.startsWith("/training/chat"),
    },
    {
      label: "Account",
      href: "/training/settings",
      icon: UserIcon,
      isActive: pathname.startsWith("/training/settings"),
    },
  ]

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
            <div className="hidden items-center gap-2 md:flex">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-1 data-vertical:h-4 data-vertical:self-auto"
              />
            </div>
            <p className="flex items-center gap-1.5 font-heading text-sm font-medium text-muted-foreground">
              <MobileHeaderIcon className="size-4 md:hidden" />
              {title}
            </p>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 pb-24 md:p-6 md:pb-6">
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
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur md:hidden">
          <div className="grid grid-cols-4 pb-[max(env(safe-area-inset-bottom),0.25rem)]">
            {mobileNavItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 pt-2 pb-1 text-[11px] text-muted-foreground",
                    item.isActive && "text-foreground"
                  )}
                >
                  <Icon className={cn("size-4", item.isActive && "text-primary")} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </SidebarInset>
    </SidebarProvider>
  )
}
