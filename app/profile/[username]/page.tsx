import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ConnectButton from '@/components/ConnectButton'
import { 
  User as UserIcon, 
  MapPin, 
  Globe, 
  Calendar, 
  ChevronLeft,
  Sparkles,
  ShieldAlert,
  MessageSquare,
  Tag
} from 'lucide-react'

interface Props {
  params: { username: string }
}

export default async function ProfilePage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, bio, location, website, visibility, avatar_url, created_at')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  // Enforce visibility
  const isOwner = user?.id === profile.id
  if (profile.visibility === 'private' && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
        <div className="glass-card rounded-[2.5rem] p-12 text-center max-w-sm w-full space-y-6">
          <div className="w-20 h-20 bg-amber-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-amber-500">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 ">Profile Private</h2>
            <p className="text-gray-500 text-sm">This user has restricted access to their profile.</p>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline">
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Check connection status
  let connectionStatus: 'none' | 'pending' | 'accepted' | 'self' = 'none'
  if (isOwner) {
    connectionStatus = 'self'
  } else if (user) {
    const { data: conn } = await supabase
      .from('connection_requests')
      .select('status, sender_id')
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${profile.id}),and(sender_id.eq.${profile.id},recipient_id.eq.${user.id})`
      )
      .single()
    if (conn) connectionStatus = conn.status as 'pending' | 'accepted'
  }

  // Connections-only visibility enforcement
  if (profile.visibility === 'connections' && !isOwner && connectionStatus !== 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
        <div className="glass-card rounded-[2.5rem] p-12 text-center max-w-sm w-full space-y-6">
          <div className="w-20 h-20 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-indigo-500">
            <Sparkles className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 ">Connections Only</h2>
            <p className="text-gray-500 text-sm">Send a request to see @{profile.username}&apos;s profile.</p>
          </div>
          <div className="pt-4">
            <ConnectButton recipientId={profile.id} initialStatus={connectionStatus as 'none' | 'pending' | 'accepted'} />
          </div>
          <Link href="/dashboard" className="block text-gray-500 text-xs hover:underline mt-4">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const { data: interests } = await supabase
    .from('interests')
    .select('name')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#fafafa] transition-colors duration-500 pb-20">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[5%] right-[10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[5%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 ">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 ">Profile</span>
          </div>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8 relative z-10">
        {/* Profile Card */}
        <div className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl border-white/20 ">
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-700 relative">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
          </div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="p-1.5 bg-[#fafafa] rounded-[2.5rem]">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] object-cover border-4 border-white/10 shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center text-4xl font-black text-gray-400 border-4 border-white/10 shadow-xl">
                    {profile.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex gap-3 mb-2">
                {!isOwner && user && (
                  <>
                    <ConnectButton recipientId={profile.id} initialStatus={connectionStatus as 'none' | 'pending' | 'accepted'} />
                    {connectionStatus === 'accepted' && (
                      <Link 
                        href={`/messages?userId=${profile.id}`}
                        className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-600 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </Link>
                    )}
                  </>
                )}
                {isOwner && (
                  <Link 
                    href="/settings"
                    className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                  >
                    Edit Profile
                  </Link>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">@{profile.username}</h1>
                <div className="flex flex-wrap gap-4 mt-2">
                  {profile.location && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-indigo-600 font-bold hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    Joined {new Date(profile.created_at).toLocaleDateString('en', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {profile.bio && (
                <p className="text-base text-gray-600 leading-relaxed max-w-2xl font-medium italic">
                  &ldquo;{profile.bio}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Interests Section */}
        <div className="glass-card rounded-[2.5rem] p-8 space-y-6 shadow-xl border-white/10 ">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-500" />
              Interests
            </h2>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest bg-gray-100/50 px-3 py-1.5 rounded-xl border border-gray-200/50 ">
              {interests?.length ?? 0} total
            </span>
          </div>

          {!interests || interests.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
                <Tag className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500 font-medium">This user hasn&apos;t added any interests yet.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {interests.map((i) => (
                <div
                  key={i.name}
                  className="px-5 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm hover:border-indigo-500/50 hover:bg-indigo-50/50 transition-all cursor-default"
                >
                  {i.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connection Context */}
        {connectionStatus === 'accepted' && !isOwner && (
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10 text-center md:text-left space-y-1">
              <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="w-5 h-5" />
                You are connected!
              </h3>
              <p className="text-indigo-100 text-sm font-medium">Send a message to start a conversation about your shared interests.</p>
            </div>
            <Link 
              href={`/messages?userId=${profile.id}`}
              className="relative z-10 px-8 py-3 bg-white text-indigo-600 rounded-2xl text-sm font-bold hover:bg-indigo-50 transition-all active:scale-95 shadow-xl"
            >
              Start Chatting
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
