'use client'

import { ProjectScorePanel } from '@/components/ProjectScorePanel'

interface Props {
  projectId:         string
  initialScore:      any
  initialEvalStatus?: string | null
}

export function ProjectScorePanelWrapper({ projectId, initialScore, initialEvalStatus }: Props) {
  return (
    <ProjectScorePanel
      projectId={projectId}
      initialScore={initialScore}
      initialEvalStatus={initialEvalStatus}
      onSeeMore={() => {
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'ai' } }))
      }}
    />
  )
}
