import { describe, expect, it } from 'vitest'
import { GEAR } from '../data'
import { newCharacter, uid } from '../state/store'
import { attrRange, attrValue, augmentedValue, computeBudget, computeDerived, freeSpellCount, stepCost } from './calc'
import type { Character } from './types'
import { validate } from './validate'

const make = (fn: (c: Character) => void = () => {}) => {
  const c = newCharacter('core')
  fn(c)
  return c
}
const errors = (c: Character) => validate(c).filter(i => i.severity === 'error').map(i => i.message)

describe('stepCost', () => {
  it('sums new rating × factor for each step', () => {
    expect(stepCost(1, 3, 5)).toBe(2 * 5 + 3 * 5)
    expect(stepCost(4, 4, 5)).toBe(0)
  })
})

describe('budgets', () => {
  it('reads pools from the priority table', () => {
    const b = computeBudget(make())
    // default priorities: metatype D (human 4), attributes A, skills B, resources C
    expect(b.adjustment.total).toBe(4)
    expect(b.attributes.total).toBe(24)
    expect(b.skills.total).toBe(24)
    expect(b.nuyen.total).toBe(150_000)
    expect(b.karma.total).toBe(50)
  })

  it('charges karma for attribute steps on top of points', () => {
    const c = make(c => { c.attributes.bod = { points: 2, adjust: 0, karma: 1 } })
    expect(attrValue(c, 'bod')).toBe(4)
    expect(computeBudget(c).karma.spent).toBe(20) // 4 × 5
  })

  it('charges karma for skills and karma-bought specializations', () => {
    const c = make(c => { c.skills.firearms = { points: 4, karma: 1, specialization: 'Rifles', specKarma: true } })
    const b = computeBudget(c)
    expect(b.skills.spent).toBe(4)
    expect(b.karma.spent).toBe(5 * 5 + 5)
  })

  it('counts skill-point specializations against skill points', () => {
    const c = make(c => { c.skills.stealth = { points: 3, karma: 0, specialization: 'Sneaking' } })
    expect(computeBudget(c).skills.spent).toBe(4)
  })

  it('adds negative quality karma to the pool and converts karma to nuyen', () => {
    const c = make(c => {
      c.qualities.push({ uid: uid(), id: 'bad_luck', level: 1 })
      c.karmaToNuyen = 5
    })
    const b = computeBudget(c)
    expect(b.karma.total).toBe(60)
    expect(b.karma.spent).toBe(5)
    expect(b.nuyen.total).toBe(150_000 + 10_000)
  })

  it('prices Allergy by its chosen variant', () => {
    const c = make(c => { c.qualities.push({ uid: uid(), id: 'allergy', level: 1, option: 9 }) }) // Uncommon, Severe
    expect(computeBudget(c).negativeQualityKarma).toBe(11)
  })

  it('charges knowledge beyond Logic free slots', () => {
    const c = make(c => {
      c.knowledge = [1, 2, 3].map(n => ({ id: String(n), name: `K${n}` })) // Logic 1 → 1 free
    })
    expect(computeBudget(c).karma.spent).toBe(6)
  })
})

describe('magic', () => {
  it('gives full magicians 2 free spells per priority Magic', () => {
    const c = make(c => { c.priorities = { metatype: 'D', attributes: 'B', magic: 'A', skills: 'C', resources: 'E' }; c.magicType = 'magician' })
    expect(freeSpellCount(c)).toBe(8)
  })

  it('splits mystic adept Magic between power points and spells', () => {
    const c = make(c => {
      c.priorities = { metatype: 'D', attributes: 'B', magic: 'A', skills: 'C', resources: 'E' }
      c.magicType = 'mysticAdept'
      c.powerPointsBought = 1
    })
    expect(freeSpellCount(c)).toBe(6)
    expect(computeBudget(c).powerPoints.total).toBe(1)
  })

  it('gives adepts power points equal to Magic', () => {
    const c = make(c => {
      c.priorities = { metatype: 'D', attributes: 'B', magic: 'A', skills: 'C', resources: 'E' }
      c.magicType = 'adept'
      c.magic = { points: 0, adjust: 1, karma: 0 }
    })
    expect(computeBudget(c).powerPoints.total).toBe(5)
  })

  it('reduces Magic for essence loss', () => {
    const c = make(c => {
      c.priorities = { metatype: 'D', attributes: 'B', magic: 'A', skills: 'C', resources: 'E' }
      c.magicType = 'adept'
      c.gear.push({ uid: uid(), id: 'datajack', qty: 1 })
    })
    expect(computeDerived(c).essence).toBe(5.9)
    expect(computeDerived(c).magic).toBe(3)
  })
})

