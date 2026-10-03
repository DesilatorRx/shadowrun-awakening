import { useMemo, useState } from 'react'
import { MAGIC_TYPE_NAMES, computeBudget, computeDerived, metatypeOf, remaining, type Pool } from '../engine/calc'
import type { Character } from '../engine/types'
import { validate, type StepId } from '../engine/validate'
import { downloadJson } from '../state/storage'
import { AttributesStep } from './steps/AttributesStep'
import { ConceptStep } from './steps/ConceptStep'
import { ContactsStep } from './steps/ContactsStep'
import { GearStep } from './steps/GearStep'
import { MagicStep } from './steps/MagicStep'
import { PrioritiesStep } from './steps/PrioritiesStep'
import { QualitiesStep } from './steps/QualitiesStep'
import { SheetStep } from './steps/SheetStep'
import { SkillsStep } from './steps/SkillsStep'
import { nuyen } from './format'
import type { Setter } from './ui'

const STEPS: { id: StepId; label: string }[] = [
  { id: 'concept', label: 'Concept' },
  { id: 'priorities', label: 'Priorities' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'magic', label: 'Magic / Resonance' },
  { id: 'qualities', label: 'Qualities' },
  { id: 'skills', label: 'Skills' },
  { id: 'gear', label: 'Gear' },
  { id: 'contacts', label: 'Contacts & Lifestyle' },
  { id: 'sheet', label: 'Character Sheet' },
]

export function Editor({ c, set, onClose }: { c: Character; set: Setter; onClose: () => void }) {
  const [step, setStep] = useState<StepId>('concept')
  const issues = useMemo(() => validate(c), [c])
  const idx = STEPS.findIndex(s => s.id === step)

  const props = { c, set }
  const body = {
    concept: <ConceptStep {...props} />,
    priorities: <PrioritiesStep {...props} />,
    attributes: <AttributesStep {...props} />,
    magic: <MagicStep {...props} />,
    qualities: <QualitiesStep {...props} />,
    skills: <SkillsStep {...props} />,
    gear: <GearStep {...props} />,
    contacts: <ContactsStep {...props} />,
    sheet: <SheetStep c={c} issues={issues} />,
  }[step]

  const stepIssues = issues.filter(i => i.step === step && step !== 'sheet')

  return (
    <div className="editor">
      <header className="topbar no-print">
        <button type="button" className="ghost" onClick={onClose}>← Runners</button>
        <strong className="topbar-name">{c.alias || c.name || 'New runner'}</strong>
        <span className="pill">{c.setting === 'berlin' ? 'Berlin' : c.setting === 'seattle' ? 'Seattle' : 'Core'}</span>
        <span className="spacer" />
        <button type="button" onClick={() => downloadJson(`${(c.alias || c.name || 'runner').replace(/[^\w-]+/g, '_')}.sr6.json`, c)}>Export JSON</button>
        <button type="button" onClick={() => { setStep('sheet'); setTimeout(() => window.print(), 50) }}>Print</button>
      </header>

      <div className="editor-body">
        <nav className="steps no-print" aria-label="Creation steps">
          <ol>
            {STEPS.map((s, i) => {
              const errs = issues.filter(x => x.step === s.id && x.severity === 'error').length
              const warns = issues.filter(x => x.step === s.id && x.severity === 'warning').length
              return (
                <li key={s.id}>
                  <button type="button" className={`step ${step === s.id ? 'current' : ''}`} aria-label={`Step ${i + 1}: ${s.label}`} title={s.label} aria-current={step === s.id ? 'step' : undefined} onClick={() => setStep(s.id)}>
                    <span className="step-num mono">{i + 1}</span>
                    <span className="step-label">{s.label}</span>
                    {errs > 0 ? <span className="badge bad" title={`${errs} errors`}>{errs}</span>
                      : warns > 0 ? <span className="badge warn" title={`${warns} warnings`}>{warns}</span>
                        : null}
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <main className="step-main">
          <h2 className="no-print">{STEPS[idx].label}</h2>
          {stepIssues.length > 0 && (
            <ul className="issue-list no-print">
              {stepIssues.map((i, n) => <li key={n} className={i.severity === 'error' ? 'bad' : 'warn'}>{i.severity === 'error' ? '✖' : '!'} {i.message}</li>)}
            </ul>
          )}
          {body}
          <div className="row step-nav no-print">
            <button type="button" disabled={idx === 0} onClick={() => setStep(STEPS[idx - 1].id)}>← {STEPS[idx - 1]?.label ?? 'Back'}</button>
            <span className="spacer" />
            {idx < STEPS.length - 1 && <button type="button" className="primary" onClick={() => setStep(STEPS[idx + 1].id)}>{STEPS[idx + 1].label} →</button>}
          </div>
        </main>

        <BudgetPanel c={c} />
      </div>
    </div>
  )
}

function BudgetPanel({ c }: { c: Character }) {
  const b = computeBudget(c)
  const d = computeDerived(c)
  const meta = metatypeOf(c)
  const row = (label: string, p: Pool, unit = '') => {
    const left = remaining(p)
    const pct = p.total > 0 ? Math.min(100, (p.spent / p.total) * 100) : 0
    return (
      <div className="budget-row" key={label}>
        <div className="row">
          <span className="dim small">{label}</span>
          <span className="spacer" />
          <span className={`mono ${left < 0 ? 'bad' : left === 0 ? 'good' : ''}`}>{unit === '¥' ? nuyen(left) : left}</span>
        </div>
        <div className="bar"><div className={`bar-fill ${left < 0 ? 'over' : ''}`} style={{ width: `${pct}%` }} /></div>
      </div>
    )
  }
  return (
    <aside className="budget no-print" aria-label="Remaining resources">
      <h3>Remaining</h3>
      {row('Adjustment points', b.adjustment)}
      {row('Attribute points', b.attributes)}
      {row('Skill points', b.skills)}
      {row('Karma', b.karma)}
      {row('Nuyen', b.nuyen, '¥')}
      {b.freeSpells.total > 0 && row('Free spells', b.freeSpells)}
      {b.freeForms.total > 0 && row('Free complex forms', b.freeForms)}
      {b.powerPoints.total > 0 && row('Power points', b.powerPoints)}
      {row('Knowledge / languages', b.freeKnowledge)}
      {row('Contact points', b.contacts)}
      <h3>At a glance</h3>
      <dl className="glance">
        <dt>Metatype</dt><dd>{meta.name}</dd>
        <dt>Type</dt><dd>{MAGIC_TYPE_NAMES[c.magicType]}</dd>
        <dt>Initiative</dt><dd className="mono">{d.initiative}</dd>
        <dt>Defense</dt><dd className="mono">{d.defenseRating}</dd>
        <dt>Phys / Stun</dt><dd className="mono">{d.physicalCM} / {d.stunCM}</dd>
        <dt>Essence</dt><dd className="mono">{d.essence.toFixed(2)}</dd>
        {d.magic > 0 && <><dt>Magic</dt><dd className="mono magic">{d.magic}</dd></>}
        {d.resonance > 0 && <><dt>Resonance</dt><dd className="mono magic">{d.resonance}</dd></>}
      </dl>
    </aside>
  )
}
