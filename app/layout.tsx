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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Navbar session={session} />
          {/* 
            Layout strategy:
            - Sidebar is position:fixed — it doesn't affect flow
            - We add a spacer div (sidebar-spacer) that takes the same width as the sidebar
            - On mobile, sidebar-spacer collapses to 0
          */}
          <div style={{ marginTop: 64, display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
            {/* Fixed sidebar (desktop only) */}
            <Sidebar session={session} />
            {/* Spacer that mirrors sidebar width on desktop, collapses on mobile */}
            <div className="sidebar-spacer" />
            {/* Main content area */}
            <div className="main-content">
              <main style={{ flex: 1 }}>{children}</main>
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
