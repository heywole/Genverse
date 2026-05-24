import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Bookmark, CheckCircle, XCircle, AlertTriangle, Github, Eye, Twitter, MessageCircle, BookOpen } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { ProjectChat } from '@/components/ProjectChat'
import { VoteButtons } from '@/components/VoteButtons'
import { SaveButton } from '@/components/SaveButton'

async function getProject(id: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
  const { data: project, error } = await supabase
    .from('projects').select('*').eq('id', id).eq('status', 'active').single()
  if (error || !project) return null

  // Get all score rows and pick the highest score (most recent re-evaluation)
  const { data: scores } = await supabase
    .from('ai_scores').select('*').eq('project_id', id)
  const scoreRow = scores?.length
    ? scores.reduce((best, s) => Number(s.score) >= Number(best.score) ? s : best, scores[0])
    : null

  const { data: ints } = await supabase
    .from('interactions').select('type').eq('project_id', id)
  const counts = { views: 0, saves: 0 }
  for (const { type } of ints ?? []) {
    if (type === 'view') counts.views++
    if (type === 'save') counts.saves++
  }
  return { ...project, ai_score: scoreRow, _count: counts }
}

function scoreColor(s: number) {
  if (s >= 75) return 'var(--green)'
  if (s >= 50) return 'var(--yellow)'
  return 'var(--red)'
}
function scoreLabel(s: number) {
  if (s >= 75) return 'High Trust'
  if (s >= 50) return 'Moderate Trust'
  return 'Low Trust'
}
function riskColors(risk: string) {
  if (risk === 'Low')    return { c: 'var(--green)',  bg: 'var(--green-bg)',  bd: 'var(--green-bd)'  }
  if (risk === 'Medium') return { c: 'var(--yellow)', bg: 'var(--yellow-bg)', bd: 'var(--yellow-bd)' }
  return                        { c: 'var(--red)',    bg: 'var(--red-bg)',    bd: 'var(--red-bd)'    }
}

