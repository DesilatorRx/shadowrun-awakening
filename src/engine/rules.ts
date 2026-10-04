// Tunable creation-rule constants. Change these (not the engine) when errata or table rules differ.
// Base ruleset: Shadowrun, Sixth World Core Rulebook: City Edition - Berlin (CGL, Nov 2023),
// which folds in all errata to date. Page references below are to that book.

export const RULES = {
  startingKarma: 50,
  /** Prime runner play doubles customization karma (p. 63). */
  primeRunnerKarma: 100,
  /** Leftover karma carried into play (p. 66). */
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

  /** Highest active skill rating at creation (7 with Aptitude); only one skill may sit at it (p. 65). */
  maxSkillRating: 6,
  skillsAtMax: 1,
  /** Only this many attributes may be at the metatype maximum at creation. */
  attributesAtMax: 1,
  /** Magic / Resonance cap at creation. */
  maxMagic: 6,

  maxQualities: 6,
  /** Net karma gained from qualities (negative − positive) may not exceed this. */
  maxNetQualityKarma: 20,

  karmaToNuyenRate: 2000,
  inDebtKarmaToNuyenRate: 5000,

  /** Nuyen kept after creation (p. 68). */
  maxNuyenCarryover: 5000,

  /** Free spells / rituals per point of priority Magic. */
  spellsPerMagic: 2,
  /** Free complex forms per point of priority Resonance. */
  formsPerResonance: 2,

  /** Free contact points = Charisma × this; Connection and Loyalty each ≤ Charisma at creation. */
  contactKarmaPerCharisma: 6,

  startingEssence: 6,
  /** Augmentations can raise an attribute by at most this much (p. 37). */
  maxAugmentation: 4,
  /** Initiative Dice cap (p. 44). */
  maxInitDice: 5,
}

/** Rules that differ between printings or tables; chosen per character. */
export interface TableOptions {
  /** Max Availability at creation: 6 per the book (p. 66); 7 as a house rule. */
  maxAvailability: 6 | 7
  /** Allow buying extra spells / complex forms with karma at creation (the book forbids it, p. 68). */
  karmaSpellsAtCreation: boolean
  /** Contact points beyond the free pool cost 1 karma each (Sixth World Companion option). */
  karmaForContacts: boolean
  /** Level of play (p. 63): street pays each priority from the row below; prime gets 100 karma. */
  powerLevel?: 'street' | 'standard' | 'prime'
}

/** Default: Berlin City Edition (2023), rules as written. */
export const BERLIN_2023_OPTIONS: TableOptions = {
  maxAvailability: 6,
  karmaSpellsAtCreation: false,
  karmaForContacts: false,
  powerLevel: 'standard',
}

/** For tables still using the original 2019 core rulebook, which allowed karma-bought spells. */
export const ORIGINAL_2019_OPTIONS: TableOptions = {
  maxAvailability: 6,
  karmaSpellsAtCreation: true,
  karmaForContacts: false,
  powerLevel: 'standard',
}

export type Rules = typeof RULES
