// Combat helpers: attack ratings, dice pools for attacks, and the AR-vs-DR Edge rule (Berlin City Edition p. 105).
import { TRADITIONS } from '../data'
import { augmentedValue, computeBonuses, computeDerived, effectiveMagic, gearItem, skillRating, skillSpecs } from './calc'
import type { AttrId, Character, GearItem } from './types'

export const RANGES = ['Close', 'Near', 'Medium', 'Far', 'Extreme'] as const
export type RangeBand = typeof RANGES[number]

/** Attack ratings per range band from a weapon's stat line ("AR 10/10/8/–/–"); null where the weapon can't reach. */
export function parseAttackRatings(item: GearItem): (number | null)[] | null {
  const m = item.stats?.match(/AR\s+([\d–\-/]+)/)
  if (!m) return null
  const parts = m[1].split('/').map(p => (/^\d+$/.test(p) ? Number(p) : null))
  while (parts.length < 5) parts.push(null)
  return parts.slice(0, 5)
}

export function parseDamage(item: GearItem): string | undefined {
  return item.stats?.match(/DV\s+([^·]+)/)?.[1].trim()
}

/** Which active skill a weapon uses. */
export function weaponSkill(item: GearItem): string {
  if (item.category === 'firearm') return 'firearms'
  if (item.subcategory === 'Throwing' || item.subcategory === 'Bows') return 'athletics'
  if (item.subcategory === 'Crossbows') return 'firearms'
  return 'close_combat'
}

/** Spell Attack Rating = Magic + tradition attribute (p. 130). */
export function spellAttackRating(c: Character): number | null {
  const t = TRADITIONS.find(x => x.id === c.tradition)
  if (!t || effectiveMagic(c) === 0) return null
  return effectiveMagic(c) + augmentedValue(c, t.drain[1] as AttrId)
}

export interface Attack {
  id: string
  name: string
  /** Attack rating per range band (unarmed and spells use a single rating). */
  ratings: (number | null)[]
  damage?: string
  pool?: number
  poolNote?: string
}

/** Every attack the character can make: unarmed, owned weapons, and combat spells. */
export function listAttacks(c: Character): Attack[] {
  const bonuses = computeBonuses(c)
  const d = computeDerived(c)
  const attrPool = (skill: string, attr: AttrId) => skillRating(c, skill) + augmentedValue(c, attr, bonuses)
  const out: Attack[] = [{
    id: 'unarmed',
    name: 'Unarmed',
    ratings: [d.unarmedAR, null, null, null, null],
    damage: d.unarmedDV,
    pool: attrPool('close_combat', 'agi'),
    poolNote: 'Close Combat + Agility',
  }]
  const seen = new Set<string>()
  for (const g of c.gear) {
    const item = gearItem(g.id)
    if (!item || seen.has(item.id) || (item.category !== 'firearm' && item.category !== 'melee')) continue
    const ratings = parseAttackRatings(item)
    if (!ratings) continue
    seen.add(item.id)
    const skill = weaponSkill(item)
    const specs = skillSpecs(c.skills[skill])
    out.push({
      id: item.id,
      name: item.name,
      ratings,
      damage: parseDamage(item),
      pool: attrPool(skill, 'agi'),
      poolNote: `${skill === 'firearms' ? 'Firearms' : skill === 'athletics' ? 'Athletics' : 'Close Combat'} + Agility${specs.length ? ` (+2 with ${specs.join(', ')})` : ''}`,
    })
  }
  const spellAR = spellAttackRating(c)
  if (spellAR !== null && skillRating(c, 'sorcery') + effectiveMagic(c) > 0) {
    out.push({
      id: 'spell',
      name: 'Combat spell',
      ratings: [spellAR, null, null, null, null],
      pool: skillRating(c, 'sorcery') + effectiveMagic(c),
      poolNote: 'Sorcery + Magic',
    })
  }
  return out
}

export type EdgeResult = 'attacker' | 'defender' | 'none'

/** If either rating is 4 or more higher than the other, that side gains 1 Edge (p. 105). */
export function edgeFromRatings(attackRating: number, defenseRating: number): EdgeResult {
  if (attackRating - defenseRating >= 4) return 'attacker'
  if (defenseRating - attackRating >= 4) return 'defender'
  return 'none'
}
