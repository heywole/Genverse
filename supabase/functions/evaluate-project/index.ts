// @ts-nocheck
// Supabase Edge Function — GenRadar project evaluator
// Deploy: supabase functions deploy evaluate-project
// Triggered by: Database webhook on projects table
//   Condition: NEW.evaluation_status = 'pending'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GENLAYER_KEY     = Deno.env.get('GENLAYER_PRIVATE_KEY')!
const GENLAYER_NET     = Deno.env.get('GENLAYER_NETWORK') || 'studionet'
const CONTRACT_ADDR    = Deno.env.get('GENLAYER_CONTRACT_ADDRESS')!
const GOOGLE_SB_KEY    = Deno.env.get('GOOGLE_SAFE_BROWSING_KEY') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Scanner ───────────────────────────────────────────────────────────────────
async function scan(project: any): Promise<Record<string, any>> {
  const signals: Record<string, any> = {
    goplus_flagged:         false,
    safe_browsing_flagged:  false,
    scamsniffer_flagged:    false,
    phishing_detected:      false,
    unsafe_wallet_behavior: false,
    has_honeypot_patterns:  false,
    suspicious_scripts:     false,
    ssl_valid:              true,
    website_unreachable:    false,
    has_github:             !!(project.github_url),
    has_twitter:            !!(project.twitter_url),
    has_telegram:           !!(project.telegram_url),
    has_discord:            !!(project.discord_url),
    has_docs:               !!(project.docs_url),
    github_summary:         '',
    website_preview:        '',
    domain_age_days:        null,
    recently_active:        false,
    hidden_redirects:       false,
    redirect_chain_length:  0,
    external_script_count:  0,
    wallet_present:         false,
  }

  const url = project.website_url
  if (!url) return signals

  const domain = url.replace(/^https?:\/\//, '').split('/')[0]

  // ── GoPlus check ─────────────────────────────────────────────────────────
  try {
    const res = await fetch(
      `https://api.gopluslabs.io/api/v1/phishing_site?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (res.ok) {
      const d = await res.json()
      // GoPlus returns phishing_site: '1' or 1 when flagged
      const flagged = d?.result?.phishing_site === '1' ||
                      d?.result?.phishing_site === 1 ||
                      Number(d?.result?.phishing_site) === 1
      if (flagged) {
        signals.goplus_flagged    = true
        signals.phishing_detected = true
      }
    }
  } catch {}

  // ── Google Safe Browsing ──────────────────────────────────────────────────
  if (GOOGLE_SB_KEY) {
    try {
      const res = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SB_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client: { clientId: 'genradar', clientVersion: '1.0' },
            threatInfo: {
              threatTypes:      ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
              platformTypes:    ['ANY_PLATFORM'],
              threatEntryTypes: ['URL'],
              threatEntries:    [{ url }],
            },
          }),
          signal: AbortSignal.timeout(8000),
        }
      )
      if (res.ok) {
        const d = await res.json()
        if (d?.matches?.length) {
          signals.safe_browsing_flagged = true
          signals.phishing_detected     = true
        }
      }
    } catch {}
  }

  // ── ScamSniffer blacklist ─────────────────────────────────────────────────
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/scamsniffer/scam-database/main/blacklist/domains.json',
      { signal: AbortSignal.timeout(8000) }
    )
    if (res.ok) {
      const list: string[] = await res.json()
      const flagged = list.some(d => typeof d === 'string' && (d === domain || domain.endsWith('.' + d)))
      if (flagged) {
        signals.scamsniffer_flagged = true
        signals.phishing_detected   = true
      }
    }
  } catch {}

  // ── Fetch website HTML ────────────────────────────────────────────────────
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 GenRadarBot/1.0' },
      signal: AbortSignal.timeout(12000),
    })
    signals.ssl_valid = url.startsWith('https')
    const html = await res.text()
    const lhtml = html.toLowerCase()

    // Plain-text preview (strip tags)
    signals.website_preview = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300)

    // Wallet patterns
    const walletPatterns = ['window.ethereum', 'connectwallet', 'connect wallet', 'wagmi',
      'web3modal', 'metamask', 'walletconnect', 'rainbowkit', 'coinbase wallet']
    signals.wallet_present = walletPatterns.some(p => lhtml.includes(p))

    // Unsafe wallet
    const unsafePatterns = [/approve\s*\(\s*[^)]*0xffffffff/i, /eth_sign\b/i,
      /setApprovalForAll.*true/i, /permit\s*\(.*deadline.*\d{10,}/i]
    signals.unsafe_wallet_behavior = signals.wallet_present && unsafePatterns.some(p => p.test(html))

    // Honeypot patterns
    const honeypotPatterns = [/you.*won.*\$[\d,]+/i, /unclaimed.*reward/i,
      /your.*wallet.*eligible/i, /gas.*fee.*only/i, /send.*bnb.*receive.*back/i]
    signals.has_honeypot_patterns = honeypotPatterns.some(p => p.test(html))

    // Obfuscated scripts
    const obfuscatedPatterns = [/eval\s*\(\s*atob\s*\(/i, /eval\s*\(\s*function\s*\(p,a,c,k,e,d\)/i,
      /String\.fromCharCode\([0-9,\s]{50,}\)/i, /document\.write\s*\(\s*unescape\s*\(/i]
    signals.suspicious_scripts = obfuscatedPatterns.some(p => p.test(html))

    // Phishing HTML patterns (only if not already flagged by databases)
    if (!signals.phishing_detected) {
      const phishingPatterns = [/enter.*private.*key/i, /enter.*seed.*phrase/i,
        /enter.*mnemonic/i, /wallet.*sync.*required/i, /wallet.*validation.*required/i]
      signals.phishing_detected = phishingPatterns.some(p => p.test(html))
    }

    // Hidden redirects
    const noScriptHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    signals.hidden_redirects = /meta.*http-equiv.*refresh.*content.*0\s*;/i.test(noScriptHtml)

  } catch {
    signals.website_unreachable = true
    signals.ssl_valid = false
  }

  // ── GitHub check ──────────────────────────────────────────────────────────
  if (project.github_url && project.github_url.startsWith('http')) {
    try {
      const match = project.github_url.match(/github\.com\/([^/]+)\/([^/?#\s]+)/)
      if (match) {
        const [, owner, repo] = match
        const cleanRepo = repo.replace(/\.git$/, '')
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${cleanRepo}`,
          { headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'GenRadarBot' },
            signal: AbortSignal.timeout(8000) }
        )
        if (res.ok) {
          const data = await res.json()
          const daysSince = (Date.now() - new Date(data.pushed_at).getTime()) / 86400000
          signals.recently_active = daysSince < 180
          signals.github_summary  = [
            `Stars: ${data.stargazers_count}`,
            `Forks: ${data.forks_count}`,
            `Last push: ${Math.round(daysSince)} days ago`,
            `Language: ${data.language || 'unknown'}`,
            `License: ${data.license?.spdx_id || 'none'}`,
          ].join('. ')
        }
      }
    } catch {}
  }

  // ── Calculate pillar scores ───────────────────────────────────────────────
  const security_score = Math.min(100,
    (signals.goplus_flagged        ? 0 : 20) +
    (signals.safe_browsing_flagged ? 0 : 20) +
    (signals.scamsniffer_flagged   ? 0 : 20) +
    ((signals.unsafe_wallet_behavior || signals.phishing_detected) ? 0 : 15) +
    (signals.has_honeypot_patterns ? 0 : 10) +
    (signals.ssl_valid             ? 10 : 0) +
    (signals.suspicious_scripts    ? 0 : 5)
  )
  const transparency_score = Math.min(100,
    25 +
    (signals.has_github   ? 20 : 0) +
    (signals.has_docs     ? 20 : 0) +
    (signals.has_twitter  ? 15 : 0) +
    (signals.has_telegram ? 10 : 0) +
    (signals.has_discord  ? 10 : 0)
  )

  signals.security_score     = security_score
  signals.transparency_score = transparency_score

  console.log(`[scan] ${domain} sec=${security_score} tr=${transparency_score} phish=${signals.phishing_detected}`)
  return signals
}

