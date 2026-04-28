'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  User, 
  MessageSquare, 
  UserCheck, 
  UserMinus, 
  Clock, 
  Inbox,
  Loader2
} from 'lucide-react'

interface IncomingRequest {
  id: string
  sender_id: string
  created_at: string
  profiles: { username: string; avatar_url: string | null } | null
}

interface AcceptedConnection {
  id: string
  sender_id: string
  recipient_id: string
  sender?: { username: string } | null
  recipient?: { username: string } | null
}

interface Props {
  incoming: IncomingRequest[]
  accepted: AcceptedConnection[]
  currentUserId: string
}

export default function ConnectionInbox({ incoming, accepted, currentUserId }: Props) {
  const router = useRouter()
  const [responding, setResponding] = useState<string | null>(null)
  const [openingConv, setOpeningConv] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function respond(id: string, status: 'accepted' | 'declined') {
    setResponding(id)
    const res = await fetch(`/api/connections?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setResponding(null)

    if (res.ok) {
      toast.success(status === 'accepted' ? 'Connection accepted!' : 'Request declined.')
      startTransition(() => router.refresh())
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to respond')
    }
  }

  async function openConversation(otherId: string) {
    setOpeningConv(otherId)
    await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ other_user_id: otherId }),
    })
    setOpeningConv(null)
    startTransition(() => router.push('/messages'))
  }

  async function removeConnection(id: string) {
    setResponding(id)
    const res = await fetch(`/api/connections?id=${id}`, { method: 'DELETE' })
    setResponding(null)
    setConfirmDelete(null)

    if (res.ok) {
      toast.success('Connection removed')
      startTransition(() => router.refresh())
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to remove connection')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-16">
      {/* Pending Requests Section */}
      <section className="space-y-6 animate-in">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending
          </h2>
          {incoming.length > 0 && (
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {incoming.length} New
            </span>
          )}
        </div>

        {incoming.length === 0 ? (
          <div className="glass-card rounded-[2rem] p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-500 ">No pending requests at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incoming.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-50 to-purple-50 flex items-center justify-center border border-indigo-100/50 group-hover:scale-105 transition-transform duration-500">
                      <User className="w-8 h-8 text-indigo-400 " />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 border-2 border-white rounded-full animate-pulse" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-lg">
                      @{req.profiles?.username ?? 'user'}
                    </p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Received {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => respond(req.id, 'declined')}
                    disabled={responding === req.id}
                    className="flex-1 sm:flex-none px-6 py-3 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-red-500 transition-colors"
                  >
                    Ignore
                  </button>
                  <button
                    onClick={() => respond(req.id, 'accepted')}
                    disabled={responding === req.id}
                    className="flex-1 sm:flex-none px-8 py-3 text-xs font-black bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                  >
                    {responding === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Connections Section */}
      <section className="space-y-6 animate-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            My Connections
          </h2>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {accepted.length} People
          </span>
        </div>

        {accepted.length === 0 ? (
          <div className="glass-card rounded-[2rem] p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
              <UserMinus className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-500 ">You haven't connected with anyone yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {accepted.map((conn) => {
              const other = conn.sender_id === currentUserId ? conn.recipient : conn.sender
              const otherId = conn.sender_id === currentUserId ? conn.recipient_id : conn.sender_id
              
              return (
                <div
                  key={conn.id}
                  className="bg-white rounded-[2rem] p-6 group flex flex-col items-center text-center space-y-4 shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative">
                    <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-indigo-50 transition-colors duration-500">
                      <User className="w-10 h-10 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center">
                      <UserCheck className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>

                  <div>
                    <p className="font-black text-gray-900 text-lg">
                      @{other?.username ?? 'unknown'}
                    </p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Active Connection</p>
                  </div>

                  <div className="flex gap-2 w-full pt-2">
                    <button
                      onClick={() => setConfirmDelete(conn.id)}
                      disabled={responding === conn.id}
                      className="p-3.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                      title="Remove Connection"
                    >
                      {responding === conn.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UserMinus className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => openConversation(otherId)}
                      disabled={openingConv === otherId}
                      className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 font-bold text-sm"
                    >
                      {openingConv === otherId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                      Message
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 px-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 shadow-2xl border border-gray-100 modal-in">
            <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 mx-auto">
              <UserMinus className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Connection?</h3>
              <p className="text-sm text-gray-500 ">
                This will permanently remove the connection and you won&apos;t be able to message each other.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-3 border-2 border-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => removeConnection(confirmDelete)}
                disabled={responding === confirmDelete}
                className="flex-1 bg-red-600 text-white rounded-2xl py-3 text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {responding === confirmDelete ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
