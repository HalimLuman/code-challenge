'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Search, Sparkles, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react'

interface Suggestion {
  name: string
  category: string
}

interface AnonInterest {
  id: string
  name: string
  created_at: string
}

interface Props {
  initialInterests?: AnonInterest[]
}

export default function AnonInterestForm({ initialInterests = [] }: Props) {
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [feed, setFeed] = useState<AnonInterest[]>(initialInterests)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setSuggestions([]); return }
    const res = await fetch(`/api/interests/suggest?q=${encodeURIComponent(q)}`)
    if (res.ok) {
      const data = await res.json()
      setSuggestions(data.suggestions ?? [])
      setShowSuggestions(true)
    }
  }, [])

  function handleChange(v: string) {
    setValue(v)
    setJustSubmitted(null)
    setError('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 200)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function submit(name: string) {
    const cleaned = name.trim().toLowerCase()
    if (!cleaned) return

    setShowSuggestions(false)
    setLoading(true)
    setError('')
    setJustSubmitted(null)

    const res = await fetch('/api/interests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleaned, metadata: { source: 'homepage' } }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      return
    }

    const newItem: AnonInterest = {
      id: data.id,
      name: data.name,
      created_at: new Date().toISOString(),
    }

    setFeed((prev) => [newItem, ...prev])
    setJustSubmitted(data.name)
    setValue('')
    setSuggestions([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submit(value)
  }

  return (
    <div className="space-y-5" ref={containerRef}>
      <form onSubmit={handleSubmit} className="flex gap-2 relative">
        <div className="flex-1 relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="e.g. rock climbing, rust, photography…"
            disabled={loading}
            className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 disabled:opacity-60"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden animate-in">
              <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100">
                Suggestions
              </div>
              <ul className="max-h-52 overflow-y-auto">
                {suggestions.map((s) => (
                  <li key={s.name}>
                    <button
                      type="button"
                      onMouseDown={() => submit(s.name)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 text-gray-900 flex items-center justify-between transition-colors group/item"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                        <span>{s.name}</span>
                      </div>
                      <span className="text-[10px] font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{s.category}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="bg-indigo-600 text-white rounded-2xl px-5 py-3.5 text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-95"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span className="hidden sm:inline">{loading ? 'Submitting…' : 'Submit'}</span>
        </button>
      </form>

      {justSubmitted && (
        <div className="flex items-center gap-3 bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-100 animate-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm font-medium">
            Submitted <span className="font-bold">&quot;{justSubmitted}&quot;</span> — thanks!
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 animate-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {feed.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Clock className="w-3 h-3" />
            Recent submissions
          </div>
          <div className="flex flex-wrap gap-2">
            {feed.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 animate-in"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
