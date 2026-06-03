'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'

const COUNTRY_FLAGS: Record<string, string> = {
  AF:'🇦🇫',AL:'🇦🇱',DZ:'🇩🇿',AR:'🇦🇷',AU:'🇦🇺',AT:'🇦🇹',BD:'🇧🇩',BE:'🇧🇪',BR:'🇧🇷',CA:'🇨🇦',
  CL:'🇨🇱',CN:'🇨🇳',CO:'🇨🇴',HR:'🇭🇷',CZ:'🇨🇿',DK:'🇩🇰',EG:'🇪🇬',ET:'🇪🇹',FI:'🇫🇮',FR:'🇫🇷',
  DE:'🇩🇪',GH:'🇬🇭',GR:'🇬🇷',GT:'🇬🇹',HU:'🇭🇺',IN:'🇮🇳',ID:'🇮🇩',IE:'🇮🇪',IL:'🇮🇱',IT:'🇮🇹',
  JP:'🇯🇵',KE:'🇰🇪',KR:'🇰🇷',MY:'🇲🇾',MX:'🇲🇽',MA:'🇲🇦',NL:'🇳🇱',NZ:'🇳🇿',NG:'🇳🇬',NO:'🇳🇴',
  PK:'🇵🇰',PE:'🇵🇪',PH:'🇵🇭',PL:'🇵🇱',PT:'🇵🇹',RO:'🇷🇴',RU:'🇷🇺',SA:'🇸🇦',SN:'🇸🇳',ZA:'🇿🇦',
  ES:'🇪🇸',SE:'🇸🇪',CH:'🇨🇭',TW:'🇹🇼',TH:'🇹🇭',TN:'🇹🇳',TR:'🇹🇷',UA:'🇺🇦',GB:'🇬🇧',US:'🇺🇸',
  VN:'🇻🇳',ZW:'🇿🇼',
}

function badgeStyle(badge: string) {
  if (badge === 'Trusted Builder')     return { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' }
  if (badge === 'Established Builder') return { bg: '#EDE9FE', color: '#5B21B6', border: '#DDD6FE' }
  if (badge === 'Growing Builder')     return { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE' }
  return { bg: '#FCE7F3', color: '#9D174D', border: '#FBCFE8' }
}

function XIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
}
function GithubIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
}

export default function BuildersPage() {
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
    <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>Builders</h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 4 }}>Discover and connect with talented builders in the GenRadar community.</p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 160, borderRadius: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : builders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
          <User size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>No builders yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {builders.map(b => {
            const flag = b.country ? COUNTRY_FLAGS[b.country] ?? '' : ''
            const bs = badgeStyle(b.badge)
            return (
              <div
                key={b.user_id}
                onClick={() => router.push(`/profile?builder=${b.user_id}`)}
                style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '20px', cursor: 'pointer',
                  transition: 'border-color 0.15s, transform 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-hi)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
              >
                {/* Top: avatar + name + badge */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-tertiary)', border: '2px solid var(--border-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {b.avatar_url
                      ? <img src={b.avatar_url} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <User size={22} color="var(--text-3)" />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                      {flag && <span style={{ fontSize: 16 }}>{flag}</span>}
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: bs.bg, color: bs.color, border: `1px solid ${bs.border}` }}>
                      {b.badge}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><rect x="2" y="3" width="7" height="7" rx="1"/><rect x="15" y="3" width="7" height="7" rx="1"/><rect x="2" y="14" width="7" height="7" rx="1"/><rect x="15" y="14" width="7" height="7" rx="1"/></svg>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{b.totalProjects}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Projects</div>
                    </div>
                  </div>
                  {b.avgScore !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{b.avgScore}<span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-3)' }}>/100</span></div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Avg. Score</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Socials */}
                <div style={{ display: 'flex', gap: 10 }}>
                  {b.twitter_url && (
                    <a href={b.twitter_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-2)', textDecoration: 'none' }}>
                      <XIcon />
                    </a>
                  )}
                  {b.github_url && (
                    <a href={b.github_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-2)', textDecoration: 'none' }}>
                      <GithubIcon />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