describe('derived stats', () => {
  it('applies troll Built Tough, dermal deposits, and armor stacking', () => {
    const c = make(c => {
      c.priorities = { metatype: 'A', attributes: 'B', magic: 'E', skills: 'C', resources: 'D' }
      c.metatype = 'troll'
      c.attributes.bod = { points: 4, adjust: 0, karma: 0 } // 5
      c.gear.push({ uid: uid(), id: 'armor_jacket', qty: 1 }, { uid: uid(), id: 'armor_vest', qty: 1 }, { uid: uid(), id: 'helmet', qty: 1 })
    })
    const d = computeDerived(c)
    expect(d.physicalCM).toBe(8 + 3 + 2)
    expect(d.overflow).toBe(10)
    expect(d.armor).toBe(4 + 1) // best body armor + helmet
    expect(d.defenseRating).toBe(5 + 5 + 1)
  })

  it('uses SR6 attribute-only test formulas', () => {
    const c = make(c => {
      c.attributes.wil = { points: 2, adjust: 0, karma: 0 }
      c.attributes.int = { points: 3, adjust: 0, karma: 0 }
      c.attributes.cha = { points: 1, adjust: 0, karma: 0 }
    })
    const d = computeDerived(c)
    expect(d.composure).toBe(3 + 2)
    expect(d.judgeIntentions).toBe(3 + 4)
    expect(d.stunCM).toBe(8 + 2)
  })
})

describe('Berlin City Edition (2023) rules as written', () => {
  it('defaults new characters to the book rules', () => {
    const c = newCharacter('seattle')
    expect(c.options).toEqual({ maxAvailability: 6, karmaSpellsAtCreation: false, karmaForContacts: false, powerLevel: 'standard' })
  })

  it('uses Logic + Intuition + 2D6 astral initiative (p. 161)', () => {
    const c = make(c => {
      c.attributes.log = { points: 2, adjust: 0, karma: 0 }
      c.attributes.int = { points: 1, adjust: 0, karma: 0 }
    })
    expect(computeDerived(c).astralInit).toBe('5 + 2D6')
  })

  it('allows only one skill at the creation maximum (p. 65)', () => {
    const c = make(c => {
      c.skills.firearms = { points: 6, karma: 0 }
      c.skills.stealth = { points: 6, karma: 0 }
    })
    expect(errors(c).some(m => m.includes('Only 1 skill may be at the creation maximum'))).toBe(true)
  })

  it('caps leftover nuyen at 5,000 (p. 68)', () => {
    const c = make(c => { c.lifestyle = 'low' })
    expect(errors(c).some(m => m.includes('at most 5,000'))).toBe(true)
  })

  it('applies Exceptional and Impaired to attribute maximums', () => {
    const c = make(c => {
      c.qualities.push({ uid: uid(), id: 'exceptional_attribute', level: 1, attr: 'agi' })
      c.qualities.push({ uid: uid(), id: 'impaired', level: 6, attr: 'str' })
    })
    expect(attrRange(c, 'agi').max).toBe(7)
    expect(attrRange(c, 'str').max).toBe(2)
  })

  it('never drops Stun below 2 boxes with Glass Jaw (p. 77)', () => {
    const c = make(c => {
      c.qualities.push({ uid: uid(), id: 'glass_jaw', level: 6 }, { uid: uid(), id: 'glass_jaw', level: 6 })
    })
    expect(computeDerived(c).stunCM).toBe(2)
  })

  it('lets Berlin qualities grant a second native language', () => {
    const c = make(c => { c.qualities.push({ uid: uid(), id: 'agent_of_flux', level: 1 }) })
    expect(errors(c).some(m => m.includes('native language'))).toBe(false)
    c.languages.push({ id: 'x', name: 'Turkish', native: true, level: 0 })
    expect(errors(c).some(m => m.includes('Only one native language'))).toBe(true)
  })
})

describe('level of play (p. 63)', () => {
  it('street level pays each priority from the row below, E stays E', () => {
    const c = make(c => {
      c.options.powerLevel = 'street'
      c.priorities = { metatype: 'B', attributes: 'A', magic: 'E', skills: 'C', resources: 'D' }
      c.metatype = 'elf'
    })
    const b = computeBudget(c)
    expect(b.attributes.total).toBe(16) // A pays B
    expect(b.skills.total).toBe(16) // C pays D
    expect(b.nuyen.total).toBe(8_000) // D pays E
    expect(b.adjustment.total).toBe(9) // elf at B pays C
  })

  it('prime runners get 100 karma', () => {
    const c = make(c => { c.options.powerLevel = 'prime' })
    expect(computeBudget(c).karma.total).toBe(100)
  })

  it('keeps the creation availability cap at 6 (p. 66)', () => {
    expect(newCharacter('berlin').options.maxAvailability).toBe(6)
  })
})

