'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { 
  Send, 
  User, 
  MessageSquare, 
  Search, 
  MoreVertical, 
  Loader2,
  Inbox
} from 'lucide-react'

interface Message {
  id: string
  body: string
  sender_id: string
  created_at: string
  read_at: string | null
}

interface Connection {
  id: string
  sender_id: string
  recipient_id: string
  senderProfile?: { username: string } | null
  recipientProfile?: { username: string } | null
}

interface Props {
  connections: Connection[]
  currentUserId: string
}

export default function MessagesClient({ connections, currentUserId }: Props) {
  const [selected, setSelected] = useState<Connection | null>(null)
  const [convId, setConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConv, setLoadingConv] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  /** Returns the other participant's display info for a given connection. */
  function getOtherUser(conn: Connection) {
    if (conn.sender_id === currentUserId) {
      return { id: conn.recipient_id, username: conn.recipientProfile?.username ?? 'Unknown' }
    }
    return { id: conn.sender_id, username: conn.senderProfile?.username ?? 'Unknown' }
  }

  /** Selects a connection, creates/fetches the conversation, then loads messages. */
  async function selectConnection(conn: Connection) {
    if (selected?.id === conn.id) return
    setSelected(conn)
    setConvId(null)
    setMessages([])
    setLoadingConv(true)

    const other = getOtherUser(conn)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ other_user_id: other.id }),
    })

    setLoadingConv(false)

    if (res.ok) {
      const data = await res.json()
      setConvId(data.id)
    } else {
      toast.error('Could not open conversation')
    }
  }

  // Load message history + subscribe to realtime inserts whenever convId changes
  useEffect(() => {
    if (!convId) return

    async function load() {
      const res = await fetch(`/api/conversations/${convId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
      }
    }
    load()

    const supabase = createClient()
    const channel = supabase
      .channel(`messages-${convId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [convId])

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || !convId) return
    setSending(true)

    const res = await fetch(`/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: input.trim() }),
    })

    setSending(false)

    if (res.ok) {
      const data = await res.json()
      setMessages((prev) => [...prev, { ...data.message, sender_id: currentUserId }])
      setInput('')
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to send message')
    }
  }

  if (connections.length === 0) {
    return (
      <div className="p-20 text-center space-y-4">
        <div className="w-20 h-20 bg-gray-100 rounded-[2.5rem] flex items-center justify-center mx-auto text-gray-400">
          <MessageSquare className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 ">No conversations yet</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Connect with people who share your interests to start a conversation!
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-[650px]">
      {/* Sidebar — lists every accepted connection */}
      <div className="w-full md:w-80 border-r border-gray-100 flex flex-col bg-gray-50/30 ">
        <div className="p-6 border-b border-gray-100 ">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {connections.map((conn) => {
            const other = getOtherUser(conn)
            const isActive = selected?.id === conn.id
            return (
              <button
                key={conn.id}
                onClick={() => selectConnection(conn)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-white shadow-lg shadow-indigo-500/5 ring-1 ring-gray-200 ' 
                    : 'hover:bg-gray-100 '
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">@{other.username}</p>
                  <p className="text-[11px] text-gray-500 truncate">Open conversation</p>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Thread panel */}
      <div className="flex-1 flex flex-col bg-white ">
        {selected ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 ">
                  {getOtherUser(selected).username[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900 ">
                    @{getOtherUser(selected).username}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 ">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingConv ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="text-sm font-medium">Opening conversation...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">No messages yet. <br />Be the first to say hello!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === currentUserId
                    const showAvatar = idx === 0 || messages[idx-1].sender_id !== msg.sender_id
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${isMe ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'} ${!showAvatar ? 'opacity-0' : ''}`}>
                          {isMe ? 'ME' : getOtherUser(selected).username[0].toUpperCase()}
                        </div>
                        <div
                          className={`max-w-[70%] px-4 py-2.5 shadow-sm transition-all ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none'
                              : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-none'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.body}</p>
                          <p className={`text-[9px] mt-1 font-bold uppercase tracking-widest ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/30 ">
              <div className="relative flex items-center gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Type your message..."
                  maxLength={2000}
                  disabled={!convId || loadingConv}
                  className="flex-1 pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 shadow-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending || !convId}
                  className="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all active:scale-90 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-indigo-500/20"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-40">
            <div className="w-24 h-24 bg-gray-100 rounded-[3rem] flex items-center justify-center text-gray-400">
              <Inbox className="w-12 h-12" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 ">Your Workspace</h3>
              <p className="text-sm font-medium text-gray-500 max-w-xs mx-auto mt-2">
                Select a conversation from the sidebar to start chatting with your connections.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
