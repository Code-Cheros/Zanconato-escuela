// components/layout/Header.tsx
'use client'
import { useSession } from 'next-auth/react'
import { GraduationCap } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession()
  const initials = session?.user?.name?.charAt(0).toUpperCase() ?? '?'

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6">
      <div className="flex items-center gap-2">
        {/* <SidebarTrigger className="md:hidden" /> */}
        <div>
          <h1 className="text-base font-semibold text-foreground sm:text-lg">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <GraduationCap className="size-4 text-primary" />
          <span className="font-medium text-primary">Complejo Educativo Católico Zaconato</span>
        </div>
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
