import { BERLIN_2023_OPTIONS, ORIGINAL_2019_OPTIONS, type TableOptions } from '../../engine/rules'
import type { Character } from '../../engine/types'
import { Section, type StepProps } from '../ui'

const LEVELS: { id: NonNullable<TableOptions['powerLevel']>; name: string; blurb: string }[] = [
  { id: 'street', name: 'Street Level', blurb: 'Every priority pays the row below it (A gives B, … E stays E). Gritty, low-powered start.' },
  { id: 'standard', name: 'Standard', blurb: 'Normal priority values and 50 karma to customize.' },
  { id: 'prime', name: 'Prime Runner', blurb: 'Normal priorities with 100 karma to customize instead of 50.' },
]

const SETTINGS: { id: Character['setting']; name: string; blurb: string }[] = [
  { id: 'berlin', name: 'Berlin', blurb: 'The Flux State, Kieze, corp sectors. Unlocks Berlin qualities and contacts.' },
  { id: 'seattle', name: 'Seattle', blurb: 'Unlocks Seattle City Edition qualities.' },
  { id: 'core', name: 'No city', blurb: 'Core qualities only.' },
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

      <Section title="Level of play">
        <div className="choice-grid">
          {LEVELS.map(l => (
            <button
              type="button"
              key={l.id}
              className={`choice ${(c.options.powerLevel ?? 'standard') === l.id ? 'selected' : ''}`}
              aria-pressed={(c.options.powerLevel ?? 'standard') === l.id}
              onClick={() => setOpt({ powerLevel: l.id })}
            >
              <strong>{l.name}</strong>
              <span className="small dim">{l.blurb}</span>
            </button>
          ))}
        </div>
        <p className="small dim">Ask your GM which level the campaign uses (book p. 63).</p>
      </Section>

      <Section
        title="Table rules"
        aside={
          <span className="row">
            <button type="button" className="small" onClick={() => setOpt(BERLIN_2023_OPTIONS)}>Berlin 2023 defaults</button>
            <button type="button" className="small" onClick={() => setOpt(ORIGINAL_2019_OPTIONS)}>Original 2019 book</button>
          </span>
        }
      >
        <p className="small dim">
          Defaults follow the Berlin City Edition core rulebook (2023) as written. Change these only if your GM uses
          house rules or the original 2019 book.
        </p>
        <div className="stack">
          <label className="row">
            <span>Maximum Availability at creation</span>
            <select value={c.options.maxAvailability} onChange={e => setOpt({ maxAvailability: Number(e.target.value) as 6 | 7 })}>
              <option value={6}>6 (rules as written, p. 66)</option>
              <option value={7}>7 (house rule)</option>
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
