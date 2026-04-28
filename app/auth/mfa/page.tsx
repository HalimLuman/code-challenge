'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function MFAChallengePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function verify() {
    if (code.length !== 6) { toast.error('Enter a 6-digit code'); return }
    setLoading(true)
    const supabase = createClient()

    const { data: factors } = await supabase.auth.mfa.listFactors()
    const totpFactor = factors?.totp?.[0]
    if (!totpFactor) { toast.error('No 2FA factor found'); setLoading(false); return }

    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id })
    if (challengeErr) { toast.error(challengeErr.message); setLoading(false); return }

    const { error } = await supabase.auth.mfa.verify({ factorId: totpFactor.id, challengeId: challenge.id, code })
    setLoading(false)

    if (error) {
      toast.error('Invalid code. Try again.')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full space-y-4 text-center">
        <div className="text-3xl">🔐</div>
        <h2 className="text-lg font-semibold">Two-factor authentication</h2>
        <p className="text-sm text-gray-500">Enter the 6-digit code from your authenticator app.</p>

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={verify}
          disabled={loading || code.length !== 6}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </div>
    </div>
  )
}
