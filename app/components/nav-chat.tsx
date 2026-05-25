"use client"

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
  const { conversations, isLoading, error } = useUserConversations({
    limit: 8,
    autoCreate: false,
  })

  return (
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
                  <SidebarMenuSubItem key={conversation.id}>
                    <SidebarMenuSubButton
                      isActive={
                        isChatOpen &&
                        selectedConversationId === conversation.id
                      }
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
