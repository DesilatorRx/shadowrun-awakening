import {
  ADEPT_POWERS, COMPLEX_FORMS, GEAR, LIFESTYLES, METATYPES, PRIORITY_TABLE, QUALITIES, SKILLS, SPELLS,
} from '../data'
import { RULES } from './rules'
import type {
  AnyAttrId, AttrAlloc, AttrId, Character, GearItem, ItemEffects, MagicOption, MagicType, Metatype, OwnedGear,
  Priority, PriorityCategory, PriorityRow, Quality, Range, TakenQuality,
} from './types'
import { ATTRS } from './types'

export const ATTR_NAMES: Record<AnyAttrId, string> = {
  bod: 'Body', agi: 'Agility', rea: 'Reaction', str: 'Strength',
  wil: 'Willpower', log: 'Logic', int: 'Intuition', cha: 'Charisma',
  edg: 'Edge', mag: 'Magic', res: 'Resonance',
}

export const MAGIC_TYPE_NAMES: Record<MagicType, string> = {
  mundane: 'Mundane',
  magician: 'Full Magician',
  aspected: 'Aspected Magician',
  mysticAdept: 'Mystic Adept',
  adept: 'Adept',
  technomancer: 'Technomancer',
}

export const isAwakened = (t: MagicType) => t !== 'mundane' && t !== 'technomancer'
export const castsSpells = (t: MagicType) => t === 'magician' || t === 'mysticAdept' || t === 'aspected'
export const hasPowers = (t: MagicType) => t === 'adept' || t === 'mysticAdept'

export function priorityRow(p: Priority): PriorityRow {
  return PRIORITY_TABLE.find(r => r.priority === p)!
}

export function rowFor(c: Character, cat: PriorityCategory): PriorityRow {
  return priorityRow(c.priorities[cat])
}

export function metatypeOf(c: Character): Metatype {
  return METATYPES.find(m => m.id === c.metatype) ?? METATYPES[0]
}

export function magicOption(c: Character): MagicOption | undefined {
  return rowFor(c, 'magic').magic.find(o => o.type === c.magicType)
}

// ---------------------------------------------------------------------------
// Attributes

const allocTotal = (a: AttrAlloc) => a.points + a.adjust + a.karma

/** Sum of rating × factor for each rating stepped through from `from` (exclusive) to `to` (inclusive). */
export function stepCost(from: number, to: number, factor: number): number {
  let sum = 0
  for (let r = from + 1; r <= to; r++) sum += r * factor
  return sum
}

/** Metatype range, adjusted by Exceptional (+1 max) and Impaired (−1 max per level, not below 2). */
export function attrRange(c: Character, a: AttrId | 'edg'): Range {
  const base = metatypeOf(c).attributes[a]
  let delta = 0
  for (const t of c.qualities) {
    if (t.attr !== a) continue
    const q = QUALITIES.find(x => x.id === t.id)
    if (q?.attrMaxPerLevel) delta += q.attrMaxPerLevel * (q.maxLevel ? Math.max(1, t.level) : 1)
  }
  const max = delta < 0 ? Math.max(2, base.max + delta) : base.max + delta
  return { min: base.min, max }
}

export function attrValue(c: Character, a: AttrId): number {
  return attrRange(c, a).min + allocTotal(c.attributes[a])
}

export function edgeValue(c: Character): number {
  return attrRange(c, 'edg').min + allocTotal(c.edge)
}

/** Starting Magic from the priority table (0 when not Awakened). */
export function magicBase(c: Character): number {
  const opt = magicOption(c)
  return opt && isAwakened(opt.type) ? opt.rating : 0
}

export function resonanceBase(c: Character): number {
  const opt = magicOption(c)
  return opt?.type === 'technomancer' ? opt.rating : 0
}

/** Magic before essence loss. */
export function magicValue(c: Character): number {
  return isAwakened(c.magicType) ? magicBase(c) + allocTotal(c.magic) : 0
}

export function resonanceValue(c: Character): number {
  return c.magicType === 'technomancer' ? resonanceBase(c) + allocTotal(c.resonance) : 0
}

/** Karma spent on an attribute: karma steps are the highest ratings. */
function attrKarmaCost(base: number, alloc: AttrAlloc): number {
  const beforeKarma = base + alloc.points + alloc.adjust
  return stepCost(beforeKarma, beforeKarma + alloc.karma, RULES.attributeKarmaPerRating)
}

