"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ClipboardCheckIcon,
  DumbbellIcon,
  LibraryBigIcon,
  MessageSquareIcon,
  PanelRightCloseIcon,
  RouteIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/components/auth-provider"
import { ChatPanel } from "@/components/chat"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface TrainingShellProps {
  email: string
  title?: string
  hideTitle?: boolean
  hideTitleOnMobile?: boolean
  contentClassName?: string
  desktopContentClassName?: string
  children?: ReactNode
}

export function TrainingShell({
  email,
  title = "Training Dashboard",
  hideTitle = false,
  hideTitleOnMobile = false,
  contentClassName,
  desktopContentClassName,
  children,
}: TrainingShellProps) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { signOut, isLoading, user } = useAuth()
  const [isDesktopChatOpen, setIsDesktopChatOpen] = useState(false)
  const [selectedChatConversationId, setSelectedChatConversationId] =
    useState<string | null>(null)
  const effectiveEmail = user?.email ?? email
  const metadataDisplayName = user?.user_metadata?.display_name
  const displayName =
    typeof metadataDisplayName === "string" ? metadataDisplayName : undefined
  const MobileHeaderIcon =
    pathname === "/training/exercises"
      ? LibraryBigIcon
      : pathname === "/training/profile"
        ? ClipboardCheckIcon
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
        pathname.startsWith("/training/exercises") ||
        pathname.startsWith("/training/profile"),
    },
    {
      label: "Account",
      href: "/training/settings",
      icon: UserIcon,
      isActive: pathname.startsWith("/training/settings"),
    },
  ]

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "c") {
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      if (isMobile) {
        return
      }

      const target = event.target
      if (target instanceof HTMLElement) {
        const tagName = target.tagName.toLowerCase()
        const isTypingTarget =
          target.isContentEditable ||
          tagName === "input" ||
          tagName === "textarea" ||
          tagName === "select"
        if (isTypingTarget) {
          return
        }
      }

      event.preventDefault()
      setIsDesktopChatOpen((current) => !current)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isMobile])

  const pageContent = (
    <div className={cn("space-y-6", contentClassName)}>
      {hideTitle ? null : (
        <h1
          className={`text-xl font-semibold sm:text-2xl ${hideTitleOnMobile ? "hidden sm:block" : ""
            }`}
        >
          {title}
        </h1>
      )}
      {children ?? (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Signed in as {effectiveEmail}.</p>
          <p>
            This route is protected server-side and unlocked only when your Supabase
            session is valid.
          </p>
        </div>
      )}
    </div>
  )

  return (
    <SidebarProvider>
      <AppSidebar
        email={effectiveEmail}
        displayName={displayName}
        onSignOut={signOut}
        onSelectChatConversation={(conversationId) => {
          setSelectedChatConversationId(conversationId)
          setIsDesktopChatOpen(true)
        }}
        selectedChatConversationId={selectedChatConversationId}
        isChatOpen={isDesktopChatOpen}
        isSigningOut={isLoading}
      />
      <SidebarInset className="md:h-svh md:min-h-0 md:overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3">
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
          <Button
            type="button"
            variant="default"
            size="lg"
            className="hidden size-9 md:inline-flex rounded-full"
            aria-keyshortcuts="c"
            aria-label={isDesktopChatOpen ? "Close chat panel" : "Open chat panel"}
            title={isDesktopChatOpen ? "Close chat (c)" : "Open chat (c)"}
            onClick={() => setIsDesktopChatOpen((current) => !current)}
          >
            {isDesktopChatOpen ? <PanelRightCloseIcon className="size-4" /> : <MessageSquareIcon className="size-4" />}
          </Button>
        </header>
        <main className="flex flex-1 min-h-0 flex-col">
          <section className="flex flex-1 flex-col gap-6 p-4 pb-24 md:hidden">
            {pageContent}
          </section>
          <section className="hidden min-h-0 flex-1 md:flex">
            {isDesktopChatOpen ? (
              <>
                <div
                  className={cn(
                    "min-w-0 flex-1 overflow-auto p-6",
                    desktopContentClassName
                  )}
                >
                  {pageContent}
                </div>
                <aside className="flex h-full w-96 shrink-0 flex-col border-l bg-background xl:w-[28rem]">
                  <ChatPanel
                    variant="aside"
                    selectedConversationId={selectedChatConversationId}
                    onSelectedConversationIdChange={setSelectedChatConversationId}
                  />
                </aside>
              </>
            ) : (
              <div
                className={cn(
                  "h-full w-full overflow-auto p-6",
                  desktopContentClassName
                )}
              >
                {pageContent}
              </div>
            )}
          </section>
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur md:hidden">
          <div className="grid grid-cols-3 pb-[max(env(safe-area-inset-bottom),0.25rem)]">
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
