'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  History, 
  LogOut, 
  Users,
  Settings
} from 'lucide-react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (!user) {
    return null
  }

  const isAdmin = user.role === 'ADMIN'

  const navItems = isAdmin
    ? [
        { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Admin Dashboard' },
        { href: '/dashboard/admin/loans', icon: CreditCard, label: 'Manage Loans' },
        { href: '/dashboard/admin/members', icon: Users, label: 'Members' },
        { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
      ]
    : [
        { href: '/dashboard', icon: LayoutDashboard, label: 'My Profile' },
        { href: '/dashboard/savings', icon: Wallet, label: 'Savings' },
        { href: '/dashboard/loans', icon: CreditCard, label: 'Loans' },
        { href: '/dashboard/transactions', icon: History, label: 'Transactions' },
        { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
      ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">🍉</span>
            </div>
            <span className="text-xl font-bold text-gray-800">Watermelon</span>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-green-500 to-red-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="mb-4 px-4">
            <p className="text-sm font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
