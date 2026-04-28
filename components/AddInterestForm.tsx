'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Search, Sparkles } from 'lucide-react'

interface Suggestion {
  name: string
  category: string
}

export default function AddInterestForm() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setSuggestions([]); return }
    const res = await fetch(`/api/interests/suggest?q=${encodeURIComponent(q)}`)
    if (res.ok) {
      const data = await res.json()
      setSuggestions(data.suggestions)
      setShowSuggestions(true)
    }
  }, [])

  function handleChange(v: string) {
    setValue(v)
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

    const res = await fetch('/api/interests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleaned }),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to add interest')
      return
    }

    setValue('')
    setSuggestions([])
    toast.success(`Added "${cleaned}"`)
    startTransition(() => router.refresh())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submit(value)
  }

  return (
    <div className="space-y-1" ref={containerRef}>
      <form onSubmit={handleSubmit} className="flex gap-2 relative">
        <div className="flex-1 relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="What are you into?"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden animate-in">
              <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100">
                Suggestions
              </div>
              <ul className="max-h-60 overflow-y-auto">
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
          disabled={isPending || !value.trim()}
          className="bg-indigo-600 text-white rounded-2xl px-5 py-2.5 text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </form>
    </div>
  )
}
