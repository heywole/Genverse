import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { evaluateProject } from '@/lib/genlayerAI'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

function cleanRisks(risks: string[], project: any) {
  return risks.filter(risk => {
    const r = risk.toLowerCase()
    if (project.twitter_url  && (r.includes('twitter') || r.includes('x account'))) return false
    if (project.telegram_url && r.includes('telegram'))  return false
    if (project.discord_url  && r.includes('discord'))   return false
    if (project.github_url   && (r.includes('github') || r.includes('repository'))) return false
    if (project.docs_url     && (r.includes('docs') || r.includes('documentation'))) return false
    return true
  })
}

function cleanPositives(positives: string[], project: any) {
  const result = [...positives]
  if (project.twitter_url  && !result.some(p => p.toLowerCase().includes('twitter')))  result.push('Twitter/X account is linked')
  if (project.github_url   && !result.some(p => p.toLowerCase().includes('github')))   result.push('Public GitHub repository is linked')
  if (project.telegram_url && !result.some(p => p.toLowerCase().includes('telegram'))) result.push('Telegram community is linked')
  if (project.discord_url  && !result.some(p => p.toLowerCase().includes('discord')))  result.push('Discord server is linked')
  return result.slice(0, 5)
}

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Find one pending project to evaluate
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('evaluation_status', 'pending')
    .eq('status', 'active')
    .order('updated_at', { ascending: true })
    .limit(1)
    .single()

  if (!project) {
    return NextResponse.json({ message: 'No pending projects' })
  }

  console.log(`[cron] evaluating ${project.id} (${project.name})`)

  try {
    await supabase.from('projects').update({ evaluation_status: 'processing' }).eq('id', project.id)

    const aiScore = await evaluateProject({
      name:         project.name,
      description:  project.description,
      website_url:  project.website_url,
      github_url:   project.github_url   || '',
      twitter_url:  project.twitter_url  || '',
      discord_url:  project.discord_url  || '',
      docs_url:     project.docs_url     || '',
      telegram_url: project.telegram_url || '',
      category:     project.category,
    }, project.id)

    const cleanedRisks     = cleanRisks(aiScore.risks || [], project)
    const cleanedPositives = cleanPositives(aiScore.positives || [], project)

    await supabase.from('ai_scores').delete().eq('project_id', project.id)
    await supabase.from('ai_scores').insert({
      project_id:         project.id,
      score:              aiScore.score,
      risk:               aiScore.risk,
      confidence:         aiScore.confidence,
      positives:          cleanedPositives,
      risks:              cleanedRisks,
      findings:           aiScore.findings    || [],
      breakdown:          aiScore.breakdown   || null,
      explanation:        aiScore.explanation || null,
      tx_hash:            aiScore.tx_hash     || null,
      security_score:     aiScore.breakdown?.security     ?? null,
      transparency_score: aiScore.breakdown?.transparency ?? null,
      created_at:         new Date().toISOString(),
    })

    await supabase.from('projects').update({ evaluation_status: 'completed' }).eq('id', project.id)
    console.log(`[cron] done: ${project.id} score=${aiScore.score}`)
    return NextResponse.json({ success: true, project_id: project.id, score: aiScore.score })

  } catch (err: any) {
    console.error(`[cron] failed: ${project.id}`, err.message)
    await supabase.from('projects').update({ evaluation_status: 'failed' }).eq('id', project.id)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
