"use client"

import type { ReactNode } from "react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavChat({
  items,
}: {
  items: {
    title: string
    url: string
    icon: ReactNode
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Chat</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton tooltip={item.title} render={<a href={item.url} />}>
              {item.icon}
              <span className="truncate">{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
