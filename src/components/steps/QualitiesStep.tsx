import { useMemo, useState } from 'react'
import { QUALITIES, SKILLS } from '../../data'
import { ATTR_NAMES, computeBudget, metatypeOf, takenQualityKarma } from '../../engine/calc'
import { RULES } from '../../engine/rules'
import type { AttrId, Quality, TakenQuality } from '../../engine/types'
import { ATTRS } from '../../engine/types'
import { uid } from '../../state/store'
import { PoolBadge, Section, Stepper, type StepProps } from '../ui'

const SOURCE_LABEL: Record<string, string> = { core: 'Core', berlin: 'Berlin', seattle: 'Seattle', companion: 'Companion' }

export function QualitiesStep({ c, set }: StepProps) {
  const b = computeBudget(c)
  const meta = metatypeOf(c)
  const [query, setQuery] = useState('')
  const [showAllSettings, setShowAllSettings] = useState(false)

  const taken = new Set(c.qualities.map(q => q.id))
  const full = c.qualities.length >= RULES.maxQualities
  const net = b.negativeQualityKarma - b.positiveQualityKarma

  const filtered = useMemo(() => {
    const allowed = showAllSettings ? null : new Set(['core', 'companion', c.setting])
    const q = query.trim().toLowerCase()
    return QUALITIES.filter(x =>
      (!allowed || allowed.has(x.source)) &&
      (!q || x.name.toLowerCase().includes(q) || x.hint?.toLowerCase().includes(q)))
  }, [query, showAllSettings, c.setting])

  const add = (q: Quality) =>
    set(ch => ({ ...ch, qualities: [...ch.qualities, { uid: uid(), id: q.id, level: 1, option: q.options ? 0 : undefined }] }))

  const list = (positive: boolean) => (
    <ul className="pick-list">
      {filtered.filter(q => q.positive === positive).map(q => {
        const restricted = q.metatypes && !q.metatypes.includes(c.metatype)
        const disabled = full || restricted || (taken.has(q.id) && !q.multi)
        const karmaLabel = q.options
          ? `${Math.min(...q.options.map(o => o.karma))}–${Math.max(...q.options.map(o => o.karma))}`
          : `${q.karma}${q.maxLevel ? '/lvl' : ''}`
        return (
          <li key={q.id}>
            <button type="button" className="pick" disabled={disabled} onClick={() => add(q)} title={restricted ? `Not available to ${meta.name}` : undefined}>
              <span>
                {q.name}{' '}
                {q.source !== 'core' && <span className="pill accent">{SOURCE_LABEL[q.source]}</span>}
                {q.hint && <span className="small faint block">{q.hint}</span>}
              </span>
              <span className={`mono ${positive ? 'warn' : 'good'}`}>{positive ? '−' : '+'}{karmaLabel}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )

  const update = (t: TakenQuality, patch: Partial<TakenQuality>) =>
    set(ch => ({ ...ch, qualities: ch.qualities.map(x => (x.uid === t.uid ? { ...x, ...patch } : x)) }))

  return (
    <div className="stack">
      <Section
        title="Your qualities"
        aside={
          <span className="row">
            <PoolBadge label="Slots" total={RULES.maxQualities} spent={c.qualities.length} />
            <span className="pool-badge">
              <span className="dim">Net bonus</span>{' '}
              <span className={`mono ${net > RULES.maxNetQualityKarma ? 'bad' : 'good'}`}>{net > 0 ? '+' : ''}{net}</span>
              <span className="faint mono"> / max +{RULES.maxNetQualityKarma}</span>
            </span>
            <PoolBadge label="Karma" total={b.karma.total} spent={b.karma.spent} />
          </span>
        }
      >
        {c.qualities.length === 0 && <p className="dim">No qualities yet. Pick from the lists below. Racial traits ({meta.traits.join(', ') || 'none'}) are automatic and don't count.</p>}
        <div className="table-wrap">
          <table>
            <tbody>
              {c.qualities.map(t => {
                const q = QUALITIES.find(x => x.id === t.id)
                if (!q) return null
                return (
                  <tr key={t.uid}>
                    <td>
                      <strong>{q.name}</strong> <span className={`pill ${q.positive ? 'accent' : 'hot'}`}>{q.positive ? 'Positive' : 'Negative'}</span>
                    </td>
                    <td>
                      {q.maxLevel && <Stepper label={`${q.name} level`} value={t.level} min={1} max={q.maxLevel} onChange={v => update(t, { level: v })} />}
                      {q.options && (
                        <select aria-label={`${q.name} variant`} value={t.option ?? 0} onChange={e => update(t, { option: Number(e.target.value) })}>
                          {q.options.map((o, i) => <option key={o.label} value={i}>{o.label} ({o.karma})</option>)}
                        </select>
                      )}
                    </td>
                    <td>
                      {q.skillChoice ? (
                        <select aria-label={`${q.name} skill`} value={t.skill ?? ''} onChange={e => update(t, { skill: e.target.value || undefined })}>
                          <option value="">Choose skill…</option>
                          {SKILLS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      ) : q.attributeChoice ? (
                        <select aria-label={`${q.name} attribute`} value={t.attr ?? ''} onChange={e => update(t, { attr: (e.target.value || undefined) as AttrId | undefined })}>
                          <option value="">Choose attribute…</option>
                          {ATTRS.map(a => <option key={a} value={a}>{ATTR_NAMES[a]}</option>)}
                        </select>
                      ) : (
                      <input type="text" aria-label={`${q.name} details`} placeholder={q.needsDetail ? 'Details (required)' : 'Notes'} value={t.detail ?? ''} onChange={e => update(t, { detail: e.target.value })} />
                      )}
                    </td>
                    <td className="num mono">{q.positive ? '−' : '+'}{takenQualityKarma(q, t)}</td>
                    <td>
                      <button type="button" className="ghost danger small" onClick={() => set(ch => ({ ...ch, qualities: ch.qualities.filter(x => x.uid !== t.uid) }))}>Remove</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="small dim">
          Up to {RULES.maxQualities} qualities. Negative qualities can net you at most {RULES.maxNetQualityKarma} bonus karma.
          Positive qualities are paid from your {RULES.startingKarma} starting karma.
        </p>
      </Section>

      <div className="row">
        <input type="search" placeholder="Search qualities…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search qualities" />
        <label className="small dim">
          <input type="checkbox" checked={showAllSettings} onChange={e => setShowAllSettings(e.target.checked)} /> Show qualities from other city editions
        </label>
      </div>

      <div className="two-col">
        <Section title="Positive (cost karma)">{list(true)}</Section>
        <Section title="Negative (grant karma)">{list(false)}</Section>
      </div>
    </div>
  )
}
