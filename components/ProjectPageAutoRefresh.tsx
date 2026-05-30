'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function ProjectPageAutoRefresh({ hasScore }: { hasScore: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (hasScore) return
    const id = setInterval(() => router.refresh(), 8000)
    return () => clearInterval(id)
  }, [hasScore, router])
  return null
}
