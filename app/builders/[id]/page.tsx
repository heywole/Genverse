'use client'

import { useRouter } from 'next/navigation'
import { BuilderProfile } from '@/components/BuilderProfile'

export default function PublicBuilderPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 80px' }}>
      <button
        onClick={() => router.back()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, fontFamily: 'var(--font-mono)' }}
      >
        ← back
      </button>
      <BuilderProfile builderId={params.id} />
    </div>
  )
}
