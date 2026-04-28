'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

export default function TwoFactorPage() {
  const [step, setStep] = useState<'idle' | 'enroll' | 'verify'>('idle')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [factorId, setFactorId] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function startEnrollment() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    setLoading(false)

    if (error || !data) {
      toast.error(error?.message ?? 'Failed to start 2FA enrollment')
      return
    }

    setQrCode(data.totp.qr_code)
    setSecret(data.totp.secret)
    setFactorId(data.id)
    setStep('enroll')
  }

  async function verifyCode() {
    if (!code || code.length !== 6) {
      toast.error('Enter a 6-digit code')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeErr) {
      toast.error(challengeErr.message)
      setLoading(false)
      return
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    })
    setLoading(false)

    if (verifyErr) {
      toast.error(verifyErr.message)
    } else {
      toast.success('Two-factor authentication enabled!')
      setStep('idle')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-900">
            ← Settings
          </Link>
          <span className="font-semibold text-gray-900">Two-Factor Authentication</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {step === 'idle' && (
            <>
              <div className="space-y-2">
                <h2 className="font-semibold text-gray-900">Set up authenticator app</h2>
                <p className="text-sm text-gray-500">
                  Use an app like Google Authenticator or Authy to generate time-based codes.
                </p>
              </div>
              <button
                onClick={startEnrollment}
                disabled={loading}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Setting up…' : 'Enable 2FA'}
              </button>
            </>
          )}

          {step === 'enroll' && (
            <>
              <div className="space-y-2">
                <h2 className="font-semibold text-gray-900">Scan QR code</h2>
                <p className="text-sm text-gray-500">
                  Scan this QR code with your authenticator app, then enter the 6-digit code.
                </p>
              </div>

              {qrCode && (
                <div className="flex justify-center">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 border border-gray-200 rounded-lg" />
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs text-gray-400 font-mono break-all">{secret}</p>
                <p className="text-xs text-gray-400">Manual entry key (if QR code doesn&apos;t work)</p>
              </div>

              <button
                onClick={() => setStep('verify')}
                className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700"
              >
                I&apos;ve scanned the code
              </button>
            </>
          )}

          {step === 'verify' && (
            <>
              <div className="space-y-2">
                <h2 className="font-semibold text-gray-900">Enter verification code</h2>
                <p className="text-sm text-gray-500">
                  Enter the 6-digit code from your authenticator app to complete setup.
                </p>
              </div>

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
                onClick={verifyCode}
                disabled={loading || code.length !== 6}
                className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Enable 2FA'}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
