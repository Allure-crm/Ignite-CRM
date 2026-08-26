import { useEffect, useMemo, useState, useCallback } from 'react'
import { store, loadUser, saveUser, isSupabase, loadUnlocked, saveUnlocked } from './lib/store'
import {
  mergedConfig,
  applyTransition,
  allowedTransitions,
  canCreateBriefs,
  canDeleteBriefs,
  withCsName,
  duplicateBrief,
  UNASSIGNED_EDITOR,
} from './lib/helpers'
import Sidebar from './components/Sidebar'
import Board from './components/Board'
import NewBriefModal from './components/NewBriefModal'
import BriefDetail from './components/BriefDetail'
import ActionDialog from './components/ActionDialog'
import ManageLists from './components/ManageLists'
import SwitchUser from './components/SwitchUser'
import Tracker from './components/Tracker'
import WeeklyIntake from './components/WeeklyIntake'
import Overview from './components/Overview'
import AccessGate from './components/AccessGate'
import BatchEditModal from './components/BatchEditModal'

export default function App() {
  const [briefs, setBriefs] = useState([])
  const [overrides, setOverrides] = useState({})
  const [intakes, setIntakes] = useState([])
  const [user, setUser] = useState(() => loadUser())
  const [unlocked, setUnlocked] = useState(() => loadUnlocked())
  const [view, setView] = useState(null) // status key | 'all' | 'launched'
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // {kind, ...}
  const [loaded, setLoaded] = useState(false)
  const [storeError, setStoreError] = useState('')

  const config = useMemo(() => mergedConfig(overrides), [overrides])

  const refresh = useCallback(() => {
    store.init().then(({ briefs, overrides, intakes }) => {
      setBriefs((briefs || []).map((b) => withCsName(b)))
      setOverrides(overrides)
      setIntakes(intakes || [])
      setStoreError('')
      setLoaded(true)
    }).catch((e) => {
      console.error(e)
      setStoreError(e.message || String(e))
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!unlocked) return
    refresh()
  }, [unlocked, refresh])
  useEffect(() => {
    if (!unlocked) return undefined
    return store.subscribe(refresh)
  }, [unlocked, refresh])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', config.accentColor)
    document.documentElement.style.setProperty('--accent2', config.accentColor2)
    document.title = `${config.brandName} ${config.brandTagline}`
  }, [config])

  // default view = first queue lane for the user's role
  useEffect(() => {
    if (user && !view) setView(config.roles[user.role]?.queue?.[0] || 'all')
  }, [user, view, config])

  const persist = async (action) => {
    try {
      await action()
      setStoreError('')
    } catch (e) {
      console.error(e)
      setStoreError(e.message || String(e))
      refresh()
    }
  }

  const upsert = async (brief) => {
    const next = withCsName(brief)
    const exists = briefs.some((b) => b.id === next.id)
    const all = exists ? briefs.map((b) => (b.id === next.id ? next : b)) : [...briefs, next]
    setBriefs(all)
    await persist(() => store.upsertBrief(next, all))
  }

  const upsertMany = async (updated) => {
    const map = new Map(updated.map((b) => [b.id, withCsName(b)]))
    const all = briefs.map((b) => map.get(b.id) || b)
    setBriefs(all)
    await persist(async () => {
      for (const brief of map.values()) await store.upsertBrief(brief, all)
    })
  }

  const rememberName = (kind, value) => {
    const name = String(value || '').trim()
    if (!name || name === UNASSIGNED_EDITOR) return
    const key = kind === 'editor' ? 'extraEditors' : kind === 'angle' ? 'extraAngles' : 'extraStrategists'
    const current = overrides[key] || config[key] || []
    if (current.some((v) => String(v).toLowerCase() === name.toLowerCase())) return
    if (kind === 'editor' && config.users.some((u) => u.role === 'video_editor' && u.name === name)) return
    if (kind === 'strategist' && config.users.some((u) => u.name === name)) return
    saveOverrides({ ...overrides, [key]: [...current, name] })
  }

  const duplicate = async (brief) => {
    await upsert(duplicateBrief(brief, { by: user.name, briefs }))
  }

  const removeBrief = async (id) => {
    const all = briefs.filter((b) => b.id !== id)
    setBriefs(all)
    await persist(() => store.deleteBrief(id, all))
    setModal(null)
  }

  const saveOverrides = async (next) => {
    setOverrides(next)
    await persist(() => store.saveOverrides(next))
  }

  const saveIntake = async (entry) => {
    const exists = intakes.some((e) => e.weekOf === entry.weekOf)
    const all = exists ? intakes.map((e) => (e.weekOf === entry.weekOf ? entry : e)) : [...intakes, entry]
    setIntakes(all)
    await persist(() => store.saveIntake(entry, all))
  }

  const runAction = (brief, transition) => {
    const allowed = allowedTransitions(config, brief.status, user?.role)
    if (!allowed.some((t) => t.to === transition.to && t.label === transition.label)) return
    if (transition.needsAssignment || transition.needsNote) {
      setModal({ kind: 'action', brief, transition })
    } else {
      upsert(applyTransition(brief, transition, { by: user.name }))
    }
  }

  const confirmAction = ({ brief, transition, note, assignTo }) => {
    upsert(applyTransition(brief, transition, { by: user.name, note, assignTo }))
    setModal(null)
  }

  if (!unlocked) {
    return (
      <AccessGate
        config={config}
        onUnlock={() => {
          saveUnlocked()
          setUnlocked(true)
        }}
      />
    )
  }

  if (!loaded) return <div className="empty-state"><h3>Loading…</h3></div>

  if (!user) {
    return (
      <>
        {storeError && (
          <div className="empty-state">
            <h3>Could not load from Supabase</h3>
            <p>{storeError}</p>
          </div>
        )}
        <SwitchUser
          config={config}
          onPick={(u) => { saveUser(u); setUser(u); setView(null) }}
        />
      </>
    )
  }

  return (
    <div className="app">
      <Sidebar
        config={config}
        user={user}
        view={view}
        briefs={briefs}
        onView={setView}
        onNewBrief={() => { if (canCreateBriefs(user.role)) setModal({ kind: 'new' }) }}
        onManageLists={() => setModal({ kind: 'lists' })}
        onSwitchUser={() => { saveUser(null); setUser(null) }}
        isSupabase={isSupabase}
        storeError={storeError}
      />
      {view === 'summary' ? (
        <Overview
          config={config}
          user={user}
          briefs={briefs}
          onOpen={(brief) => setModal({ kind: 'detail', briefId: brief.id })}
          onAction={runAction}
          onBatchEdit={(ids) => setModal({ kind: 'batch', ids: [...ids] })}
        />
      ) : view === 'tracker' ? (
        <div className="main">
          <div className="topbar">
            <div><h1>Creative Tracker</h1><div className="sub">{briefs.length} briefs</div></div>
          </div>
          <div className="content">
            <Tracker
              config={config}
              briefs={briefs}
              onOpen={(brief) => setModal({ kind: 'detail', briefId: brief.id })}
              onBatchEdit={(ids) => setModal({ kind: 'batch', ids: [...ids] })}
            />
          </div>
        </div>
      ) : view === 'intake' ? (
        <div className="main">
          <div className="topbar">
            <div><h1>Weekly Strategist Intake</h1><div className="sub">Monday check-in</div></div>
          </div>
          <div className="content">
            <WeeklyIntake user={user} intakes={intakes} onSave={saveIntake} />
          </div>
        </div>
      ) : (
        <Board
          config={config}
          user={user}
          view={view}
          briefs={briefs}
          search={search}
          onSearch={setSearch}
          onOpen={(brief) => setModal({ kind: 'detail', briefId: brief.id })}
          onAction={runAction}
        />
      )}

      {modal?.kind === 'new' && canCreateBriefs(user.role) && (
        <NewBriefModal
          config={config}
          user={user}
          briefs={briefs}
          onClose={() => setModal(null)}
          onCreate={(brief) => { upsert(brief); setModal(null) }}
          onRememberName={rememberName}
        />
      )}
      {modal?.kind === 'detail' && (
        <BriefDetail
          config={config}
          user={user}
          brief={briefs.find((b) => b.id === modal.briefId)}
          briefs={briefs}
          onClose={() => setModal(null)}
          onSave={upsert}
          onDelete={(id) => { if (canDeleteBriefs(user.role)) removeBrief(id) }}
          onAction={runAction}
          onDuplicate={duplicate}
          onRememberName={rememberName}
        />
      )}
      {modal?.kind === 'action' && (
        <ActionDialog
          config={config}
          brief={modal.brief}
          transition={modal.transition}
          onClose={() => setModal(null)}
          onConfirm={confirmAction}
        />
      )}
      {modal?.kind === 'batch' && (
        <BatchEditModal
          config={config}
          briefs={briefs}
          selected={new Set(modal.ids)}
          user={user}
          onClose={() => setModal(null)}
          onApply={async (updated) => {
            await upsertMany(updated)
            setModal(null)
          }}
        />
      )}
      {modal?.kind === 'lists' && (
        <ManageLists
          config={config}
          overrides={overrides}
          onClose={() => setModal(null)}
          onSave={saveOverrides}
        />
      )}
    </div>
  )
}
