import ConnectButton from '@/components/ConnectButton'
import Link from 'next/link'
import { User, Users, Sparkles } from 'lucide-react'

type Match = {
  user_id: string
  username: string
  shared_interests: string[]
  match_count: number
  connection_status?: 'none' | 'pending' | 'accepted'
}

export default function SimilarUsers({ matches, isAuthenticated = true }: { matches: Match[]; isAuthenticated?: boolean }) {
  if (matches.length === 0) {
    return (
      <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-200 rounded-[2rem] p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No matches yet</h3>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Add more interests to your profile to find people with similar passions.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {matches.map((match) => (
        <div
          key={match.user_id}
          className="group glass-card rounded-[1.5rem] p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200 overflow-hidden group-hover:scale-110 transition-transform duration-300">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <Link
                  href={`/profile/${match.username}`}
                  className="font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  @{match.username}
                </Link>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                    {match.match_count} Shared
                  </span>
                </div>
              </div>
            </div>

            {isAuthenticated && (
              <ConnectButton
                recipientId={match.user_id}
                initialStatus={match.connection_status ?? 'none'}
              />
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Shared Interests</span>
            <div className="flex flex-wrap gap-1.5">
              {match.shared_interests.map((interest) => (
                <span
                  key={interest}
                  className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-200/50"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
