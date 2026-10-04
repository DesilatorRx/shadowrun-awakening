import { METATYPES, PRIORITY_TABLE } from '../../data'
import { MAGIC_TYPE_NAMES, paidRow } from '../../engine/calc'
import type { Character, MagicType, Priority, PriorityCategory } from '../../engine/types'
import { PRIORITIES, PRIORITY_CATEGORIES } from '../../engine/types'
import { Section, type StepProps } from '../ui'
import { nuyen } from '../format'

const CAT_LABEL: Record<PriorityCategory, string> = {
  metatype: 'Metatype',
  attributes: 'Attributes',
  magic: 'Magic / Resonance',
  skills: 'Skills',
  resources: 'Resources',
}

function cellText(c: Character, cat: PriorityCategory, p: Priority): string[] {
  const r = paidRow(c, p)
  switch (cat) {
    case 'metatype':
      return Object.entries(r.metatypes).map(([id, adj]) => `${METATYPES.find(m => m.id === id)?.name ?? id} (${adj})`)
    case 'attributes': return [`${r.attributes} points`]
    case 'skills': return [`${r.skills} points`]
    case 'resources': return [nuyen(r.resources)]
    case 'magic':
      return r.magic.length ? r.magic.map(o => `${MAGIC_TYPE_NAMES[o.type]} ${o.rating}`) : ['Mundane']
  }
}

/** Assign letter p to category cat, swapping with whichever category held it. */
function assign(c: Character, cat: PriorityCategory, p: Priority): Character {
  const pr = { ...c.priorities }
  const holder = PRIORITY_CATEGORIES.find(k => pr[k] === p)
  if (holder && holder !== cat) pr[holder] = pr[cat]
  pr[cat] = p
  return fixSelections({ ...c, priorities: pr })
}

/** Keep metatype & magic choices legal after priorities change. */
function fixSelections(c: Character): Character {
  const metaRow = paidRow(c, c.priorities.metatype)
  const metatype = metaRow.metatypes[c.metatype] !== undefined ? c.metatype : Object.keys(metaRow.metatypes)[0]
  const magicRow = paidRow(c, c.priorities.magic)
  const magicType: MagicType = magicRow.magic.some(o => o.type === c.magicType)
    ? c.magicType
    : 'mundane'
  return { ...c, metatype, magicType }
}

export function PrioritiesStep({ c, set }: StepProps) {
  const metaRow = paidRow(c, c.priorities.metatype)
  const magicRow = paidRow(c, c.priorities.magic)

  return (
    <div className="stack">
      <Section
        title="Priority table"
        aside={<span className="small dim">
          {c.options.powerLevel === 'street' && <span className="warn">Street level: each letter pays the row below. </span>}
          Click a cell to assign. Letters swap automatically.
        </span>}
      >
        <div className="table-wrap">
          <table className="prio-table">
            <thead>
              <tr>
                <th />
                {PRIORITIES.map(p => <th key={p} className="num">{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {PRIORITY_CATEGORIES.map(cat => (
                <tr key={cat}>
                  <th scope="row">{CAT_LABEL[cat]}</th>
                  {PRIORITIES.map(p => {
                    const selected = c.priorities[cat] === p
                    return (
                      <td key={p} className="prio-cell-td">
                        <button
                          type="button"
                          className={`prio-cell ${selected ? 'selected' : ''}`}
                          aria-pressed={selected}
                          onClick={() => set(ch => assign(ch, cat, p))}
                        >
                          {cellText(c, cat, p).map(t => <span key={t}>{t}</span>)}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={`Metatype — priority ${c.priorities.metatype}`}>
        <div className="choice-grid">
          {METATYPES.map(m => {
            const adj = metaRow.metatypes[m.id]
            const available = adj !== undefined
            return (
              <button
                type="button"
                key={m.id}
                disabled={!available}
                className={`choice ${c.metatype === m.id ? 'selected' : ''}`}
                aria-pressed={c.metatype === m.id}
                onClick={() => set(ch => ({ ...ch, metatype: m.id, attributes: resetAdjust(ch) }))}
              >
                <strong>{m.name}</strong>
                <span className="small dim">{available ? `${adj} adjustment points` : 'Not at this priority'}</span>
                <span className="small faint">{m.traits.join(' · ') || 'No racial traits'}</span>
              </button>
            )
          })}
        </div>
      </Section>

      <Section title={`Magic or Resonance — priority ${c.priorities.magic}`}>
        <div className="choice-grid">
          <button
            type="button"
            className={`choice ${c.magicType === 'mundane' ? 'selected' : ''}`}
            aria-pressed={c.magicType === 'mundane'}
            onClick={() => set(ch => ({ ...ch, magicType: 'mundane' }))}
          >
            <strong>Mundane</strong>
            <span className="small dim">No magic or resonance</span>
          </button>
          {magicRow.magic.map(o => (
            <button
              type="button"
              key={o.type}
              className={`choice ${c.magicType === o.type ? 'selected' : ''}`}
              aria-pressed={c.magicType === o.type}
              onClick={() => set(ch => ({ ...ch, magicType: o.type }))}
            >
              <strong>{MAGIC_TYPE_NAMES[o.type]}</strong>
              <span className="small magic">{o.type === 'technomancer' ? 'Resonance' : 'Magic'} {o.rating}</span>
            </button>
          ))}
        </div>
        {PRIORITY_TABLE.length === 0 && <p className="bad">Priority data missing.</p>}
      </Section>
    </div>
  )
}

/** Adjustment points are metatype specific; clear them when switching. */
function resetAdjust(c: Character): Character['attributes'] {
  const out = { ...c.attributes }
  for (const k of Object.keys(out) as (keyof typeof out)[]) out[k] = { ...out[k], adjust: 0 }
  return out
}
