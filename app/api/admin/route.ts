import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = ['wolegold247@gmail.com']

async function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (!auth) return null
  const token = auth.replace('Bearer ', '')
  // Use anon key with user token to verify identity
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) return null
  return user
}

function getServiceClient() {
  // Use service role key for admin data access — bypasses RLS
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()

  const [
    { data: projects },
    { data: scores },
    { data: profiles },
    { data: messages },
  ] = await Promise.all([
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('ai_scores').select('*').order('created_at', { ascending: false }),
    supabase.from('builder_profiles').select('user_id'),
    supabase.from('messages').select('id').limit(1000),
  ])

  const scoreMap: Record<string, any> = {}
  for (const s of scores ?? []) {
    if (!scoreMap[s.project_id]) scoreMap[s.project_id] = s
  }

  const projectsWithScores = (projects ?? []).map(p => ({
    ...p,
    ai_score: scoreMap[p.id] ?? null,
  }))

  const active = projectsWithScores.filter(p => p.status === 'active')
  const evaluated = active.filter(p => p.ai_score)
  const stuck = active.filter(p => !p.ai_score)
  const avgScore = evaluated.length
    ? Math.round(evaluated.reduce((a, p) => a + Number(p.ai_score.score), 0) / evaluated.length)
    : null

  return NextResponse.json({
    projects: projectsWithScores,
    stats: {
      totalProjects: active.length,
      totalEvaluated: evaluated.length,
      totalStuck: stuck.length,
      totalUsers: profiles?.length ?? 0,
      totalMessages: messages?.length ?? 0,
      avgScore,
    },
    recentScores: (scores ?? []).slice(0, 20),
  })
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, project_id } = await req.json()
  const supabase = getServiceClient()

  if (action === 'delete') {
    await Promise.all([
      supabase.from('ai_scores').delete().eq('project_id', project_id),
      supabase.from('messages').delete().eq('project_id', project_id),
      supabase.from('interactions').delete().eq('project_id', project_id),
      supabase.from('votes').delete().eq('project_id', project_id),
    ])
    const { error } = await supabase.from('projects').delete().eq('id', project_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'approve') {
    const { error } = await supabase.from('projects').update({ status: 'active' }).eq('id', project_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'reject') {
    const { error } = await supabase.from('projects').update({ status: 'rejected' }).eq('id', project_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 're-evaluate') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://genradar.vercel.app'
    try {
      const res = await fetch(`${baseUrl}/api/re-evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id }),
      })
      const data = await res.json()
      return NextResponse.json(data)
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
