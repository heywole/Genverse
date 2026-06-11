'use client'

import { ProjectScorePanel } from '@/components/ProjectScorePanel'

interface Props {
  projectId:    string
  initialScore: any
}

export function ProjectScorePanelWrapper({ projectId, initialScore }: Props) {
  return (
    <ProjectScorePanel
      projectId={projectId}
      initialScore={initialScore}
      onSeeMore={() => {
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'ai' } }))
      }}
    />
  )
}
