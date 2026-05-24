import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const project_id = searchParams.get('project_id')
  if (!project_id) return NextResponse.json({ error: 'Missing project_id' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )

  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', project_id)
    .order('created_at', { ascending: true })
    .limit(100)

  return NextResponse.json({ messages: data || [] })
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  )

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id, content } = await req.json()
  if (!project_id || !content?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 422 })
  }

  const { data } = await supabase.from('messages').insert({
    project_id,
    user_id:     user.id,
    user_name:   user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    user_avatar: user.user_metadata?.avatar_url || null,
    content:     content.trim().slice(0, 500),
  }).select().single()

  return NextResponse.json({ success: true, message: data })
}
