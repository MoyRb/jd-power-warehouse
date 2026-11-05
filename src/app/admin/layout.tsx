import { requireAdmin } from '@/lib/auth/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side auth guard — redirects to /admin/login if not authenticated
  await requireAdmin()

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <AdminSidebar />

      <main className="flex-1 min-w-0 overflow-auto">
        {/* Spacer for mobile hamburger button */}
        <div className="lg:hidden h-16" aria-hidden="true" />
        {children}
      </main>
    </div>
  )
}
