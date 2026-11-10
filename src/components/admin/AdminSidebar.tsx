'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard,
  Package,
  Tag,
  Warehouse,
  MessageSquare,
  FileText,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/admin/login/actions'

const navLinks = [
  { href: '/admin',            label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/products',   label: 'Products',   icon: Package         },
  { href: '/admin/categories', label: 'Categories', icon: Tag             },
  { href: '/admin/inventory',  label: 'Inventory',  icon: Warehouse       },
  { href: '/admin/inquiries',  label: 'Inquiries',  icon: MessageSquare   },
  { href: '/admin/quotes',     label: 'Quotes',     icon: FileText        },
  { href: '/admin/customers',  label: 'Customers',  icon: Building2       },
  { href: '/admin/settings',   label: 'Settings',   icon: Settings        },
]

export default function AdminSidebar() {
  const currentPath = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/admin'
      ? currentPath === '/admin'
      : currentPath.startsWith(href)

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#2e2e2e]">
        <div className="w-8 h-8 relative shrink-0">
          <Image
            src="/images/logo/151663a7-cc48-492e-93d3-ab8a929b7a09_png.png"
            alt="JD Power Warehouse"
            fill
            className="object-contain"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[#f6f4ee] font-black text-sm truncate">JD Power</p>
          <p className="text-[#f3c41b] text-xs font-semibold tracking-wider uppercase">Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#f3c41b]/10 text-[#f3c41b] border-l-2 border-[#f3c41b] pl-[10px]'
                  : 'text-[#8c8c8c] hover:text-[#f6f4ee] hover:bg-[#1e1e1e]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4 border-t border-[#2e2e2e] pt-4">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#8c8c8c] hover:text-red-400 hover:bg-red-900/10 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Log Out
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-[#141414] border-r border-[#2e2e2e] h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile: hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 flex items-center justify-center bg-[#141414] border border-[#2e2e2e] rounded-lg text-[#f6f4ee]"
        aria-label="Open navigation"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile: overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile: drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-[#141414] border-r border-[#2e2e2e] transform transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#8c8c8c] hover:text-[#f6f4ee]"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4" />
        </button>
        {sidebarContent}
      </aside>
    </>
  )
}
