// Shadowrun 6th Edition core creation data: priority table, metatypes, skills, lifestyles.
// Game statistics only (names and numbers). No rules text is reproduced; see the core rulebook.
// Found an error? Fix it here and open a pull request.

import type { AttrId, Lifestyle, Metatype, PriorityRow, Range, Skill } from '../engine/types'

const std: Range = { min: 1, max: 6 }
const r = (max: number): Range => ({ min: 1, max })

function attrs(over: Partial<Record<AttrId | 'edg', number>> = {}): Metatype['attributes'] {
  const out = { bod: std, agi: std, rea: std, str: std, wil: std, log: std, int: std, cha: std, edg: std }
  for (const [k, v] of Object.entries(over)) out[k as AttrId | 'edg'] = r(v)
  return out
}

/** Adjustment points may raise any attribute whose metatype maximum exceeds 6 (Edge, Magic, Resonance always). */
function adjustable(a: Metatype['attributes']): AttrId[] {
  return (Object.keys(a) as (AttrId | 'edg')[]).filter((k): k is AttrId => k !== 'edg' && a[k].max > 6)
}

function meta(m: Omit<Metatype, 'adjustable'>): Metatype {
  return { ...m, adjustable: adjustable(m.attributes) }
}

export const METATYPES: Metatype[] = [
  meta({ id: 'human', name: 'Human', source: 'core', attributes: attrs({ edg: 7 }), traits: [] }),
  meta({ id: 'dwarf', name: 'Dwarf', source: 'core', attributes: attrs({ bod: 7, rea: 5, str: 8, wil: 7 }), traits: ['Thermographic Vision', 'Toxin Resistance'] }),
  meta({ id: 'elf', name: 'Elf', source: 'core', attributes: attrs({ agi: 7, cha: 8 }), traits: ['Low-Light Vision'] }),
  meta({ id: 'ork', name: 'Ork', source: 'core', attributes: attrs({ bod: 8, str: 8, cha: 5 }), traits: ['Low-Light Vision', 'Built Tough 1'], builtTough: 1 }),
  meta({ id: 'troll', name: 'Troll', source: 'core', attributes: attrs({ bod: 9, agi: 5, str: 9, cha: 5 }), traits: ['Thermographic Vision', 'Built Tough 2', 'Dermal Deposits', 'Reach'], builtTough: 2, defenseBonus: 1 }),
]

const all = (adj: number) => ({ human: adj, dwarf: adj, elf: adj, ork: adj, troll: adj })

const magic = (full: number) => [
  { type: 'magician' as const, rating: full },
  { type: 'aspected' as const, rating: full + 1 },
  { type: 'mysticAdept' as const, rating: full },
  { type: 'adept' as const, rating: full },
  { type: 'technomancer' as const, rating: full },
]

export const PRIORITY_TABLE: PriorityRow[] = [
  { priority: 'A', metatypes: { dwarf: 13, ork: 13, troll: 13 }, attributes: 24, skills: 32, resources: 450_000, magic: magic(4) },
  { priority: 'B', metatypes: { dwarf: 11, elf: 11, ork: 11, troll: 11 }, attributes: 16, skills: 24, resources: 275_000, magic: magic(3) },
  { priority: 'C', metatypes: all(9), attributes: 12, skills: 20, resources: 150_000, magic: magic(2) },
  { priority: 'D', metatypes: all(4), attributes: 8, skills: 16, resources: 50_000, magic: magic(1) },
  { priority: 'E', metatypes: all(1), attributes: 2, skills: 10, resources: 8_000, magic: [] },
]

export const SKILLS: Skill[] = [
  { id: 'astral', name: 'Astral', attr: 'int', untrained: false, specializations: ['Astral Combat', 'Astral Signatures', 'Emotional Stress', 'Spirit Types'] },
  { id: 'athletics', name: 'Athletics', attr: 'agi', untrained: true, specializations: ['Archery', 'Climbing', 'Flying', 'Free-Fall', 'Gymnastics', 'Sprinting', 'Swimming', 'Throwing'] },
  { id: 'biotech', name: 'Biotech', attr: 'log', untrained: false, specializations: ['Biotechnology', 'Cybertechnology', 'First Aid', 'Medicine'] },
  { id: 'close_combat', name: 'Close Combat', attr: 'agi', untrained: true, specializations: ['Blades', 'Clubs', 'Unarmed'] },
  { id: 'con', name: 'Con', attr: 'cha', untrained: true, specializations: ['Acting', 'Disguise', 'Impersonation', 'Performance'] },
  { id: 'conjuring', name: 'Conjuring', attr: 'mag', untrained: false, specializations: ['Banishing', 'Summoning'] },
  { id: 'cracking', name: 'Cracking', attr: 'log', untrained: false, specializations: ['Cybercombat', 'Electronic Warfare', 'Hacking'] },
  { id: 'electronics', name: 'Electronics', attr: 'log', untrained: true, specializations: ['Computer', 'Hardware', 'Software', 'Complex Forms'] },
  { id: 'enchanting', name: 'Enchanting', attr: 'mag', untrained: false, specializations: ['Alchemy', 'Artificing', 'Disenchanting'] },
  { id: 'engineering', name: 'Engineering', attr: 'log', untrained: true, specializations: ['Aeronautics Mechanic', 'Armorer', 'Automotive Mechanic', 'Demolitions', 'Gunnery', 'Industrial Mechanic', 'Lockpicking', 'Nautical Mechanic'] },
  { id: 'exotic_weapons', name: 'Exotic Weapons', attr: 'agi', untrained: false, specializations: ['Specific exotic weapon'] },
  { id: 'firearms', name: 'Firearms', attr: 'agi', untrained: true, specializations: ['Tasers', 'Holdouts', 'Light Pistols', 'Heavy Pistols', 'Machine Pistols', 'Submachine Guns', 'Rifles', 'Shotguns', 'Machine Guns', 'Assault Cannons'] },
  { id: 'influence', name: 'Influence', attr: 'cha', untrained: true, specializations: ['Etiquette', 'Instruction', 'Intimidation', 'Leadership', 'Negotiation'] },
  { id: 'outdoors', name: 'Outdoors', attr: 'int', untrained: true, specializations: ['Animal Handling', 'Navigation', 'Survival', 'Tracking', 'Urban', 'Woods', 'Desert'] },
  { id: 'perception', name: 'Perception', attr: 'int', untrained: true, specializations: ['Visual', 'Aural', 'Tactile', 'Scent', 'Taste', 'Urban', 'Woods', 'Desert'] },
  { id: 'piloting', name: 'Piloting', attr: 'rea', untrained: true, specializations: ['Ground Craft', 'Aircraft', 'Watercraft'] },
  { id: 'sorcery', name: 'Sorcery', attr: 'mag', untrained: false, specializations: ['Counterspelling', 'Ritual Spellcasting', 'Spellcasting'] },
  { id: 'stealth', name: 'Stealth', attr: 'agi', untrained: true, specializations: ['Camouflage', 'Palming', 'Sneaking'] },
  { id: 'tasking', name: 'Tasking', attr: 'res', untrained: false, specializations: ['Compiling', 'Decompiling', 'Registering'] },
]

export const LIFESTYLES: Lifestyle[] = [
  { id: 'street', name: 'Street', cost: 0 },
  { id: 'squatter', name: 'Squatter', cost: 500 },
  { id: 'low', name: 'Low', cost: 2_000 },
  { id: 'middle', name: 'Middle', cost: 5_000 },
  { id: 'high', name: 'High', cost: 10_000 },
  { id: 'luxury', name: 'Luxury', cost: 100_000 },
]