// ── Build fallback score (no GenLayer consensus needed) ───────────────────────
function buildFallbackScore(signals: any, projectId: string) {
  const score = Math.round((signals.security_score + signals.transparency_score) / 2)
  const risk  = score >= 75 ? 'Low' : score >= 50 ? 'Medium' : 'High'

  const risks: string[] = []
  if (signals.goplus_flagged)          risks.push('Flagged by GoPlus phishing database')
  if (signals.safe_browsing_flagged)   risks.push('Flagged by Google Safe Browsing')
  if (signals.scamsniffer_flagged)     risks.push('Flagged by ScamSniffer blacklist')
  if (signals.phishing_detected)       risks.push('Phishing patterns detected in website')
  if (signals.unsafe_wallet_behavior)  risks.push('Unsafe wallet approval patterns detected')
  if (signals.has_honeypot_patterns)   risks.push('Honeypot/fake reward patterns detected')
  if (signals.suspicious_scripts)      risks.push('Obfuscated scripts detected')
  if (!signals.ssl_valid)              risks.push('No HTTPS/SSL certificate')
  if (!signals.has_github)             risks.push('No GitHub repository linked')
  if (!signals.has_docs)               risks.push('No documentation linked')
  if (!signals.has_twitter)            risks.push('No Twitter/X account linked')
  if (!signals.has_telegram)           risks.push('No Telegram community linked')
  if (!signals.has_discord)            risks.push('No Discord server linked')

  const positives: string[] = []
  if (!signals.goplus_flagged && !signals.safe_browsing_flagged && !signals.scamsniffer_flagged)
    positives.push('Not flagged by any threat database (GoPlus, Safe Browsing, ScamSniffer)')
  if (!signals.phishing_detected)      positives.push('No phishing patterns detected')
  if (!signals.unsafe_wallet_behavior) positives.push('No unsafe wallet patterns detected')
  if (!signals.has_honeypot_patterns)  positives.push('No honeypot patterns detected')
  if (!signals.suspicious_scripts)     positives.push('No obfuscated scripts detected')
  if (!signals.website_unreachable)    positives.push('Website is live and accessible')
  if (signals.ssl_valid)               positives.push('HTTPS/SSL certificate is valid')
  if (signals.has_github)              positives.push('Public GitHub repository linked')
  if (signals.recently_active)         positives.push('GitHub repository recently active')

  return {
    score,
    security_score:     signals.security_score,
    transparency_score: signals.transparency_score,
    risk,
    confidence: signals.website_unreachable ? 'Low' : (signals.has_github ? 'High' : 'Medium'),
    positives:  positives.slice(0, 5),
    risks:      risks.slice(0, 5),
    findings:   risks.slice(0, 5),
    explanation: `Scanner-only score. Security: ${signals.security_score}/100. Transparency: ${signals.transparency_score}/100.`,
    security_explanation:     `Security score ${signals.security_score}/100 based on threat database checks and HTML analysis.`,
    transparency_explanation: `Transparency score ${signals.transparency_score}/100 based on public presence and documentation.`,
    breakdown: { security: signals.security_score, transparency: signals.transparency_score },
    tx_hash: null,
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const body = await req.json()
    // Webhook sends { type, table, record, old_record }
    const record     = body.record ?? body
    const project_id = record.id

    if (!project_id) {
      console.error('[edge] No project_id in payload:', JSON.stringify(body))
      return new Response('No project_id', { status: 400 })
    }

    // Only process if evaluation_status is pending
    if (record.evaluation_status && record.evaluation_status !== 'pending') {
      console.log(`[edge] Skipping — evaluation_status=${record.evaluation_status}`)
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`[edge] Starting evaluation for project ${project_id}`)

    // Mark as processing immediately
    await supabase.from('projects')
      .update({ evaluation_status: 'processing' })
      .eq('id', project_id)

    // Fetch full project record
    const { data: project, error: fetchErr } = await supabase
      .from('projects').select('*').eq('id', project_id).single()

    if (fetchErr || !project) {
      console.error('[edge] Project not found:', fetchErr?.message)
      return new Response('Project not found', { status: 404 })
    }

    console.log(`[edge] Scanning ${project.name} (${project.website_url})...`)
    const signals = await scan(project)
    console.log(`[edge] Scan done. security=${signals.security_score} transparency=${signals.transparency_score}`)

    // Try GenLayer consensus — fall back to scanner score if it fails/times out
    let evalData: any = null
    let txHash: string | null = null

    if (GENLAYER_KEY && CONTRACT_ADDR) {
      try {
        const { createClient: glCreateClient } = await import('https://esm.sh/genlayer-js@0.9.3')
        const gl = glCreateClient({
          network: GENLAYER_NET as any,
          privateKey: GENLAYER_KEY as `0x${string}`,
        })

        console.log('[edge] Sending to GenLayer contract...')
        txHash = await gl.writeContract({
          address:      CONTRACT_ADDR as `0x${string}`,
          functionName: 'evaluate_project',
          args: [
            project_id,
            project.name            ?? '',
            project.description     ?? '',
            project.website_url     ?? '',
            project.github_url      ?? '',
            project.category        ?? '',
            JSON.stringify({
              website_unreachable:    signals.website_unreachable,
              phishing_detected:      signals.phishing_detected,
              suspicious_scripts:     signals.suspicious_scripts,
              wallet_present:         signals.wallet_present,
              unsafe_wallet_behavior: signals.unsafe_wallet_behavior,
              hidden_redirects:       signals.hidden_redirects,
              has_github:             signals.has_github,
              recently_active:        signals.recently_active,
              has_docs:               signals.has_docs,
              has_twitter:            signals.has_twitter,
              has_telegram:           signals.has_telegram,
              has_discord:            signals.has_discord,
              domain_age_days:        signals.domain_age_days,
              github_summary:         (signals.github_summary || '').slice(0, 200),
              website_preview:        (signals.website_preview || '').slice(0, 500),
              goplus_flagged:         signals.goplus_flagged,
              safe_browsing_flagged:  signals.safe_browsing_flagged,
              scamsniffer_flagged:    signals.scamsniffer_flagged,
              ssl_valid:              signals.ssl_valid,
              has_honeypot_patterns:  signals.has_honeypot_patterns,
            }),
          ],
        })

        console.log(`[edge] TX submitted: ${txHash}`)

        // Wait for consensus — up to 10 minutes (600 retries × 1s)
        const receipt = await gl.waitForTransactionReceipt({
          hash:     txHash,
          retries:  120,
          interval: 5000,
        })
        console.log('[edge] Consensus reached')

        // Read result from contract
        const raw = await gl.readContract({
          address:      CONTRACT_ADDR as `0x${string}`,
          functionName: 'get_evaluation',
          args:         [project_id],
        }) as string

        if (raw && raw !== '{}' && raw !== 'null' && raw.length > 5) {
          evalData = typeof raw === 'string' ? JSON.parse(raw) : raw
          console.log(`[edge] GenLayer result: score=${evalData.score}`)
        }
      } catch (glErr: any) {
        console.warn('[edge] GenLayer failed, using fallback:', glErr.message)
      }
    }

    // Build final score — GenLayer result or fallback
    const fallback = buildFallbackScore(signals, project_id)
    const final = {
      score:              evalData?.score              ?? fallback.score,
      security_score:     evalData?.security_score     ?? fallback.security_score,
      transparency_score: evalData?.transparency_score ?? fallback.transparency_score,
      risk:               evalData?.risk               ?? fallback.risk,
      confidence:         evalData?.confidence         ?? fallback.confidence,
      positives:          evalData?.positives          ?? fallback.positives,
      risks:              evalData?.risks              ?? fallback.risks,
      findings:           evalData?.findings           ?? fallback.findings,
      explanation:        evalData?.explanation        ?? fallback.explanation,
      security_explanation:     evalData?.security_explanation     ?? fallback.security_explanation,
      transparency_explanation: evalData?.transparency_explanation ?? fallback.transparency_explanation,
      breakdown:          evalData?.breakdown          ?? fallback.breakdown,
      tx_hash:            txHash,
    }

    // Save to DB — delete old score first, then insert fresh
    await supabase.from('ai_scores').delete().eq('project_id', project_id)
    await supabase.from('ai_scores').insert({
      project_id,
      score:                    final.score,
      security_score:           final.security_score,
      transparency_score:       final.transparency_score,
      risk:                     final.risk,
      confidence:               final.confidence,
      positives:                final.positives,
      risks:                    final.risks,
      findings:                 final.findings,
      explanation:              final.explanation,
      security_explanation:     final.security_explanation,
      transparency_explanation: final.transparency_explanation,
      breakdown:                final.breakdown,
      tx_hash:                  final.tx_hash,
      created_at:               new Date().toISOString(),
    })

    await supabase.from('projects')
      .update({ evaluation_status: 'completed' })
      .eq('id', project_id)

    console.log(`[edge] Done. project=${project_id} score=${final.score} tx=${txHash ?? 'fallback'}`)

    return new Response(JSON.stringify({ success: true, score: final.score, tx_hash: txHash }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('[edge] Fatal error:', err.message)
    // Try to mark project as failed
    try {
      const body = await req.clone().json().catch(() => ({}))
      const project_id = (body.record ?? body)?.id
      if (project_id) {
        await supabase.from('projects')
          .update({ evaluation_status: 'failed' })
          .eq('id', project_id)
      }
    } catch {}
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
