// Tunable creation-rule constants. Change these (not the engine) when errata or table rules differ.
// Base ruleset: Shadowrun, Sixth World Core Rulebook: City Edition - Berlin (CGL, Nov 2023),
// which folds in all errata to date. Cross-checked against CGL errata (2019/2020) and the
// German 3rd printing errata, which the Berlin edition was produced alongside.

export const RULES = {
  startingKarma: 50,
  /** Leftover karma carried into play (errata'd printings: 5; original 2019 printing: 0). */
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

/** Rules that differ between printings or tables; chosen per character. */
export interface TableOptions {
  /** Max Availability at creation: 7 (errata'd printings) or 6 (original 2019 printing). */
  maxAvailability: 6 | 7
  /** Allow buying extra spells / complex forms with karma at creation (errata'd printings forbid it). */
  karmaSpellsAtCreation: boolean
  /** Contact points beyond the free pool cost 1 karma each (Sixth World Companion option). */
  karmaForContacts: boolean
  /** Astral initiative dice: 3D6 (errata'd printings) or 2D6 (original 2019 printing). */
  astralInitDice: 2 | 3
}

/** Default: Berlin City Edition (2023). */
export const BERLIN_2023_OPTIONS: TableOptions = {
  maxAvailability: 7,
  karmaSpellsAtCreation: false,
  karmaForContacts: false,
  astralInitDice: 3,
}

/** For tables still using the original 2019 core rulebook without errata. */
export const ORIGINAL_2019_OPTIONS: TableOptions = {
  maxAvailability: 6,
  karmaSpellsAtCreation: true,
  karmaForContacts: false,
  astralInitDice: 2,
}

export type Rules = typeof RULES
