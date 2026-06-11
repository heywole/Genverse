'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  projectDetailsPanel: React.ReactNode
  aiEvaluationPanel:   React.ReactNode
  builderId: string
}

export function ProjectTabs({ projectDetailsPanel, aiEvaluationPanel, builderId }: Props) {
  const router = useRouter()
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
    { key: 'builder' as const, label: 'Builder Profile'  },
  ]

  function handleTabClick(key: 'details' | 'ai' | 'builder') {
    if (key === 'builder') {
      // Navigate to builder profile page — no sign-in required
      router.push(`/profile?builder=${builderId}`)
      return
    }
    setTab(key)
  }

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => handleTabClick(key)} style={{
            padding: '10px 22px', border: 'none', cursor: 'pointer',
            background: 'transparent', fontSize: 13,
            fontWeight: (tab === key && key !== 'builder') ? 700 : 500,
            color: (tab === key && key !== 'builder') ? 'var(--text-1)' : 'var(--text-3)',
            borderBottom: (tab === key && key !== 'builder') ? '2px solid var(--brand)' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.12s', fontFamily: 'var(--font-sans)',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'details' && <div>{projectDetailsPanel}</div>}
      {tab === 'ai'      && <div>{aiEvaluationPanel}</div>}
    </div>
  )
}
