// components/layout/Header.tsx
'use client'
import { useSession } from 'next-auth/react'
import { Bell, GraduationCap } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
          <GraduationCap className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-700">Complejo Educativo Católico Zaconato</span>
        </div>
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {session?.user?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  )
}
