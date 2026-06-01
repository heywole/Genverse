// Shared helper to track which project IDs are currently being re-evaluated.
// Uses sessionStorage so the state survives navigation within the same tab.

const KEY = 'gr_evaluating_ids'

function getIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function saveIds(ids: Set<string>) {
  try { sessionStorage.setItem(KEY, JSON.stringify([...ids])) } catch {}
}

export function markEvaluating(projectId: string) {
  const ids = getIds()
  ids.add(projectId)
  saveIds(ids)
  // Also fire a window event so cards already mounted react immediately
  window.dispatchEvent(new CustomEvent('evaluation-started', { detail: { projectId } }))
}

export function clearEvaluating(projectId: string) {
  const ids = getIds()
  ids.delete(projectId)
  saveIds(ids)
}

export function isEvaluating(projectId: string): boolean {
  return getIds().has(projectId)
}
