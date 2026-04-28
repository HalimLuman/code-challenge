'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { UserPlus, Clock, UserCheck, Loader2 } from 'lucide-react'

interface Props {
  recipientId: string
  initialStatus: 'none' | 'pending' | 'accepted'
}

export default function ConnectButton({ recipientId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  async function sendRequest() {
    setLoading(true)
    const res = await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: recipientId }),
    })
    setLoading(false)

    if (res.ok) {
      setStatus('pending')
      toast.success('Connection request sent!')
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to send request')
    }
  }

  if (status === 'accepted') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold uppercase tracking-wider">
        <UserCheck className="w-3.5 h-3.5" />
        Connected
      </span>
    )
  }

  if (status === 'pending') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-gray-100 text-gray-500 border border-gray-200 rounded-xl font-bold uppercase tracking-wider">
        <Clock className="w-3.5 h-3.5" />
        Pending
      </span>
    )
  }

  return (
    <button
      onClick={sendRequest}
      disabled={loading}
      className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-bold uppercase tracking-wider transition-all duration-200 shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <UserPlus className="w-3.5 h-3.5" />
      )}
      Connect
    </button>
  )
}
