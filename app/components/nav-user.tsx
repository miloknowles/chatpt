"use client"

import { useRouter } from "next/navigation"
import BoringAvatar from "boring-avatars"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  ChevronsUpDownIcon,
  Loader2,
  LogOutIcon,
  Settings2Icon,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const BRAND_BEAM_DUOTONE_COLORS = ["var(--primary)", "#f59e0b"]

export function NavUser({
  user,
  onSignOut,
  isSigningOut = false,
}: {
  user: {
    name: string
    email: string
  }
  onSignOut: () => void
  isSigningOut?: boolean
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const avatarSeed = user.email.trim().toLowerCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <div className="size-8 shrink-0 overflow-hidden rounded-full">
              <BoringAvatar
                size={32}
                name={avatarSeed}
                variant="beam"
                colors={BRAND_BEAM_DUOTONE_COLORS}
              />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <div className="size-8 shrink-0 overflow-hidden rounded-full">
                    <BoringAvatar
                      size={32}
                      name={avatarSeed}
                      variant="beam"
                      colors={BRAND_BEAM_DUOTONE_COLORS}
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between px-2 py-1 text-sm">
              <span>Theme</span>
              <ThemeToggle variant="secondary" size="icon-sm" />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/training/settings")}>
              <Settings2Icon />
              User settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} disabled={isSigningOut}>
              {isSigningOut ? (
                <Loader2 className="animate-spin" />
              ) : (
                <LogOutIcon />
              )}
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
