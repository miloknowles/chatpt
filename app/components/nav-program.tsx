"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ChevronRightIcon,
  LibraryBigIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RouteIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react"

import { useUserSessions } from "@/hooks/use-user-sessions"
import type { Database } from "@/types/database"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type UserSession = Database["public"]["Tables"]["user_sessions"]["Row"]

export function NavProgram() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedSessionId = searchParams.get("session")
  const isSessionsRoute = pathname.startsWith("/training/sessions")
  const isProfileRoute = pathname.startsWith("/training/profile")
  const [sessionPendingDelete, setSessionPendingDelete] =
    useState<UserSession | null>(null)
  const {
    sessions,
    isLoading,
    isMutating,
    createSession,
    deleteSession,
  } = useUserSessions()

  useEffect(() => {
    if (!isSessionsRoute || selectedSessionId || sessions.length === 0) {
      return
    }

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("session", sessions[0].id)
    router.replace(`/training/sessions?${nextParams.toString()}`)
  }, [
    isSessionsRoute,
    router,
    searchParams,
    selectedSessionId,
    sessions,
  ])

  async function handleCreateSession() {
    const result = await createSession()
    if (result.error || !result.session) {
      return
    }

    router.push(`/training/sessions?session=${result.session.id}`)
  }

  function openSession(sessionId: string) {
    router.push(`/training/sessions?session=${sessionId}`)
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    if (!open) {
      setSessionPendingDelete(null)
    }
  }

  async function handleDeleteSession() {
    if (!sessionPendingDelete) {
      return
    }

    const deletedSessionId = sessionPendingDelete.id
    const result = await deleteSession(deletedSessionId)
    if (result.error) {
      return
    }

    setSessionPendingDelete(null)

    if (selectedSessionId === deletedSessionId) {
      router.push("/training/sessions")
    }
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Program</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Profile"
              isActive={isProfileRoute}
              render={<a href="/training/profile" />}
            >
              <UserRoundIcon />
              <span>Profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Exercises"
              isActive={pathname.startsWith("/training/exercises")}
              render={<a href="/training/exercises" />}
            >
              <LibraryBigIcon />
              <span>Exercises</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <Collapsible
            defaultOpen={isSessionsRoute}
            className="group/collapsible"
            render={<SidebarMenuItem />}
          >
            <div className="flex items-center gap-1">
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton
                    tooltip="Sessions"
                    isActive={isSessionsRoute}
                    className="min-w-0 flex-1"
                  />
                }
              >
                <RouteIcon />
                <span>Sessions</span>
                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                className="size-6 group-data-[collapsible=icon]:hidden"
                aria-label="Create session"
                disabled={isMutating}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  void handleCreateSession()
                }}
              >
                <PlusIcon />
              </Button>
            </div>
            <CollapsibleContent>
              <SidebarMenuSub className="mr-0 pr-0">
                {isLoading ? (
                  <SidebarMenuSubItem>
                    <span className="px-2 text-xs text-sidebar-foreground/70">
                      Loading sessions...
                    </span>
                  </SidebarMenuSubItem>
                ) : sessions.length === 0 ? (
                  <SidebarMenuSubItem>
                    <span className="px-2 text-xs text-sidebar-foreground/70">
                      No sessions yet
                    </span>
                  </SidebarMenuSubItem>
                ) : (
                  sessions.map((session) => (
                    <SidebarMenuSubItem
                      key={session.id}
                      className="w-full"
                    >
                      <SidebarMenuSubButton
                        isActive={
                          isSessionsRoute &&
                          selectedSessionId === session.id
                        }
                        className="w-full pr-8"
                        render={<a href={`/training/sessions?session=${session.id}`} />}
                      >
                        <span>{session.name}</span>
                      </SidebarMenuSubButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="absolute top-0.5 right-0 size-6 group-data-[collapsible=icon]:hidden"
                              aria-label={`Actions for ${session.name}`}
                              disabled={isMutating}
                            />
                          }
                        >
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-32">
                          <DropdownMenuItem onClick={() => openSession(session.id)}>
                            <PencilIcon />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setSessionPendingDelete(session)}
                          >
                            <Trash2Icon />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuSubItem>
                  ))
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>

      <AlertDialog
        open={Boolean(sessionPendingDelete)}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to delete "${sessionPendingDelete?.name ?? "this session"}"? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isMutating}
              onClick={() => void handleDeleteSession()}
            >
              {isMutating ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
