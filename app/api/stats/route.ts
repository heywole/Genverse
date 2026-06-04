import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )

    const [
      { count: projects },
      { count: evaluations },
      { count: interactions },
      { count: votes },
      { count: messages },
    ] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('ai_scores').select('*', { count: 'exact', head: true }),
      supabase.from('interactions').select('user_id', { count: 'exact', head: true }),
      supabase.from('votes').select('user_id', { count: 'exact', head: true }),
      supabase.from('messages').select('user_id', { count: 'exact', head: true }),
    ])

    // Try service role for exact auth.users count
    let users = 0
    try {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )
      const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
      users = data?.users?.length ?? 0
    } catch {
      // Fallback: estimate from distinct activity
      users = Math.max(interactions ?? 0, votes ?? 0, messages ?? 0, 1)
    }

    return NextResponse.json({
      users,
      projects: projects ?? 0,
      evaluations: evaluations ?? 0,
    })
  } catch (e: any) {
    return NextResponse.json({ users: 0, projects: 0, evaluations: 0 })
  }
}
