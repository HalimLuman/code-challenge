import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const TERMS_VERSION = process.env.TERMS_VERSION ?? '2026-04'
const PRIVACY_VERSION = process.env.PRIVACY_VERSION ?? '2026-04'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/terms', '/privacy', '/auth/callback']
  const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith('/terms/') || pathname.startsWith('/privacy'))

  // Redirect authenticated users away from auth-only pages (not the homepage)
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Require authentication for protected paths
  const protectedPaths = ['/dashboard', '/settings', '/connections', '/messages', '/onboarding', '/profile']
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    // Check email verification
    if (!user.email_confirmed_at && pathname !== '/verify-email' && !pathname.startsWith('/auth/')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      // Only gate if we have a profile (not OAuth flow in progress)
      if (profile && isProtected) {
        return NextResponse.redirect(new URL('/verify-email', request.url))
      }
    }

    // Check onboarding completion for dashboard
    if (pathname.startsWith('/dashboard')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single()

      if (profile && !profile.onboarding_complete) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }

    // Check MFA assurance level if user has enrolled factors
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2' && pathname !== '/auth/mfa') {
      return NextResponse.redirect(new URL('/auth/mfa', request.url))
    }

    // Guard admin routes
    if (pathname.startsWith('/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