// ---------------------------------------------------------------------------
// Skills

/** Skill chosen for a skill quality (falls back to matching free-text detail from older saves). */
export function qualitySkill(c: Character, qualityId: string): string[] {
  return c.qualities.filter(t => t.id === qualityId).map(t => {
    if (t.skill) return t.skill
    const d = t.detail?.toLowerCase() ?? ''
    return SKILLS.find(s => d.includes(s.name.toLowerCase()))?.id ?? ''
  }).filter(Boolean)
}

/** Highest rank a skill may have at creation: 6, or 7 with Aptitude, or 0 with Incompetent (pp. 65, 70, 76). */
export function skillCap(c: Character, id: string): number {
  if (qualitySkill(c, 'incompetent').includes(id)) return 0
  return RULES.maxSkillRating + (qualitySkill(c, 'aptitude').includes(id) ? 1 : 0)
}

export function skillRating(c: Character, id: string): number {
  const s = c.skills[id]
  return s ? s.points + s.karma : 0
}

/** All specializations on a skill (Exotic Weapons may have several). */
export function skillSpecs(s: { specialization?: string; extraSpecs?: string[] } | undefined): string[] {
  if (!s) return []
  return [s.specialization, ...(s.extraSpecs ?? [])].filter((x): x is string => !!x?.trim())
}

function skillKarmaCost(c: Character): number {
  let k = 0
  for (const s of Object.values(c.skills)) {
    k += stepCost(s.points, s.points + s.karma, RULES.skillKarmaPerRating)
    if (s.specKarma) k += skillSpecs(s).length * RULES.specializationKarma
  }
  return k
}

function skillPointsSpent(c: Character): number {
  let p = 0
  for (const s of Object.values(c.skills)) {
    p += s.points
    if (!s.specKarma) p += skillSpecs(s).length * RULES.specializationSkillPoints
  }
  return p
}

// ---------------------------------------------------------------------------
// Gear

export function gearItem(id: string): GearItem | undefined {
  return GEAR.find(g => g.id === id)
}

export function gearUnitCost(item: GearItem, rating?: number): number {
  if (item.rated && item.perRating?.cost) return item.perRating.cost * (rating ?? item.rated.min)
  return item.cost
}

export function gearEssence(item: GearItem, rating?: number): number {
  if (item.rated && item.perRating?.essence !== undefined) return item.perRating.essence * (rating ?? item.rated.min)
  return item.essence ?? 0
}

export function gearAvail(item: GearItem, rating?: number): number {
  if (item.rated && item.perRating?.avail) return item.perRating.avail * (rating ?? item.rated.min)
  return item.avail
}

const isAugmentation = (item: GearItem) => item.category === 'cyberware' || item.category === 'bioware'

/** Max copies a character may own (augmentations default to one). */
export function gearLimit(item: GearItem): number {
  return item.maxCount ?? (isAugmentation(item) ? 1 : Infinity)
}

export function gearCount(c: Character, id: string): number {
  return c.gear.filter(g => g.id === id).reduce((s, g) => s + g.qty, 0)
}

/** An owned item this one can't be installed alongside, if any. */
export function gearConflict(c: Character, item: GearItem): GearItem | undefined {
  for (const g of c.gear) {
    const other = gearItem(g.id)
    if (!other || other.id === item.id) continue
    if (item.conflicts?.includes(other.id) || other.conflicts?.includes(item.id)) return other
  }
  return undefined
}

export function ownedGearCost(g: OwnedGear): number {
  const item = gearItem(g.id)
  return item ? gearUnitCost(item, g.rating) * g.qty : 0
}

export function essenceValue(c: Character): number {
  let loss = 0
  for (const g of c.gear) {
    const item = gearItem(g.id)
    if (item) loss += gearEssence(item, g.rating) * g.qty
  }
  return Math.round((RULES.startingEssence - loss) * 100) / 100
}

/** Each started point of essence lost reduces Magic/Resonance by 1. */
function essencePenalty(c: Character): number {
  return Math.max(0, Math.ceil(RULES.startingEssence - essenceValue(c) - 1e-9))
}
export function effectiveMagic(c: Character): number {
  return Math.max(0, magicValue(c) - essencePenalty(c))
}
export function effectiveResonance(c: Character): number {
  return Math.max(0, resonanceValue(c) - essencePenalty(c))
}

// ---------------------------------------------------------------------------
// Qualities

