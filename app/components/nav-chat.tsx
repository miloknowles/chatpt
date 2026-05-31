"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import {
  ChevronRightIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import { useUserConversations } from "@/hooks/use-user-conversations"
import type { UserConversation } from "@/types/database"
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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

type NavChatProps = {
  isChatOpen: boolean
  selectedConversationId: string | null
  onSelectConversation: (conversationId: string) => void
}

export function NavChat({
  isChatOpen,
  selectedConversationId,
  onSelectConversation,
}: NavChatProps) {
  const [conversationPendingRename, setConversationPendingRename] =
    useState<UserConversation | null>(null)
  const [conversationPendingDelete, setConversationPendingDelete] =
    useState<UserConversation | null>(null)
  const [renameTitle, setRenameTitle] = useState("")
  const {
    conversations,
    isLoading,
    isMutating,
    error,
    mutationError,
    updateConversation,
    deleteConversation,
  } = useUserConversations({
    limit: 8,
    autoCreate: false,
  })

  function openRenameDialog(conversation: UserConversation) {
    setConversationPendingRename(conversation)
    setRenameTitle(conversation.title)
  }

  function handleRenameDialogOpenChange(open: boolean) {
    if (!open) {
      setConversationPendingRename(null)
      setRenameTitle("")
    }
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    if (!open) {
      setConversationPendingDelete(null)
    }
  }

  async function handleRenameConversation(event: FormEvent) {
    event.preventDefault()

    if (!conversationPendingRename) {
      return
    }

    const title = renameTitle.trim()
    if (!title) {
      return
    }

    const result = await updateConversation(conversationPendingRename.id, {
      title,
    })
    if (result.error) {
      return
    }

    setConversationPendingRename(null)
    setRenameTitle("")
  }

  async function handleDeleteConversation() {
    if (!conversationPendingDelete) {
      return
    }

    const result = await deleteConversation(conversationPendingDelete.id)
    if (result.error) {
      return
    }

    setConversationPendingDelete(null)
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Chat</SidebarGroupLabel>
        <SidebarMenu>
          <Collapsible
            defaultOpen
            className="group/collapsible"
            render={<SidebarMenuItem />}
          >
            <CollapsibleTrigger
              render={
                <SidebarMenuButton
                  tooltip="Chat"
                  isActive={isChatOpen}
                />
              }
            >
              <MessageSquareIcon />
              <span>Conversations</span>
              <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="mr-0 pr-0">
                {isLoading ? (
                  <SidebarMenuSubItem>
                    <span className="px-2 text-xs text-sidebar-foreground/70">
                      Loading conversations...
                    </span>
                  </SidebarMenuSubItem>
                ) : error ? (
                  <SidebarMenuSubItem>
                    <span className="px-2 text-xs text-destructive">
                      {error}
                    </span>
                  </SidebarMenuSubItem>
                ) : conversations.length === 0 ? (
                  <SidebarMenuSubItem>
                    <span className="px-2 text-xs text-sidebar-foreground/70">
                      No conversations yet
                    </span>
                  </SidebarMenuSubItem>
                ) : (
                  conversations.map((conversation) => (
                    <SidebarMenuSubItem
                      key={conversation.id}
                      className="w-full"
                    >
                      <SidebarMenuSubButton
                        isActive={
                          isChatOpen &&
                          selectedConversationId === conversation.id
                        }
                        className="w-full pr-8"
                        render={
                          <a
                            href="#"
                            onClick={(event) => {
                              event.preventDefault()
                              onSelectConversation(conversation.id)
                            }}
                          />
                        }
                      >
                        <span>{conversation.title}</span>
                      </SidebarMenuSubButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="absolute top-0.5 right-0 size-6 opacity-0 group-data-[collapsible=icon]:hidden group-focus-within/menu-sub-item:opacity-100 group-hover/menu-sub-item:opacity-100 aria-expanded:opacity-100"
                              aria-label={`Actions for ${conversation.title}`}
                              disabled={isMutating}
                            />
                          }
                        >
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-32">
                          <DropdownMenuItem
                            onClick={() => openRenameDialog(conversation)}
                          >
                            <PencilIcon />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              setConversationPendingDelete(conversation)
                            }
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

      <Dialog
        open={Boolean(conversationPendingRename)}
        onOpenChange={handleRenameDialogOpenChange}
      >
        <DialogContent>
          <form onSubmit={(event) => void handleRenameConversation(event)}>
            <DialogHeader>
              <DialogTitle>Rename Conversation</DialogTitle>
              <DialogDescription>
                Update the name shown in the chat sidebar.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={renameTitle}
                onChange={(event) => setRenameTitle(event.target.value)}
                disabled={isMutating}
                autoFocus
                aria-label="Conversation name"
              />
              {mutationError ? (
                <p className="mt-2 text-sm text-destructive">{mutationError}</p>
              ) : null}
            </div>
            <DialogFooter>
              <DialogClose disabled={isMutating}>Cancel</DialogClose>
              <Button
                type="submit"
                disabled={isMutating || !renameTitle.trim()}
              >
                {isMutating ? "Renaming..." : "Rename"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(conversationPendingDelete)}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to delete "${conversationPendingDelete?.title ?? "this conversation"}"? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isMutating}
              onClick={() => void handleDeleteConversation()}
            >
              {isMutating ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
