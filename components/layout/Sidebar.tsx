// components/layout/Sidebar.tsx
'use client'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['COLECTOR', 'MATRICULA', 'ADMINISTRATIVO'] },
  { href: '/pagos', label: 'Gestionar Pagos', icon: CreditCard, roles: ['COLECTOR', 'ADMINISTRATIVO'] },
  { href: '/talonarios', label: 'Talonarios', icon: BookOpen, roles: ['COLECTOR', 'MATRICULA', 'ADMINISTRATIVO'] },
  { href: '/estudiantes', label: 'Estudiantes', icon: Users, roles: ['MATRICULA', 'ADMINISTRATIVO'] },
  { href: '/reportes', label: 'Reportes', icon: BarChart3, roles: ['ADMINISTRATIVO'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol

  const visibleItems = navItems.filter(item => item.roles.includes(rol))

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen flex flex-col shadow-sm">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-blue-700 leading-tight truncate">C.E.C.</p>
            <p className="text-xs text-gray-500 leading-tight truncate">Zaconato</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-link',
                active ? 'active' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-70" />}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs font-semibold text-gray-800 truncate">{session?.user?.name}</p>
          <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-medium">
            {rol === 'ADMINISTRATIVO' ? 'Administrativo' : rol === 'MATRICULA' ? 'Matrícula' : 'Colector'}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
