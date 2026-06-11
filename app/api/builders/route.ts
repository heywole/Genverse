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
  // Use service role so we can read auth.users metadata for real names
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: profiles } = await supabase.from('builder_profiles').select('*')
  if (!profiles?.length) return NextResponse.json({ builders: [] })

  const userIds = profiles.map(p => p.user_id)

  // Fetch auth users to get real names from GitHub OAuth metadata
  const { data: authData } = await supabase.auth.admin.listUsers()
  const authUsers: Record<string, any> = {}
  for (const u of authData?.users ?? []) {
    authUsers[u.id] = u
  }

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
    const authUser = authUsers[profile.user_id]

    // Real name: prefer builder_profiles.name → GitHub full_name → GitHub user_name → email prefix
    const realName =
      profile.name ||
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      authUser?.user_metadata?.user_name ||
      authUser?.user_metadata?.preferred_username ||
      authUser?.email?.split('@')[0] ||
      'Builder'

    // Avatar: prefer builder_profiles.avatar_url → GitHub avatar
    const avatarUrl =
      profile.avatar_url ||
      authUser?.user_metadata?.avatar_url ||
      authUser?.user_metadata?.picture ||
      null

    const userProjects    = projectsByUser[profile.user_id] ?? []
    const totalProjects   = userProjects.length
    const scoredProjects  = userProjects.filter((p: any) => p.score !== null && Number(p.score) > 0)
    const avgScore        = scoredProjects.length > 0
      ? Math.round(scoredProjects.reduce((a: number, p: any) => a + Number(p.score), 0) / scoredProjects.length)
      : null
    const badge = getBadge(totalProjects, avgScore)

    return {
      user_id:      profile.user_id,
      name:         realName,
      avatar_url:   avatarUrl,
      country:      profile.country   ?? null,
      twitter_url:  profile.twitter_url  ?? null,
      github_url:   profile.github_url   ?? null,
      bio:          profile.bio          ?? null,
      totalProjects,
      avgScore,
      badge,
    }
  }).filter((b: any) => b.totalProjects > 0)

  // Sort by: avg score desc, then total projects desc
  builders.sort((a: any, b: any) => {
    const as = a.avgScore ?? 0
    const bs = b.avgScore ?? 0
    if (bs !== as) return bs - as
    return b.totalProjects - a.totalProjects
  })

  return NextResponse.json({ builders })
}
