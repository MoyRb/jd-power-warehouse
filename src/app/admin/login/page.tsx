import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth/server'
import LoginForm from './LoginForm'

export const instant = false

export const metadata: Metadata = {
  title: 'Admin Login — JD Power Warehouse',
}

export default async function AdminLoginPage() {
  // If already logged in, go to dashboard
  const session = await getAdminSession()
  if (session) redirect('/admin')

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-[#f6f4ee]">JD Power Warehouse</h1>
          <p className="text-[#f3c41b] text-sm font-semibold tracking-wider uppercase mt-1">
            Admin Panel
          </p>
        </div>

        {/* Card — Suspense wraps searchParams reading in LoginForm */}
        <Suspense fallback={<div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-8 h-72 animate-pulse" />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-[#8c8c8c] text-xs mt-6">
          JD Power Warehouse Admin — Authorized Access Only
        </p>
      </div>
    </div>
  )
}
