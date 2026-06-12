'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'

import { COUNTRY_FLAG } from '@/components/CountrySelector'
const COUNTRY_FLAGS = COUNTRY_FLAG

function rankMedal(i: number) {
  if (i === 0) return { emoji: '🥇', label: '#1 Builder', color: '#F59E0B' }
  if (i === 1) return { emoji: '🥈', label: '#2 Builder', color: '#9CA3AF' }
  if (i === 2) return { emoji: '🥉', label: '#3 Builder', color: '#B45309' }
  return null
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [builders, setBuilders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/builders')
      .then(r => r.json())
      .then(d => { setBuilders(d.builders ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>Leaderboard</h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 4 }}>Ranked by total projects submitted.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 72, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : builders.length === 0 ? (
        <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '60px 0' }}>No builders yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {builders.map((b, i) => {
            const flag = b.country ? COUNTRY_FLAGS[b.country] ?? '' : ''
            const medal = rankMedal(i)
            return (
              <div
                key={b.user_id}
                onClick={() => router.push(`/builders/${b.user_id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                  background: i < 3 ? 'var(--bg-secondary)' : 'var(--bg)',
                  border: `1px solid ${i < 3 ? 'var(--border-hi)' : 'var(--border)'}`,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--brand)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = i < 3 ? 'var(--border-hi)' : 'var(--border)'}
              >
                {/* Rank */}
                <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                  {medal
                    ? <span style={{ fontSize: 22 }}>{medal.emoji}</span>
                    : <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>#{i + 1}</span>
                  }
                </div>

                {/* Avatar */}
                <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-tertiary)', border: '2px solid var(--border-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {b.avatar_url
                    ? <img src={b.avatar_url} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <User size={18} color="var(--text-3)" />
                  }
                </div>

                {/* Name + flag + medal badge */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{b.name}</span>
                    {flag && <span style={{ fontSize: 15 }}>{flag}</span>}
                    {medal && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--brand-bg)', color: 'var(--brand)', border: '1px solid var(--brand-bd)' }}>
                        {medal.label}
                      </span>
                    )}
                  </div>
                  {b.avgScore !== null && (
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Avg. Score: {b.avgScore}/100</div>
                  )}
                </div>

                {/* Projects count */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1 }}>{b.totalProjects}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Projects</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
