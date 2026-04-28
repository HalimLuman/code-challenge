import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MessagesClient from '@/components/MessagesClient'
import { ChevronLeft, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch accepted connections with both participants' profiles so the
  // sidebar can show the other person's name regardless of which side
  // the current user is on (sender vs recipient).
  const { data: connections } = await supabase
    .from('connection_requests')
    .select(`
      id, sender_id, recipient_id,
      senderProfile:profiles!connection_requests_sender_id_fkey(username),
      recipientProfile:profiles!connection_requests_recipient_id_fkey(username)
    `)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#fafafa] transition-colors duration-500">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[30%] left-[10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[10%] right-[20%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 ">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-gray-600 " />
              </div>
              <h1 className="font-bold text-lg text-gray-900 ">Messages</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 relative">
        <div className="animate-in bg-white rounded-[2.5rem] border border-gray-200/50 shadow-2xl overflow-hidden min-h-[600px]">
          <MessagesClient
            connections={(connections ?? []) as any[]}
            currentUserId={user.id}
          />
        </div>
      </main>
    </div>
  )
}
