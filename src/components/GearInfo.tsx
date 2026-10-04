import { GEAR_INFO } from '../data/gearInfo'
import { gearAvail, gearEssence, gearUnitCost } from '../engine/calc'
import type { GearItem } from '../engine/types'
import { nuyen } from './format'
import { InfoTip } from './InfoTip'

const LEGALITY: Record<string, string> = { L: 'Licensed', I: 'Illegal' }

/** Item name with a hover / tap popover describing the item. */
export function GearName({ item, rating }: { item: GearItem; rating?: number }) {
  return (
    <InfoTip label={item.name} content={() => <GearCard item={item} rating={rating} />}>
      <span className="gear-name">{item.name}</span>
    </InfoTip>
  )
}

function GearCard({ item, rating }: { item: GearItem; rating?: number }) {
  const info = GEAR_INFO[item.id]
  const r = item.rated ? rating ?? item.rated.min : undefined
  const ess = gearEssence(item, r)
  const facts: [string, string][] = [
    ['Availability', `${gearAvail(item, r)}${item.legality ? ` (${LEGALITY[item.legality]})` : ''}`],
    ['Cost', `${nuyen(gearUnitCost(item, r))}${item.rated ? ` at rating ${r}` : ''}`],
  ]
  if (ess) facts.push(['Essence', ess.toFixed(2)])
  if (item.rated) facts.push(['Rating', `${item.rated.min}–${item.rated.max}`])
  if (item.defense) facts.push(['Armor', `+${item.defense}${item.stacks ? ' (adds to worn armor)' : ''}`])

  return (
    <>
      <div className="infotip-head">
        <strong>{item.name}</strong>
        {item.subcategory && <span className="small dim">{item.subcategory}</span>}
      </div>
      {info?.summary ? <p className="infotip-body">{info.summary}</p> : <p className="infotip-body dim">No description yet.</p>}
      {item.stats && <p className="infotip-stats mono small">{item.stats}</p>}
      <dl className="infotip-facts small">
        {facts.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd className="mono">{v}</dd></div>))}
      </dl>
      {info?.page && <div className="small faint">Core Rulebook (Berlin) p. {info.page}</div>}
    </>
  )
}
