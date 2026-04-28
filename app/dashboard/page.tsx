import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AddInterestForm from '@/components/AddInterestForm'
import InterestList from '@/components/InterestList'
import SimilarUsers from '@/components/SimilarUsers'
import SignOutButton from '@/components/SignOutButton'
import NotificationBell from '@/components/NotificationBell'
import Link from 'next/link'
import {
  Users,
  MessageSquare,
  Settings,
  LayoutDashboard,
  Sparkles,
  User as UserIcon,
  Shield,
  ShieldCheck
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: interests },
    { data: profile },
    { data: matches },
    { data: connectionRequests },
  ] = await Promise.all([
    supabase
      .from('interests')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('username, role').eq('id', user.id).single(),
    supabase.rpc('get_similar_users', { current_user_id: user.id }),
    supabase
      .from('connection_requests')
      .select('recipient_id, sender_id, status')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`),
  ])

  // Build a map of userId → connection status for the matches
  const connectionMap: Record<string, 'pending' | 'accepted'> = {}
  for (const req of connectionRequests ?? []) {
    const otherId = req.sender_id === user.id ? req.recipient_id : req.sender_id
    connectionMap[otherId] = req.status as 'pending' | 'accepted'
  }

  const matchesWithStatus = (matches ?? []).slice(0, 10).map((m: any) => ({
    ...m,
    connection_status: connectionMap[m.user_id] ?? 'none',
  }))

  const pendingCount = (connectionRequests ?? []).filter(
    (r) => r.recipient_id === user.id && r.status === 'pending'
  ).length

  return (
    <div className="min-h-screen bg-[#fafafa] transition-colors duration-500">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-indigo-500/10 blur-[100px] rounded-full" />
      </div>

      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 ">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 ">
              Interest Matcher
            </span>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-900 font-medium transition-all duration-200">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/connections" className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200">
                <Users className="w-4 h-4" />
                Connections
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </Link>
              <Link href="/messages" className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200">
                <MessageSquare className="w-4 h-4" />
                Messages
              </Link>
              <Link href="/settings" className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              {profile?.role === 'admin' && (
                <Link href="/admin" className="flex items-center gap-2 px-4 py-2 rounded-xl text-purple-600 hover:bg-purple-50 transition-all duration-200 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-6 ml-2">
              <NotificationBell userId={user.id} />
              <div className="flex items-center gap-3 bg-gray-100/50 p-1 pr-3 rounded-full border border-gray-200 ">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                  <UserIcon className="w-4 h-4 text-gray-500 " />
                </div>
                <span className="text-sm font-medium text-gray-700 ">@{profile?.username}</span>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 relative">
        <section className="mb-10 animate-in">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">Welcome back, {profile?.username || 'User'}! 👋</h1>
              <p className="text-indigo-100 text-lg max-w-2xl mb-8">
                Explore your interests, connect with like-minded people, and expand your horizons today.
              </p>

              <div className="flex flex-wrap gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10">
                  <span className="block text-xs text-indigo-200 font-medium uppercase tracking-wider mb-1">Total Interests</span>
                  <span className="text-2xl font-bold">{(interests ?? []).length}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10">
                  <span className="block text-xs text-indigo-200 font-medium uppercase tracking-wider mb-1">New Matches</span>
                  <span className="text-2xl font-bold">{(matches ?? []).length}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10">
                  <span className="block text-xs text-indigo-200 font-medium uppercase tracking-wider mb-1">Pending Requests</span>
                  <span className="text-2xl font-bold">{pendingCount}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-4 space-y-8 animate-in" style={{ animationDelay: '100ms' }}>
            <div className="glass-card rounded-[2rem] p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  Your Interests
                </h2>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                  {(interests ?? []).length} items
                </span>
              </div>
              <div className="space-y-6">
                <AddInterestForm />
                <InterestList interests={interests ?? []} />
              </div>
            </div>
          </section>

          <section className="lg:col-span-8 space-y-8 animate-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Recommended Matches
              </h2>
              <Link 
                href="/matches"
                className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all"
              >
                View All
              </Link>
            </div>
            <SimilarUsers matches={matchesWithStatus} />
          </section>
        </div>
      </main>
    </div>
  )
}
