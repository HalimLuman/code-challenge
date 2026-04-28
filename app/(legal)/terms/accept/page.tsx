'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AcceptTermsPage() {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAccept() {
    if (!accepted) return
    setLoading(true)

    const res = await fetch('/api/auth/accept-terms', { method: 'POST' })
    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to record consent')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6 max-w-md w-full">
        <h2 className="text-lg font-semibold">Updated Terms & Privacy Policy</h2>
        <p className="text-sm text-gray-500">
          Our Terms of Service and Privacy Policy have been updated. Please review and accept
          to continue using Interest Matcher.
        </p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">
            I have read and agree to the{' '}
            <Link href="/terms" target="_blank" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <button
          onClick={handleAccept}
          disabled={!accepted || loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving…' : 'Accept and continue'}
        </button>
      </div>
    </div>
  )
}
