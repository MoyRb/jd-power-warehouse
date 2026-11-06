'use server'

import { redirect } from 'next/navigation'
import { isDevBypassEnabled } from '@/lib/dev-bypass'

export async function loginAction(formData: FormData): Promise<void> {
  const email = (formData.get('email') as string | null) ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!email || !password) {
    redirect('/admin/login?error=missing_fields')
  }

  // Dev bypass: only active outside production. Accepts any credentials and sets a mock session cookie.
  if (isDevBypassEnabled()) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.set('jdpw_dev_admin', 'true', {
      httpOnly: true,
      path: '/admin',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    })
    redirect('/admin')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    redirect('/admin/login?error=not_configured')
  }

  // Supabase auth login
  const { createServerSupabaseClient } = await import('@/lib/auth/server')
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/admin/login?error=invalid_credentials')
  }

  redirect('/admin')
}

export async function logoutAction(): Promise<void> {
  if (isDevBypassEnabled()) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.delete('jdpw_dev_admin')
  } else if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createServerSupabaseClient } = await import('@/lib/auth/server')
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()
  }
  redirect('/admin/login')
}
