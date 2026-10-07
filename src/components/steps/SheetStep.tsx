import { ADEPT_POWERS, LIFESTYLES, MENTOR_SPIRITS, QUALITIES, SKILLS, TRADITIONS } from '../../data'
import {
  ATTR_NAMES, MAGIC_TYPE_NAMES, attrValue, augmentedValue, computeBonuses, computeBudget, computeDerived, formById, gearItem,
  metatypeOf, qualitySkill, skillSpecs,
  remaining, skillRating, spellById, takenQualityKarma,
} from '../../engine/calc'
import type { AttrId, Character } from '../../engine/types'
import { ATTRS } from '../../engine/types'
import type { Issue } from '../../engine/validate'
import { nuyen } from '../format'
import { GearName } from '../GearInfo'

export function SheetStep({ c, issues }: { c: Character; issues: Issue[] }) {
  const d = computeDerived(c)
  const b = computeBudget(c)
  const bonuses = computeBonuses(c)
  const meta = metatypeOf(c)
  const errors = issues.filter(i => i.severity === 'error')
  const warnings = issues.length - errors.length
  const tradition = TRADITIONS.find(t => t.id === c.tradition)
  const mentor = MENTOR_SPIRITS.find(m => m.id === c.mentorSpirit)
  const lifestyle = LIFESTYLES.find(l => l.id === c.lifestyle)
  const skills = SKILLS.filter(s => skillRating(c, s.id) > 0)
  const aptitudeSkills = qualitySkill(c, 'aptitude')
  const incompetentSkills = qualitySkill(c, 'incompetent')
  const pool = (attr: string, rating: number) =>
    ['mag', 'res', 'edg'].includes(attr)
      ? rating + (attr === 'mag' ? d.magic : attr === 'res' ? d.resonance : d.edge)
      : rating + augmentedValue(c, attr as AttrId, bonuses)

  return (
    <div className="stack">
      <div className={`card no-print ${errors.length ? 'status-bad' : 'status-good'}`}>
        <div className="row">
          <strong>
            {errors.length
              ? `${errors.length} rule problem${errors.length > 1 ? 's' : ''} to fix`
              : warnings
                ? `Street legal, with ${warnings} thing${warnings > 1 ? 's' : ''} worth a second look.`
                : 'Street legal: this runner is ready.'}
          </strong>
          <span className="spacer" />
          <button type="button" className="primary" onClick={() => window.print()}>Print / Save PDF</button>
        </div>
        {issues.length > 0 && (
          <ul className="issue-list">
            {issues.map((i, n) => <li key={n} className={i.severity === 'error' ? 'bad' : 'warn'}>{i.message}</li>)}
          </ul>
        )}
      </div>

      <article className="sheet">
        <header className="sheet-head">
          <div>
            <h1>{c.alias || c.name || 'Unnamed runner'}</h1>
            <div className="dim">
              {[c.alias && c.name ? c.name : null, meta.name, MAGIC_TYPE_NAMES[c.magicType], c.concept].filter(Boolean).join(' · ')}
            </div>
          </div>
          <div className="sheet-meta mono small">
            <div>Priorities {(['metatype', 'attributes', 'magic', 'skills', 'resources'] as const).map(k => c.priorities[k]).join('')}</div>
            <div>Karma left {remaining(b.karma)} · Nuyen left {nuyen(remaining(b.nuyen))}</div>
          </div>
        </header>

        <section className="sheet-grid">
          <div>
            <h3>Attributes</h3>
            <table className="compact">
              <tbody>
                {ATTRS.map(a => (
                  <tr key={a}>
                    <td>{ATTR_NAMES[a]}</td>
                    <td className="num">{attrValue(c, a)}{bonuses.attrs[a] > 0 && <span className="good"> ({attrValue(c, a) + bonuses.attrs[a]})</span>}</td>
                  </tr>
                ))}
                <tr><td>Edge</td><td className="num">{d.edge}</td></tr>
                <tr><td>Essence</td><td className="num">{d.essence.toFixed(2)}</td></tr>
                {c.magicType !== 'mundane' && c.magicType !== 'technomancer' && <tr><td>Magic</td><td className="num">{d.magic}</td></tr>}
                {c.magicType === 'technomancer' && <tr><td>Resonance</td><td className="num">{d.resonance}</td></tr>}
              </tbody>
            </table>
          </div>
          <div>
            <h3>Derived</h3>
            <table className="compact">
              <tbody>
                <tr><td>Initiative</td><td className="num">{d.initiative}</td></tr>
                <tr><td>Matrix (AR)</td><td className="num">{d.matrixInitAR}</td></tr>
                <tr><td>Matrix (VR)</td><td className="num small">{d.matrixInitVR}</td></tr>
                {c.magicType !== 'mundane' && c.magicType !== 'technomancer' && <tr><td>Astral</td><td className="num">{d.astralInit}</td></tr>}
                <tr><td>Defense Rating</td><td className="num">{d.defenseRating}</td></tr>
                <tr><td>Unarmed</td><td className="num">AR {d.unarmedAR} · DV {d.unarmedDV}</td></tr>
                <tr><td>Composure</td><td className="num">{d.composure}</td></tr>
                <tr><td>Judge Intentions</td><td className="num">{d.judgeIntentions}</td></tr>
                <tr><td>Memory</td><td className="num">{d.memory}</td></tr>
                <tr><td>Lift / Carry</td><td className="num">{d.liftCarry}</td></tr>
                <tr><td>Movement</td><td className="num small">{d.movement}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3>Condition</h3>
            <CM label="Physical" boxes={d.physicalCM} />
            <CM label="Stun" boxes={d.stunCM} />
            <CM label="Overflow" boxes={d.overflow} />
            {meta.traits.length > 0 && <><h3>Racial traits</h3><p className="small">{meta.traits.join(', ')}</p></>}
          </div>
        </section>

        <section className="sheet-grid">
          <div>
            <h3>Skills</h3>
            <table className="compact">
              <thead><tr><th>Skill</th><th className="num">Rtg</th><th className="num">Pool</th></tr></thead>
              <tbody>
                {skills.map(s => {
                  const r = skillRating(c, s.id)
                  const spec = skillSpecs(c.skills[s.id]).join(', ')
                  return (
                    <tr key={s.id}>
                      <td>
                        {s.name}{spec && <span className="small dim"> ({spec} +2)</span>}
                        {aptitudeSkills.includes(s.id) && <span className="small good"> · Aptitude</span>}
                      </td>
                      <td className="num">{r}</td>
                      <td className="num">{pool(s.attr, r)}</td>
                    </tr>
                  )
                })}
                {skills.length === 0 && <tr><td colSpan={3} className="dim">None</td></tr>}
                {incompetentSkills.map(id => (
                  <tr key={id}><td className="dim">{SKILLS.find(s => s.id === id)?.name} <span className="small bad">· Incompetent</span></td><td className="num">—</td><td className="num">—</td></tr>
                ))}
              </tbody>
            </table>
            <h3>Knowledge & languages</h3>
            <p className="small">
              {[
                ...c.languages.map(l => `${l.name} (${l.native ? 'Native' : ['', 'Basic', 'Specialist', 'Expert'][Math.max(1, l.level)]})`),
                ...c.qualities.map(t => QUALITIES.find(q => q.id === t.id)?.grantsNativeLanguage).filter(Boolean).map(n => `${n} (Native)`),
                ...c.knowledge.map(k => k.name),
              ].join(', ') || '—'}
            </p>
          </div>
          <div>
            <h3>Qualities</h3>
            <ul className="plain small">
              {c.qualities.map(t => {
                const q = QUALITIES.find(x => x.id === t.id)
                if (!q) return null
                const variant = [q.options ? q.options[t.option ?? 0]?.label : q.maxLevel ? `level ${t.level}` : '', t.attr ? ATTR_NAMES[t.attr] : '', t.skill ? SKILLS.find(s => s.id === t.skill)?.name ?? '' : '']
                  .filter(Boolean).join(', ')
                return <li key={t.uid}>{q.name}{variant && ` (${variant})`}{t.detail && `: ${t.detail}`} <span className="dim mono">[{q.positive ? '−' : '+'}{takenQualityKarma(q, t)}]</span></li>
              })}
              {c.qualities.length === 0 && <li className="dim">None</li>}
            </ul>
            {(tradition || mentor || c.aspectedSkill) && (
              <>
                <h3>Magic</h3>
                <p className="small">
                  {[tradition && `${tradition.name} (drain ${ATTR_NAMES[tradition.drain[0]]} + ${ATTR_NAMES[tradition.drain[1]]})`, c.aspectedSkill && `Aspected: ${c.aspectedSkill}`, mentor && `Mentor: ${mentor.name}`].filter(Boolean).join(' · ')}
                </p>
              </>
            )}
          </div>
          <div>
            <h3>Contacts</h3>
            <ul className="plain small">
              {c.contacts.map(ct => <li key={ct.uid}>{ct.name || 'Unnamed'}{ct.role && `, ${ct.role}`} <span className="mono dim">C{ct.connection}/L{ct.loyalty}</span></li>)}
              {c.contacts.length === 0 && <li className="dim">None</li>}
            </ul>
            <h3>Lifestyle</h3>
            <p className="small">{lifestyle ? `${lifestyle.name} (${c.lifestyleMonths} month${c.lifestyleMonths > 1 ? 's' : ''} paid)` : '—'}</p>
          </div>
        </section>

        {(c.spells.length > 0 || c.adeptPowers.length > 0 || c.complexForms.length > 0) && (
          <section>
            {c.spells.length > 0 && (
              <>
                <h3>
                  Spells
                  {tradition && <span className="small dim"> · drain resistance {ATTR_NAMES[tradition.drain[0]]} + {ATTR_NAMES[tradition.drain[1]]} = <strong className="mono">{augmentedValue(c, tradition.drain[0] as AttrId, bonuses) + augmentedValue(c, tradition.drain[1] as AttrId, bonuses)}</strong></span>}
                </h3>
                <table className="compact">
                  <thead><tr><th>Spell</th><th>Category</th><th className="num">Type</th><th>Range</th><th>Duration</th><th className="num">Drain</th></tr></thead>
                  <tbody>
                    {c.spells.map(id => spellById(id)).filter(sp => !!sp).map(sp => (
                      <tr key={sp!.id}>
                        <td>{sp!.name}</td>
                        <td className="dim" style={{ textTransform: 'capitalize' }}>{sp!.category}</td>
                        <td className="num">{sp!.type === 'M' ? 'Mana' : 'Physical'}</td>
                        <td>{sp!.range}</td>
                        <td>{sp!.duration}</td>
                        <td className="num">{sp!.drain}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {c.adeptPowers.length > 0 && (
              <>
                <h3>Adept powers</h3>
                <table className="compact">
                  <thead><tr><th>Power</th><th className="num">Level</th><th className="num">PP</th></tr></thead>
                  <tbody>
                    {c.adeptPowers.map(t => {
                      const p = ADEPT_POWERS.find(x => x.id === t.id)
                      if (!p) return null
                      return (
                        <tr key={t.id}>
                          <td>{p.name}</td>
                          <td className="num">{p.maxLevel ? t.level : '—'}</td>
                          <td className="num">{p.cost * (p.maxLevel ? Math.max(1, t.level) : 1)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </>
            )}
            {c.complexForms.length > 0 && (
              <>
                <h3>
                  Complex forms
                  <span className="small dim"> · fading resistance Willpower + Logic = <strong className="mono">{augmentedValue(c, 'wil', bonuses) + augmentedValue(c, 'log', bonuses)}</strong></span>
                </h3>
                <table className="compact">
                  <thead><tr><th>Complex form</th><th>Duration</th><th className="num">Fade</th></tr></thead>
                  <tbody>
                    {c.complexForms.map(id => formById(id)).filter(f => !!f).map(f => (
                      <tr key={f!.id}><td>{f!.name}</td><td>{f!.duration}</td><td className="num">{f!.fade}</td></tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>
        )}

        <section>
          <h3>Gear</h3>
          <table className="compact">
            <tbody>
              {c.gear.map(g => {
                const item = gearItem(g.id)
                if (!item) return null
                return (
                  <tr key={g.uid}>
                    <td><GearName item={item} rating={g.rating} />{item.rated && ` (R${g.rating})`}{g.qty > 1 && ` ×${g.qty}`}</td>
                    <td className="small dim">{item.stats}</td>
                  </tr>
                )
              })}
              {c.gear.length === 0 && <tr><td className="dim">None</td></tr>}
            </tbody>
          </table>
        </section>

        {c.notes && <section><h3>Notes</h3><p className="small pre">{c.notes}</p></section>}

        <section className="sheet-grid no-print">
          <div>
            <h3>Karma spent</h3>
            <table className="compact">
              <tbody>
                {b.karmaBreakdown.filter(k => k.karma).map(k => <tr key={k.label}><td>{k.label}</td><td className="num">{k.karma}</td></tr>)}
                <tr><td><strong>Total</strong></td><td className="num"><strong>{b.karma.spent} / {b.karma.total}</strong></td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3>Nuyen spent</h3>
            <table className="compact">
              <tbody>
                {b.nuyenBreakdown.filter(k => k.nuyen).map(k => <tr key={k.label}><td>{k.label}</td><td className="num">{nuyen(k.nuyen)}</td></tr>)}
                <tr><td><strong>Total</strong></td><td className="num"><strong>{nuyen(b.nuyen.spent)} / {nuyen(b.nuyen.total)}</strong></td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </article>
    </div>
  )
}

function CM({ label, boxes }: { label: string; boxes: number }) {
  return (
    <div className="cm">
      <span className="small dim">{label} ({boxes})</span>
      <div className="cm-boxes">{Array.from({ length: boxes }, (_, i) => <span key={i} className="cm-box" />)}</div>
    </div>
  )
}
