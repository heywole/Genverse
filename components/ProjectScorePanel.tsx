'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import { VoteButtons } from '@/components/VoteButtons'
import { isEvaluating, clearEvaluating } from '@/lib/evaluatingState'
import { supabase } from '@/lib/supabase'

function riskColors(risk: string) {
  if (risk === 'Low')    return { c: 'var(--green)',  bg: 'var(--green-bg)',  bd: 'var(--green-bd)'  }
  if (risk === 'Medium') return { c: 'var(--yellow)', bg: 'var(--yellow-bg)', bd: 'var(--yellow-bd)' }
  return                        { c: 'var(--red)',    bg: 'var(--red-bg)',    bd: 'var(--red-bd)'    }
}

function scoreColor(s: number) {
  if (s >= 75) return 'var(--green)'
  if (s >= 50) return 'var(--yellow)'
  return 'var(--red)'
}

function trustLabel(risk: string) {
  if (risk === 'Low')    return 'High'
  if (risk === 'Medium') return 'Moderate'
  return 'Low'
}

interface Props {
  projectId: string
  initialScore: any   // the ai_score row from server, or null
}

export function ProjectScorePanel({ projectId, initialScore }: Props) {
  const [score,        setScore]        = useState<any>(initialScore)
  const [evaluating,   setEvaluating]   = useState(() => isEvaluating(projectId))
  const timerRef = { current: null as NodeJS.Timeout | null }

  function startPolling() {
    if (timerRef.current) return
    timerRef.current = setInterval(async () => {
      try {
        const { data: rows } = await supabase
          .from('ai_scores')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1)
        const row = rows?.[0] ?? null
        const fresh = row && Number(row.score) > 0 ? row : null
        if (fresh) {
          // Check it's actually newer than what we already have
          const isNewer = !score || new Date(fresh.created_at) > new Date(score.created_at)
          if (isNewer) {
            setScore(fresh)
            setEvaluating(false)
            clearEvaluating(projectId)
            clearInterval(timerRef.current!)
            timerRef.current = null
          }
        }
      } catch {}
    }, 3000)
  }

  useEffect(() => {
    // If already evaluating when page loads, start polling immediately
    if (isEvaluating(projectId)) {
      setEvaluating(true)
      startPolling()
    }

    function handleEvalStart(e: any) {
      if (e.detail?.projectId !== projectId) return
      setEvaluating(true)
      startPolling()
    }

    window.addEventListener('evaluation-started', handleEvalStart)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      window.removeEventListener('evaluation-started', handleEvalStart)
    }
  }, [projectId])

  const ai = evaluating ? null : score
  const s = ai ? Number(ai.score) : null
  const color = s !== null ? scoreColor(s) : 'var(--text-3)'
  const rc = ai ? riskColors(ai.risk) : null
  const R = 30, circ = 2 * Math.PI * R
  const offset = s !== null ? circ * (1 - s / 100) : circ
  const txHash = ai?.tx_hash ?? null
  const explorerUrl = txHash
    ? `https://explorer-studio.genlayer.com/tx/${txHash}`
    : 'https://explorer-studio.genlayer.com/txs'

  if (!ai) {
    return (
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '32px 20px', textAlign: 'center', border: '1px solid var(--border)' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>Undergoing AI Evaluation</p>
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Score will appear shortly...</p>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>

      {/* Score circle */}
      <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, fontFamily: 'var(--font-mono)' }}>AI Trust Score</p>
        <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 14px' }}>
          <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r={R} fill="none" stroke="var(--bg-tertiary)" strokeWidth="5" />
            <circle cx="40" cy="40" r={R} fill="none" stroke={color} strokeWidth="5"
              strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontWeight: 900, fontSize: 24, color, letterSpacing: '-0.04em', lineHeight: 1 }}>{ai.score}</span>
            <span style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>/100</span>
          </div>
        </div>

        {rc && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: rc.bg, color: rc.c, border: `1px solid ${rc.bd}` }}>
              Trust: <strong>{trustLabel(ai.risk)}</strong>
            </span>
            <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: rc.bg, color: rc.c, border: `1px solid ${rc.bd}` }}>
              Risk: <strong>{ai.risk}</strong>
            </span>
          </div>
        )}
        <p style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          Confidence: {ai.confidence ?? 'Medium'}
        </p>
      </div>

      {/* Explorer link */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'rgba(59,130,246,0.06)' }}>
        <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--blue)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
          <ExternalLink size={10} />
          {txHash
            ? `TX: ${txHash.slice(0, 10)}...${txHash.slice(-6)} → GenLayer Explorer`
            : 'View on GenLayer Explorer'
          }
        </a>
      </div>

      {/* AI Explanation */}
      {(ai.explanation || ai.findings?.[0]) && (
        <details open style={{ borderBottom: '1px solid var(--border)' }}>
          <summary style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 14px', cursor: 'pointer', listStyle: 'none', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
            AI Explanation <ChevronDown size={11} style={{ marginLeft: 'auto' }} />
          </summary>
          <div style={{ padding: '2px 14px 12px' }}>
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>{ai.explanation || ai.findings?.[0]}</p>
          </div>
        </details>
      )}

      {/* Positive signals */}
      {Array.isArray(ai.positives) && ai.positives.length > 0 && (
        <details style={{ borderBottom: '1px solid var(--border)' }}>
          <summary style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 14px', cursor: 'pointer', listStyle: 'none', fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
            <CheckCircle size={10} color="var(--green)" /> Positive Signals <ChevronDown size={11} style={{ marginLeft: 'auto' }} />
          </summary>
          <div style={{ padding: '2px 14px 12px' }}>
            {ai.positives.map((pos: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-2)', marginBottom: 6, lineHeight: 1.55 }}>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, marginTop: 7 }} />
                {pos}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Risk signals */}
      {Array.isArray(ai.risks) && ai.risks.length > 0 && (
        <details style={{ borderBottom: '1px solid var(--border)' }}>
          <summary style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 14px', cursor: 'pointer', listStyle: 'none', fontSize: 10, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
            <XCircle size={10} color="var(--red)" /> Risk Signals <ChevronDown size={11} style={{ marginLeft: 'auto' }} />
          </summary>
          <div style={{ padding: '2px 14px 12px' }}>
            {ai.risks.map((r: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-2)', marginBottom: 6, lineHeight: 1.55 }}>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--red)', flexShrink: 0, marginTop: 7 }} />
                {r}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Community Trust */}
      <div style={{ padding: '14px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>Community Trust</p>
        <VoteButtons projectId={projectId} />
      </div>
    </div>
  )
}
