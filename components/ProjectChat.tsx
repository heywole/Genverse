'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Message {
  id:          string
  user_name:   string
  user_avatar: string | null
  content:     string
  created_at:  string
}

export function ProjectChat({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [fetching, setFetching] = useState(true)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const userScrolled = useRef(false)

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 15000)
    return () => clearInterval(interval)
  }, [projectId])

  async function fetchMessages() {
    const res  = await fetch(`/api/messages?project_id=${projectId}`)
    const data = await res.json()
    const prev = messages.length
    setMessages(data.messages || [])
    setFetching(false)
    // Only auto-scroll if user hasn't scrolled up manually
    if (!userScrolled.current && prev !== (data.messages || []).length) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }
  }

  function handleScroll() {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    // User scrolled up — stop auto-scroll
    userScrolled.current = scrollHeight - scrollTop - clientHeight > 50
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/auth'; return }
    setLoading(true)
    await fetch('/api/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body:    JSON.stringify({ project_id: projectId, content: input.trim() }),
    })
    setInput('')
    userScrolled.current = false
    await fetchMessages()
    setLoading(false)
  }

  return (
    <div style={{ padding: '22px 24px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border-hi)' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
        Community Feedback
      </p>

      <div ref={containerRef} onScroll={handleScroll}
        style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {fetching ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-3)' }} />
          </div>
        ) : messages.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0', fontFamily: 'var(--font-mono)' }}>
            No feedback yet. Be the first.
          </p>
        ) : messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              {msg.user_avatar
                ? <img src={msg.user_avatar} alt={msg.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-2)' }}>{msg.user_name?.[0]?.toUpperCase() || 'U'}</span>
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{msg.user_name}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, margin: 0 }}>{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          placeholder="Share your experience..."
          style={{ flex: 1, padding: '9px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-hi)', borderRadius: 8, color: 'var(--text-1)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none' }} />
        <button type="submit" disabled={loading || !input.trim()}
          style={{ padding: '9px 14px', background: 'var(--text-1)', color: 'var(--bg)', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, opacity: loading || !input.trim() ? 0.6 : 1 }}>
          {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
        </button>
      </form>
    </div>
  )
}
