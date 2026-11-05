import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { AdminRole } from '../db/types'

export interface AdminSession {
  userId: string
  role: AdminRole
}

// Mock dev session — only active when no Supabase env vars and not in production
const DEV_SESSION: AdminSession = {
  userId: 'mock-admin-id',
  role: 'admin',
}

function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Component — cookie mutations silently ignored
          }
        },
      },
    },
  )
}

export async function getAdminSession(): Promise<AdminSession | null> {
  // Dev mode: return mock session when Supabase is not configured
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      return null
    }
    return DEV_SESSION
  }

  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) return null

    // Verify user is in admin_users table — NEVER use user_metadata
    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminRow) return null

    return {
      userId: user.id,
      role: adminRow.role as AdminRole,
    }
  } catch {
    return null
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }
  return session
}
