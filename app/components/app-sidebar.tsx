"use client"

import * as React from "react"

import { NavChat } from "@/components/nav-chat"
import { NavLibrary } from "@/components/nav-library"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  CompassIcon,
  DumbbellIcon,
  LibraryBigIcon,
  MessageSquareIcon,
  RouteIcon,
  ShieldCheckIcon,
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
    {
      title: "Sessions",
      url: "#",
      icon: <RouteIcon />,
      items: [
        {
          title: "Pre-run Prep",
          url: "#",
        },
        {
          title: "Strength Blocks",
          url: "#",
        },
        {
          title: "Cardio Work",
          url: "#",
        },
      ],
    },
    {
      title: "Qualities",
      url: "#",
      icon: <ShieldCheckIcon />,
      items: [
        {
          title: "Building",
          url: "#",
        },
        {
          title: "Maintaining",
          url: "#",
        },
        {
          title: "Inactive",
          url: "#",
        },
      ],
    },
    {
      title: "Insights",
      url: "#",
      icon: <CompassIcon />,
      items: [
        {
          title: "Coverage Gaps",
          url: "#",
        },
        {
          title: "Progression Risks",
          url: "#",
        },
      ],
    },
  ],
  library: [
    {
      title: "Exercises",
      url: "/training/exercises",
      icon: <LibraryBigIcon />,
    },
    {
      title: "Session Builder",
      url: "/training/sessions",
      icon: <RouteIcon />,
    },
  ],
  chat: [
    {
      title: "Coach: Weekly Build",
      url: "/training/chat?thread=weekly-build",
      icon: <MessageSquareIcon />,
    },
    {
      title: "Adjust Tomorrow Session",
      url: "/training/chat?thread=adjust-tomorrow",
      icon: <MessageSquareIcon />,
    },
    {
      title: "Recovery Check-in",
      url: "/training/chat?thread=recovery-checkin",
      icon: <MessageSquareIcon />,
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
        <NavLibrary label="Program" items={data.library} />
        <NavChat items={data.chat} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
