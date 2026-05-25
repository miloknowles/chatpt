"use client"

import * as React from "react"

import { NavChat } from "@/components/nav-chat"
import { NavMain } from "@/components/nav-main"
import { NavProgram } from "@/components/nav-program"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DumbbellIcon,
} from "lucide-react"

function userNameFromEmail(email: string) {
  const [local] = email.split("@")
  if (!local) {
    return "Athlete"
  }
  return local
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ")
}

const data = {
  navMain: [
    {
      title: "Training",
      url: "/training",
      icon: <DumbbellIcon />,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "/training",
        },
      ],
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  email: string
  displayName?: string
  onSignOut: () => void
  isSigningOut?: boolean
}

export function AppSidebar({
  email,
  displayName,
  onSignOut,
  isSigningOut = false,
  ...props
}: AppSidebarProps) {
  const normalizedDisplayName = displayName?.trim()

  const user = React.useMemo(
    () => ({
      name: normalizedDisplayName || userNameFromEmail(email),
      email,
    }),
    [email, normalizedDisplayName]
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser
          user={user}
          onSignOut={onSignOut}
          isSigningOut={isSigningOut}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProgram />
        <NavChat />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