describe('augmentation effects', () => {
  it('adds dermal plating rating and armor to Defense Rating', () => {
    const c = make(c => {
      c.attributes.bod = { points: 2, adjust: 0, karma: 0 } // 3
      c.gear.push({ uid: uid(), id: 'dermal_plating', qty: 1, rating: 3 }, { uid: uid(), id: 'armor_jacket', qty: 1 })
    })
    expect(computeDerived(c).defenseRating).toBe(3 + 4 + 3)
  })

  it('raises Reaction and Initiative Dice with wired reflexes', () => {
    const c = make(c => {
      c.attributes.rea = { points: 2, adjust: 0, karma: 0 } // 3
      c.attributes.int = { points: 1, adjust: 0, karma: 0 } // 2
      c.gear.push({ uid: uid(), id: 'wired_reflexes_2', qty: 1 })
    })
    expect(computeDerived(c).initiative).toBe('7 + 3D6')
  })

  it('caps augmentation at +4 and Initiative Dice at 5D6', () => {
    const c = make(c => {
      c.gear.push({ uid: uid(), id: 'wired_reflexes_4', qty: 1 }, { uid: uid(), id: 'reaction_enhancers', qty: 1, rating: 4 })
    })
    expect(augmentedValue(c, 'rea')).toBe(1 + 4)
    expect(computeDerived(c).initDice).toBe(5)
  })

  it('applies bone lacing to Defense Rating and unarmed attacks', () => {
    const c = make(c => { c.gear.push({ uid: uid(), id: 'bone_lacing_titanium', qty: 1 }) })
    const d = computeDerived(c)
    expect(d.defenseRating).toBe(1 + 2)
    expect(d.unarmedAR).toBe(1 + 1 + 3)
    expect(d.unarmedDV).toBe('4P')
  })

  it('applies adept Improved Reflexes and Mystic Armor', () => {
    const c = make(c => {
      c.priorities = { metatype: 'D', attributes: 'B', magic: 'A', skills: 'C', resources: 'E' }
      c.magicType = 'adept'
      c.adeptPowers = [{ id: 'improved_reflexes', level: 2 }, { id: 'mystic_armor', level: 2 }]
    })
    const d = computeDerived(c)
    expect(d.initiative).toBe('4 + 3D6')
    expect(d.defenseRating).toBe(1 + 2)
  })
})

