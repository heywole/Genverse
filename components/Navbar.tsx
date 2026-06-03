'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { Moon, Sun, Plus, User, LogIn, LogOut, Settings, ChevronDown, Menu, X, Home, Compass, PlusCircle, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'

interface Props { session: Session | null }

export function Navbar({ session: initialSession }: Props) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted,     setMounted]     = useState(false)
  const [session,     setSession]     = useState<Session | null>(initialSession)
  const [dropOpen,    setDropOpen]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
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

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  async function handleSignOut() {
    setDropOpen(false); setMobileOpen(false)
    await supabase.auth.signOut()
    router.push('/'); router.refresh()
  }

  const avatarUrl = session?.user?.user_metadata?.avatar_url
  const userName  = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Profile'

  const NAV = [
    { href: '/',          label: 'Home',      icon: Home },
    { href: '/explore',   label: 'Explore',   icon: Compass },
    { href: '/submit',    label: 'Submit',    icon: PlusCircle },
    { href: '/resources', label: 'Resources', icon: BookOpen },
  ]

  return (
    <>
      <header style={{
        height: 64, borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)', position: 'fixed',
        top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
      }}>
        {/* Mobile hamburger */}
        <button
          className="mobile-only"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            width: 38, height: 38, borderRadius: 10,
            border: '1px solid var(--border-hi)', background: 'var(--bg-secondary)',
            color: 'var(--text-2)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
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

        {/* Submit — hide label on small screens */}
        <Link href="/submit" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '0 14px', height: 36, borderRadius: 20,
          background: 'var(--brand)', color: '#fff',
          fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          <Plus size={14} />
          <span className="hide-mobile">Submit Project</span>
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
                <span className="hide-mobile" style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</span>
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
              <span className="hide-mobile">Sign In</span>
            </Link>
          )
        )}
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="mobile-only"
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 90,
            background: 'rgba(0,0,0,0.5)',
          }}
        />
      )}

      {/* Mobile drawer */}
      <div
        className="mobile-only"
        style={{
          position: 'fixed', top: 64, left: 0, bottom: 0,
          width: 260, zIndex: 95,
          background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 10, marginBottom: 4,
                fontSize: 15, fontWeight: active ? 700 : 500,
                color: active ? 'var(--brand)' : 'var(--text-2)',
                background: active ? 'var(--brand-bg)' : 'transparent',
                textDecoration: 'none',
              }}>
                <Icon size={18} style={{ color: active ? 'var(--brand)' : 'inherit' }} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Mobile sign out */}
        {session && (
          <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
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
      </div>
    </>
  )
}
