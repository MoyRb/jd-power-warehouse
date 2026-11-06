import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page through unconditionally
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Dev bypass: explicit opt-in. Session validated via mock cookie set during login.
  // Set ADMIN_DEV_BYPASS=true only in .env.local — never in staging/production.
  if (process.env.ADMIN_DEV_BYPASS === 'true') {
    const devSession = request.cookies.get('jdpw_dev_admin')
    if (devSession?.value === 'true') {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // If Supabase is not configured, block access
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Step 1: Verify authenticated session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/admin/login', request.url)
    // Validate next param is a relative path before setting it
    if (pathname.startsWith('/') && !pathname.startsWith('//')) {
      loginUrl.searchParams.set('next', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // Step 2: Verify user is in admin_users table (C-2 fix)
  // Uses the anon client with RLS: admin_users policy allows users to read their own row.
  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!adminRow) {
    // Authenticated Supabase user but not an admin — redirect to login
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