describe('validation', () => {
  it('flags adjustment points on attributes the metatype does not raise', () => {
    const c = make(c => { c.attributes.str = { points: 0, adjust: 1, karma: 0 } })
    expect(errors(c).some(m => m.includes("Adjustment points can't raise Strength"))).toBe(true)
  })

  it('allows only one attribute at its natural maximum', () => {
    const c = make(c => {
      c.attributes.agi = { points: 5, adjust: 0, karma: 0 }
      c.attributes.rea = { points: 5, adjust: 0, karma: 0 }
    })
    expect(errors(c).some(m => m.includes('natural maximum'))).toBe(true)
  })

  it('caps qualities at six and net bonus karma at 20', () => {
    const c = make(c => {
      for (const id of ['bad_luck', 'ar_vertigo', 'astral_beacon', 'honorbound', 'incompetent', 'low_pain_tolerance', 'gremlins'])
        c.qualities.push({ uid: uid(), id, level: 1, detail: 'x' })
    })
    const e = errors(c)
    expect(e.some(m => m.includes('At most 6 qualities'))).toBe(true)
    expect(e.some(m => m.includes('the limit is 20'))).toBe(true)
  })

  it('enforces the table availability limit', () => {
    GEAR.push({ id: 'test_rare', name: 'Test Rare Item', category: 'misc', cost: 1, avail: 7, legality: 'I' })
    const c = make(c => { c.gear.push({ uid: uid(), id: 'wired_reflexes_4', qty: 1 }) })
    expect(errors(c).some(m => m.includes('Availability'))).toBe(false)
    c.gear.push({ uid: uid(), id: 'test_rare', qty: 1 })
    expect(errors(c).some(m => m.includes('Test Rare Item has Availability 7'))).toBe(true)
    c.options.maxAvailability = 7
    expect(errors(c).some(m => m.includes('Test Rare Item'))).toBe(false)
    GEAR.pop()
  })

  it('blocks extra spells unless the table allows karma purchases', () => {
    const c = make(c => {
      c.priorities = { metatype: 'D', attributes: 'B', magic: 'D', skills: 'C', resources: 'A' }
      c.magicType = 'magician'
      c.tradition = 'hermetic'
      c.spells = ['manabolt', 'stunbolt', 'heal']
    })
    expect(errors(c).some(m => m.includes('extra spells'))).toBe(true)
    c.options.karmaSpellsAtCreation = true
    expect(errors(c).some(m => m.includes('extra spells'))).toBe(false)
    expect(computeBudget(c).karma.spent).toBe(5)
  })

  it('allows each augmentation only once (implant weapons twice)', () => {
    const c = make(c => {
      c.gear.push({ uid: uid(), id: 'datajack', qty: 1 }, { uid: uid(), id: 'datajack', qty: 1 })
      c.gear.push({ uid: uid(), id: 'handblade', qty: 2 })
      c.gear.push({ uid: uid(), id: 'ammo_light', qty: 40 })
    })
    const e = errors(c)
    expect(e.some(m => m.includes('Datajack can only be installed once'))).toBe(true)
    expect(e.some(m => m.includes('Handblade'))).toBe(false)
    expect(e.some(m => m.includes('Ammo'))).toBe(false)
  })

  it('blocks augmentations the book says are incompatible', () => {
    const c = make(c => {
      c.gear.push({ uid: uid(), id: 'bone_lacing_titanium', qty: 1 }, { uid: uid(), id: 'bone_lacing_plastic', qty: 1 })
      c.gear.push({ uid: uid(), id: 'synaptic_booster', qty: 1, rating: 1 }, { uid: uid(), id: 'wired_reflexes_1', qty: 1 })
    })
    const e = errors(c)
    expect(e.filter(m => m.includes("can't be combined")).length).toBe(2)
  })

  it('lets wired reflexes run with reaction enhancers (wireless) with a warning', () => {
    const c = make(c => { c.gear.push({ uid: uid(), id: 'wired_reflexes_1', qty: 1 }, { uid: uid(), id: 'reaction_enhancers', qty: 1, rating: 1 }) })
    expect(errors(c).some(m => m.includes("can't be combined"))).toBe(false)
    expect(validate(c).some(i => i.message.includes('wireless'))).toBe(true)
  })

  it('lets the Aptitude skill start at 7, and only that skill', () => {
    const c = make(c => {
      c.qualities.push({ uid: uid(), id: 'aptitude', level: 1, skill: 'firearms' })
      c.skills.firearms = { points: 7, karma: 0 }
      c.skills.stealth = { points: 7, karma: 0 }
    })
    const e = errors(c)
    expect(e.some(m => m.includes('Firearms 7 exceeds'))).toBe(false)
    expect(e.some(m => m.includes('Stealth 7 exceeds the creation maximum of 6'))).toBe(true)
  })

  it('forbids ranks in an Incompetent skill and requires a skill choice', () => {
    const c = make(c => {
      c.qualities.push({ uid: uid(), id: 'incompetent', level: 1, skill: 'con' })
      c.qualities.push({ uid: uid(), id: 'aptitude', level: 1 })
      c.skills.con = { points: 1, karma: 0 }
    })
    const e = errors(c)
    expect(e.some(m => m.includes("Incompetent in this skill"))).toBe(true)
    expect(e.some(m => m.includes('Aptitude: choose a skill'))).toBe(true)
  })

  it('warns when Exotic Weapons has no named weapon and charges per weapon', () => {
    const c = make(c => { c.skills.exotic_weapons = { points: 2, karma: 0 } })
    expect(errors(c).some(m => m.includes('Exotic Weapons'))).toBe(false)
    expect(validate(c).some(i => i.severity === 'warning' && i.message.includes('no weapon named'))).toBe(true)
    c.skills.exotic_weapons = { points: 2, karma: 0, specialization: 'Blowgun', extraSpecs: ['Bolas'] }
    expect(errors(c).some(m => m.includes('Exotic Weapons'))).toBe(false)
    expect(computeBudget(c).skills.spent).toBe(2 + 2)
  })

  it('allows only one specialization on other skills, custom names welcome', () => {
    const c = make(c => { c.skills.influence = { points: 3, karma: 0, specialization: 'Haggling with Kiez bosses' } })
    expect(errors(c).some(m => m.includes('Influence'))).toBe(false)
    c.skills.influence.extraSpecs = ['Leadership']
    expect(errors(c).some(m => m.includes('only one specialization per skill'))).toBe(true)
  })

  it('requires each priority letter exactly once', () => {
    const c = make(c => { c.priorities.skills = 'A' })
    expect(errors(c).some(m => m.includes('exactly once'))).toBe(true)
  })

  it('caps contact ratings at Charisma', () => {
    const c = make(c => { c.contacts.push({ uid: uid(), name: 'Mama Zita', role: 'Fixer', connection: 3, loyalty: 1 }) })
    expect(errors(c).some(m => m.includes("can't exceed Charisma"))).toBe(true)
  })
})
