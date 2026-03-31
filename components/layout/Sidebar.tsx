// components/layout/Sidebar.tsx
'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  CreditCard,
  BookOpen,
  Users,
  BarChart3,
  LogOut,
  GraduationCap,
  ChevronRight,
  UserCog,
} from 'lucide-react'
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['COLECTOR', 'MATRICULA', 'ADMINISTRATIVO'] },
  { href: '/pagos', label: 'Gestionar Pagos', icon: CreditCard, roles: ['COLECTOR', 'ADMINISTRATIVO'] },
  { href: '/talonarios', label: 'Talonarios', icon: BookOpen, roles: ['COLECTOR', 'MATRICULA', 'ADMINISTRATIVO'] },
  { href: '/estudiantes', label: 'Estudiantes', icon: Users, roles: ['MATRICULA', 'ADMINISTRATIVO'] },
  { href: '/usuarios', label: 'Usuarios', icon: UserCog, roles: ['ADMINISTRATIVO'] },
  { href: '/reportes', label: 'Reportes', icon: BarChart3, roles: ['ADMINISTRATIVO'] },
]

type SessionUser = { name?: string | null; email?: string | null; rol?: string }

function roleLabel(rol: string | undefined) {
  if (rol === 'ADMINISTRATIVO') return 'Administrativo'
  if (rol === 'MATRICULA') return 'Matrícula'
  if (rol === 'COLECTOR') return 'Colector'
  return rol ?? ''
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { setOpenMobile } = useSidebar()
  const user = session?.user as SessionUser | undefined
  const rol = user?.rol

  const visibleItems = navItems.filter(item => item.roles.includes(rol ?? ''))

  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  return (
    <SidebarRoot collapsible="offcanvas" variant="floating">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3 px-1">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-bold">C.E.C.</p>
            <p className="truncate text-xs text-muted-foreground leading-tight">Zaconato</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 py-2">
        <SidebarMenu>
          {visibleItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.label} className='px-2 my-2'>
                  <Link href={item.href}>
                    <item.icon />
                    <span className="flex-1">{item.label}</span>
                    {active ? <ChevronRight className="size-3 opacity-70" /> : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div
          className={cn(
            'mb-2 rounded-md px-2 py-2 text-left',
            'group-data-[collapsible=icon]:hidden'
          )}
        >
          <p className="truncate text-xs font-semibold text-sidebar-foreground">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          <Badge variant="secondary" className="mt-1.5 text-[0.65rem] font-medium">
            {roleLabel(rol)}
          </Badge>
        </div>
        <SidebarSeparator className="my-2 group-data-[collapsible=icon]:hidden" />
        <Button
          variant="ghost"
          className="h-8 w-full justify-start gap-2 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:sr-only">Cerrar Sesión</span>
        </Button>
      </SidebarFooter>
    </SidebarRoot>
  )
}
