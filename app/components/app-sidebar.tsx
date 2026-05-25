"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  ActivityIcon,
  CompassIcon,
  DumbbellIcon,
  ListChecksIcon,
  RouteIcon,
  ShieldCheckIcon,
  TimerIcon,
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
  projects: [
    {
      name: "Ankle + Foot",
      url: "#",
      icon: <ActivityIcon />,
    },
    {
      name: "Posterior Chain",
      url: "#",
      icon: <ListChecksIcon />,
    },
    {
      name: "Marathon Build",
      url: "#",
      icon: <TimerIcon />,
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
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
