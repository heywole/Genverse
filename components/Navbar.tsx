'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun, Plus, User, LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface Props { session: Session | null }

export function Navbar({ session: initialSession }: Props) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState<Session | null>(initialSession)
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    setMounted(true)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  return (
    <header style={{
      height: 64, borderBottom: '1px solid var(--border)',
      background: 'var(--bg)', position: 'fixed',
      top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14,
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
        {mounted && (
          <img src={isDark ? '/logo-dark.png' : '/logo-light.png'} alt="GenScout"
            style={{ height: 34, width: 'auto', objectFit: 'contain' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: 'var(--text-1)' }}>
          GenScout
        </span>
      </Link>

      <div style={{ flex: 1 }} />

      {/* Submit */}
      <Link href="/submit" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '0 18px', height: 40, borderRadius: 20,
        background: 'var(--brand)', color: '#fff',
        fontWeight: 700, fontSize: 13, textDecoration: 'none',
        whiteSpace: 'nowrap', flexShrink: 0,
        boxShadow: '0 2px 8px rgba(232,99,10,0.25)',
      }}>
        <Plus size={14} /> Submit Project
      </Link>

      {/* Theme */}
      {mounted && (
        <button onClick={() => setTheme(isDark ? 'light' : 'dark')} style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '1px solid var(--border-hi)',
          background: 'var(--bg-secondary)', color: 'var(--text-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}>
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      )}

      {/* Profile / Sign In */}
      {mounted && (
        session ? (
          <Link href="/profile" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 40, padding: '0 14px', borderRadius: 20,
            border: '1px solid var(--border-hi)',
            background: 'var(--bg-secondary)', color: 'var(--text-2)',
            textDecoration: 'none', flexShrink: 0, fontSize: 13, fontWeight: 500,
            overflow: 'hidden',
          }}>
            {session.user?.user_metadata?.avatar_url
              ? <img src={session.user.user_metadata.avatar_url} alt="profile" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
              : <User size={14} />
            }
            <span>Profile</span>
          </Link>
        ) : (
          <Link href="/auth" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 40, padding: '0 16px', borderRadius: 20,
            border: '1px solid var(--border-hi)',
            background: 'var(--bg-secondary)', color: 'var(--text-1)',
            textDecoration: 'none', flexShrink: 0, fontSize: 13, fontWeight: 600,
          }}>
            <LogIn size={14} /> Sign In
          </Link>
        )
      )}
    </header>
  )
}
