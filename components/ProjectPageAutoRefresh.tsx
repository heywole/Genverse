'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isEvaluating } from '@/lib/evaluatingState'

export function ProjectPageAutoRefresh({ hasScore, projectId }: { hasScore: boolean; projectId?: string }) {
  const router = useRouter()

  useEffect(() => {
    // Case 1: no score yet — poll until we get one
    if (!hasScore) {
      const id = setInterval(() => router.refresh(), 8000)
      return () => clearInterval(id)
    }

    // Case 2: has a score but re-evaluation might be in progress
    // Check sessionStorage first (covers navigating to this page after triggering re-eval)
    let pollInterval: NodeJS.Timeout | null = null

    function startPolling() {
      if (pollInterval) return
      pollInterval = setInterval(() => router.refresh(), 8000)
    }

    function stopPolling() {
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null }
    }

    // If already marked as evaluating when this page loads
    if (projectId && isEvaluating(projectId)) {
      startPolling()
    }

    // Listen for re-evaluation starting while on this page
    function handleEvalStart(e: any) {
      if (!projectId || e.detail?.projectId !== projectId) return
      startPolling()
    }

    window.addEventListener('evaluation-started', handleEvalStart)
    return () => {
      stopPolling()
      window.removeEventListener('evaluation-started', handleEvalStart)
    }
  }, [hasScore, projectId, router])

  return null
}
