import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Sparkles, Users, Lock } from 'lucide-react'
import AnonInterestForm from '@/components/AnonInterestForm'

export default async function HomePage() {
  const supabase = await createClient()
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: { user } }, { data: recentAnon }] = await Promise.all([
    supabase.auth.getUser(),
    admin
      .from('anonymous_interests')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[15%] -left-[10%] w-[45%] h-[45%] bg-purple-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-[30%] -right-[10%] w-[35%] h-[35%] bg-indigo-500/10 blur-[110px] rounded-full" />
        <div className="absolute bottom-[5%] left-[25%] w-[30%] h-[25%] bg-indigo-400/[0.08] blur-[90px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">
              Interest Matcher
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative">
        {/* Hero + anonymous submission */}
        <section className="max-w-3xl mx-auto px-4 pt-20 pb-16 text-center animate-in">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-8 border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5" />
            Discover your people
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight mb-5 leading-[1.05]">
            Find people who<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              share your interests
            </span>
          </h1>

          <p className="text-lg text-gray-500 mb-10 leading-relaxed">
            Drop an interest below — no account needed. We&apos;ll match you with people who care about the same things.
          </p>

          {/* Anonymous submission — above the fold */}
          <div className="glass-card rounded-3xl p-6 md:p-8 text-left mb-6">
            <AnonInterestForm initialInterests={recentAnon ?? []} />
            <p className="mt-3 text-xs text-gray-400">
              Stored anonymously.{' '}
              {!user ? (
                <>
                  <Link href="/register" className="text-indigo-500 hover:underline font-medium">
                    Create an account
                  </Link>{' '}
                  to join matching.
                </>
              ) : (
                <>
                  <Link href="/dashboard" className="text-indigo-500 hover:underline font-medium">
                    Go to your dashboard
                  </Link>{' '}
                  to add interests to your profile.
                </>
              )}
            </p>
          </div>

          {/* Secondary CTAs */}
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl px-8 py-3.5 text-sm font-bold hover:opacity-90 transition-all shadow-2xl shadow-indigo-500/30 active:scale-95"
            >
              Go to your Dashboard →
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl px-6 py-3.5 text-sm font-bold hover:opacity-90 transition-all shadow-2xl shadow-indigo-500/30 active:scale-95"
              >
                Create a free account
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 glass-card text-gray-700 rounded-2xl px-6 py-3.5 text-sm font-bold hover:bg-gray-50 transition-all active:scale-95"
              >
                Sign In
              </Link>
            </div>
          )}
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 py-10 pb-24 animate-in" style={{ animationDelay: '100ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Secure Auth</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Email/password sign-in. Row-level security keeps your data yours.
                </p>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Interest Tracking</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Curate a list of things you care about. Suggestions help you discover new ones.
                </p>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Smart Matching</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  See people ranked by how many interests you share — the more overlap, the higher the match.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200/50 bg-white/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between text-xs text-gray-400 font-medium">
          <span>© 2026 Interest Matcher</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
