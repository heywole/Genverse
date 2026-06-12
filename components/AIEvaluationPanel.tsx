'use client'

import { useState } from 'react'
import { ExternalLink, CheckCircle, XCircle, ShieldCheck, Eye } from 'lucide-react'

function scoreColor(s: number) {
  if (s >= 75) return 'var(--green)'
  if (s >= 50) return 'var(--yellow)'
  return 'var(--red)'
}
function riskColors(risk: string) {
  if (risk === 'Low')    return { c: 'var(--green)',  bg: 'var(--green-bg)',  bd: 'var(--green-bd)'  }
  if (risk === 'Medium') return { c: 'var(--yellow)', bg: 'var(--yellow-bg)', bd: 'var(--yellow-bd)' }
  return                        { c: 'var(--red)',    bg: 'var(--red-bg)',    bd: 'var(--red-bd)'    }
}
function trustLabel(risk: string) {
  if (risk === 'Low')    return 'High'
  if (risk === 'Medium') return 'Moderate'
  return 'Low'
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = scoreColor(value)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{value}/100</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, value)}%`, background: color, borderRadius: 999, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

// Security score breakdown — what each check contributed
function SecurityBreakdown({ score, risks, positives }: { score: number; risks: string[]; positives: string[] }) {
  const allRisksText = [...risks].join(' ').toLowerCase()
  const allPositivesText = [...positives].join(' ').toLowerCase()

  const checks = [
    { label: 'GoPlus threat check',       points: 20, passed: !allRisksText.includes('goplus') && !allRisksText.includes('phishing database') },
    { label: 'Google Safe Browsing',       points: 20, passed: !allRisksText.includes('safe browsing') && !allRisksText.includes('google') },
    { label: 'ScamSniffer blacklist',      points: 20, passed: !allRisksText.includes('scamsniffer') && !allRisksText.includes('blacklist') },
    { label: 'No phishing/wallet patterns',points: 15, passed: !allRisksText.includes('phishing') && !allRisksText.includes('unsafe wallet') },
    { label: 'No honeypot patterns',       points: 10, passed: !allRisksText.includes('honeypot') },
    { label: 'HTTPS/SSL valid',            points: 10, passed: !allRisksText.includes('ssl') && !allRisksText.includes('https') },
    { label: 'No obfuscated scripts',      points: 5,  passed: !allRisksText.includes('obfuscated') && !allRisksText.includes('script') },
  ]

  return (
    <div style={{ marginTop: 12 }}>
      {checks.map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < checks.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-2)' }}>
            {c.passed
              ? <CheckCircle size={11} color="var(--green)" />
              : <XCircle    size={11} color="var(--red)"   />
            }
            {c.label}
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: c.passed ? 'var(--green)' : 'var(--red)' }}>
            {c.passed ? `+${c.points}` : `-${c.points}`}
          </span>
        </div>
      ))}
    </div>
  )
}

// Transparency score breakdown
function TransparencyBreakdown({ project }: { project: any }) {
  const checks = [
    { label: 'Website present',      points: 25, passed: true }, // always true if project exists
    { label: 'GitHub repository',    points: 20, passed: !!(project?.github_url) },
    { label: 'Documentation',        points: 20, passed: !!(project?.docs_url) },
    { label: 'Twitter/X account',    points: 15, passed: !!(project?.twitter_url) },
    { label: 'Telegram community',   points: 10, passed: !!(project?.telegram_url) },
    { label: 'Discord server',       points: 10, passed: !!(project?.discord_url) },
  ]

  return (
    <div style={{ marginTop: 12 }}>
      {checks.map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < checks.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-2)' }}>
            {c.passed
              ? <CheckCircle size={11} color="var(--green)" />
              : <XCircle    size={11} color="var(--red)"   />
            }
            {c.label}
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: c.passed ? 'var(--green)' : 'var(--red)' }}>
            {c.passed ? `+${c.points}` : `0`}
          </span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  score:   any   // ai_score row
  project?: any  // project row (for transparency breakdown)
}

export function AIEvaluationPanel({ score: ai, project }: Props) {
  const [showSecBreakdown,   setShowSecBreakdown]   = useState(false)
  const [showTransBreakdown, setShowTransBreakdown] = useState(false)

  if (!ai || Number(ai.score) === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 600 }}>AI Evaluation in Progress</p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>GenLayer validators are reaching consensus. This page will update automatically.</p>
      </div>
    )
  }

  const s           = Number(ai.score)
  const color       = scoreColor(s)
  const rc          = riskColors(ai.risk)
  const R = 44, circ = 2 * Math.PI * R
  const offset      = circ * (1 - s / 100)
  const txHash      = ai.tx_hash ?? null
  const explorerUrl = txHash
    ? `https://explorer-studio.genlayer.com/tx/${txHash}`
    : 'https://explorer-studio.genlayer.com/txs'
  const secScore   = ai.security_score     ?? ai.breakdown?.security     ?? null
  const transScore = ai.transparency_score ?? ai.breakdown?.transparency ?? null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28, alignItems: 'start' }} className="proj-detail-grid">

      {/* LEFT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* How it works */}
        <div style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--blue-bg)', border: '1px solid var(--blue-bd)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
          <p style={{ fontWeight: 700, color: 'var(--blue)', marginBottom: 6, fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>How this score was generated</p>
          <p>GenRadar's scanner checks threat databases (GoPlus, Google Safe Browsing, ScamSniffer) and analyses the website for phishing, unsafe wallet patterns, and suspicious scripts. These signals are sent to <strong>GenLayer AI Consensus</strong> — multiple independent validators (GPT-4, Claude, Llama) each run the evaluation contract and reach consensus on-chain.</p>
        </div>

        {/* Security score breakdown */}
        {secScore !== null && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: '18px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={13} color="var(--brand)" />
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Security Score</p>
              </div>
              <button onClick={() => setShowSecBreakdown(v => !v)} style={{ fontSize: 11, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                {showSecBreakdown ? 'hide breakdown ▲' : 'show breakdown ▼'}
              </button>
            </div>
            <ScoreBar label="Security" value={secScore} />
            {ai.security_explanation && <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>{ai.security_explanation}</p>}
            {showSecBreakdown && <SecurityBreakdown score={secScore} risks={ai.risks ?? []} positives={ai.positives ?? []} />}
          </div>
        )}

        {/* Transparency score breakdown */}
        {transScore !== null && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: '18px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={13} color="var(--brand)" />
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Transparency Score</p>
              </div>
              <button onClick={() => setShowTransBreakdown(v => !v)} style={{ fontSize: 11, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                {showTransBreakdown ? 'hide breakdown ▲' : 'show breakdown ▼'}
              </button>
            </div>
            <ScoreBar label="Transparency" value={transScore} />
            {ai.transparency_explanation && <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>{ai.transparency_explanation}</p>}
            {showTransBreakdown && <TransparencyBreakdown project={project} />}
          </div>
        )}

        {/* AI Explanation */}
        {ai.explanation && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: '18px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>AI Summary</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8 }}>{ai.explanation}</p>
          </div>
        )}

        {/* Positive signals */}
        {Array.isArray(ai.positives) && ai.positives.length > 0 && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: '18px', border: '1px solid var(--green-bd)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <CheckCircle size={13} color="var(--green)" />
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Positive Signals</p>
            </div>
            {ai.positives.map((pos: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.6, alignItems: 'flex-start' }}>
                <CheckCircle size={12} color="var(--green)" style={{ flexShrink: 0, marginTop: 2 }} />
                {pos}
              </div>
            ))}
          </div>
        )}

        {/* Risk signals — no duplicates with findings */}
        {Array.isArray(ai.risks) && ai.risks.length > 0 && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: '18px', border: '1px solid var(--red-bd)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <XCircle size={13} color="var(--red)" />
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Risk Signals</p>
            </div>
            {ai.risks.map((r: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.6, alignItems: 'flex-start' }}>
                <XCircle size={12} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
                {r}
              </div>
            ))}
          </div>
        )}
        {/* NOTE: Detailed Findings removed — was identical to Risk Signals */}
      </div>

      {/* RIGHT — score summary */}
      <div style={{ position: 'sticky', top: 20 }} className="proj-detail-sidebar">
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ padding: '24px 20px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, fontFamily: 'var(--font-mono)' }}>AI Trust Score</p>
            <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 14px' }}>
              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r={R} fill="none" stroke="var(--bg-tertiary)" strokeWidth="6" />
                <circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="6"
                  strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 900, fontSize: 30, color, letterSpacing: '-0.04em', lineHeight: 1 }}>{s}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>/100</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: rc.bg, color: rc.c, border: `1px solid ${rc.bd}` }}>
                Trust: {trustLabel(ai.risk)}
              </span>
              <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: rc.bg, color: rc.c, border: `1px solid ${rc.bd}` }}>
                Risk: {ai.risk}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
              Confidence: {ai.confidence ?? 'Medium'}
            </p>
          </div>

          {/* On-chain TX proof */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>On-Chain Proof</p>
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--blue)', textDecoration: 'none', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', lineHeight: 1.6 }}>
              <ExternalLink size={10} style={{ flexShrink: 0 }} />
              {txHash ? `TX: ${txHash.slice(0, 14)}...${txHash.slice(-8)}` : 'View on GenLayer Explorer'}
            </a>
            {txHash && <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>Score verified on GenLayer studionet</p>}
          </div>

          {/* Pillar scores */}
          {(secScore !== null || transScore !== null) && (
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>Pillar Scores</p>
              {secScore !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-2)' }}>
                    <ShieldCheck size={12} color="var(--brand)" /> Security
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 13, color: scoreColor(secScore), fontFamily: 'var(--font-mono)' }}>{secScore}/100</span>
                </div>
              )}
              {transScore !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-2)' }}>
                    <Eye size={12} color="var(--brand)" /> Transparency
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 13, color: scoreColor(transScore), fontFamily: 'var(--font-mono)' }}>{transScore}/100</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
