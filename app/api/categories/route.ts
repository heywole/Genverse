import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const BASE_CATEGORIES = [
  'Infra', 'AI', 'DeFi', 'Lending', 'Derivatives', 'Stable',
  'Payments', 'Wallet', 'Identity', 'Custody', 'Bridge',
  'DevTools', 'Analytics', 'Oracle', 'DAO', 'LaunchPad',
  'RWA', 'Game', 'NFT', 'Social', 'Prediction Market', 'Other'
]

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )
    const { data } = await supabase
      .from('custom_categories')
      .select('name')
      .order('created_at', { ascending: true })

    const custom = (data ?? []).map((r: any) => r.name)
    const all = [...BASE_CATEGORIES.filter(c => c !== 'Other'), ...custom, 'Other']
    return NextResponse.json({ categories: all })
  } catch {
    return NextResponse.json({ categories: BASE_CATEGORIES })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json()
    if (!name || name.length < 2 || name.length > 30) {
      return NextResponse.json({ error: 'Invalid category name' }, { status: 400 })
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )
    await supabase.from('custom_categories').upsert({ name: name.trim() }, { onConflict: 'name' })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
