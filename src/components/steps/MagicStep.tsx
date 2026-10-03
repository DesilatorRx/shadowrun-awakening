import { useMemo, useState } from 'react'
import { ADEPT_POWERS, COMPLEX_FORMS, MENTOR_SPIRITS, SPELLS, TRADITIONS } from '../../data'
import {
  ATTR_NAMES, MAGIC_TYPE_NAMES, castsSpells, computeBudget, hasPowers, magicBase, magicValue, remaining, resonanceValue,
} from '../../engine/calc'
import type { Character } from '../../engine/types'
import { uid } from '../../state/store'
import { RULES } from '../../engine/rules'
import type { SpellCategory } from '../../engine/types'
import { PoolBadge, Section, Stepper, type StepProps } from '../ui'

const CATEGORIES: SpellCategory[] = ['combat', 'detection', 'health', 'illusion', 'manipulation']

export function MagicStep({ c, set }: StepProps) {
  const b = computeBudget(c)
  const [spellCat, setSpellCat] = useState<SpellCategory | 'all'>('all')
  const [query, setQuery] = useState('')

  const spells = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SPELLS.filter(s => (spellCat === 'all' || s.category === spellCat) && (!q || s.name.toLowerCase().includes(q)))
  }, [spellCat, query])

  if (c.magicType === 'mundane') {
    return (
      <Section title="Magic & Resonance">
        <p className="dim">This character is mundane. Choose a magic or resonance type on the Priorities step to unlock this page.</p>
      </Section>
    )
  }

  const toggle = (list: 'spells' | 'complexForms', id: string) =>
    set(ch => ({ ...ch, [list]: ch[list].includes(id) ? ch[list].filter(x => x !== id) : [...ch[list], id] }))

  const karmaLeft = remaining(b.karma)
  const canBuy = (cost: number) => c.options.karmaSpellsAtCreation && karmaLeft >= cost
  const extraNote = c.options.karmaSpellsAtCreation
    ? `extra: ${RULES.spellKarma} karma each`
    : 'no extras at creation (table rule)'

  return (
    <div className="stack">
      <Section title={MAGIC_TYPE_NAMES[c.magicType]} aside={<PoolBadge label="Karma" total={b.karma.total} spent={b.karma.spent} />}>
        <div className="form-grid">
          {c.magicType !== 'technomancer' && c.magicType !== 'adept' && (
            <label>
              <span className="dim small">Tradition</span>
              <select value={c.tradition ?? ''} onChange={e => set(ch => ({ ...ch, tradition: e.target.value || undefined }))}>
                <option value="">Choose…</option>
                {TRADITIONS.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (drain: {ATTR_NAMES[t.drain[0]]} + {ATTR_NAMES[t.drain[1]]})</option>
                ))}
              </select>
            </label>
          )}
          {c.magicType === 'aspected' && (
            <label>
              <span className="dim small">Aspected skill</span>
              <select value={c.aspectedSkill ?? ''} onChange={e => set(ch => ({ ...ch, aspectedSkill: (e.target.value || undefined) as typeof ch.aspectedSkill }))}>
                <option value="">Choose…</option>
                <option value="sorcery">Sorcery</option>
                <option value="conjuring">Conjuring</option>
                <option value="enchanting">Enchanting</option>
              </select>
            </label>
          )}
          {c.magicType !== 'technomancer' && (
            <label>
              <span className="dim small">Mentor spirit (optional quality)</span>
              <select value={c.mentorSpirit ?? ''} onChange={e => set(ch => setMentor(ch, e.target.value || undefined))}>
                <option value="">None</option>
                {MENTOR_SPIRITS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
          )}
          <div>
            <span className="dim small block">{c.magicType === 'technomancer' ? 'Resonance' : 'Magic'}</span>
            <strong className="big-num magic">{c.magicType === 'technomancer' ? resonanceValue(c) : magicValue(c)}</strong>
            <span className="small faint"> raise it on the Attributes step</span>
          </div>
        </div>
      </Section>

      {castsSpells(c.magicType) && (
        <Section
          title="Spells"
          aside={<span className="row"><PoolBadge label="Free spells" total={b.freeSpells.total} spent={b.freeSpells.spent} /><span className="small dim">{extraNote}</span></span>}
        >
          <div className="row">
            <input type="search" placeholder="Search spells…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search spells" />
            <div className="seg">
              {(['all', ...CATEGORIES] as const).map(cat => (
                <button key={cat} type="button" className={spellCat === cat ? 'selected' : ''} aria-pressed={spellCat === cat} onClick={() => setSpellCat(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th /><th>Spell</th><th>Category</th><th className="num">Type</th><th>Range</th><th>Duration</th><th className="num">Drain</th></tr>
              </thead>
              <tbody>
                {spells.map(s => {
                  const known = c.spells.includes(s.id)
                  const needsKarma = !known && b.freeSpells.spent >= b.freeSpells.total
                  return (
                    <tr key={s.id} className={known ? 'active-row' : ''}>
                      <td>
                        <input type="checkbox" aria-label={`Know ${s.name}`} checked={known} disabled={needsKarma && !canBuy(RULES.spellKarma)} onChange={() => toggle('spells', s.id)} />
                      </td>
                      <td>{s.name}</td>
                      <td className="dim">{s.category}</td>
                      <td className="num">{s.type}</td>
                      <td className="dim">{s.range}</td>
                      <td className="dim">{s.duration}</td>
                      <td className="num">{s.drain}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {hasPowers(c.magicType) && (
        <Section title="Adept powers" aside={<PoolBadge label="Power points" total={b.powerPoints.total} spent={b.powerPoints.spent} />}>
          {c.magicType === 'mysticAdept' && (
            <div className="row">
              <span className="dim">Priority Magic put toward power points (each point = 1 PP, costs 2 free spells):</span>
              <Stepper label="Magic toward power points" value={c.powerPointsBought} max={magicBase(c)} onChange={v => set(ch => ({ ...ch, powerPointsBought: v }))} />
            </div>
          )}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Power</th><th className="num">PP</th><th className="num">Level</th></tr></thead>
              <tbody>
                {ADEPT_POWERS.map(p => {
                  const t = c.adeptPowers.find(x => x.id === p.id)
                  const level = t?.level ?? 0
                  const setLevel = (lv: number) => set(ch => ({
                    ...ch,
                    adeptPowers: lv <= 0
                      ? ch.adeptPowers.filter(x => x.id !== p.id)
                      : t ? ch.adeptPowers.map(x => (x.id === p.id ? { ...x, level: lv } : x)) : [...ch.adeptPowers, { id: p.id, level: lv }],
                  }))
                  const ppLeft = remaining(b.powerPoints)
                  return (
                    <tr key={p.id} className={level ? 'active-row' : ''}>
                      <td>{p.name}</td>
                      <td className="num">{p.cost}{p.maxLevel ? '/lvl' : ''}</td>
                      <td className="num">
                        <Stepper label={p.name} value={level} max={p.maxLevel ?? 1} onChange={setLevel} disabledUp={ppLeft < p.cost - 1e-9} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {c.magicType === 'technomancer' && (
        <Section
          title="Complex forms"
          aside={<span className="row"><PoolBadge label="Free forms" total={b.freeForms.total} spent={b.freeForms.spent} /><span className="small dim">{extraNote}</span></span>}
        >
          <table>
            <thead><tr><th /><th>Complex form</th><th>Duration</th><th className="num">Fade</th></tr></thead>
            <tbody>
              {COMPLEX_FORMS.map(f => {
                const known = c.complexForms.includes(f.id)
                const needsKarma = !known && b.freeForms.spent >= b.freeForms.total
                return (
                  <tr key={f.id} className={known ? 'active-row' : ''}>
                    <td><input type="checkbox" aria-label={`Know ${f.name}`} checked={known} disabled={needsKarma && !canBuy(RULES.complexFormKarma)} onChange={() => toggle('complexForms', f.id)} /></td>
                    <td>{f.name}</td>
                    <td className="dim">{f.duration}</td>
                    <td className="num">{f.fade}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Section>
      )}
    </div>
  )
}

/** Mentor spirits come with the Mentor Spirit quality; keep the two in sync. */
function setMentor(c: Character, mentor: string | undefined): Character {
  const has = c.qualities.some(q => q.id === 'mentor_spirit')
  let qualities = c.qualities
  if (mentor && !has) qualities = [...qualities, { uid: uid(), id: 'mentor_spirit', level: 1 }]
  if (!mentor && has) qualities = qualities.filter(q => q.id !== 'mentor_spirit')
  return { ...c, mentorSpirit: mentor, qualities }
}
