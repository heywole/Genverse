# v0.4.0 — Two-pillar scoring: Security + Transparency
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class ProjectEvaluator(gl.Contract):
    results: TreeMap[str, str]

    def __init__(self) -> None:
        self.results = TreeMap()

    @gl.public.write
    def evaluate_project(
        self,
        project_id:      str,
        name:            str,
        description:     str,
        website_url:     str,
        github_url:      str,
        category:        str,
        scanner_signals: str,
    ) -> None:

        signals = {}
        try:
            signals = json.loads(scanner_signals)
        except Exception:
            signals = {}

        # ── SECURITY SCORE (0–100) ────────────────────────────────────────────
        security = 0
        security_breakdown = {}

        goplus = bool(signals.get("goplus_flagged", False))
        sb     = bool(signals.get("safe_browsing_flagged", False))
        scam   = bool(signals.get("scamsniffer_flagged", False))

        gp_pts = 0 if goplus else 20
        sb_pts = 0 if sb     else 20
        sc_pts = 0 if scam   else 20
        security_breakdown["goplus"]        = gp_pts
        security_breakdown["safe_browsing"] = sb_pts
        security_breakdown["scamsniffer"]   = sc_pts
        security += gp_pts + sb_pts + sc_pts

        phishing     = bool(signals.get("phishing_detected", False))
        wallet_bad   = bool(signals.get("unsafe_wallet_behavior", False))
        honeypot     = bool(signals.get("has_honeypot_patterns", False))
        bad_scripts  = bool(signals.get("suspicious_scripts", False))
        ssl          = bool(signals.get("ssl_valid", True))

        wallet_pts   = 0 if (wallet_bad or phishing) else 15
        honeypot_pts = 0 if honeypot   else 10
        ssl_pts      = 10 if ssl       else 0
        scripts_pts  = 0 if bad_scripts else 5
        security_breakdown["wallet_safe"]   = wallet_pts
        security_breakdown["no_honeypot"]   = honeypot_pts
        security_breakdown["ssl"]           = ssl_pts
        security_breakdown["clean_scripts"] = scripts_pts
        security += wallet_pts + honeypot_pts + ssl_pts + scripts_pts

        security = max(0, min(100, security))

        # ── TRANSPARENCY SCORE (0–100) ────────────────────────────────────────
        transparency = 0
        transparency_breakdown = {}

        has_github   = bool(signals.get("has_github",   False))
        has_docs     = bool(signals.get("has_docs",     False))
        has_twitter  = bool(signals.get("has_twitter",  False))
        has_telegram = bool(signals.get("has_telegram", False))
        has_discord  = bool(signals.get("has_discord",  False))

        web_pts  = 25
        gh_pts   = 20 if has_github   else 0
        doc_pts  = 20 if has_docs     else 0
        tw_pts   = 15 if has_twitter  else 0
        tg_pts   = 10 if has_telegram else 0
        dc_pts   = 10 if has_discord  else 0

        transparency_breakdown["website"]  = web_pts
        transparency_breakdown["github"]   = gh_pts
        transparency_breakdown["docs"]     = doc_pts
        transparency_breakdown["twitter"]  = tw_pts
        transparency_breakdown["telegram"] = tg_pts
        transparency_breakdown["discord"]  = dc_pts

        transparency += web_pts + gh_pts + doc_pts + tw_pts + tg_pts + dc_pts
        transparency = max(0, min(100, transparency))

        # ── FINAL SCORE ───────────────────────────────────────────────────────
        score = round((security + transparency) / 2)
        risk  = "Low" if score >= 75 else "Medium" if score >= 50 else "High"

        unreachable = bool(signals.get("website_unreachable", False))
        confidence  = "Low" if unreachable else ("High" if has_github else "Medium")

        # ── VERIFIED FACTS (plain English for AI) ────────────────────────────
        twitter_fact  = "CONFIRMED PRESENT" if has_twitter  else "NOT present"
        telegram_fact = "CONFIRMED PRESENT" if has_telegram else "NOT present"
        discord_fact  = "CONFIRMED PRESENT" if has_discord  else "NOT present"
        github_fact   = "CONFIRMED PRESENT" if has_github   else "NOT present"
        docs_fact     = "CONFIRMED PRESENT" if has_docs     else "NOT present"
        ssl_fact      = "VALID" if ssl else "INVALID or missing"
        goplus_fact   = "FLAGGED" if goplus else "CLEAN"
        sb_fact       = "FLAGGED" if sb     else "CLEAN"
        scam_fact     = "FLAGGED" if scam   else "CLEAN"
        wallet_fact   = "UNSAFE DETECTED" if (wallet_bad or phishing) else "SAFE"
        honeypot_fact = "DETECTED" if honeypot    else "NOT detected"
        scripts_fact  = "DETECTED" if bad_scripts else "CLEAN"

        github_summary = str(signals.get("github_summary", ""))
        site_preview   = str(signals.get("website_preview", ""))

        deductions = []
        if goplus:           deductions.append("Flagged by GoPlus database")
        if sb:               deductions.append("Flagged by Google Safe Browsing")
        if scam:             deductions.append("Flagged by ScamSniffer")
        if phishing:         deductions.append("Phishing patterns in HTML")
        if wallet_bad:       deductions.append("Unsafe wallet patterns detected")
        if honeypot:         deductions.append("Honeypot patterns detected")
        if bad_scripts:      deductions.append("Obfuscated scripts detected")
        if not ssl:          deductions.append("No SSL/HTTPS certificate")
        if not has_github:   deductions.append("No GitHub repository linked")
        if not has_docs:     deductions.append("No documentation linked")
        if not has_twitter:  deductions.append("No Twitter/X linked")
        if not has_telegram: deductions.append("No Telegram linked")
        if not has_discord:  deductions.append("No Discord linked")
        deduction_text = "; ".join(deductions) if deductions else "No issues found"

        # ── AI NARRATIVE ──────────────────────────────────────────────────────
        prompt = f"""You are a Web3 security analyst for GenRadar, a GenLayer-powered trust platform.

VERIFIED SCANNER DATA — these are confirmed facts from automated backend scans. You must treat every value below as ground truth and must not contradict any of them:

SECURITY CHECKS:
- GoPlus database: {goplus_fact}
- Google Safe Browsing: {sb_fact}
- ScamSniffer: {scam_fact}
- SSL/HTTPS certificate: {ssl_fact}
- Wallet behavior: {wallet_fact}
- Honeypot patterns: {honeypot_fact}
- Obfuscated scripts: {scripts_fact}

TRANSPARENCY CHECKS:
- Twitter/X account: {twitter_fact}
- Telegram community: {telegram_fact}
- Discord server: {discord_fact}
- GitHub repository: {github_fact}
- Documentation: {docs_fact}
- Website: CONFIRMED PRESENT

FINAL SCORES (already computed, do not change):
- Security Score: {security}/100
- Transparency Score: {transparency}/100
- Final Score: {score}/100
- Risk Level: {risk}

PROJECT DETAILS:
- Name: {name}
- Category: {category}
- Description: {description[:400]}
- Website: {website_url}
- GitHub URL: {github_url if github_url else "not provided"}
- GitHub details: {github_summary}
- Website preview: {site_preview[:300]}

STRICT WRITING RULES — violating any of these makes your response invalid:
1. If Twitter/X account is CONFIRMED PRESENT → you MUST list it as a positive. You MUST NOT say it is missing or unlinked.
2. If Telegram community is CONFIRMED PRESENT → you MUST list it as a positive. You MUST NOT say it is missing or unlinked.
3. If Discord server is CONFIRMED PRESENT → you MUST list it as a positive. You MUST NOT say it is missing or unlinked.
4. If GitHub repository is CONFIRMED PRESENT → you MUST list it as a positive. You MUST NOT say it is missing or unlinked.
5. If Documentation is CONFIRMED PRESENT → you MUST list it as a positive. You MUST NOT say it is missing or unlinked.
6. Only list something as missing or a risk if it is explicitly marked NOT present or FLAGGED above.
7. Do not change any scores.
8. Write security_explanation and transparency_explanation separately.
9. Be specific, accurate, and base everything only on the verified data above.

Return ONLY valid JSON with no markdown or backticks:
{{"positives": ["..."], "risks": ["..."], "findings": ["..."], "explanation": "...", "security_explanation": "...", "transparency_explanation": "..."}}"""

        def run_node():
            result = gl.nondet.exec_prompt(prompt)
            result = result.strip()
            if "```" in result:
                for part in result.split("```"):
                    part = part.strip().lstrip("json").strip()
                    if part.startswith("{"):
                        result = part
                        break
            s = result.find("{")
            e = result.rfind("}") + 1
            if s >= 0 and e > s:
                result = result[s:e]
            return result

        try:
            consensus = gl.eq_principle.prompt_comparative(
                run_node,
                f"""Evaluate whether the narrative accurately reflects these verified scanner facts:
- Twitter/X: {twitter_fact}
- Telegram: {telegram_fact}
- Discord: {discord_fact}
- GitHub: {github_fact}
- Documentation: {docs_fact}
- GoPlus: {goplus_fact}
- Safe Browsing: {sb_fact}
- ScamSniffer: {scam_fact}
- SSL: {ssl_fact}
- Wallet: {wallet_fact}

A response is INVALID if it mentions any CONFIRMED PRESENT item as missing or unlinked.
A response is INVALID if it mentions any CLEAN item as flagged or risky.
A response is INVALID if it changes any score.
Choose the response that most accurately and completely reflects all verified facts above."""
            )
        except Exception:
            try:
                consensus = run_node()
            except Exception:
                consensus = json.dumps({
                    "positives": ["Website is accessible" if not unreachable else "Project submitted for review"],
                    "risks": deductions[:3] if deductions else ["Insufficient data"],
                    "findings": [deduction_text],
                    "explanation": f"Security: {security}/100. Transparency: {transparency}/100. Final: {score}/100.",
                    "security_explanation": f"Security score {security}/100 based on threat database checks and HTML analysis.",
                    "transparency_explanation": f"Transparency score {transparency}/100 based on public presence and documentation.",
                })

        try:
            data = json.loads(consensus)
        except Exception:
            data = {}

        output = {
            "score":                    score,
            "security_score":           security,
            "transparency_score":       transparency,
            "risk":                     risk,
            "confidence":               confidence,
            "positives":                list(data.get("positives", []))[:5],
            "risks":                    list(data.get("risks", deductions[:3]))[:5],
            "findings":                 list(data.get("findings", []))[:5],
            "explanation":              str(data.get("explanation", deduction_text)),
            "security_explanation":     str(data.get("security_explanation", "")),
            "transparency_explanation": str(data.get("transparency_explanation", "")),
            "breakdown": {
                "security":             security,
                "transparency":         transparency,
                "security_detail":      security_breakdown,
                "transparency_detail":  transparency_breakdown,
            },
        }

        self.results[project_id] = json.dumps(output)

    @gl.public.view
    def get_evaluation(self, project_id: str) -> str:
        if project_id in self.results:
            return self.results[project_id]
        return "{}"

    @gl.public.view
    def has_evaluation(self, project_id: str) -> bool:
        return project_id in self.results