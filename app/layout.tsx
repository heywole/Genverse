import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { ThemeProvider }  from '@/components/ThemeProvider'
import { Navbar }         from '@/components/Navbar'
import { Sidebar }        from '@/components/Sidebar'
import { Footer }         from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'GenRadar',
  description: 'Community-driven discovery platform for GenLayer ecosystem projects. AI-evaluated. Community-rated.',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Navbar session={session} />
          <div style={{ marginTop: 64, display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
            <Sidebar session={session} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
              <main style={{ flex: 1, minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>{children}</main>
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
