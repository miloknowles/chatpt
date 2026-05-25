"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { ChevronRightIcon, MessageSquareIcon } from "lucide-react"

import { useUserConversations } from "@/hooks/use-user-conversations"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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

export function NavChat() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedConversationId = searchParams.get("conversation")
  const isChatRoute = pathname.startsWith("/training/chat")
  const { conversations, isLoading, error } = useUserConversations({
    limit: 8,
    autoCreate: false,
  })

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Chat</SidebarGroupLabel>
      <SidebarMenu>
        <Collapsible
          defaultOpen={isChatRoute}
          className="group/collapsible"
          render={<SidebarMenuItem />}
        >
          <CollapsibleTrigger
            render={
              <SidebarMenuButton
                tooltip="Chat"
                isActive={isChatRoute}
              />
            }
          >
            <MessageSquareIcon />
            <span>Chat</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
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
                  <SidebarMenuSubItem key={conversation.id}>
                    <SidebarMenuSubButton
                      isActive={
                        isChatRoute &&
                        selectedConversationId === conversation.id
                      }
                      render={
                        <a href={`/training/chat?conversation=${conversation.id}`} />
                      }
                    >
                      <span>{conversation.title}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))
              )}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  )
}
