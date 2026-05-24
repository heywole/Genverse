'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Shield, Cpu, Users, Upload, ExternalLink, Eye, Bookmark, ThumbsUp, MessageSquare } from 'lucide-react'
import { ProjectCard } from '@/components/ProjectCard'
import type { Project } from '@/types'

// ── AI Scanner Terminal ───────────────────────────────────────────────
function AIScanner() {
  const [lines, setLines] = useState<{text:string;color:string;tx?:string;bold?:boolean}[]>([])
  const [cursor, setCursor] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  const STEPS = [
    { text: '$ genscout-eval --network studionet', color: 'var(--text-3)', delay: 0 },
    { text: '> Connecting to GenLayer validators...', color: 'var(--text-2)', delay: 700 },
    { text: '> Scanning website for phishing... OK', color: '#22C55E', delay: 1500 },
    { text: '> Checking wallet safety... OK', color: '#22C55E', delay: 2200 },
    { text: '> Detecting obfuscated scripts... OK', color: '#22C55E', delay: 2900 },
    { text: '> GitHub repository... NOT FOUND [-10]', color: '#D97706', delay: 3700 },
    { text: '> Documentation... NOT FOUND [-5]', color: '#D97706', delay: 4400 },
    { text: '> Twitter: ✓  Telegram: ✗ [-3]  Discord: ✗ [-3]', color: '#D97706', delay: 5100 },
    { text: '> Sending raw signals to AI consensus...', color: '#3B82F6', delay: 5900 },
    { text: 'TX: 0x2AFe...8c23 → GenLayer Explorer ↗', color: '#3B82F6', tx: 'https://studio.genlayer.com/transactions', delay: 6700 },
    { text: '> Validator 1: score=76, risk=Low ✓', color: '#22C55E', delay: 7800 },
    { text: '> Validator 2: score=76, risk=Low ✓', color: '#22C55E', delay: 8600 },
    { text: '> Validator 3: score=76, risk=Low ✓', color: '#22C55E', delay: 9400 },
    { text: '> Consensus reached. Final score: 76/100', color: '#22C55E', delay: 10200, bold: true },
    { text: '✓ Verified on GenLayer network.', color: '#22C55E', delay: 11000, bold: true },
  ]

  useEffect(() => {
    let timers: NodeJS.Timeout[] = []
    function run() {
      setLines([])
      STEPS.forEach((s, i) => {
        timers.push(setTimeout(() => {
          setLines(prev => [...prev, s])
          if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
        }, s.delay))
      })
      timers.push(setTimeout(run, 13500))
    }
    run()
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setCursor(c => !c), 530)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ background: '#111', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#0A0A09', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EAB308' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E' }} />
        <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>genscout — ai-evaluator</span>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E', animation: 'pulse 2s infinite' }} />
      </div>
      <div ref={ref} style={{ height: 240, overflowY: 'auto', padding: '14px 16px', scrollbarWidth: 'none' }}>
        {lines.map((line, i) =>
          line.tx ? (
            <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, marginBottom: 2 }}>
              <a href={line.tx} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                style={{ color: '#3B82F6', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {line.text} <ExternalLink size={10} />
              </a>
            </div>
          ) : (
            <div key={i} style={{ color: line.color, fontWeight: line.bold ? 700 : 400, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, marginBottom: 2 }}>
              {line.text}
            </div>
          )
        )}
        {lines.length > 0 && lines.length < STEPS.length && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#22C55E', opacity: cursor ? 1 : 0 }}>█</span>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [projects,    setProjects]    = useState<Project[]>([])
  const [totalCount,  setTotalCount]  = useState(0)
  const [scoredCount, setScoredCount] = useState(0)
  const [loading,     setLoading]     = useState(true)

  const loadProjects = useCallback(async () => {
    try {
      const r = await fetch(`/api/projects?sort=views&limit=50&t=${Date.now()}`, {
        cache: 'no-store', headers: { 'Cache-Control': 'no-cache, no-store' },
      })
      const d = await r.json()
      const all: Project[] = d.projects ?? []
      setTotalCount(all.length)
      setScoredCount(all.filter(p => p.ai_score).length)
      setProjects(all.slice(0, 4))
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProjects()
    const id = setInterval(loadProjects, 20000)
    return () => clearInterval(id)
  }, [loadProjects])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>

      {/* ── HERO ── matching reference image */}
      <section style={{
        marginTop: 20, marginBottom: 28,
        background: 'var(--hero-bg)',
        borderRadius: 20, overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.05)',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        minHeight: 360, position: 'relative',
      }}>
        {/* Left */}
        <div style={{ padding: '52px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(30px, 3.8vw, 52px)', letterSpacing: '-0.04em', lineHeight: 1.05, color: 'var(--text-1)', marginBottom: 18 }}>
            Discover Trusted<br />Projects on<br />
            <span style={{ color: '#E8630A' }}>GenLayer</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.78, maxWidth: 400, marginBottom: 30 }}>
            GenScout combines AI-powered evaluation, backend security scanning, and community validation to help you discover and trust the best Web3 projects.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/explore" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', background: 'var(--text-1)', color: 'var(--bg)',
              fontWeight: 700, fontSize: 14, textDecoration: 'none', borderRadius: 10,
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}>
              Explore Projects <ArrowRight size={15} />
            </Link>
            <Link href="/submit" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', background: 'transparent', color: 'var(--text-1)',
              border: '1.5px solid var(--border-hi)', fontWeight: 600, fontSize: 14,
              textDecoration: 'none', borderRadius: 10,
            }}>
              Submit Your Project
            </Link>
          </div>
        </div>

        {/* Right — feature pills */}
        <div style={{ padding: '40px 40px 40px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
          {[
            { icon: Shield, label: 'AI Security Scanning',  sub: 'Phishing, scripts, wallet safety',  bg: 'rgba(22,163,74,0.12)',  ic: '#16A34A' },
            { icon: Cpu,    label: 'GenLayer AI Consensus',  sub: 'On-chain validator scoring',        bg: 'rgba(37,99,235,0.12)',  ic: '#2563EB' },
            { icon: Users,  label: 'Community Validation',   sub: 'Real users vote and review',        bg: 'rgba(232,99,10,0.12)',  ic: '#E8630A' },
          ].map(({ icon: Icon, label, sub, bg, ic }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px', borderRadius: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={21} color={ic} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-1)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRENDING PROJECTS ── */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <h2 style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text-1)', margin: 0 }}>Trending Projects</h2>
          </div>
          <Link href="/explore" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none' }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {!loading && projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', background: 'var(--bg-secondary)', borderRadius: 14 }}>
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 16 }}>No projects yet. Be the first!</p>
            <Link href="/submit" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', borderRadius: 8 }}>
              Submit a project <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {projects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text-1)', marginBottom: 24 }}>How GenScout Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
          {[
            { n: '1', icon: Upload, title: 'Submission',             color: 'var(--brand)', bg: 'var(--brand-bg)',   desc: 'Project owners submit their projects to GenScout.' },
            { n: '2', icon: Shield, title: 'Backend Scanning',       color: '#EAB308', bg: 'rgba(234,179,8,0.1)',   desc: 'Automated scans detect risks, phishing, and vulnerabilities.' },
            { n: '3', icon: Cpu,    title: 'GenLayer Intelligent\nEvaluation', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', desc: 'GenLayer evaluates projects across multiple dimensions for trust.' },
            { n: '4', icon: Users,  title: 'Community Feedback',     color: '#16A34A', bg: 'rgba(22,163,74,0.1)',   desc: 'Community reviews and feedback help improve trust over time.' },
          ].map(({ n, icon: Icon, title, color, bg, desc }, i) => (
            <div key={n} style={{ padding: '24px 20px', textAlign: 'center', position: 'relative' }}>
              {/* Dotted connector */}
              {i < 3 && (
                <div style={{ position: 'absolute', top: 36, right: -10, zIndex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                  {[...Array(4)].map((_, d) => <div key={d} style={{ width: 4, height: 2, borderRadius: 1, background: 'var(--border-hi)' }} />)}
                  <ArrowRight size={12} color="var(--text-3)" />
                </div>
              )}
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: bg, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', position: 'relative', zIndex: 2 }}>
                <span style={{ fontWeight: 800, fontSize: 16, color }}>{n}</span>
              </div>
              <Icon size={22} color={color} style={{ marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-1)', marginBottom: 6, whiteSpace: 'pre-line' }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY GENSCOUT + AI EVALUATION side by side ── */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Why GenScout */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '28px' }}>
            <h3 style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text-1)', marginBottom: 10 }}>Why GenScout?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.78, marginBottom: 20 }}>
              GenScout ensures transparency, security, and community trust so you can discover and support the best Web3 projects with confidence.
            </p>
            <Link href="/explore" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', borderRadius: 8 }}>
              Explore Projects <ArrowRight size={13} />
            </Link>
          </div>

          {/* Live AI Evaluation */}
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text-1)', marginBottom: 10 }}>Live AI Evaluation</h3>
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 14 }}>
              Exactly what happens when a project is submitted — scanner sends raw signals to GenLayer validators, consensus reached on-chain.
            </p>
            <AIScanner />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section>
        <div style={{
          background: 'var(--cta-bg)',
          borderRadius: 16, padding: '36px 44px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 20,
        }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--cta-text)', marginBottom: 6 }}>Have a project to share?</h2>
            <p style={{ fontSize: 14, color: 'var(--cta-sub)', lineHeight: 1.6 }}>Free AI evaluation. Runs automatically on GenLayer consensus.</p>
          </div>
          <Link href="/submit" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 24px', background: 'var(--brand)', color: '#fff',
            fontWeight: 700, fontSize: 14, textDecoration: 'none', borderRadius: 10,
            boxShadow: '0 4px 16px rgba(232,99,10,0.4)',
          }}>
            Submit Your Project <ArrowRight size={15} />
          </Link>
        </div>
      </section>

    </div>
  )
}
