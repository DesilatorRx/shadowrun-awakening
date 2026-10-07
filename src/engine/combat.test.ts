import { describe, expect, it } from 'vitest'
import { GEAR } from '../data'
import { newCharacter, uid } from '../state/store'
import { edgeFromRatings, listAttacks, parseAttackRatings, spellAttackRating } from './combat'

describe('AR vs DR Edge (p. 105)', () => {
  it('gives Edge to whichever side is 4 or more higher', () => {
    expect(edgeFromRatings(8, 4)).toBe('attacker')
    expect(edgeFromRatings(4, 8)).toBe('defender')
    expect(edgeFromRatings(10, 7)).toBe('none')
    expect(edgeFromRatings(7, 10)).toBe('none')
  })
})

describe('attack ratings', () => {
  it('parses weapon ARs by range band', () => {
    const predator = GEAR.find(g => g.id === 'ares_predator_vi')!
    expect(parseAttackRatings(predator)).toEqual([10, 10, 8, null, null])
  })

  it('uses Magic + tradition attribute for spells (p. 130)', () => {
    const c = newCharacter('berlin')
    c.priorities = { metatype: 'D', attributes: 'B', magic: 'A', skills: 'C', resources: 'E' }
    c.magicType = 'magician'
    c.tradition = 'shamanic'
    c.attributes.cha = { points: 4, adjust: 0, karma: 0 } // 5
    expect(spellAttackRating(c)).toBe(4 + 5)
  })

  it('lists unarmed, owned weapons and spells with dice pools', () => {
    const c = newCharacter('berlin')
    c.attributes.agi = { points: 3, adjust: 0, karma: 0 } // 4
    c.skills.firearms = { points: 4, karma: 0, specialization: 'Heavy Pistols' }
    c.gear.push({ uid: uid(), id: 'ares_predator_vi', qty: 1 })
    const attacks = listAttacks(c)
    const gun = attacks.find(a => a.id === 'ares_predator_vi')!
    expect(gun.pool).toBe(8)
    expect(gun.poolNote).toContain('Heavy Pistols')
    expect(attacks[0].name).toBe('Unarmed')
  })
})
