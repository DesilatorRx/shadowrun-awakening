// Core domain types for the character model and the rules data it references.

import type { TableOptions } from './rules'

export type Priority = 'A' | 'B' | 'C' | 'D' | 'E'
export const PRIORITIES: Priority[] = ['A', 'B', 'C', 'D', 'E']

export type PriorityCategory = 'metatype' | 'attributes' | 'magic' | 'skills' | 'resources'
export const PRIORITY_CATEGORIES: PriorityCategory[] = ['metatype', 'attributes', 'magic', 'skills', 'resources']

export type AttrId = 'bod' | 'agi' | 'rea' | 'str' | 'wil' | 'log' | 'int' | 'cha'
export const ATTRS: AttrId[] = ['bod', 'agi', 'rea', 'str', 'wil', 'log', 'int', 'cha']
export type SpecialAttrId = 'edg' | 'mag' | 'res'
export type AnyAttrId = AttrId | SpecialAttrId

export type MagicType = 'mundane' | 'magician' | 'aspected' | 'mysticAdept' | 'adept' | 'technomancer'

export type MetatypeId = string

/** Rule-source tag so content can be filtered by book / campaign setting. */
export type Source = 'core' | 'berlin' | 'seattle' | 'companion'

// ---------------------------------------------------------------------------
// Rules data

export interface Range { min: number; max: number }

export interface Metatype {
  id: MetatypeId
  name: string
  source: Source
  attributes: Record<AttrId | 'edg', Range>
  /** Racial traits, display only. */
  traits: string[]
  /** Attributes (besides Edge/Magic/Resonance) the metatype modifies, which adjustment points may raise. */
  adjustable: AttrId[]
  /** Extra physical condition monitor boxes from racial Built Tough. */
  builtTough?: number
  /** Racial bonus to physical Defense Rating (e.g. troll dermal deposits). */
  defenseBonus?: number
  lifestyleNote?: string
}

export interface MagicOption {
  type: MagicType
  /** Starting Magic or Resonance rating. */
  rating: number
}

export interface PriorityRow {
  priority: Priority
  /** metatype id -> adjustment points; metatypes not listed are unavailable. */
  metatypes: Record<MetatypeId, number>
  attributes: number
  skills: number
  resources: number
  magic: MagicOption[]
}

export interface Skill {
  id: string
  name: string
  attr: AnyAttrId
  untrained: boolean
  specializations: string[]
}

export interface Quality {
  id: string
  name: string
  /** Karma per level. Positive qualities cost karma, negative qualities grant karma. */
  karma: number
  positive: boolean
  maxLevel?: number
  source: Source
  /** Short factual hint (never rules text). */
  hint?: string
  /** Needs a free-text detail, e.g. which allergy or which addiction. */
  needsDetail?: boolean
  /** May be taken more than once (each with its own detail). */
  multi?: boolean
  /** Fixed karma variants instead of levels (e.g. Allergy severity). */
  options?: { label: string; karma: number }[]
  /** Restricted to these metatypes. */
  metatypes?: MetatypeId[]
  /** The quality applies to one chosen active skill (Aptitude, Incompetent). */
  skillChoice?: boolean
  /** The quality applies to one chosen attribute (Exceptional, Impaired). */
  attributeChoice?: 'physicalMental'
  /** Change to the chosen attribute's maximum per level. */
  attrMaxPerLevel?: number
  /** Grants a second native language (Berlin qualities). */
  grantsNativeLanguage?: string
  /** Physical condition monitor boxes per level (Built Tough). */
  physicalCM?: number
  /** Stun condition monitor change per level (Glass Jaw is negative). */
  stunCM?: number
}

export interface Tradition {
  id: string
  name: string
  drain: [AnyAttrId, AnyAttrId]
}

export type SpellCategory = 'combat' | 'detection' | 'health' | 'illusion' | 'manipulation'
export interface Spell {
  id: string
  name: string
  category: SpellCategory
  type: 'P' | 'M'
  range: string
  duration: string
  drain: number
}

export interface AdeptPower {
  id: string
  name: string
  effects?: ItemEffects
  /** Power point cost per level (or flat when not leveled). */
  cost: number
  maxLevel?: number
}

