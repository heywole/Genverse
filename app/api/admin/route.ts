import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Your user ID — only you can access admin
const ADMIN_EMAILS = ['wolegold247@gmail.com']

async function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (!auth) return null
  const token = auth.replace('Bearer ', '')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) return null
  return user
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const [
    { data: projects },
    { data: scores },
    { data: users },
    { data: messages },
  ] = await Promise.all([
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('ai_scores').select('*').order('created_at', { ascending: false }),
    supabase.from('builder_profiles').select('*'),
    supabase.from('messages').select('project_id').limit(1000),
  ])

  // Map latest score per project
  const scoreMap: Record<string, any> = {}
  for (const s of scores ?? []) {
    if (!scoreMap[s.project_id]) scoreMap[s.project_id] = s
  }

  const projectsWithScores = (projects ?? []).map(p => ({
    ...p,
    ai_score: scoreMap[p.id] ?? null,
  }))

  const stuck = projectsWithScores.filter(p => !p.ai_score && p.status === 'active')
  const evaluated = projectsWithScores.filter(p => p.ai_score)
  const avgScore = evaluated.length
    ? Math.round(evaluated.reduce((a, p) => a + Number(p.ai_score.score), 0) / evaluated.length)
    : null

  return NextResponse.json({
    projects: projectsWithScores,
    stats: {
      totalProjects: projects?.length ?? 0,
      totalEvaluated: evaluated.length,
      totalStuck: stuck.length,
      totalUsers: users?.length ?? 0,
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  if (action === 'delete') {
    await supabase.from('ai_scores').delete().eq('project_id', project_id)
    await supabase.from('messages').delete().eq('project_id', project_id)
    await supabase.from('interactions').delete().eq('project_id', project_id)
    await supabase.from('votes').delete().eq('project_id', project_id)
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
    // Trigger re-evaluation via the existing route
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/re-evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id }),
    })
    const data = await res.json()
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
