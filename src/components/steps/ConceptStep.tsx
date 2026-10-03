import { BERLIN_2023_OPTIONS, ORIGINAL_2019_OPTIONS, type TableOptions } from '../../engine/rules'
import type { Character } from '../../engine/types'
import { Section, type StepProps } from '../ui'

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
          Defaults follow the Berlin City Edition core rulebook (2023), which includes all errata. These are the rules that
          changed between printings. Adjust them if your table plays differently.
        </p>
        <div className="stack">
          <label className="row">
            <span>Maximum Availability at creation</span>
            <select value={c.options.maxAvailability} onChange={e => setOpt({ maxAvailability: Number(e.target.value) as 6 | 7 })}>
              <option value={7}>7 (Berlin 2023 / errata)</option>
              <option value={6}>6 (original 2019 book)</option>
            </select>
          </label>
          <label className="row">
            <input type="checkbox" checked={c.options.karmaSpellsAtCreation} onChange={e => setOpt({ karmaSpellsAtCreation: e.target.checked })} />
            <span>Allow buying extra spells and complex forms with karma at creation (5 karma each)</span>
          </label>
          <label className="row">
            <span>Astral initiative dice</span>
            <select value={c.options.astralInitDice} onChange={e => setOpt({ astralInitDice: Number(e.target.value) as 2 | 3 })}>
              <option value={3}>3D6 (Berlin 2023 / errata)</option>
              <option value={2}>2D6 (original 2019 book)</option>
            </select>
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
