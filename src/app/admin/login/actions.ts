'use server'

import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData): Promise<void> {
  const email = (formData.get('email') as string | null) ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!email || !password) {
    redirect('/admin/login?error=missing_fields')
  }

  // Dev bypass: when ADMIN_DEV_BYPASS=true and no Supabase, accept any credentials
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (process.env.ADMIN_DEV_BYPASS === 'true') {
      redirect('/admin')
    }
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
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createServerSupabaseClient } = await import('@/lib/auth/server')
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()
  }
  redirect('/admin/login')
}