export function qualityById(id: string): Quality | undefined {
  return QUALITIES.find(q => q.id === id)
}

export function takenQualityKarma(q: Quality, t: TakenQuality): number {
  if (q.options) return q.options[t.option ?? 0]?.karma ?? 0
  return q.karma * (q.maxLevel ? Math.max(1, t.level) : 1)
}

export function qualityKarma(c: Character): { positive: number; negative: number } {
  let positive = 0
  let negative = 0
  for (const t of c.qualities) {
    const q = qualityById(t.id)
    if (!q) continue
    const k = takenQualityKarma(q, t)
    if (q.positive) positive += k
    else negative += k
  }
  return { positive, negative }
}

function qualityLevels(c: Character, id: string): number {
  return c.qualities.filter(t => t.id === id).reduce((s, t) => s + Math.max(1, t.level), 0)
}

// ---------------------------------------------------------------------------
// Magic

/** Mystic adepts move priority Magic points into power points; the rest buys free spells. */
export function freeSpellCount(c: Character): number {
  if (!castsSpells(c.magicType)) return 0
  const base = magicBase(c) - (c.magicType === 'mysticAdept' ? c.powerPointsBought : 0)
  return Math.max(0, base) * RULES.spellsPerMagic
}

export function freeFormCount(c: Character): number {
  return c.magicType === 'technomancer' ? resonanceBase(c) * RULES.formsPerResonance : 0
}

export function powerPointsSpent(c: Character): number {
  let pp = 0
  for (const t of c.adeptPowers) {
    const p = ADEPT_POWERS.find(x => x.id === t.id)
    if (p) pp += p.cost * (p.maxLevel ? Math.max(1, t.level) : 1)
  }
  return Math.round(pp * 100) / 100
}

export function powerPointsAvailable(c: Character): number {
  if (c.magicType === 'adept') return effectiveMagic(c)
  if (c.magicType === 'mysticAdept') return c.powerPointsBought
  return 0
}

// ---------------------------------------------------------------------------
// Budgets

export interface Pool { total: number; spent: number }
export const remaining = (p: Pool) => p.total - p.spent

export interface Budget {
  adjustment: Pool
  attributes: Pool
  skills: Pool
  karma: Pool
  nuyen: Pool
  freeSpells: Pool
  freeForms: Pool
  powerPoints: Pool
  freeKnowledge: Pool
  contacts: Pool
  positiveQualityKarma: number
  negativeQualityKarma: number
  karmaBreakdown: { label: string; karma: number }[]
  nuyenBreakdown: { label: string; nuyen: number }[]
}

export function karmaToNuyenRate(c: Character): number {
  return c.qualities.some(q => q.id === 'in_debt') ? RULES.inDebtKarmaToNuyenRate : RULES.karmaToNuyenRate
}

