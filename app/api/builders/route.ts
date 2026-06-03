import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getBadge(totalProjects: number, avgScore: number | null): string {
  if (totalProjects >= 5 && avgScore !== null && avgScore >= 75) return 'Trusted Builder'
  if (totalProjects >= 5) return 'Established Builder'
  if (totalProjects >= 2) return 'Growing Builder'
  return 'New Builder'
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: profiles } = await supabase.from('builder_profiles').select('*')
  if (!profiles?.length) return NextResponse.json({ builders: [] })

  const userIds = profiles.map(p => p.user_id)

  const [{ data: projects }, { data: scores }] = await Promise.all([
    supabase.from('projects')
      .select('id, created_by, name, category, logo_url, website_url, github_url, twitter_url, created_at')
      .in('created_by', userIds).eq('status', 'active'),
    supabase.from('ai_scores').select('project_id, score'),
  ])

  const scoreMap: Record<string, number> = {}
  for (const s of scores ?? []) scoreMap[s.project_id] = Number(s.score)

  const projectsByUser: Record<string, any[]> = {}
  for (const p of projects ?? []) {
    if (!projectsByUser[p.created_by]) projectsByUser[p.created_by] = []
    projectsByUser[p.created_by].push({ ...p, score: scoreMap[p.id] ?? null })
  }

  const builders = profiles.map(profile => {
    const userProjects = projectsByUser[profile.user_id] ?? []
    const totalProjects = userProjects.length
    const scoredProjects = userProjects.filter((p: any) => p.score !== null)
    const avgScore = scoredProjects.length > 1
      ? Math.round(scoredProjects.reduce((a: number, p: any) => a + p.score, 0) / scoredProjects.length)
      : null
    const badge = getBadge(totalProjects, avgScore)
    return { user_id: profile.user_id, name: profile.name || 'Builder', avatar_url: profile.avatar_url, country: profile.country, twitter_url: profile.twitter_url, github_url: profile.github_url, bio: profile.bio, totalProjects, avgScore, badge }
  }).filter((b: any) => b.totalProjects > 0)

  builders.sort((a: any, b: any) => b.totalProjects - a.totalProjects)
  return NextResponse.json({ builders })
}
