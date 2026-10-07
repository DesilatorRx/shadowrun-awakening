import { useState } from 'react'
import { computeDerived } from '../engine/calc'
import { RANGES, edgeFromRatings, listAttacks, type EdgeResult } from '../engine/combat'
import type { Character } from '../engine/types'
import { Stepper } from './ui'

const RESULT_TEXT: Record<EdgeResult, string> = {
  attacker: 'You gain 1 Edge',
  defender: 'Target gains 1 Edge',
  none: 'No Edge (difference under 4)',
}

/** Printable attack table plus an on-screen AR vs DR Edge check (p. 105). */
export function CombatPanel({ c }: { c: Character }) {
  const attacks = listAttacks(c)
  const d = computeDerived(c)
  const [attackId, setAttackId] = useState(attacks[0].id)
  const [range, setRange] = useState(0)
  const [targetDR, setTargetDR] = useState(4)
  const [enemyAR, setEnemyAR] = useState(8)

  const attack = attacks.find(a => a.id === attackId) ?? attacks[0]
  const usable = attack.ratings.map((r, i) => (r === null ? -1 : i)).filter(i => i >= 0)
  const band = usable.includes(range) ? range : usable[0] ?? 0
  const ar = attack.ratings[band]
  const offense = ar === null || ar === undefined ? null : edgeFromRatings(ar, targetDR)
  const defense = edgeFromRatings(enemyAR, d.defenseRating)

  return (
    <section>
      <h3>Combat <span className="small dim">· Defense Rating <strong className="mono">{d.defenseRating}</strong> · Edge when AR and DR differ by 4+</span></h3>
      <table className="compact">
        <thead>
          <tr>
            <th>Attack</th>
            <th className="num">DV</th>
            {RANGES.map(r => <th key={r} className="num">{r}</th>)}
            <th className="num">Pool</th>
          </tr>
        </thead>
        <tbody>
          {attacks.map(a => (
            <tr key={a.id}>
              <td>{a.name}{a.poolNote && <div className="small faint">{a.poolNote}</div>}</td>
              <td className="num">{a.damage ?? (a.id === 'spell' ? 'per spell' : '—')}</td>
              {a.ratings.map((r, i) => <td key={i} className="num">{r ?? '—'}</td>)}
              <td className="num"><strong>{a.pool ?? '—'}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="edge-check no-print">
        <div className="edge-row">
          <strong className="small">Attacking</strong>
          <select aria-label="Attack" value={attack.id} onChange={e => setAttackId(e.target.value)}>
            {attacks.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {usable.length > 1 && (
            <select aria-label="Range" value={band} onChange={e => setRange(Number(e.target.value))}>
              {usable.map(i => <option key={i} value={i}>{RANGES[i]}</option>)}
            </select>
          )}
          <span className="small dim">AR <strong className="mono">{ar ?? '—'}</strong> vs target DR</span>
          <Stepper label="Target Defense Rating" value={targetDR} min={0} max={30} onChange={setTargetDR} />
          {offense && <span className={`edge-result ${offense}`}>{RESULT_TEXT[offense]}</span>}
        </div>
        <div className="edge-row">
          <strong className="small">Defending</strong>
          <span className="small dim">enemy AR</span>
          <Stepper label="Enemy Attack Rating" value={enemyAR} min={0} max={30} onChange={setEnemyAR} />
          <span className="small dim">vs your DR <strong className="mono">{d.defenseRating}</strong></span>
          <span className={`edge-result ${defense === 'attacker' ? 'defender' : defense === 'defender' ? 'attacker' : 'none'}`}>
            {defense === 'attacker' ? 'Enemy gains 1 Edge' : defense === 'defender' ? 'You gain 1 Edge' : 'No Edge (difference under 4)'}
          </span>
        </div>
        <p className="small faint">Max 2 Edge gained per round; Edge caps at 7. Situation and gear can add more (p. 105).</p>
      </div>
    </section>
  )
}