export function computeBudget(c: Character): Budget {
  const meta = metatypeOf(c)
  const adjTotal = rowFor(c, 'metatype').metatypes[c.metatype] ?? 0

  let adjSpent = c.edge.adjust + c.magic.adjust + c.resonance.adjust
  let attrSpent = c.edge.points + c.magic.points + c.resonance.points
  let attrKarma = 0
  for (const a of ATTRS) {
    const al = c.attributes[a]
    adjSpent += al.adjust
    attrSpent += al.points
    attrKarma += attrKarmaCost(meta.attributes[a].min, al)
  }
  attrKarma += attrKarmaCost(meta.attributes.edg.min, c.edge)
  if (isAwakened(c.magicType)) attrKarma += attrKarmaCost(magicBase(c), c.magic)
  if (c.magicType === 'technomancer') attrKarma += attrKarmaCost(resonanceBase(c), c.resonance)

  const { positive, negative } = qualityKarma(c)

  const freeSpells = freeSpellCount(c)
  const spellKarma = Math.max(0, c.spells.length - freeSpells) * RULES.spellKarma
  const freeForms = freeFormCount(c)
  const formKarma = Math.max(0, c.complexForms.length - freeForms) * RULES.complexFormKarma

  // Knowledge skills and languages share Logic free slots; the native language is free.
  const freeKnowledge = attrValue(c, 'log')
  const languageLevels = c.languages.filter(l => !l.native).reduce((s, l) => s + Math.max(1, l.level), 0)
  const knowledgeUsed = c.knowledge.length + languageLevels
  const knowledgeKarma = Math.max(0, knowledgeUsed - freeKnowledge) * RULES.knowledgeSkillKarma

  const contactTotal = attrValue(c, 'cha') * RULES.contactKarmaPerCharisma
  const contactSpent = c.contacts.reduce((s, x) => s + x.connection + x.loyalty, 0)
  const contactKarma = c.options.karmaForContacts ? Math.max(0, contactSpent - contactTotal) : 0

  const karmaBreakdown = [
    { label: 'Attributes', karma: attrKarma },
    { label: 'Skills', karma: skillKarmaCost(c) },
    { label: 'Positive qualities', karma: positive },
    { label: 'Extra spells', karma: spellKarma },
    { label: 'Extra complex forms', karma: formKarma },
    { label: 'Knowledge & languages', karma: knowledgeKarma },
    { label: 'Extra contact points', karma: contactKarma },
    { label: 'Converted to nuyen', karma: c.karmaToNuyen },
  ]

  const lifestyle = LIFESTYLES.find(l => l.id === c.lifestyle)
  const byCat = (cats: string[]) => c.gear
    .filter(g => cats.includes(gearItem(g.id)?.category ?? ''))
    .reduce((s, g) => s + ownedGearCost(g), 0)
  const nuyenBreakdown = [
    { label: 'Weapons', nuyen: byCat(['firearm', 'melee']) },
    { label: 'Armor', nuyen: byCat(['armor']) },
    { label: 'Electronics', nuyen: byCat(['electronics']) },
    { label: 'Augmentations', nuyen: byCat(['cyberware', 'bioware']) },
    { label: 'Other gear', nuyen: byCat(['misc', 'vehicle']) },
    { label: 'Lifestyle', nuyen: lifestyle ? lifestyle.cost * Math.max(1, c.lifestyleMonths) : 0 },
  ]

  return {
    adjustment: { total: adjTotal, spent: adjSpent },
    attributes: { total: rowFor(c, 'attributes').attributes, spent: attrSpent },
    skills: { total: rowFor(c, 'skills').skills, spent: skillPointsSpent(c) },
    karma: { total: RULES.startingKarma + negative, spent: karmaBreakdown.reduce((s, b) => s + b.karma, 0) },
    nuyen: {
      total: rowFor(c, 'resources').resources + c.karmaToNuyen * karmaToNuyenRate(c),
      spent: nuyenBreakdown.reduce((s, b) => s + b.nuyen, 0),
    },
    freeSpells: { total: freeSpells, spent: Math.min(c.spells.length, freeSpells) },
    freeForms: { total: freeForms, spent: Math.min(c.complexForms.length, freeForms) },
    powerPoints: { total: powerPointsAvailable(c), spent: powerPointsSpent(c) },
    freeKnowledge: { total: freeKnowledge, spent: Math.min(knowledgeUsed, freeKnowledge) },
    contacts: { total: contactTotal, spent: contactSpent },
    positiveQualityKarma: positive,
    negativeQualityKarma: negative,
    karmaBreakdown,
    nuyenBreakdown,
  }
}

// ---------------------------------------------------------------------------
// Augmentation and power effects

export interface Bonuses {
  attrs: Record<AttrId, number>
  initDice: number
  defense: number
  unarmedAR: number
  unarmedDV?: string
  /** Where each bonus came from, for display. */
  sources: { name: string; text: string }[]
}

function describe(e: ItemEffects, n: number): string {
  const parts: string[] = []
  for (const [a, v] of Object.entries(e.attrs ?? {})) parts.push(`+${v * n} ${ATTR_NAMES[a as AttrId]}`)
  if (e.initDice) parts.push(`+${e.initDice * n}D6 Initiative`)
  if (e.defense) parts.push(`+${e.defense * n} Defense`)
  if (e.unarmedAR) parts.push(`unarmed AR +${e.unarmedAR}, DV ${e.unarmedDV}`)
  return parts.join(', ')
}

