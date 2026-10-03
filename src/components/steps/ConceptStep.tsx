import { BERLIN_OPTIONS, DEFAULT_OPTIONS, type TableOptions } from '../../engine/rules'
import type { Character } from '../../engine/types'
import { Section, type StepProps } from '../ui'

const SETTINGS: { id: Character['setting']; name: string; blurb: string }[] = [
  { id: 'berlin', name: 'Berlin', blurb: 'Berlin City Edition: the Flux State, Kieze, corp sectors. Unlocks Berlin qualities.' },
  { id: 'seattle', name: 'Seattle', blurb: 'Seattle City Edition. Unlocks Seattle qualities.' },
  { id: 'core', name: 'Core only', blurb: 'Sixth World core rulebook content only.' },
]

export function ConceptStep({ c, set }: StepProps) {
  const field = (k: 'name' | 'alias' | 'concept') => ({
    value: c[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(ch => ({ ...ch, [k]: e.target.value })),
  })
  const setOpt = (patch: Partial<TableOptions>) => set(ch => ({ ...ch, options: { ...ch.options, ...patch } }))

  return (
    <div className="stack">
      <Section title="Who are you on the street?">
        <div className="form-grid">
          <label><span className="dim small">Street name</span><input type="text" placeholder="e.g. Kassette" {...field('alias')} /></label>
          <label><span className="dim small">Real name</span><input type="text" placeholder="Optional" {...field('name')} /></label>
          <label className="span-2"><span className="dim small">Concept</span><input type="text" placeholder="e.g. Ork street samurai from Kreuzberg who owes the Vory" {...field('concept')} /></label>
          <label className="span-2">
            <span className="dim small">Notes & backstory</span>
            <textarea rows={5} value={c.notes} onChange={e => set(ch => ({ ...ch, notes: e.target.value }))} />
          </label>
        </div>
      </Section>

      <Section title="Campaign setting">
        <div className="choice-grid">
          {SETTINGS.map(s => (
            <button
              type="button"
              key={s.id}
              className={`choice ${c.setting === s.id ? 'selected' : ''}`}
              aria-pressed={c.setting === s.id}
              onClick={() => set(ch => ({ ...ch, setting: s.id }))}
            >
              <strong>{s.name}</strong>
              <span className="small dim">{s.blurb}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section
        title="Table rules"
        aside={
          <span className="row">
            <button type="button" className="small" onClick={() => setOpt(BERLIN_OPTIONS)}>Berlin printing defaults</button>
            <button type="button" className="small" onClick={() => setOpt(DEFAULT_OPTIONS)}>English core defaults</button>
          </span>
        }
      >
        <p className="small dim">These rules differ between printings and errata. Check with your GM.</p>
        <div className="stack">
          <label className="row">
            <span>Maximum Availability at creation</span>
            <select value={c.options.maxAvailability} onChange={e => setOpt({ maxAvailability: Number(e.target.value) as 6 | 7 })}>
              <option value={6}>6 (English core / Seattle)</option>
              <option value={7}>7 (German 3rd printing / Berlin)</option>
            </select>
          </label>
          <label className="row">
            <input type="checkbox" checked={c.options.karmaSpellsAtCreation} onChange={e => setOpt({ karmaSpellsAtCreation: e.target.checked })} />
            <span>Allow buying extra spells and complex forms with karma at creation (5 karma each)</span>
          </label>
          <label className="row">
            <input type="checkbox" checked={c.options.karmaForContacts} onChange={e => setOpt({ karmaForContacts: e.target.checked })} />
            <span>Contact points beyond Charisma × 6 cost 1 karma each (Sixth World Companion)</span>
          </label>
        </div>
      </Section>
    </div>
  )
}
