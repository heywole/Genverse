'use client'

import { useState, useEffect } from 'react'
import { BuilderProfile } from '@/components/BuilderProfile'

interface Props {
  projectDetailsPanel: React.ReactNode
  aiEvaluationPanel:   React.ReactNode
  builderId: string
}

export function ProjectTabs({ projectDetailsPanel, aiEvaluationPanel, builderId }: Props) {
  const [tab, setTab] = useState<'details' | 'ai' | 'builder'>('details')

  // Listen for "See full evaluation" button from score panel
  useEffect(() => {
    function handleSwitch(e: any) {
      if (e.detail?.tab) setTab(e.detail.tab)
    }
    window.addEventListener('switch-tab', handleSwitch)
    return () => window.removeEventListener('switch-tab', handleSwitch)
  }, [])

  const tabs = [
    { key: 'details' as const, label: 'Project Details' },
    { key: 'ai'      as const, label: 'AI Evaluation'   },
    { key: 'builder' as const, label: 'Builder Profile' },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '10px 22px', border: 'none', cursor: 'pointer',
            background: 'transparent', fontSize: 13, fontWeight: tab === key ? 700 : 500,
            color: tab === key ? 'var(--text-1)' : 'var(--text-3)',
            borderBottom: tab === key ? '2px solid var(--brand)' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.12s', fontFamily: 'var(--font-sans)',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content — Builder Profile renders inline, no sign-in required, no navigation */}
      {tab === 'details' && <div>{projectDetailsPanel}</div>}
      {tab === 'ai'      && <div>{aiEvaluationPanel}</div>}
      {tab === 'builder' && <BuilderProfile builderId={builderId} />}
    </div>
  )
}
