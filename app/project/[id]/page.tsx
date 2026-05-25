import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ExternalLink, CheckCircle, XCircle,
  AlertTriangle, Github, Eye, Twitter, MessageCircle,
  BookOpen, ChevronDown
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { ProjectChat }        from '@/components/ProjectChat'
import { VoteButtons }        from '@/components/VoteButtons'
import { SaveButton }         from '@/components/SaveButton'
import { ProjectDetailClient } from '@/components/ProjectDetailClient'
import { ProjectTabs }        from '@/components/ProjectTabs'

async function getProject(id: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
  const { data: project, error } = await supabase
    .from('projects').select('*').eq('id', id).eq('status', 'active').single()
  if (error || !project) return null

  const { data: scores } = await supabase.from('ai_scores').select('*').eq('project_id', id)
  const scoreRow = scores?.length
    ? scores.reduce((best, s) => Number(s.score) >= Number(best.score) ? s : best, scores[0])
    : null

  const { data: ints } = await supabase.from('interactions').select('type').eq('project_id', id)
  const counts = { views: 0, saves: 0 }
  for (const { type } of ints ?? []) {
    if (type === 'view') counts.views++
    if (type === 'save') counts.saves++
  }
  return { ...project, ai_score: scoreRow, _count: counts }
}

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

export const dynamic    = 'force-dynamic'
export const revalidate = 0

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id)
  if (!project) notFound()

  const ai    = project.ai_score as any
  const score = ai ? Number(ai.score) : null
  const color = score !== null ? scoreColor(score) : 'var(--text-3)'
  const isVerified  = ai && score !== null && score >= 75 && ai.risk === 'Low'
  const rc          = ai ? riskColors(ai.risk) : null
  const txHash      = ai?.tx_hash ?? null
  const explorerUrl = txHash ? `https://studio.genlayer.com/transactions/${txHash}` : null

  const R = 30, circ = 2 * Math.PI * R
  const offset = score !== null ? circ * (1 - score / 100) : circ

  // Build the project details panel (server rendered)
  const projectDetailsPanel = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 32, alignItems: 'start' }} className="proj-detail-grid">
      {/* LEFT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>About</p>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.85 }}>{project.description}</p>
          <ProjectDetailClient projectId={project.id} initialViews={project._count.views} initialSaves={project._count.saves} />
        </div>
        <ProjectChat projectId={project.id} />
      </div>

      {/* RIGHT */}
      <div style={{ position: 'sticky', top: 20 }} className="proj-detail-sidebar">
        {ai ? (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {/* Score */}
            <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, fontFamily: 'var(--font-mono)' }}>AI Trust Score</p>
              <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 10px' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: rc.bg, color: rc.c, border: `1px solid ${rc.bd}` }}>
                    Trust: {ai.risk === 'Low' ? 'High' : ai.risk === 'Medium' ? 'Moderate' : 'Low'}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: rc.bg, color: rc.c, border: `1px solid ${rc.bd}` }}>
                    {ai.risk} Risk
                  </span>
                </div>
              )}
              <p style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Confidence: {ai.confidence}</p>
            </div>

            {explorerUrl && (
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--blue-bg)' }}>
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--blue)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
                  <ExternalLink size={10} /> {txHash.slice(0, 10)}...{txHash.slice(-6)} → GenLayer
                </a>
              </div>
            )}

            {/* AI Explanation — collapsible */}
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

            {/* Community vote */}
            <div style={{ padding: '14px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>Community Trust</p>
              <VoteButtons projectId={project.id} />
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '32px 20px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>Undergoing AI Evaluation</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Score will appear shortly...</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 80px' }}>

      <Link href="/explore" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none', marginBottom: 18, fontFamily: 'var(--font-mono)' }}>
        <ArrowLeft size={12} /> back to projects
      </Link>

      <div style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 9, marginBottom: 24, background: 'var(--yellow-bg)', fontSize: 13, color: 'var(--yellow)', lineHeight: 1.5 }}>
        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span><strong>Community-submitted.</strong> GenScout does not endorse any project. Always do your own research.</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {project.logo_url
              ? <img src={project.logo_url} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--text-3)' }}>{project.name.slice(0, 2).toUpperCase()}</span>
            }
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <h1 style={{ fontWeight: 900, fontSize: 24, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}>{project.name}</h1>
              {isVerified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: 'var(--green-bg)', border: '1px solid var(--green-bd)', fontSize: 10, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                  <CheckCircle size={9} /> VERIFIED
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 11, background: 'var(--bg-secondary)', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{project.category}</span>
              {rc && <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: rc.bg, color: rc.c, border: `1px solid ${rc.bd}` }}>{ai.risk} Risk</span>}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {project.twitter_url  && <a href={project.twitter_url}  target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}><Twitter size={11} /> X/Twitter</a>}
              {project.discord_url  && <a href={project.discord_url}  target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}><MessageCircle size={11} /> Discord</a>}
              {project.github_url   && <a href={project.github_url}   target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}><Github size={11} /> GitHub</a>}
              {project.docs_url     && <a href={project.docs_url}     target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}><BookOpen size={11} /> Docs</a>}
              {project.telegram_url && <a href={project.telegram_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}><MessageCircle size={11} /> Telegram</a>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href={project.website_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 9, background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
            <ExternalLink size={13} /> Visit Website
          </a>
          <SaveButton projectId={project.id} />
        </div>
      </div>

      {/* ── TABS: Project Details | Builder Profile ── */}
      <ProjectTabs
        projectDetailsPanel={projectDetailsPanel}
        builderId={project.created_by ?? ''}
      />
    </div>
  )
}
