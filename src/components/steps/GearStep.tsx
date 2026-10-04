import { useMemo, useState } from 'react'
import { GEAR } from '../../data'
import {
  computeBudget, essenceValue, gearAvail, gearEssence, gearItem, gearUnitCost, karmaToNuyenRate, remaining,
} from '../../engine/calc'
import type { GearCategory, GearItem } from '../../engine/types'
import { uid } from '../../state/store'
import { GearName } from '../GearInfo'
import { PoolBadge, Section, Stepper, type StepProps } from '../ui'
import { nuyen } from '../format'

const TABS: { id: GearCategory | 'aug'; label: string }[] = [
  { id: 'firearm', label: 'Firearms' },
  { id: 'melee', label: 'Melee' },
  { id: 'armor', label: 'Armor' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'aug', label: 'Augmentations' },
  { id: 'misc', label: 'Other' },
]

const inTab = (g: GearItem, tab: GearCategory | 'aug') =>
  tab === 'aug' ? g.category === 'cyberware' || g.category === 'bioware' : g.category === tab

const availLabel = (g: GearItem, rating?: number) => `${gearAvail(g, rating)}${g.legality ?? ''}`

export function GearStep({ c, set }: StepProps) {
  const b = computeBudget(c)
  const [tab, setTab] = useState<GearCategory | 'aug'>('firearm')
  const [query, setQuery] = useState('')
  const left = remaining(b.nuyen)
  const karmaLeft = remaining(b.karma)

  const catalog = useMemo(() => {
    const q = query.trim().toLowerCase()
    return GEAR.filter(g => inTab(g, tab) && (!q || g.name.toLowerCase().includes(q) || g.subcategory?.toLowerCase().includes(q)))
  }, [tab, query])

  const groups = useMemo(() => {
    const m = new Map<string, GearItem[]>()
    for (const g of catalog) {
      const k = g.subcategory ?? 'Other'
      m.set(k, [...(m.get(k) ?? []), g])
    }
    return [...m.entries()]
  }, [catalog])

  const add = (g: GearItem) =>
    set(ch => ({ ...ch, gear: [...ch.gear, { uid: uid(), id: g.id, qty: 1, rating: g.rated?.min }] }))

  const rate = karmaToNuyenRate(c)

  return (
    <div className="stack">
      <Section
        title="Resources"
        aside={<span className="row"><PoolBadge label="Nuyen" total={b.nuyen.total} spent={b.nuyen.spent} unit="¥" /><PoolBadge label="Karma" total={b.karma.total} spent={b.karma.spent} /></span>}
      >
        <div className="row">
          <span>Convert karma to nuyen ({nuyen(rate)} each):</span>
          <Stepper label="Karma converted to nuyen" value={c.karmaToNuyen} onChange={v => set(ch => ({ ...ch, karmaToNuyen: v }))} disabledUp={karmaLeft < 1} />
          <span className="mono dim">= {nuyen(c.karmaToNuyen * rate)}</span>
          <span className="spacer" />
          <span>Essence <strong className="mono">{essenceValue(c).toFixed(2)}</strong></span>
          <span className="small faint">Max Availability {c.options.maxAvailability}</span>
        </div>
      </Section>

      <Section title="Owned gear">
        {c.gear.length === 0 && <p className="dim">Nothing yet. Browse the catalog below.</p>}
        <div className="table-wrap">
          <table>
            {c.gear.length > 0 && (
              <thead>
                <tr><th>Item</th><th className="num">Rating</th><th className="num">Qty</th><th className="num">Avail</th><th className="num">Essence</th><th className="num">Cost</th><th /></tr>
              </thead>
            )}
            <tbody>
              {c.gear.map(g => {
                const item = gearItem(g.id)
                if (!item) return null
                const patch = (p: Partial<typeof g>) => set(ch => ({ ...ch, gear: ch.gear.map(x => (x.uid === g.uid ? { ...x, ...p } : x)) }))
                const tooRare = gearAvail(item, g.rating) > c.options.maxAvailability
                const ess = gearEssence(item, g.rating) * g.qty
                return (
                  <tr key={g.uid}>
                    <td><GearName item={item} rating={g.rating} />{item.stats && <div className="small faint">{item.stats}</div>}</td>
                    <td className="num">
                      {item.rated ? <Stepper label={`${item.name} rating`} value={g.rating ?? item.rated.min} min={item.rated.min} max={item.rated.max} onChange={v => patch({ rating: v })} /> : '—'}
                    </td>
                    <td className="num"><Stepper label={`${item.name} quantity`} value={g.qty} min={1} onChange={v => patch({ qty: v })} /></td>
                    <td className={`num ${tooRare ? 'bad' : ''}`}>{availLabel(item, g.rating)}</td>
                    <td className="num">{ess ? ess.toFixed(2) : '—'}</td>
                    <td className="num">{nuyen(gearUnitCost(item, g.rating) * g.qty)}</td>
                    <td><button type="button" className="ghost danger small" onClick={() => set(ch => ({ ...ch, gear: ch.gear.filter(x => x.uid !== g.uid) }))}>Remove</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Catalog">
        <div className="row">
          <div className="seg">
            {TABS.map(t => (
              <button key={t.id} type="button" className={tab === t.id ? 'selected' : ''} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>
          <input type="search" placeholder="Search…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search gear" />
        </div>
        {groups.map(([sub, items]) => (
          <div key={sub} className="gear-group">
            <h4 className="dim">{sub}</h4>
            <ul className="pick-list">
              {items.map(g => {
                const cost = gearUnitCost(g, g.rated?.min)
                const blocked = gearAvail(g, g.rated?.min) > c.options.maxAvailability
                return (
                  <li key={g.id} className={`pick-row ${blocked ? 'blocked' : ''}`}>
                    <span className="pick-main">
                      <GearName item={g} />
                      <span className="small faint block">
                        {[g.stats, `Avail ${availLabel(g, g.rated?.min)}`, g.essence ? `Ess ${gearEssence(g, g.rated?.min)}` : null, g.rated ? `Rating ${g.rated.min}–${g.rated.max}` : null].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="pick-add"
                      disabled={blocked || cost > left}
                      title={blocked ? `Availability above ${c.options.maxAvailability}` : cost > left ? 'Not enough nuyen' : undefined}
                      onClick={() => add(g)}
                      aria-label={`Add ${g.name}`}
                    >
                      <span className="mono">{nuyen(cost)}{g.rated ? '/R' : ''}</span> <span aria-hidden>+</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
        {groups.length === 0 && <p className="dim">No matches.</p>}
      </Section>
    </div>
  )
}
