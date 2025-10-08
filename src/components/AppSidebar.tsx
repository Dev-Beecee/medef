'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  BarChart3,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const menuItems = [
  {
    title: 'Dashboard',
    url: '/ghost-dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Participations',
    url: '/ghost-dashboard/participations',
    icon: FileText,
  },
  {
    title: 'Votes',
    url: '/ghost-dashboard/stats',
    icon: BarChart3,
  },
  {
    title: 'Gestion des dates',
    url: '/ghost-dashboard/dates',
    icon: Calendar,
  },
  {
    title: 'Administrateurs',
    url: '/ghost-dashboard/admin',
    icon: Users,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">M</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">MEDEF Admin</span>
            <span className="text-xs text-muted-foreground">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.url

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex flex-col gap-2 rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {user?.email || 'Admin'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Administrateur
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 px-2 py-1 rounded hover:bg-background"
              >
                <LogOut className="h-3 w-3" />
                Déconnexion
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

