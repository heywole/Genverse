# v0.3.0
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

        # ── SCORING ──────────────────────────────────────────────────────────
        score      = 100
        deductions = []

        # Threat database flags (heaviest penalties)
        if bool(signals.get("goplus_flagged", False)):
            score -= 30
            deductions.append("Flagged by GoPlus security database (-30)")

        if bool(signals.get("safe_browsing_flagged", False)):
            score -= 30
            deductions.append("Flagged by Google Safe Browsing (-30)")

        if bool(signals.get("scamsniffer_flagged", False)):
            score -= 30
            deductions.append("Flagged by ScamSniffer phishing database (-30)")

        # Security penalties
        if bool(signals.get("phishing_detected", False)):
            score -= 25
            deductions.append("Phishing patterns detected in website code (-25)")

        if bool(signals.get("unsafe_wallet_behavior", False)):
            score -= 23
            deductions.append("Unsafe wallet approval patterns detected (-23)")

        if bool(signals.get("has_honeypot_patterns", False)):
            score -= 20
            deductions.append("Honeypot or fake reward patterns detected (-20)")

        if bool(signals.get("suspicious_scripts", False)):
            score -= 15
            deductions.append("Obfuscated or malicious scripts detected (-15)")

        if bool(signals.get("hidden_redirects", False)):
            score -= 10
            deductions.append("Hidden auto-redirects detected (-10)")

        if not bool(signals.get("ssl_valid", True)):
            score -= 8
            deductions.append("No HTTPS/SSL certificate (-8)")

        domain_age = signals.get("domain_age_days", None)
        if domain_age is not None:
            try:
                if int(domain_age) < 30:
                    score -= 5
                    deductions.append("Domain registered less than 30 days ago (-5)")
            except Exception:
                pass

        # Transparency penalties
        if not bool(signals.get("has_github", False)):
            score -= 10
            deductions.append("No public GitHub repository linked (-10)")

        if not bool(signals.get("has_docs", False)):
            score -= 5
            deductions.append("No documentation linked (-5)")

        # Community presence — use submitted URLs as ground truth
        if not bool(signals.get("has_twitter", False)):
            score -= 3
            deductions.append("No Twitter/X account linked (-3)")

        if not bool(signals.get("has_telegram", False)):
            score -= 3
            deductions.append("No Telegram community linked (-3)")

        if not bool(signals.get("has_discord", False)):
            score -= 3
            deductions.append("No Discord server linked (-3)")

        score      = max(0, min(100, score))
        risk       = "Low" if score >= 75 else "Medium" if score >= 50 else "High"
        unreachable = bool(signals.get("website_unreachable", False))
        has_github  = bool(signals.get("has_github", False))
        confidence  = "Low" if unreachable else ("High" if has_github else "Medium")

        deduction_summary = "; ".join(deductions) if deductions else "No deductions applied"
        github_summary    = str(signals.get("github_summary", ""))
        site_preview      = str(signals.get("website_preview", ""))

        # ── AI NARRATIVE ─────────────────────────────────────────────────────
        # AI writes ONLY the narrative text. Score is fixed above.
        has_twitter  = bool(signals.get("has_twitter", False))
        has_telegram = bool(signals.get("has_telegram", False))
        has_discord  = bool(signals.get("has_discord", False))
        has_docs     = bool(signals.get("has_docs", False))
        goplus       = bool(signals.get("goplus_flagged", False))
        sb           = bool(signals.get("safe_browsing_flagged", False))
        scam         = bool(signals.get("scamsniffer_flagged", False))
        phishing     = bool(signals.get("phishing_detected", False))
        wallet_safe  = not bool(signals.get("unsafe_wallet_behavior", False))
        no_scripts   = not bool(signals.get("suspicious_scripts", False))
        no_redirects = not bool(signals.get("hidden_redirects", False))
        ssl          = bool(signals.get("ssl_valid", True))
        honeypot     = bool(signals.get("has_honeypot_patterns", False))

        prompt = f"""You are a Web3 security analyst for GenVerse, a GenLayer-powered trust platform.

A backend scanner has analyzed this project using GoPlus, Google Safe Browsing, ScamSniffer,
deep HTML analysis, and GitHub verification. The score is FINAL at {score}/100.
Your ONLY job is to write accurate narrative text based on the exact scanner findings below.

PROJECT:
Name: {name}
Category: {category}
Description: {description[:400]}
Website: {website_url}
GitHub: {github_url if github_url else "not provided"}

EXACT SCANNER RESULTS (write narrative based ONLY on these facts):
- GoPlus flagged: {goplus}
- Google Safe Browsing flagged: {sb}
- ScamSniffer flagged: {scam}
- Phishing patterns in HTML: {phishing}
- Unsafe wallet behavior: {not wallet_safe}
- Honeypot patterns: {honeypot}
- Obfuscated scripts: {not no_scripts}
- Hidden redirects: {not no_redirects}
- SSL/HTTPS valid: {ssl}
- Website unreachable: {unreachable}
- GitHub repository confirmed: {has_github}
- GitHub details: {github_summary}
- Documentation linked: {has_docs}
- Twitter/X linked: {has_twitter}
- Telegram linked: {has_telegram}
- Discord linked: {has_discord}
- Website preview: {site_preview[:300]}

SCORE: {score}/100 | RISK: {risk}
DEDUCTIONS: {deduction_summary}

IMPORTANT RULES:
1. If has_twitter is True, do NOT mention missing Twitter. Same for telegram, discord, github, docs.
2. Only mention something as missing if its scanner value is False.
3. Write specific, accurate statements — not generic.
4. Do not suggest a different score.

Write 2-4 positives, 1-4 risks (only for what is actually False/flagged), findings, and explanation.

Return ONLY valid JSON, no markdown:
{{"positives": ["..."], "risks": ["..."], "findings": ["..."], "explanation": "..."}}"""

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
                "The narrative must accurately reflect scanner findings. Do not mention missing socials if they were provided."
            )
        except Exception:
            try:
                consensus = run_node()
            except Exception:
                consensus = json.dumps({
                    "positives": ["Website accessible" if not unreachable else "Project submitted for review"],
                    "risks":     deductions[:3] if deductions else ["Insufficient data for full analysis"],
                    "findings":  [deduction_summary],
                    "explanation": f"Score of {score}/100. {deduction_summary}",
                })

        try:
            data = json.loads(consensus)
        except Exception:
            data = {}

        output = {
            "score":      score,
            "risk":       risk,
            "confidence": confidence,
            "positives":  list(data.get("positives", []))[:5],
            "risks":      list(data.get("risks", deductions[:3]))[:5],
            "findings":   list(data.get("findings", []))[:5],
            "explanation": str(data.get("explanation", deduction_summary)),
            "breakdown": {
                "security":     max(0, 100
                    - (30 if goplus else 0)
                    - (30 if sb else 0)
                    - (25 if phishing else 0)
                    - (23 if not wallet_safe else 0)
                    - (15 if not no_scripts else 0)
                    - (10 if not no_redirects else 0)
                    - (8  if not ssl else 0)),
                "transparency": max(0, 100
                    - (10 if not has_github else 0)
                    - (5  if not has_docs   else 0)),
                "community": max(0, 100
                    - (3 if not has_twitter  else 0)
                    - (3 if not has_telegram else 0)
                    - (3 if not has_discord  else 0)),
            },
        }

        # Always overwrite — one result per project_id
        self.results[project_id] = json.dumps(output)

    @gl.public.view
    def get_evaluation(self, project_id: str) -> str:
        if project_id in self.results:
            return self.results[project_id]
        return "{}"

    @gl.public.view
    def has_evaluation(self, project_id: str) -> bool:
        return project_id in self.results
