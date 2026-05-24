'use client'

import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  projectId: string
}

export function VoteButtons({ projectId }: Props) {
  const [up,          setUp]          = useState(0)
  const [down,        setDown]        = useState(0)
  const [userVote,    setUserVote]    = useState<'up' | 'down' | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [showPrompt,  setShowPrompt]  = useState(false)
  const [feedback,    setFeedback]    = useState('')
  const [submitted,   setSubmitted]   = useState(false)

  useEffect(() => { fetchVotes() }, [projectId])

  async function fetchVotes() {
    const res  = await fetch(`/api/vote?project_id=${projectId}`)
    const data = await res.json()
    setUp(data.up ?? 0); setDown(data.down ?? 0)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const sb = (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )
    const { data: v } = await sb.from('votes').select('vote_type').eq('project_id', projectId).eq('user_id', session.user.id).maybeSingle()
    setUserVote(v?.vote_type ?? null)
  }

  async function handleVote(type: 'up' | 'down') {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/auth'; return }

    if (type === 'down' && userVote !== 'down') {
      setShowPrompt(true)
      return
    }

    await submitVote(type)
  }

  async function submitVote(type: 'up' | 'down') {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    setLoading(true)
    const res  = await fetch('/api/vote', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body:    JSON.stringify({ project_id: projectId, vote_type: type }),
    })
    const data = await res.json()

    if (data.action === 'removed') {
      setUserVote(null)
      if (type === 'up')   setUp(u => Math.max(0, u - 1))
      if (type === 'down') setDown(d => Math.max(0, d - 1))
    } else if (data.action === 'switched') {
      setUserVote(type)
      if (type === 'up')   { setUp(u => u + 1); setDown(d => Math.max(0, d - 1)) }
      if (type === 'down') { setDown(d => d + 1); setUp(u => Math.max(0, u - 1)) }
    } else {
      setUserVote(type)
      if (type === 'up')   setUp(u => u + 1)
      if (type === 'down') setDown(d => d + 1)
    }
    setLoading(false)
  }

  async function handleFeedbackSubmit() {
    // Submit feedback message first
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    if (feedback.trim()) {
      await fetch('/api/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body:    JSON.stringify({ project_id: projectId, content: `⚠️ Downvote feedback: ${feedback.trim()}` }),
      })
    }

    await submitVote('down')
    setShowPrompt(false)
    setFeedback('')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const hasWarning = down > up && down >= 3

  return (
    <div style={{ padding: '20px 24px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border-hi)' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, fontFamily: 'var(--font-mono)' }}>
        Community Trust
      </p>

      {hasWarning && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', marginBottom: 14 }}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <span style={{ fontSize: 12, color: '#EF4444', lineHeight: 1.5 }}>
            Community has flagged this project as potentially risky.
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: showPrompt ? 14 : 0 }}>
        <button
          onClick={() => handleVote('up')}
          disabled={loading}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
            border: `1px solid ${userVote === 'up' ? 'rgba(34,197,94,0.5)' : 'var(--border-hi)'}`,
            background: userVote === 'up' ? 'rgba(34,197,94,0.1)' : 'transparent',
            color: userVote === 'up' ? '#22C55E' : 'var(--text-2)',
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
          }}
        >
          <ThumbsUp size={14} />
          <span>{up}</span>
          <span style={{ fontSize: 11, opacity: 0.7 }}>Trust</span>
        </button>

        <button
          onClick={() => handleVote('down')}
          disabled={loading}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
            border: `1px solid ${userVote === 'down' ? 'rgba(239,68,68,0.5)' : 'var(--border-hi)'}`,
            background: userVote === 'down' ? 'rgba(239,68,68,0.1)' : 'transparent',
            color: userVote === 'down' ? '#EF4444' : 'var(--text-2)',
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
          }}
        >
          <ThumbsDown size={14} />
          <span>{down}</span>
          <span style={{ fontSize: 11, opacity: 0.7 }}>Report</span>
        </button>
      </div>

      {/* Downvote feedback prompt */}
      {showPrompt && (
        <div style={{ marginTop: 14, padding: '14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-hi)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.5 }}>
            Please provide feedback for your downvote. This helps the community understand the concern.
          </p>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="e.g. Wallet drainer detected, phishing site, fake project..."
            rows={3}
            style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-hi)', borderRadius: 6, color: 'var(--text-1)', fontSize: 12, fontFamily: 'var(--font-sans)', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={() => { setShowPrompt(false); setFeedback('') }}
              style={{ flex: 1, padding: '8px', border: '1px solid var(--border-hi)', background: 'transparent', color: 'var(--text-2)', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
            >
              Cancel
            </button>
            <button
              onClick={handleFeedbackSubmit}
              style={{ flex: 1, padding: '8px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            >
              Submit Downvote
            </button>
          </div>
        </div>
      )}

      {submitted && (
        <p style={{ fontSize: 12, color: '#EF4444', marginTop: 10, textAlign: 'center' }}>
          Downvote recorded. Thank you for the feedback.
        </p>
      )}
    </div>
  )
}
