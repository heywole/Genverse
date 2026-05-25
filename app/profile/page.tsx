'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ProjectCard } from '@/components/ProjectCard'
import { Loader2, User, Bookmark, Eye, Flag, Package, X, Check, Clock } from 'lucide-react'
import type { Project } from '@/types'
import { PROJECT_CATEGORIES } from '@/types'

type Tab = 'submitted' | 'saved' | 'viewed' | 'reported'
interface DeleteRequest { project_id: string; scheduled_at: string; reason: string; name: string }

export default function ProfilePage() {
  const router = useRouter()
  const [user,         setUser]         = useState<any>(null)
  const [loading,      setLoading]      = useState(true)
  const [tab,          setTab]          = useState<Tab>('submitted')
  const [projects,     setProjects]     = useState<Project[]>([])
  const [fetching,     setFetching]     = useState(false)
  const [editProject,  setEditProject]  = useState<Project | null>(null)
  const [deleteModal,  setDeleteModal]  = useState<Project | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [delRequests,  setDelRequests]  = useState<DeleteRequest[]>([])
  const [saving,       setSaving]       = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', website_url: '', github_url: '', twitter_url: '', discord_url: '', docs_url: '', category: '' })
  const [builderProfile,     setBuilderProfile]     = useState<any>(null)
  const [showBuilderForm,    setShowBuilderForm]     = useState(false)
  const [builderForm,        setBuilderForm]         = useState({ bio: '', twitter_url: '', telegram_url: '', github_url: '', discord_url: '', website_url: '', other_links: '' })
  const [savingBuilder,      setSavingBuilder]       = useState(false)
  const [builderSaved,       setBuilderSaved]        = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      setUser(session.user)
      setLoading(false)
    })
  }, [router])

  useEffect(() => {
    if (!user) return
    fetchProjects(tab)
    loadDeleteRequests()
    loadBuilderProfile()
  }, [tab, user])

  async function loadBuilderProfile() {
    if (!user) return
    const res = await fetch(`/api/builder-profile?user_id=${user.id}`)
    const data = await res.json()
    if (data.profile) {
      setBuilderProfile(data.profile)
      setBuilderForm({
        bio:          data.profile.bio          || '',
        twitter_url:  data.profile.twitter_url  || '',
        telegram_url: data.profile.telegram_url || '',
        github_url:   data.profile.github_url   || '',
        discord_url:  data.profile.discord_url  || '',
        website_url:  data.profile.website_url  || '',
        other_links:  data.profile.other_links  || '',
      })
    }
  }

  async function saveBuilderProfile() {
    if (!user) return
    setSavingBuilder(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch('/api/builder-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(builderForm),
    })
    setSavingBuilder(false)
    setBuilderSaved(true)
    setShowBuilderForm(false)
    loadBuilderProfile()
    setTimeout(() => setBuilderSaved(false), 3000)
  }

  function loadDeleteRequests() {
    try {
      const stored = localStorage.getItem(`del_${user?.id}`)
      if (stored) setDelRequests(JSON.parse(stored))
    } catch {}
  }

  function saveDeleteRequests(reqs: DeleteRequest[]) {
    setDelRequests(reqs)
    localStorage.setItem(`del_${user?.id}`, JSON.stringify(reqs))
  }

  const fetchProjects = useCallback(async (t: Tab) => {
    if (!user) return
    setFetching(true); setProjects([])
    try {
      if (t === 'submitted') {
        const { data } = await supabase
          .from('projects')
          .select('*, ai_scores(score,risk,confidence,positives,risks)')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
        setProjects(shape(data || []))
      } else {
        const map: Record<Tab, string> = { saved: 'save', viewed: 'view', reported: 'report', submitted: '' }
        const { data: ints } = await supabase.from('interactions').select('project_id').eq('user_id', user.id).eq('type', map[t])
        const ids = (ints || []).map((i: any) => i.project_id)
        if (!ids.length) { setFetching(false); return }
        const { data } = await supabase.from('projects').select('*, ai_scores(score,risk,confidence,positives,risks)').in('id', ids)
        setProjects(shape(data || []))
      }
    } catch (e) { console.error(e) }
    setFetching(false)
  }, [user])

  function shape(data: any[]): Project[] {
    return data.map(p => ({ ...p, ai_score: Array.isArray(p.ai_scores) ? p.ai_scores[0] ?? null : p.ai_scores ?? null, _count: { views: 0, saves: 0, reports: 0 } }))
  }

  function openEdit(p: Project) {
    setEditProject(p)
    setEditForm({ name: p.name || '', description: p.description || '', website_url: p.website_url || '', github_url: (p as any).github_url || '', twitter_url: (p as any).twitter_url || '', discord_url: (p as any).discord_url || '', docs_url: (p as any).docs_url || '', category: p.category || '' })
  }

  async function handleSaveEdit() {
    if (!editProject || !user) return
    setSaving(true)
    await supabase.from('projects').update({
      ...editForm,
      github_url:   editForm.github_url   || null,
      twitter_url:  editForm.twitter_url  || null,
      discord_url:  editForm.discord_url  || null,
      docs_url:     editForm.docs_url     || null,
      evaluation_status: 'pending',
    }).eq('id', editProject.id).eq('created_by', user.id)
    // Trigger re-evaluation after edit
    fetch('/api/re-evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: editProject.id }),
    }).catch(() => {})
    setSaving(false); setEditProject(null); fetchProjects('submitted')
  }

  function scheduleDelete(p: Project) {
    if (!deleteReason.trim()) return
    const reqs = [...delRequests.filter(r => r.project_id !== p.id), { project_id: p.id, name: p.name, scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), reason: deleteReason }]
    saveDeleteRequests(reqs); setDeleteModal(null); setDeleteReason('')
  }

  function cancelDelete(id: string) { saveDeleteRequests(delRequests.filter(r => r.project_id !== id)) }

  async function confirmDelete(id: string) {
    await supabase.from('projects').delete().eq('id', id).eq('created_by', user.id)
    cancelDelete(id); fetchProjects('submitted')
  }

  function countdown(at: string) {
    const ms = new Date(at).getTime() - Date.now()
    if (ms <= 0) return null
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-3)' }} /></div>

  const TABS = [
    { key: 'submitted' as Tab, label: 'Submitted', icon: Package  },
    { key: 'saved'     as Tab, label: 'Saved',     icon: Bookmark },
    { key: 'viewed'    as Tab, label: 'Viewed',    icon: Eye      },
    { key: 'reported'  as Tab, label: 'Reported',  icon: Flag     },
  ]

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-hi)', borderRadius: 6, color: 'var(--text-1)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none' }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px' }}>

      {/* Profile header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid var(--border-hi)' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          {user?.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} /> : <User size={22} color="var(--text-3)" />}
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 19, color: 'var(--text-1)', marginBottom: 3 }}>
            {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-hi)', marginBottom: 28 }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'transparent', color: tab === key ? 'var(--text-1)' : 'var(--text-3)', borderBottom: tab === key ? '2px solid var(--text-1)' : '2px solid transparent', fontWeight: tab === key ? 600 : 400 }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Pending deletions banner */}
      {delRequests.length > 0 && tab === 'submitted' && (
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: 'var(--red-bg)', border: '1px solid var(--red-bd)' }}>
          {delRequests.map(req => {
            const cd = countdown(req.scheduled_at)
            return (
              <div key={req.project_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--red)' }}>
                  <Clock size={13} />
                  <span><strong>{req.name}</strong> — {cd ? `Deleting in ${cd}` : 'Ready to delete'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!cd && (
                    <button onClick={() => confirmDelete(req.project_id)} style={{ padding: '4px 12px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      Confirm Delete
                    </button>
                  )}
                  <button onClick={() => cancelDelete(req.project_id)} style={{ padding: '4px 12px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border-hi)', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                    Cancel
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Builder Profile Section ── */}
      <div style={{ marginBottom: 24, padding: '20px', background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: builderProfile || showBuilderForm ? 16 : 0, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)', margin: 0, marginBottom: 2 }}>Builder Profile</h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Visible on your project pages under the Builder Profile tab</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {builderSaved && <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>✓ Saved</span>}
            {projects.length === 0 && !builderProfile ? (
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>Submit a project first</span>
            ) : (
              <button onClick={() => setShowBuilderForm(!showBuilderForm)} style={{
                padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-hi)',
                background: showBuilderForm ? 'var(--brand)' : 'transparent',
                color: showBuilderForm ? '#fff' : 'var(--text-1)',
                cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-sans)',
              }}>
                {builderProfile ? (showBuilderForm ? 'Cancel' : 'Edit Profile') : (showBuilderForm ? 'Cancel' : 'Create Builder Profile')}
              </button>
            )}
          </div>
        </div>

        {/* Builder profile form */}
        {showBuilderForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'bio',          label: 'Bio',          placeholder: 'Tell the community about yourself...', multi: true },
              { key: 'twitter_url',  label: 'X / Twitter',  placeholder: 'https://x.com/yourhandle' },
              { key: 'telegram_url', label: 'Telegram',     placeholder: 'https://t.me/yourhandle' },
              { key: 'github_url',   label: 'GitHub',       placeholder: 'https://github.com/yourname' },
              { key: 'discord_url',  label: 'Discord',      placeholder: 'https://discord.gg/yourserver' },
              { key: 'website_url',  label: 'Website',      placeholder: 'https://yourwebsite.com' },
              { key: 'other_links',  label: 'Other Details', placeholder: 'Any other info or links...' },
            ].map(({ key, label, placeholder, multi }) => (
              <div key={key}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 5, display: 'block' }}>{label}</label>
                {multi ? (
                  <textarea
                    value={(builderForm as any)[key]}
                    onChange={e => setBuilderForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder} rows={3}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-card)', border: '1.5px solid var(--border-hi)', borderRadius: 8, color: 'var(--text-1)', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
                  />
                ) : (
                  <input
                    type="text"
                    value={(builderForm as any)[key]}
                    onChange={e => setBuilderForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', height: 40, padding: '0 12px', background: 'var(--bg-card)', border: '1.5px solid var(--border-hi)', borderRadius: 8, color: 'var(--text-1)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            ))}
            <button onClick={saveBuilderProfile} disabled={savingBuilder} style={{
              padding: '10px', background: 'var(--brand)', color: '#fff', border: 'none',
              borderRadius: 8, cursor: savingBuilder ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-sans)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: savingBuilder ? 0.7 : 1,
            }}>
              {savingBuilder ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : 'Save Builder Profile'}
            </button>
          </div>
        )}

        {/* Show existing profile summary */}
        {builderProfile && !showBuilderForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {builderProfile.bio && <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{builderProfile.bio}</p>}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {builderProfile.twitter_url  && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>✓ Twitter</span>}
              {builderProfile.github_url   && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>✓ GitHub</span>}
              {builderProfile.telegram_url && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>✓ Telegram</span>}
              {builderProfile.discord_url  && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>✓ Discord</span>}
              {builderProfile.website_url  && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>✓ Website</span>}
            </div>
          </div>
        )}
      </div>

      {/* Project grid */}
      {fetching ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-3)' }} /></div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', border: '1px solid var(--border-hi)', borderRadius: 8 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>No {tab} projects yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {projects.map(p => {
            const del = delRequests.find(r => r.project_id === p.id)
            return (
              <div key={p.id} style={{ position: 'relative', opacity: del ? 0.6 : 1 }}>
                <ProjectCard
                  project={p}
                  showEditControls={tab === 'submitted'}
                  onEdit={openEdit}
                  onDelete={p => setDeleteModal(p)}
                />
                {del && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: 'rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--red-bd)', borderRadius: 8, padding: '10px 16px', textAlign: 'center' }}>
                      <Clock size={14} color="var(--red)" style={{ marginBottom: 4 }} />
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>
                        {countdown(del.scheduled_at) ? `Deletes in ${countdown(del.scheduled_at)}` : 'Ready to delete'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hi)', borderRadius: 12, padding: '28px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 17, color: 'var(--text-1)' }}>Edit Project</h2>
              <button onClick={() => setEditProject(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {(['name','website_url','github_url','twitter_url','discord_url','docs_url'] as const).map(key => (
                <div key={key}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 5, display: 'block' }}>{key.replace(/_url$/, '').replace(/_/g, ' ')}</label>
                  <input value={(editForm as any)[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} style={inp} />
                </div>
              ))}
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 5, display: 'block' }}>Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={4} style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 5, display: 'block' }}>Category</label>
                <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  {PROJECT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setEditProject(null)} style={{ flex: 1, padding: '10px', border: '1px solid var(--border-hi)', background: 'transparent', color: 'var(--text-2)', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} style={{ flex: 1, padding: '10px', background: 'var(--text-1)', color: 'var(--bg)', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Check size={13} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hi)', borderRadius: 12, padding: '28px', width: '100%', maxWidth: 420 }}>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 17, color: 'var(--red)', marginBottom: 8 }}>Schedule Deletion</h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.6 }}>
              <strong>{deleteModal.name}</strong> will be permanently deleted after <strong>24 hours</strong>. You can cancel anytime during this period.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6, display: 'block' }}>Reason *</label>
              <textarea value={deleteReason} onChange={e => setDeleteReason(e.target.value)} placeholder="Why are you deleting this project?" rows={3} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-hi)', borderRadius: 6, color: 'var(--text-1)', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'var(--font-sans)' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setDeleteModal(null); setDeleteReason('') }} style={{ flex: 1, padding: '10px', border: '1px solid var(--border-hi)', background: 'transparent', color: 'var(--text-2)', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={() => scheduleDelete(deleteModal)} disabled={!deleteReason.trim()} style={{ flex: 1, padding: '10px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, cursor: !deleteReason.trim() ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: !deleteReason.trim() ? 0.6 : 1 }}>
                Schedule Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