export interface ComplexForm {
  id: string
  name: string
  duration: string
  fade: number
}

export interface MentorSpirit { id: string; name: string }

/** Bonuses an item or power grants. With `perRating`, numbers are multiplied by the rating/level. */
export interface ItemEffects {
  attrs?: Partial<Record<AttrId, number>>
  initDice?: number
  defense?: number
  unarmedAR?: number
  unarmedDV?: string
  perRating?: boolean
}

export interface Lifestyle { id: string; name: string; cost: number }

export type GearCategory =
  | 'firearm' | 'melee' | 'ammo' | 'accessory' | 'explosive' | 'armor' | 'electronics' | 'software'
  | 'cyberware' | 'bioware' | 'magical' | 'vehicle' | 'drone' | 'drug' | 'misc'

export interface GearItem {
  id: string
  name: string
  category: GearCategory
  subcategory?: string
  cost: number
  /** Availability rating; "L" legal suffix etc. kept in `legality`. */
  avail: number
  legality?: 'L' | 'I'
  essence?: number
  /** Short stat line for display (DV, AR, defense, device rating...). */
  stats?: string
  /** Defense bonus for armor items. */
  defense?: number
  /** Armor that adds to worn body armor (helmets, shields) instead of replacing it. */
  stacks?: boolean
  /** Game effects applied to derived stats while the item is owned. */
  effects?: ItemEffects
  /** How many a character may have. Augmentations default to 1; other gear is unlimited. */
  maxCount?: number
  /** Item ids this can't be installed alongside (checked both ways). */
  conflicts?: string[]
  rated?: { min: number; max: number }
  /** When rated, cost/essence/avail scale linearly with rating. */
  perRating?: { cost?: number; essence?: number; avail?: number }
  /** When rated with non-linear values: arrays indexed from rated.min upward. */
  byRating?: { cost?: number[]; essence?: number[]; avail?: number[] }
}

// ---------------------------------------------------------------------------
// Character

/** Attribute raised by three separate pools at creation. */
export interface AttrAlloc { points: number; adjust: number; karma: number }

export interface SkillAlloc {
  points: number
  karma: number
  specialization?: string
  /** True when specializations are paid with karma instead of skill points. */
  specKarma?: boolean
  /** Additional specializations; only Exotic Weapons allows more than one (p. 96). */
  extraSpecs?: string[]
}

export interface KnowledgeSkill { id: string; name: string }
export interface Language { id: string; name: string; native: boolean; level: 0 | 1 | 2 | 3 }

export interface TakenQuality {
  uid: string
  id: string
  level: number
  detail?: string
  option?: number
  attr?: AttrId
  /** Chosen active skill id for skill qualities. */
  skill?: string
}
export interface TakenPower { id: string; level: number }
export interface OwnedGear { uid: string; id: string; qty: number; rating?: number }
export interface Contact { uid: string; name: string; role: string; connection: number; loyalty: number }

export interface Character {
  id: string
  schema: 1
  created: string
  updated: string
  name: string
  alias: string
  concept: string
  notes: string
  setting: 'berlin' | 'seattle' | 'core'
  options: TableOptions

  priorities: Record<PriorityCategory, Priority>
  metatype: MetatypeId
  magicType: MagicType
  aspectedSkill?: 'sorcery' | 'conjuring' | 'enchanting'
  tradition?: string
  mentorSpirit?: string

  attributes: Record<AttrId, AttrAlloc>
  edge: AttrAlloc
  magic: AttrAlloc
  resonance: AttrAlloc

  skills: Record<string, SkillAlloc>
  knowledge: KnowledgeSkill[]
  languages: Language[]
  qualities: TakenQuality[]
  spells: string[]
  complexForms: string[]
  adeptPowers: TakenPower[]
  /** Mystic adepts: points of priority Magic put toward adept power points instead of spells. */
  powerPointsBought: number

  gear: OwnedGear[]
  contacts: Contact[]
  lifestyle: string
  lifestyleMonths: number
  karmaToNuyen: number
}
