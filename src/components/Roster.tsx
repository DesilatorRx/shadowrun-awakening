import { useRef, useState } from 'react'
import { MAGIC_TYPE_NAMES, metatypeOf } from '../engine/calc'
import type { Character } from '../engine/types'
import { validate } from '../engine/validate'

export function Roster({ chars, onOpen, onCreate, onImport, onDelete, onDuplicate }: {
  chars: Character[]
  onOpen: (id: string) => void
  onCreate: (setting: Character['setting']) => void
  onImport: (c: Character) => void
  onDelete: (id: string) => void
  onDuplicate: (c: Character) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const importFile = async (file: File) => {
    setError('')
    try {
      const data = JSON.parse(await file.text())
      if (!data || typeof data !== 'object' || !data.priorities || !data.attributes) throw new Error('Not a character file')
      onImport(data as Character)
    } catch (e) {
      setError(`Couldn't import ${file.name}: ${(e as Error).message}`)
    }
  }

  return (
    <div className="roster">
      <header className="hero">
        <div className="hero-mark" aria-hidden>▲</div>
        <div>
          <h1>Shadowrun Awakening</h1>
          <p className="dim">A free, open-source Shadowrun Sixth World character generator, using the Berlin City Edition core rules (2023).</p>
        </div>
      </header>

      <section className="card">
        <h3>New runner</h3>
        <div className="row">
          <button type="button" className="primary" onClick={() => onCreate('berlin')}>New runner</button>
          <span className="small faint">or set in</span>
          <button type="button" className="ghost small" onClick={() => onCreate('seattle')}>Seattle</button>
          <button type="button" className="ghost small" onClick={() => onCreate('core')}>no city</button>
          <span className="spacer" />
          <button type="button" onClick={() => fileRef.current?.click()}>Import JSON…</button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = '' }}
          />
        </div>
        {error && <p className="bad small">{error}</p>}
      </section>

      <section>
        <h3>Your runners</h3>
        {chars.length === 0 && <p className="dim">No runners yet. They're saved in this browser; export JSON to back them up or share them.</p>}
        <div className="runner-grid">
          {chars.map(c => {
            const errs = validate(c).filter(i => i.severity === 'error').length
            return (
              <article key={c.id} className="card runner-card">
                <button type="button" className="runner-open" onClick={() => onOpen(c.id)}>
                  <strong>{c.alias || c.name || 'Unnamed runner'}</strong>
                  <span className="small dim">{metatypeOf(c).name} · {MAGIC_TYPE_NAMES[c.magicType]}</span>
                  <span className="small faint">{c.concept || '—'}</span>
                  <span className={`small ${errs ? 'warn' : 'good'}`}>{errs ? `${errs} issue${errs > 1 ? 's' : ''} left` : 'Ready to run'}</span>
                </button>
                <div className="row">
                  <span className="pill">{c.setting}</span>
                  <span className="spacer" />
                  <button type="button" className="ghost small" onClick={() => onDuplicate(c)}>Duplicate</button>
                  <button
                    type="button"
                    className="ghost danger small"
                    onClick={() => { if (confirm(`Delete ${c.alias || c.name || 'this runner'}? This can't be undone.`)) onDelete(c.id) }}
                  >Delete</button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <footer className="small faint footer">
        Unofficial fan tool. Shadowrun is a trademark of Topps Company, Inc.; this project is not affiliated with Catalyst Game Labs or Topps.
        No rules text is included. You'll need the rulebooks.
      </footer>
    </div>
  )
}
