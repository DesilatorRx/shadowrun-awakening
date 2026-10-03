import { LIFESTYLES } from '../../data'
import { attrValue, computeBudget } from '../../engine/calc'
import type { Contact } from '../../engine/types'
import { uid } from '../../state/store'
import { PoolBadge, Section, Stepper, type StepProps } from '../ui'
import { nuyen } from '../format'

const BERLIN_ROLES = ['Fixer', 'Kiez Boss', 'Flux State Anarchist', 'Street Doc', 'Talismonger', 'Fence', 'Bartender', 'Corp Wageslave', 'Bundespolizei Officer', 'Smuggler', 'Decker', 'Vory Lieutenant']
const GENERIC_ROLES = ['Fixer', 'Street Doc', 'Talismonger', 'Fence', 'Bartender', 'Mr. Johnson', 'Cop', 'Gang Leader', 'Smuggler', 'Decker', 'Rigger', 'Corp Wageslave']

export function ContactsStep({ c, set }: StepProps) {
  const b = computeBudget(c)
  const cha = attrValue(c, 'cha')
  const roles = c.setting === 'berlin' ? BERLIN_ROLES : GENERIC_ROLES

  const patch = (id: string, p: Partial<Contact>) =>
    set(ch => ({ ...ch, contacts: ch.contacts.map(x => (x.uid === id ? { ...x, ...p } : x)) }))

  return (
    <div className="stack">
      <Section
        title="Contacts"
        aside={<span className="row"><PoolBadge label="Contact points" total={b.contacts.total} spent={b.contacts.spent} /><PoolBadge label="Karma" total={b.karma.total} spent={b.karma.spent} /></span>}
      >
        <p className="small dim">
          Free points = Charisma × 6 ({b.contacts.total}). Each contact costs Connection + Loyalty; neither may exceed your Charisma ({cha}) at creation.
        </p>
        <datalist id="contact-roles">{roles.map(r => <option key={r} value={r} />)}</datalist>
        <div className="table-wrap">
          <table>
            {c.contacts.length > 0 && (
              <thead><tr><th>Name</th><th>Role</th><th className="num">Connection</th><th className="num">Loyalty</th><th /></tr></thead>
            )}
            <tbody>
              {c.contacts.map(ct => (
                <tr key={ct.uid}>
                  <td><input type="text" aria-label="Contact name" placeholder="Name" value={ct.name} onChange={e => patch(ct.uid, { name: e.target.value })} /></td>
                  <td><input type="text" aria-label="Contact role" list="contact-roles" placeholder="Role" value={ct.role} onChange={e => patch(ct.uid, { role: e.target.value })} /></td>
                  <td className="num"><Stepper label="Connection" value={ct.connection} min={1} max={cha} onChange={v => patch(ct.uid, { connection: v })} /></td>
                  <td className="num"><Stepper label="Loyalty" value={ct.loyalty} min={1} max={cha} onChange={v => patch(ct.uid, { loyalty: v })} /></td>
                  <td><button type="button" className="ghost danger small" onClick={() => set(ch => ({ ...ch, contacts: ch.contacts.filter(x => x.uid !== ct.uid) }))}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => set(ch => ({ ...ch, contacts: [...ch.contacts, { uid: uid(), name: '', role: '', connection: 1, loyalty: 1 }] }))}>
          + Add contact
        </button>
      </Section>

      <Section title="Lifestyle">
        <div className="choice-grid">
          {LIFESTYLES.map(l => (
            <button
              type="button"
              key={l.id}
              className={`choice ${c.lifestyle === l.id ? 'selected' : ''}`}
              aria-pressed={c.lifestyle === l.id}
              onClick={() => set(ch => ({ ...ch, lifestyle: l.id }))}
            >
              <strong>{l.name}</strong>
              <span className="small dim mono">{nuyen(l.cost)} / month</span>
            </button>
          ))}
        </div>
        <div className="row">
          <span>Months prepaid:</span>
          <Stepper label="Months prepaid" value={c.lifestyleMonths} min={1} max={12} onChange={v => set(ch => ({ ...ch, lifestyleMonths: v }))} />
        </div>
      </Section>
    </div>
  )
}
