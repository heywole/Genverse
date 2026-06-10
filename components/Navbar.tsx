'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { Moon, Sun, Plus, User, LogIn, LogOut, Settings, ChevronDown, Menu, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'

interface Props { session: Session | null }

export function Navbar({ session: initialSession }: Props) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted,     setMounted]     = useState(false)
  const [session,     setSession]     = useState<Session | null>(initialSession)
  const [dropOpen,    setDropOpen]    = useState(false)
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [buildersMobileOpen, setBuildersMobileOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const dropRef  = useRef<HTMLDivElement>(null)
  const router   = useRouter()
  const pathname = usePathname()
  const isDark   = resolvedTheme === 'dark'

  useEffect(() => {
    setMounted(true)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s); setAvatarError(false)
    })
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => { subscription.unsubscribe(); document.removeEventListener('mousedown', handleClick) }
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  async function handleSignOut() {
    setDropOpen(false); setMobileOpen(false)
    await supabase.auth.signOut()
    router.push('/'); router.refresh()
  }

  const avatarUrl = session?.user?.user_metadata?.avatar_url
  const userName  = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Profile'

  return (
    <>
      <header style={{
        height: 64, borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)', position: 'fixed',
        top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
      }}>
        {/* Mobile hamburger — only shows on mobile via CSS */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            width: 38, height: 38, borderRadius: 10,
            border: '1px solid var(--border-hi)', background: 'var(--bg-secondary)',
            color: 'var(--text-2)', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            display: 'none', // hidden by default, shown on mobile via CSS
          }}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          {mounted ? (
            <img
              src={isDark ? '/logo-dark.svg' : '/logo-light.svg'}
              alt="GenRadar"
              style={{ height: 36, width: 'auto', objectFit: 'contain', display: 'block' }}
              onError={e => {
                const img = e.target as HTMLImageElement
                if (img.src.endsWith('.svg')) img.src = isDark ? '/logo-dark.png' : '/logo-light.png'
                else img.style.display = 'none'
              }}
            />
          ) : <div style={{ height: 36, width: 36 }} />}
          <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.04em', color: 'var(--text-1)' }}>
            GenRadar
          </span>
        </Link>

        <div style={{ flex: 1 }} />

        {/* Submit button */}
        <Link href="/submit" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '0 14px', height: 36, borderRadius: 20,
          background: 'var(--brand)', color: '#fff',
          fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          <Plus size={14} />
          <span className="hide-on-mobile">Submit Project</span>
        </Link>

        {/* Theme toggle */}
        {mounted && (
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')} style={{
            width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border-hi)',
            background: 'var(--bg-secondary)', color: 'var(--text-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            flexShrink: 0,
          }}>
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        )}

        {/* User / Sign In */}
        {mounted && (
          session ? (
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button onClick={() => setDropOpen(!dropOpen)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: 36, padding: '0 10px', borderRadius: 20,
                border: '1px solid var(--border-hi)', background: 'var(--bg-secondary)',
                color: 'var(--text-1)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', background: 'var(--brand-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {avatarUrl && !avatarError
                    ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setAvatarError(true)} />
                    : <User size={12} color="var(--brand)" />
                  }
                </div>
                <span className="hide-on-mobile" style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</span>
                <ChevronDown size={12} style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {dropOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  minWidth: 180, background: 'var(--bg-card)',
                  border: '1px solid var(--border-hi)', borderRadius: 12,
                  padding: '6px', zIndex: 200,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                }}>
                  <Link href="/profile" onClick={() => setDropOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
                    borderRadius: 8, fontSize: 13, color: 'var(--text-1)', textDecoration: 'none', fontWeight: 500,
                  }}>
                    <Settings size={14} color="var(--text-3)" /> My Profile
                  </Link>
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  <button onClick={handleSignOut} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 12px', borderRadius: 8, fontSize: 13,
                    color: 'var(--red)', border: 'none', background: 'transparent',
                    cursor: 'pointer', fontWeight: 500, textAlign: 'left',
                  }}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 36, padding: '0 14px', borderRadius: 20,
              border: '1px solid var(--border-hi)', background: 'var(--bg-secondary)',
              color: 'var(--text-1)', textDecoration: 'none', fontSize: 13, fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              <LogIn size={14} />
              <span className="hide-on-mobile">Sign In</span>
            </Link>
          )
        )}
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 90,
            background: 'rgba(0,0,0,0.5)',
            display: 'none', // shown via CSS on mobile
          }}
        />
      )}

      {/* Mobile drawer */}
      <nav
        className="mobile-drawer"
        style={{
          position: 'fixed', top: 64, left: 0, bottom: 0,
          width: 260, zIndex: 95,
          background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          flexDirection: 'column',
          overflowY: 'auto',
          display: 'none', // shown via CSS on mobile
        }}
      >
        <div style={{ padding: '12px 8px', flex: 1 }}>
          {[
            { href: '/', label: 'Home' },
            { href: '/explore', label: 'Explore' },
            { href: '/submit', label: 'Submit' },
            { href: '/resources', label: 'Resources' },
          ].map(({ href, label }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center',
                padding: '12px 16px', borderRadius: 10, marginBottom: 4,
                fontSize: 15, fontWeight: active ? 700 : 500,
                color: active ? 'var(--brand)' : 'var(--text-2)',
                background: active ? 'var(--brand-bg)' : 'transparent',
                textDecoration: 'none',
              }}>
                {label}
              </Link>
            )
          })}

          {/* Builders dropdown in mobile */}
          <div>
            <button onClick={() => setBuildersMobileOpen(o => !o)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 10, marginBottom: 4,
              fontSize: 15, fontWeight: pathname.startsWith('/builders') ? 700 : 500,
              color: pathname.startsWith('/builders') ? 'var(--brand)' : 'var(--text-2)',
              background: pathname.startsWith('/builders') ? 'var(--brand-bg)' : 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'left',
            }}>
              Builders
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: buildersMobileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {buildersMobileOpen && (
              <div style={{ paddingLeft: 28, marginBottom: 4 }}>
                <Link href="/builders" style={{ display: 'block', padding: '10px 16px', borderRadius: 8, fontSize: 14, color: pathname === '/builders' ? 'var(--brand)' : 'var(--text-3)', textDecoration: 'none', fontWeight: pathname === '/builders' ? 600 : 400 }}>
                  All Builders
                </Link>
                <Link href="/builders/leaderboard" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, fontSize: 14, color: pathname === '/builders/leaderboard' ? 'var(--brand)' : 'var(--text-3)', textDecoration: 'none', fontWeight: pathname === '/builders/leaderboard' ? 600 : 400 }}>
                  🏆 Leaderboard
                </Link>
              </div>
            )}
          </div>
        </div>
        {session && (
          <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
            <Link href="/profile" onClick={() => setMobileOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 10, fontSize: 14,
              color: 'var(--text-1)', border: '1px solid var(--border)',
              background: 'transparent', textDecoration: 'none', marginBottom: 8,
            }}>
              <User size={16} /> My Profile
            </Link>
            <button onClick={handleSignOut} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 10, fontSize: 14,
              color: 'var(--red)', border: '1px solid var(--border)',
              background: 'transparent', cursor: 'pointer', fontWeight: 500,
            }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        )}
      </nav>
    </>
  )
}
