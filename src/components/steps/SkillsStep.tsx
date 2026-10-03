import { useState } from 'react'
import { QUALITIES, SKILLS } from '../../data'
import { ATTR_NAMES, attrValue, computeBudget, remaining, skillRating } from '../../engine/calc'
import { RULES } from '../../engine/rules'
import type { AttrId, Character, Language, SkillAlloc } from '../../engine/types'
import { uid } from '../../state/store'
import { PoolBadge, Section, Stepper, type StepProps } from '../ui'

const LANGUAGE_LEVELS = ['Basic', 'Specialist', 'Expert'] as const

function writeSkill(c: Character, id: string, s: SkillAlloc): Character {
  const skills = { ...c.skills }
  if (s.points + s.karma === 0 && !s.specialization) delete skills[id]
  else skills[id] = s
  return { ...c, skills }
}

export function SkillsStep({ c, set }: StepProps) {
  const b = computeBudget(c)
  const ptsLeft = remaining(b.skills)
  const karmaLeft = remaining(b.karma)
  const [newKnowledge, setNewKnowledge] = useState('')
  const [newLanguage, setNewLanguage] = useState('')

  const visible = SKILLS.filter(s => {
    if (s.attr === 'res') return c.magicType === 'technomancer'
    if (s.attr === 'mag') return c.magicType !== 'mundane' && c.magicType !== 'technomancer'
    return true
  })

  const dicePool = (attr: string, rating: number) => {
    if (attr === 'mag' || attr === 'res' || attr === 'edg') return null
    return rating + attrValue(c, attr as AttrId)
  }

  const setLang = (id: string, patch: Partial<Language>) =>
    set(ch => ({ ...ch, languages: ch.languages.map(l => (l.id === id ? { ...l, ...patch } : l)) }))

  return (
    <div className="stack">
      <Section
        title="Active skills"
        aside={
          <span className="row">
            <PoolBadge label="Skill pts" total={b.skills.total} spent={b.skills.spent} />
            <PoolBadge label="Karma" total={b.karma.total} spent={b.karma.spent} />
          </span>
        }
      >
        <div className="table-wrap">
          <table className="skill-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th className="num">Attr</th>
                <th className="num">Points</th>
                <th className="num">Karma</th>
                <th className="num">Rating</th>
                <th>Specialization</th>
                <th className="num">Pool</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(skill => {
                const s: SkillAlloc = c.skills[skill.id] ?? { points: 0, karma: 0 }
                const rating = skillRating(c, skill.id)
                const atCap = rating >= RULES.maxSkillRating + 1
                const nextKarma = (rating + 1) * RULES.skillKarmaPerRating
                const pool = dicePool(skill.attr, rating)
                return (
                  <tr key={skill.id} className={rating > 0 ? 'active-row' : ''}>
                    <th scope="row">
                      {skill.name}
                      {!skill.untrained && <span className="pill small" title="Cannot be used untrained"> trained only</span>}
                    </th>
                    <td className="num dim">{ATTR_NAMES[skill.attr].slice(0, 3)}</td>
                    <td className="num">
                      <Stepper label={`${skill.name} points`} value={s.points} onChange={v => set(ch => writeSkill(ch, skill.id, { ...s, points: v }))} disabledUp={atCap || ptsLeft <= 0} />
                    </td>
                    <td className="num">
                      <Stepper label={`${skill.name} karma`} value={s.karma} onChange={v => set(ch => writeSkill(ch, skill.id, { ...s, karma: v }))} disabledUp={atCap || karmaLeft < nextKarma} />
                    </td>
                    <td className="num"><strong className="big-num">{rating}</strong></td>
                    <td>
                      <div className="row nowrap">
                        <select
                          aria-label={`${skill.name} specialization`}
                          value={s.specialization ?? ''}
                          disabled={rating === 0}
                          onChange={e => set(ch => writeSkill(ch, skill.id, { ...s, specialization: e.target.value || undefined }))}
                        >
                          <option value="">—</option>
                          {skill.specializations.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                        </select>
                        {s.specialization && (
                          <label className="small dim nowrap" title="Pay for the specialization with karma instead of a skill point">
                            <input type="checkbox" checked={!!s.specKarma} onChange={e => set(ch => writeSkill(ch, skill.id, { ...s, specKarma: e.target.checked }))} /> karma
                          </label>
                        )}
                      </div>
                    </td>
                    <td className="num mono">{pool ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="small dim">
          Max rating {RULES.maxSkillRating} at creation.
          One specialization (+2 dice) per skill, costing {RULES.specializationSkillPoints} skill point or {RULES.specializationKarma} karma.
          Expertise can't be bought at creation. Aptitude raises one skill's cap to {RULES.maxSkillRating + 1}.
        </p>
      </Section>

      <Section title="Knowledge skills" aside={<PoolBadge label="Free (Logic)" total={b.freeKnowledge.total} spent={b.freeKnowledge.spent} />}>
        <ul className="tag-list">
          {c.knowledge.map(k => (
            <li key={k.id} className="tag">
              {k.name}
              <button type="button" className="ghost small" aria-label={`Remove ${k.name}`} onClick={() => set(ch => ({ ...ch, knowledge: ch.knowledge.filter(x => x.id !== k.id) }))}>×</button>
            </li>
          ))}
        </ul>
        <form
          className="row"
          onSubmit={e => {
            e.preventDefault()
            const name = newKnowledge.trim()
            if (!name) return
            set(ch => ({ ...ch, knowledge: [...ch.knowledge, { id: uid(), name }] }))
            setNewKnowledge('')
          }}
        >
          <input type="text" placeholder="e.g. Berlin Kieze, Corporate Politics, Ork Rock" value={newKnowledge} onChange={e => setNewKnowledge(e.target.value)} />
          <button type="submit">Add</button>
        </form>
        <p className="small dim">
          You get Logic free knowledge skills or language levels. Extras cost {RULES.knowledgeSkillKarma} karma each.
        </p>
      </Section>

      <Section title="Languages">
        {c.qualities.map(t => QUALITIES.find(q => q.id === t.id)).filter(q => q?.grantsNativeLanguage).map(q => (
          <p key={q!.id} className="small dim">{q!.grantsNativeLanguage} (Native), free from {q!.name}.</p>
        ))}
        <table>
          <tbody>
            {c.languages.map(l => (
              <tr key={l.id}>
                <td><input type="text" aria-label="Language name" value={l.name} onChange={e => setLang(l.id, { name: e.target.value })} /></td>
                <td>
                  <label className="small"><input type="checkbox" checked={l.native} onChange={e => setLang(l.id, { native: e.target.checked })} /> Native</label>
                </td>
                <td>
                  {!l.native && (
                    <select aria-label={`${l.name} level`} value={Math.max(1, l.level)} onChange={e => setLang(l.id, { level: Number(e.target.value) as Language['level'] })}>
                      {LANGUAGE_LEVELS.map((lv, i) => <option key={lv} value={i + 1}>{lv}</option>)}
                    </select>
                  )}
                </td>
                <td>
                  <button type="button" className="ghost danger small" onClick={() => set(ch => ({ ...ch, languages: ch.languages.filter(x => x.id !== l.id) }))}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form
          className="row"
          onSubmit={e => {
            e.preventDefault()
            const name = newLanguage.trim()
            if (!name) return
            set(ch => ({ ...ch, languages: [...ch.languages, { id: uid(), name, native: false, level: 1 }] }))
            setNewLanguage('')
          }}
        >
          <input type="text" placeholder="e.g. English, Sperethiel, Kiezdeutsch, Turkish" value={newLanguage} onChange={e => setNewLanguage(e.target.value)} />
          <button type="submit">Add language</button>
        </form>
      </Section>
    </div>
  )
}
