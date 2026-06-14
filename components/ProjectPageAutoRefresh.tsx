'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function ProjectPageAutoRefresh({
  hasScore,
  projectId,
  evaluationStatus,
}: {
  hasScore: boolean
  projectId?: string
  evaluationStatus?: string | null
}) {
  const router      = useRouter()
  const statusRef   = useRef(evaluationStatus)
  statusRef.current = evaluationStatus

  useEffect(() => {
    // Poll whenever evaluation is not complete
    const shouldPoll = !hasScore ||
      evaluationStatus === 'processing' ||
      evaluationStatus === 'pending'

    if (!shouldPoll) return

    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [hasScore, evaluationStatus, router])

  return null
}