export const dynamic   = 'force-dynamic'
export const revalidate = 0

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id)
  if (!project) notFound()

  const ai    = project.ai_score as any
  const score = ai ? Number(ai.score) : null
  const color = score !== null ? scoreColor(score) : 'var(--text-3)'
  const isVerified = ai && score !== null && score >= 75 && ai.risk === 'Low'
  const rc = ai ? riskColors(ai.risk) : null

  const R = 38, circ = 2 * Math.PI * R
  const offset = score !== null ? circ * (1 - score / 100) : circ

  // TX hash from score row
  const txHash = ai?.tx_hash ?? null
  const explorerUrl = txHash ? `https://studio.genlayer.com/transactions/${txHash}` : null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 28px 100px' }}>

      <Link href="/explore" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none', marginBottom: 24, fontFamily: 'var(--font-mono)' }}>
        <ArrowLeft size={12} /> back to projects
      </Link>

      <div style={{ display: 'flex', gap: 10, padding: '10px 16px', borderRadius: 9, marginBottom: 28, background: 'var(--yellow-bg)', fontSize: 13, color: 'var(--yellow)', lineHeight: 1.5 }}>
        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span><strong>Community-submitted.</strong> GenScout does not endorse any project. Always do your own research.</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 68, height: 68, borderRadius: 14, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
            {project.logo_url
              ? <img src={project.logo_url} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 10 }} />
              : <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--text-3)' }}>{project.name.slice(0, 2).toUpperCase()}</span>
            }
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontWeight: 900, fontSize: 26, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}>{project.name}</h1>
              {isVerified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: 'var(--green-bg)', border: '1px solid var(--green-bd)', fontSize: 10, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                  <CheckCircle size={9} /> VERIFIED
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, background: 'var(--bg-secondary)', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{project.category}</span>
              {rc && <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: rc.bg, color: rc.c, border: `1px solid ${rc.bd}` }}>{ai.risk} Risk</span>}
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {project.twitter_url  && <a href={project.twitter_url}  target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}><Twitter size={11} /> X/Twitter</a>}
              {project.discord_url  && <a href={project.discord_url}  target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}><MessageCircle size={11} /> Discord</a>}
              {project.github_url   && <a href={project.github_url}   target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}><Github size={11} /> GitHub</a>}
              {project.docs_url     && <a href={project.docs_url}     target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}><BookOpen size={11} /> Docs</a>}
              {project.telegram_url && <a href={project.telegram_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}><MessageCircle size={11} /> Telegram</a>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <a href={project.website_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 9, background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
            <ExternalLink size={13} /> Visit Website
          </a>
          <SaveButton projectId={project.id} />
        </div>
      </div>

      {/* 2-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 36, alignItems: 'start' }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, fontFamily: 'var(--font-mono)' }}>About</p>
            <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.85 }}>{project.description}</p>
            <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}><Eye size={11} /> {project._count.views} views</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}><Bookmark size={11} /> {project._count.saves} saves</span>
            </div>
          </div>
          <ProjectChat projectId={project.id} />
        </div>

        {/* RIGHT — score card */}
        <div style={{ position: 'sticky', top: 24 }}>
          {ai ? (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>

              {/* Score ring */}
              <div style={{ padding: '24px 20px 18px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>AI Trust Score</p>
                <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 12px' }}>
                  <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r={R} fill="none" stroke="var(--bg-tertiary)" strokeWidth="6" />
                    <circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="6"
                      strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontWeight: 900, fontSize: 28, color, letterSpacing: '-0.04em', lineHeight: 1 }}>{ai.score}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>/100</span>
                  </div>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color, marginBottom: 6 }}>{score !== null ? scoreLabel(score) : ''}</p>
                {/* Trust + Risk on same line */}
                {rc && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: rc.bg, color: rc.c, border: `1px solid ${rc.bd}` }}>
                      Trust: {ai.risk === 'Low' ? 'High' : ai.risk === 'Medium' ? 'Moderate' : 'Low'}
                    </span>
                    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: rc.bg, color: rc.c, border: `1px solid ${rc.bd}` }}>
                      {ai.risk} Risk
                    </span>
                  </div>
                )}
                <p style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Confidence: {ai.confidence}</p>
              </div>

              {/* TX Hash → GenLayer Explorer */}
              {explorerUrl && (
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--blue-bg)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>On-Chain TX</p>
                  <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--blue)', textDecoration: 'none', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                    <ExternalLink size={10} style={{ flexShrink: 0 }} />
                    {txHash.slice(0, 12)}...{txHash.slice(-8)} →
                  </a>
                </div>
              )}

              {/* AI Explanation */}
              {(ai.explanation || ai.findings?.[0]) && (
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>AI Explanation</p>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>{ai.explanation || ai.findings?.[0]}</p>
                </div>
              )}

              {/* Positive signals */}
              {Array.isArray(ai.positives) && ai.positives.length > 0 && (
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                    <CheckCircle size={11} color="var(--green)" />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Positive Signals</span>
                  </div>
                  {ai.positives.map((pos: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-2)', marginBottom: 7, lineHeight: 1.55 }}>
                      <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, marginTop: 7 }} />
                      {pos}
                    </div>
                  ))}
                </div>
              )}

              {/* Risk signals */}
              {Array.isArray(ai.risks) && ai.risks.length > 0 && (
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                    <XCircle size={11} color="var(--red)" />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Risk Signals</span>
                  </div>
                  {ai.risks.map((r: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-2)', marginBottom: 7, lineHeight: 1.55 }}>
                      <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--red)', flexShrink: 0, marginTop: 7 }} />
                      {r}
                    </div>
                  ))}
                </div>
              )}

              {/* Community vote */}
              <div style={{ padding: '16px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>Community Trust</p>
                <VoteButtons projectId={project.id} />
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '32px 20px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 13, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Evaluating...</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Score appears shortly.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
