'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function resend() {
    setLoading(true)
    setMessage('')

    const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
    setLoading(false)

    if (res.ok) {
      setMessage('Verification email sent — check your inbox.')
      setCooldown(60)
      timerRef.current = setInterval(() => {
        setCooldown((v) => {
          if (v <= 1) { clearInterval(timerRef.current!); return 0 }
          return v - 1
        })
      }, 1000)
    } else {
      const data = await res.json()
      setMessage(data.error ?? 'Failed to resend. Try again later.')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-4 text-center">
      <div className="text-3xl">✉️</div>
      <h2 className="text-lg font-semibold">Verify your email</h2>
      <p className="text-sm text-gray-500">
        We sent a verification link to your email address. Click the link to activate your account.
      </p>

      {message && (
        <p className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">{message}</p>
      )}

      <button
        onClick={resend}
        disabled={loading || cooldown > 0}
        className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
      >
        {cooldown > 0 ? `Resend in ${cooldown}s` : loading ? 'Sending…' : 'Resend verification email'}
      </button>

      <p className="text-center text-sm text-gray-500">
        <Link href="/login" className="text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
