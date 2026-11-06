import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { AdminRole } from '../db/types'
import { isDevBypassEnabled } from '../dev-bypass'

export interface AdminSession {
  userId: string
  role: AdminRole
}

// Mock dev session — ONLY active when ADMIN_DEV_BYPASS=true is explicitly set.
// Never relies on NODE_ENV: that value is controlled by the deployment
// environment and cannot be used as a security gate.
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
  // Dev bypass: explicit opt-in. Valid only when the mock session cookie is present.
  // The cookie is set by loginAction and cleared by logoutAction.
  // Clearing browser cookies invalidates the session, allowing auth tests to work correctly.
  if (isDevBypassEnabled()) {
    const cookieStore = await cookies()
    const devSession = cookieStore.get('jdpw_dev_admin')
    return devSession?.value === 'true' ? DEV_SESSION : null
  }

  if (!isSupabaseConfigured()) {
    return null
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
