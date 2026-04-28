'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Hash, Loader2 } from 'lucide-react'

type Interest = { id: string; name: string; created_at: string }

export default function InterestList({ interests }: { interests: Interest[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string, name: string) {
    setDeletingId(id)
    const res = await fetch(`/api/interests?id=${id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (res.ok) {
      toast.success(`Removed "${name}"`)
      startTransition(() => router.refresh())
    } else {
      toast.error('Failed to remove interest')
    }
  }

  if (interests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-gray-200 rounded-[1.5rem]">
        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
          <Hash className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">
          No interests yet. <br />Add one above to find matches.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {interests.map((interest) => (
        <div
          key={interest.id}
          className="group flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5 transition-all duration-200 hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-0.5"
        >
          <span className="text-sm font-semibold text-indigo-700">
            {interest.name}
          </span>
          <button
            onClick={() => handleDelete(interest.id, interest.name)}
            disabled={deletingId === interest.id || isPending}
            aria-label={`Remove ${interest.name}`}
            className="text-indigo-300 hover:text-red-500 transition-colors"
          >
            {deletingId === interest.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      ))}
    </div>
  )
}
