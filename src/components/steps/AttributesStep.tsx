import {
  ATTR_NAMES, attrRange, computeBudget, magicBase, metatypeOf, remaining, resonanceBase,
  stepCost,
} from '../../engine/calc'
import { RULES } from '../../engine/rules'
import type { AttrAlloc, Character } from '../../engine/types'
import { ATTRS } from '../../engine/types'
import { Dots, PoolBadge, Section, Stepper, type StepProps } from '../ui'

type AllocKey = keyof AttrAlloc

interface RowDef {
  key: string
  name: string
  base: number
  max: number
  alloc: AttrAlloc
  canAdjust: boolean
  canPoints: boolean
  write: (c: Character, a: AttrAlloc) => Character
}

export function AttributesStep({ c, set }: StepProps) {
  const meta = metatypeOf(c)
  const b = computeBudget(c)
  const adjLeft = remaining(b.adjustment)
  const ptsLeft = remaining(b.attributes)
  const karmaLeft = remaining(b.karma)

  const rows: RowDef[] = ATTRS.map(a => {
    const r = attrRange(c, a)
    return {
      key: a,
      name: ATTR_NAMES[a],
      base: r.min,
      max: r.max,
      alloc: c.attributes[a],
      canAdjust: meta.adjustable.includes(a),
      canPoints: true,
      write: (ch, al) => ({ ...ch, attributes: { ...ch.attributes, [a]: al } }),
    }
  })
  const edge = attrRange(c, 'edg')
  rows.push({
    key: 'edg', name: 'Edge', base: edge.min, max: edge.max, alloc: c.edge, canAdjust: true, canPoints: false,
    write: (ch, al) => ({ ...ch, edge: al }),
  })
  if (c.magicType !== 'mundane' && c.magicType !== 'technomancer') {
    rows.push({
      key: 'mag', name: 'Magic', base: magicBase(c), max: 6, alloc: c.magic, canAdjust: true, canPoints: false,
      write: (ch, al) => ({ ...ch, magic: al }),
    })
  }
  if (c.magicType === 'technomancer') {
    rows.push({
      key: 'res', name: 'Resonance', base: resonanceBase(c), max: 6, alloc: c.resonance, canAdjust: true, canPoints: false,
      write: (ch, al) => ({ ...ch, resonance: al }),
    })
  }

  const valueOf = (r: RowDef) => r.base + r.alloc.points + r.alloc.adjust + r.alloc.karma

  return (
    <div className="stack">
      <Section
        title={`${meta.name} attributes`}
        aside={
          <span className="row">
            <PoolBadge label="Adjustment" total={b.adjustment.total} spent={b.adjustment.spent} />
            <PoolBadge label="Attribute pts" total={b.attributes.total} spent={b.attributes.spent} />
            <PoolBadge label="Karma" total={b.karma.total} spent={b.karma.spent} />
          </span>
        }
      >
        <div className="table-wrap">
          <table className="attr-table">
            <thead>
              <tr>
                <th>Attribute</th>
                <th className="num">Range</th>
                <th className="num">Adjustment</th>
                <th className="num">Points</th>
                <th className="num">Karma</th>
                <th className="num">Value</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const val = valueOf(r)
                const atCap = val >= r.max
                const change = (k: AllocKey, v: number) => set(ch => r.write(ch, { ...r.alloc, [k]: v }))
                const nextKarma = (val + 1) * RULES.attributeKarmaPerRating
                const karmaSpent = stepCost(val - r.alloc.karma, val, RULES.attributeKarmaPerRating)
                return (
                  <tr key={r.key} className={r.key === 'mag' || r.key === 'res' ? 'magic-row' : ''}>
                    <th scope="row">{r.name}</th>
                    <td className="num dim">{r.base}–{r.max}</td>
                    <td className="num">
                      {r.canAdjust
                        ? <Stepper label={`${r.name} adjustment`} value={r.alloc.adjust} onChange={v => change('adjust', v)} disabledUp={atCap || adjLeft <= 0} />
                        : <span className="faint">—</span>}
                    </td>
                    <td className="num">
                      {r.canPoints
                        ? <Stepper label={`${r.name} points`} value={r.alloc.points} onChange={v => change('points', v)} disabledUp={atCap || ptsLeft <= 0} />
                        : <span className="faint">—</span>}
                    </td>
                    <td className="num">
                      <Stepper label={`${r.name} karma`} value={r.alloc.karma} onChange={v => change('karma', v)} disabledUp={atCap || karmaLeft < nextKarma} />
                      {karmaSpent > 0 && <div className="small faint">{karmaSpent} karma</div>}
                    </td>
                    <td className="num"><strong className="big-num">{val}</strong></td>
                    <td><Dots value={val} max={r.max} min={r.base} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="small dim">
          Attribute points raise the eight core attributes. Adjustment points raise Edge, Magic/Resonance, and the attributes
          your metatype modifies ({meta.adjustable.map(a => ATTR_NAMES[a]).join(', ') || 'none'}). Karma costs
          the new rating × {RULES.attributeKarmaPerRating} per step. Only {RULES.attributesAtMax} attribute may sit at its maximum.
        </p>
      </Section>
    </div>
  )
}