export function computeBonuses(c: Character): Bonuses {
  const b: Bonuses = {
    attrs: { bod: 0, agi: 0, rea: 0, str: 0, wil: 0, log: 0, int: 0, cha: 0 },
    initDice: 0, defense: 0, unarmedAR: 0, sources: [],
  }
  const apply = (name: string, e: ItemEffects | undefined, level: number) => {
    if (!e) return
    const n = e.perRating ? Math.max(1, level) : 1
    for (const [a, v] of Object.entries(e.attrs ?? {})) b.attrs[a as AttrId] += v * n
    b.initDice += (e.initDice ?? 0) * n
    b.defense += (e.defense ?? 0) * n
    if (e.unarmedAR && e.unarmedAR > b.unarmedAR) { b.unarmedAR = e.unarmedAR; b.unarmedDV = e.unarmedDV }
    b.sources.push({ name, text: describe(e, n) })
  }
  for (const g of c.gear) {
    const item = gearItem(g.id)
    if (item?.effects) apply(item.name + (item.rated ? ` ${g.rating ?? item.rated.min}` : ''), item.effects, g.rating ?? item.rated?.min ?? 1)
  }
  if (hasPowers(c.magicType)) {
    for (const t of c.adeptPowers) {
      const p = ADEPT_POWERS.find(x => x.id === t.id)
      if (p?.effects) apply(`${p.name} ${t.level}`, p.effects, t.level)
    }
  }
  for (const a of ATTRS) b.attrs[a] = Math.min(RULES.maxAugmentation, b.attrs[a])
  return b
}

/** Attribute including augmentation bonuses (natural value + bonus, bonus capped at +4). */
export function augmentedValue(c: Character, a: AttrId, bonuses = computeBonuses(c)): number {
  return attrValue(c, a) + bonuses.attrs[a]
}

// ---------------------------------------------------------------------------
// Derived stats

export interface Derived {
  initiative: string
  matrixInitAR: string
  matrixInitVR: string
  astralInit: string
  physicalCM: number
  stunCM: number
  unarmedAR: number
  overflow: number
  defenseRating: number
  composure: number
  judgeIntentions: number
  memory: number
  liftCarry: number
  movement: string
  essence: number
  magic: number
  resonance: number
  edge: number
  armor: number
  initDice: number
  unarmedDV: string
}

/** Best body armor plus all stacking pieces (helmets, shields). */
export function armorValue(c: Character): number {
  let body = 0
  let stacked = 0
  for (const g of c.gear) {
    const item = gearItem(g.id)
    if (item?.category !== 'armor' || !item.defense) continue
    if (item.stacks) stacked += item.defense
    else body = Math.max(body, item.defense)
  }
  return body + stacked
}

export function computeDerived(c: Character): Derived {
  const bonuses = computeBonuses(c)
  const v = (a: AttrId) => augmentedValue(c, a, bonuses)
  const meta = metatypeOf(c)
  const armor = armorValue(c)
  const dice = Math.min(RULES.maxInitDice, 1 + bonuses.initDice)
  const builtTough = (meta.builtTough ?? 0) + qualityLevels(c, 'built_tough')
  const glassJaw = qualityLevels(c, 'glass_jaw')
  const dermal = (meta.defenseBonus ?? 0) + (c.qualities.some(q => q.id === 'dermal_deposits') ? 1 : 0)
  return {
    initiative: `${v('rea') + v('int')} + ${dice}D6`,
    matrixInitAR: `${v('rea') + v('int')} + ${dice}D6`,
    matrixInitVR: c.magicType === 'technomancer'
      ? `${v('log') + v('int')} + 2D6 cold / 3D6 hot`
      : `Data Processing + ${v('int')} + 2D6 cold / 3D6 hot`,
    astralInit: `${v('log') + v('int')} + 2D6`,
    physicalCM: 8 + Math.ceil(v('bod') / 2) + builtTough,
    stunCM: Math.max(2, 8 + Math.ceil(v('wil') / 2) - glassJaw),
    unarmedAR: v('rea') + v('str') + bonuses.unarmedAR,
    unarmedDV: bonuses.unarmedDV ?? (dermal ? '2P' : '2S'),
    initDice: dice,
    overflow: v('bod') * 2 + 2 * qualityLevels(c, 'will_to_live'),
    defenseRating: v('bod') + armor + dermal + bonuses.defense,
    composure: v('wil') + v('cha'),
    judgeIntentions: v('wil') + v('int'),
    memory: v('log') + v('int'),
    liftCarry: v('bod') + v('wil'),
    movement: '10 / 15 m (+1 m per hit sprinting)',
    essence: essenceValue(c),
    magic: effectiveMagic(c),
    resonance: effectiveResonance(c),
    edge: edgeValue(c),
    armor,
  }
}

export function skillById(id: string) {
  return SKILLS.find(s => s.id === id)
}
export function spellById(id: string) {
  return SPELLS.find(s => s.id === id)
}
export function formById(id: string) {
  return COMPLEX_FORMS.find(s => s.id === id)
}
