import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SimilarUsers from '@/components/SimilarUsers'
import { ChevronLeft, Sparkles, Users } from 'lucide-react'
import Link from 'next/link'

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: matches }, { data: connectionRequests }] = await Promise.all([
    supabase.rpc('get_similar_users', { current_user_id: user.id }),
    supabase
      .from('connection_requests')
      .select('recipient_id, sender_id, status')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`),
  ])

  // Build a map of userId → connection status
  const connectionMap: Record<string, 'pending' | 'accepted'> = {}
  for (const req of connectionRequests ?? []) {
    const otherId = req.sender_id === user.id ? req.recipient_id : req.sender_id
    connectionMap[otherId] = req.status as 'pending' | 'accepted'
  }

  const matchesWithStatus = (matches ?? []).map((m: any) => ({
    ...m,
    connection_status: connectionMap[m.user_id] ?? 'none',
  }))

  return (
    <div className="min-h-screen bg-[#fafafa] transition-colors duration-500">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 ">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 ">All Matches</span>
          </div>
          <div className="w-24 hidden md:block" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 relative z-10">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Discover Your Tribe</h1>
              <p className="text-gray-500 font-medium">Everyone on this list shares at least one passion with you.</p>
            </div>
            <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{matchesWithStatus.length} Potential Connections</span>
            </div>
          </div>

          <div className="animate-in" style={{ animationDelay: '100ms' }}>
            <SimilarUsers matches={matchesWithStatus} />
          </div>

          {matchesWithStatus.length === 0 && (
            <div className="glass-card rounded-[3rem] p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-100 rounded-[2.5rem] flex items-center justify-center mx-auto text-gray-400">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 ">No matches found yet</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Try adding more diverse interests to your profile to find more people!
              </p>
              <Link href="/dashboard" className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-500/20">
                Update Interests
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
