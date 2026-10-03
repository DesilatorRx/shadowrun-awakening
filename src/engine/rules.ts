// Tunable creation-rule constants. Change these (not the engine) when errata or table rules differ.
// Sources: SR6 core rulebook + CGL errata (Aug 2019, Feb 2020) + German 3rd printing errata.

export const RULES = {
  startingKarma: 50,
  /** Leftover karma carried into play (German 3rd printing / Missions: 5; original printing: 0). */
  maxKarmaCarryover: 5,
  /** Karma cost to raise an attribute or active skill to the new rating = rating × this. */
  attributeKarmaPerRating: 5,
  skillKarmaPerRating: 5,
  specializationKarma: 5,
  /** A specialization bought with skill points costs this many points. */
  specializationSkillPoints: 1,
  knowledgeSkillKarma: 3,
  spellKarma: 5,
  complexFormKarma: 5,

  /** Highest active skill rating at creation (7 with Aptitude). */
  maxSkillRating: 6,
  /** Only this many attributes may be at the metatype maximum at creation. */
  attributesAtMax: 1,
  /** Magic / Resonance cap at creation. */
  maxMagic: 6,

  maxQualities: 6,
  /** Net karma gained from qualities (negative − positive) may not exceed this. */
  maxNetQualityKarma: 20,

  karmaToNuyenRate: 2000,
  inDebtKarmaToNuyenRate: 5000,

  /** Nuyen kept after creation (commonly used; not confirmed for SR6). */
  maxNuyenCarryover: 5000,

  /** Free spells / rituals per point of priority Magic. */
  spellsPerMagic: 2,
  /** Free complex forms per point of priority Resonance. */
  formsPerResonance: 2,

  /** Free contact points = Charisma × this; Connection and Loyalty each ≤ Charisma at creation. */
  contactKarmaPerCharisma: 6,

  startingEssence: 6,
}

/** Rules that differ between printings; chosen per character. */
export interface TableOptions {
  /** Max Availability at creation: 6 (English core/Seattle) or 7 (German 3rd printing / Berlin). */
  maxAvailability: 6 | 7
  /** Allow buying extra spells / complex forms with karma at creation (forbidden by German 3rd printing). */
  karmaSpellsAtCreation: boolean
  /** Contact points beyond the free pool cost 1 karma each (Sixth World Companion option). */
  karmaForContacts: boolean
}

export const DEFAULT_OPTIONS: TableOptions = {
  maxAvailability: 6,
  karmaSpellsAtCreation: false,
  karmaForContacts: true,
}

export const BERLIN_OPTIONS: TableOptions = {
  maxAvailability: 7,
  karmaSpellsAtCreation: false,
  karmaForContacts: true,
}

export type Rules = typeof RULES
