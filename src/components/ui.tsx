import type { ReactNode } from 'react'
import type { Character } from '../engine/types'

export type Setter = (fn: (c: Character) => Character) => void
export interface StepProps { c: Character; set: Setter }

export function Stepper({ value, onChange, min = 0, max = 99, label, disabledUp }: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  label?: string
  /** Extra condition blocking the increase (e.g. no points left). */
  disabledUp?: boolean
}) {
  return (
    <span className="stepper" aria-label={label}>
      <button type="button" className="ghost" aria-label={`Decrease ${label ?? ''}`} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
      <span className="mono stepper-val">{value}</span>
      <button type="button" className="ghost" aria-label={`Increase ${label ?? ''}`} disabled={value >= max || disabledUp} onClick={() => onChange(value + 1)}>+</button>
    </span>
  )
}

export function Dots({ value, max, min = 0 }: { value: number; max: number; min?: number }) {
  return (
    <span className="dots" aria-label={`${value} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < min ? 'dot base' : i < value ? 'dot on' : 'dot'} />
      ))}
    </span>
  )
}

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      <div className="row section-head">
        <h3>{title}</h3>
        <span className="spacer" />
        {aside}
      </div>
      {children}
    </section>
  )
}

export function PoolBadge({ label, total, spent, unit = '' }: { label: string; total: number; spent: number; unit?: string }) {
  const left = total - spent
  const cls = left < 0 ? 'bad' : left === 0 ? 'good' : 'warn'
  return (
    <span className="pool-badge">
      <span className="dim">{label}</span>{' '}
      <span className={`mono ${cls}`}>{left.toLocaleString()}{unit}</span>
      <span className="faint mono"> / {total.toLocaleString()}{unit}</span>
    </span>
  )
}
