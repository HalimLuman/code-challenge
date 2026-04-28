'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Eye,
  Tag,
  X,
  Plus,
  Loader2,
  CheckCircle
} from 'lucide-react'

const SUGGESTED_INTERESTS = [
  'javascript', 'python', 'machine learning', 'react', 'rust', 'photography',
  'running', 'hiking', 'cooking', 'chess', 'music production', 'gaming',
  'reading', 'travel', 'yoga', 'astronomy', 'board games', 'climbing',
]

type Visibility = 'public' | 'connections' | 'private'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [interests, setInterests] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('public')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function addInterest(name: string) {
    const cleaned = name.trim().toLowerCase()
    if (!cleaned || interests.includes(cleaned)) return
    setInterests((prev) => [...prev, cleaned])
    setInputValue('')
  }

  function removeInterest(name: string) {
    setInterests((prev) => prev.filter((i) => i !== name))
  }

  async function finishOnboarding() {
    if (!termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }

    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Save interests
    if (interests.length > 0) {
      const interestsRes = await fetch('/api/interests/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests }),
      })
      if (!interestsRes.ok) {
        const err = await interestsRes.json()
        setError(`Failed to save interests: ${err.error || interestsRes.statusText}`)
        return
      }
    }

    // Update profile visibility + onboarding complete
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ visibility, onboarding_complete: true })
      .eq('id', user.id)

    if (profileError) {
      setError(`Failed to save profile: ${profileError.message}`)
      return
    }

    // Record consent
    await fetch('/api/auth/accept-terms', { method: 'POST' })

    startTransition(() => {
      router.push('/dashboard')
      router.refresh()
    })
  }

  const ProgressHeader = () => (
    <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-200 '
            }`}
        />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] px-4 py-8 transition-colors duration-500 relative overflow-x-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <ProgressHeader />

        {step === 1 && (
          <div className="glass-card rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in border-white/20 shadow-2xl">
            <div className="space-y-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-500/20">
                <Tag className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">What are you into?</h2>
              <p className="text-xs sm:text-sm font-medium text-gray-500 leading-relaxed">Add at least <span className="text-indigo-600 font-bold">3 interests</span> to find your tribe.</p>
            </div>

            <div className="relative group">
              <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addInterest(inputValue) }
                }}
                placeholder="Type an interest..."
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl sm:rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-3 sm:space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Suggested for you</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_INTERESTS.filter((s) => !interests.includes(s)).slice(0, 8).map((s) => (
                  <button
                    key={s}
                    onClick={() => addInterest(s)}
                    className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 px-3 sm:px-4 py-2 rounded-xl transition-all active:scale-95 shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {interests.length > 0 && (
              <div className="pt-6 border-t border-gray-100 ">
                <div className="flex flex-wrap gap-2">
                  {interests.map((i) => (
                    <span
                      key={i}
                      className="group flex items-center gap-2 bg-indigo-600 text-white text-[10px] sm:text-[11px] font-bold px-3 py-2 rounded-xl shadow-lg shadow-indigo-500/20 animate-in"
                    >
                      {i}
                      <button
                        onClick={() => removeInterest(i)}
                        className="p-0.5 bg-white/20 rounded-md hover:bg-white/40 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={interests.length < 3}
              className="w-full bg-indigo-600 text-white rounded-xl sm:rounded-2xl py-4 text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98] shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              Continue {interests.length < 3 ? `(${3 - interests.length} more)` : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="glass-card rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in border-white/20 shadow-2xl">
            <div className="space-y-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-500/20">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Privacy Check</h2>
              <p className="text-xs sm:text-sm font-medium text-gray-500 ">Control who can discover and connect with you.</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {(['public', 'connections', 'private'] as Visibility[]).map((v) => (
                <label
                  key={v}
                  className={`flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all ${visibility === v
                      ? 'border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-500/5'
                      : 'border-gray-100 hover:border-gray-200 bg-gray-50/30 '
                    }`}
                >
                  <div className="mt-1 relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="visibility"
                      value={v}
                      checked={visibility === v}
                      onChange={() => setVisibility(v)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 transition-all flex items-center justify-center ${visibility === v ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 '}`}>
                      {visibility === v && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold capitalize text-gray-900 mb-0.5 sm:mb-1">
                      {v === 'connections' ? 'Connections only' : v}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 leading-relaxed font-medium">
                      {v === 'public' && 'Your profile is visible to everyone searching for similar interests.'}
                      {v === 'connections' && 'Only people you accept can see your full details.'}
                      {v === 'private' && 'You will not appear in any search results.'}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-4 border-2 border-gray-100 text-gray-600 rounded-xl sm:rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-[0.98]"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-4 bg-indigo-600 text-white rounded-xl sm:rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="glass-card rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in border-white/20 shadow-2xl">
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-[1.5rem] sm:rounded-[2.5rem] flex items-center justify-center text-white mb-4 sm:mb-6 mx-auto shadow-2xl shadow-indigo-500/40">
                <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Almost there!</h2>
              <p className="text-xs sm:text-sm font-medium text-gray-500 ">Ready to start matching? Just one last thing.</p>
            </div>

            {error && (
              <div className="flex items-start gap-3 text-xs sm:text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100 ">
                <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            <label className={`flex items-start gap-3 sm:gap-4 p-5 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer ${termsAccepted ? 'border-indigo-500 bg-indigo-50/30 ' : 'border-gray-100 hover:border-gray-200 '
              }`}>
              <div className="mt-1 relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-lg border-2 transition-all flex items-center justify-center ${termsAccepted ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 '}`}>
                  {termsAccepted && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-600 leading-relaxed">
                I agree to the <Link href="/terms" target="_blank" className="text-indigo-600 hover:underline">Terms</Link> and <Link href="/privacy" target="_blank" className="text-indigo-600 hover:underline">Privacy Policy</Link>. My data will be used to suggest connections.
              </p>
            </label>

            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-4 border-2 border-gray-100 text-gray-600 rounded-xl sm:rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-[0.98]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={finishOnboarding}
                disabled={!termsAccepted || isPending}
                className="flex-1 bg-indigo-600 text-white rounded-xl sm:rounded-2xl py-4 text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isPending ? 'Setting up...' : 'Get Started'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
