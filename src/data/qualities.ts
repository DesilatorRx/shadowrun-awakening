// Qualities: name, karma value, and a short hint in our own words. Look up full effects in the books.

import type { Quality } from '../engine/types'

const pos = (id: string, name: string, karma: number, extra: Partial<Quality> = {}): Quality =>
  ({ id, name, karma, positive: true, source: 'core', ...extra })
const neg = (id: string, name: string, karma: number, extra: Partial<Quality> = {}): Quality =>
  ({ id, name, karma, positive: false, source: 'core', ...extra })

// Allergy value = 20 minus allergen and severity steps (rare/mild bring it down to 2).
const ALLERGENS = [['Common', 0], ['Seasonal', 3], ['Uncommon', 6], ['Rare', 9]] as const
const SEVERITIES = [['Extreme', 0], ['Severe', 3], ['Moderate', 6], ['Mild', 9]] as const
const allergyOptions = ALLERGENS.flatMap(([a, ak]) =>
  SEVERITIES.map(([s, sk]) => ({ label: `${a} allergen, ${s}`, karma: Math.max(2, 20 - ak - sk) })))

export const CORE_QUALITIES: Quality[] = [
  pos('ambidextrous', 'Ambidextrous', 4, { hint: 'No off-hand penalty' }),
  pos('analytical_mind', 'Analytical Mind', 3, { hint: 'Edge on logic puzzles and pattern work' }),
  pos('aptitude', 'Aptitude', 12, { hint: 'One skill may exceed the normal maximum', needsDetail: true }),
  pos('astral_chameleon', 'Astral Chameleon', 9, { hint: 'Astral signature fades faster' }),
  pos('blandness', 'Blandness', 8, { hint: 'Hard to notice or remember' }),
  pos('built_tough', 'Built Tough', 4, { maxLevel: 4, hint: '+1 physical box per level', physicalCM: 1 }),
  pos('catlike', 'Catlike', 12, { hint: 'Graceful, quiet movement' }),
  pos('dermal_deposits', 'Dermal Deposits', 7, { hint: 'Natural armor and physical unarmed damage' }),
  pos('double_jointed', 'Double Jointed', 12, { hint: 'Escape bonds, squeeze into tight spaces' }),
  pos('elemental_resistance', 'Elemental Resistance', 12, { hint: 'Resist one element', needsDetail: true }),
  pos('exceptional_attribute', 'Exceptional Attribute', 12, { hint: '+1 to one attribute maximum', needsDetail: true, multi: true }),
  pos('first_impression', 'First Impression', 12, { hint: 'Bonus on first social encounters' }),
  pos('focused_concentration', 'Focused Concentration', 12, { maxLevel: 3, hint: 'Sustain spells/forms with less penalty' }),
  pos('gearhead', 'Gearhead', 10, { hint: 'Push vehicles beyond limits' }),
  pos('guts', 'Guts', 12, { hint: 'Resist fear and intimidation' }),
  pos('hardening', 'Hardening', 10, { hint: 'Resist biofeedback damage' }),
  pos('high_pain_tolerance', 'High Pain Tolerance', 7, { hint: 'Ignore some wound modifiers' }),
  pos('home_ground', 'Home Ground', 10, { hint: 'Advantage in one familiar place', needsDetail: true, multi: true }),
  pos('human_looking', 'Human-Looking', 8, { hint: 'Metahuman who passes as human', metatypes: ['dwarf', 'elf', 'ork'] }),
  pos('indomitable', 'Indomitable', 12, { hint: 'Hard to break mentally or physically' }),
  pos('juryrigger', 'Juryrigger', 12, { hint: 'Improvised repairs' }),
  pos('long_reach', 'Long Reach', 12, { hint: 'Extra reach in melee' }),
  pos('low_light_vision', 'Low-Light Vision', 6, { hint: 'See in dim light' }),
  pos('magic_resistance', 'Magic Resistance', 8, { hint: 'Resist spells, even helpful ones' }),
  pos('mentor_spirit', 'Mentor Spirit', 10, { hint: 'Spirit patron with bonuses and a drawback' }),
  pos('photographic_memory', 'Photographic Memory', 12, { hint: 'Perfect recall' }),
  pos('quick_healer', 'Quick Healer', 8, { hint: 'Faster natural healing' }),
  pos('resistance_to_pathogens', 'Resistance to Pathogens', 12, { hint: 'Resist disease' }),
  pos('spirit_affinity', 'Spirit Affinity', 14, { hint: 'One spirit type favors you', needsDetail: true, multi: true }),
  pos('sprite_affinity', 'Sprite Affinity', 14, { hint: 'One sprite type favors you', needsDetail: true, multi: true }),
  pos('thermographic_vision', 'Thermographic Vision', 8, { hint: 'See heat' }),
  pos('toughness', 'Toughness', 12, { hint: 'Better damage resistance' }),
  pos('toxin_resistance', 'Toxin Resistance', 12, { hint: 'Resist toxins and drugs' }),
  pos('will_to_live', 'Will to Live', 8, { maxLevel: 3, hint: 'Extra overflow boxes' }),

  neg('addiction', 'Addiction', 2, { maxLevel: 6, hint: 'Dependency; level sets severity', needsDetail: true, multi: true }),
  neg('allergy', 'Allergy', 0, { hint: 'Value depends on allergen and severity', needsDetail: true, multi: true, options: allergyOptions }),
  neg('ar_vertigo', 'AR Vertigo', 10, { hint: 'Augmented reality makes you sick' }),
  neg('astral_beacon', 'Astral Beacon', 10, { hint: 'Your aura stands out' }),
  neg('bad_luck', 'Bad Luck', 10, { hint: 'Edge can backfire' }),
  neg('bad_rep', 'Bad Rep', 8, { hint: 'Notorious in the shadows' }),
  neg('combat_paralysis', 'Combat Paralysis', 8, { hint: 'Freeze when fighting starts' }),
  neg('dependents', 'Dependents', 4, { maxLevel: 3, hint: 'People who rely on you', needsDetail: true }),
  neg('distinctive_style', 'Distinctive Style', 6, { hint: 'Memorable look', needsDetail: true }),
  neg('elf_poser', 'Elf Poser', 6, { hint: 'Pretends to be an elf', metatypes: ['human', 'ork'] }),
  neg('glass_jaw', 'Glass Jaw', 4, { maxLevel: 6, hint: '−1 stun box per level', stunCM: -1 }),
  neg('gremlins', 'Gremlins', 6, { hint: 'Tech fails around you' }),
  neg('honorbound', 'Honorbound', 10, { hint: 'Strict personal code', needsDetail: true }),
  neg('impaired', 'Impaired', 8, { maxLevel: 6, hint: 'Lowered attribute maximum', needsDetail: true, multi: true }),
  neg('incompetent', 'Incompetent', 10, { hint: 'Useless at one skill', needsDetail: true }),
  neg('in_debt', 'In Debt', 0, { hint: 'Better karma→nuyen rate, but you owe someone' }),
  neg('insomnia', 'Insomnia', 4, { hint: 'Trouble resting' }),
  neg('loss_of_confidence', 'Loss of Confidence', 6, { hint: 'Doubt in one skill', needsDetail: true }),
  neg('low_pain_tolerance', 'Low Pain Tolerance', 10, { hint: 'Wound modifiers hit harder' }),
  neg('ork_poser', 'Ork Poser', 6, { hint: 'Pretends to be an ork', metatypes: ['human', 'elf'] }),
  neg('prejudiced', 'Prejudiced', 8, { hint: 'Biased against a group', needsDetail: true, multi: true }),
  neg('scorched', 'Scorched', 6, { hint: 'Matrix trauma flashbacks' }),
  neg('sensitive_system', 'Sensitive System', 8, { hint: 'Body rejects implants (mundanes only)' }),
  neg('simsense_vertigo', 'Simsense Vertigo', 6, { hint: 'Simsense disorients you' }),
  neg('sinner', 'SINner', 8, { hint: 'You have a real, traceable SIN', needsDetail: true }),
  neg('social_stress', 'Social Stress', 8, { hint: 'Trouble in social situations' }),
  neg('spirit_bane', 'Spirit Bane', 12, { hint: 'One spirit type hates you', needsDetail: true }),
  neg('sprite_bane', 'Sprite Bane', 12, { hint: 'One sprite type hates you', needsDetail: true }),
  neg('uncouth', 'Uncouth', 6, { hint: 'Socially abrasive' }),
  neg('uneducated', 'Uneducated', 6, { hint: 'Limited schooling' }),
  neg('unsteady_hands', 'Unsteady Hands', 4, { hint: 'Shaky under pressure' }),
  neg('weak_immune_system', 'Weak Immune System', 8, { hint: 'Get sick easily' }),
]

// Berlin City Edition
export const BERLIN_QUALITIES: Quality[] = [
  pos('agent_of_flux', 'Agent of the Flux State', 10, { source: 'berlin', hint: 'Anarchist insider; grants Kiezspeak' }),
  pos('crowd_ghost', 'Crowd Ghost', 5, { source: 'berlin', hint: 'Disappear into crowds' }),
  pos('exotic_style', 'Exotic Style', 5, { source: 'berlin', hint: 'Fits in with Berlin\'s subcultures' }),
  pos('factory_blood', 'Factory Blood', 10, { source: 'berlin', hint: 'Toxin-hardened; Charisma −1' }),
  pos('off_the_grid', 'Off the Grid', 9, { source: 'berlin', hint: 'Lives outside the Matrix' }),
  pos('sorbian_blood', 'Sorbian Blood', 10, { source: 'berlin', hint: 'Sorbian heritage; grants Sorbian language' }),
  pos('tunnel_rat', 'Tunnel Rat', 10, { source: 'berlin', hint: 'At home in Berlin\'s underground' }),
  pos('under_the_radar', 'Under the Radar', 15, { source: 'berlin', hint: 'Authorities overlook you' }),
  neg('marked_by_kassandra', 'Marked by Kassandra', 5, { source: 'berlin', hint: 'On the radar of the Kassandra' }),
  neg('what_doesnt_kill_you_berlin', "What Doesn't Kill You (Berlin)", 3, { source: 'berlin', hint: 'Check the sign with your GM' }),
]

// Seattle City Edition
export const SEATTLE_QUALITIES: Quality[] = [
  pos('you_get_used_to_it', 'You Get Used to It', 5, { source: 'seattle' }),
  pos('i_belong_here', 'I Belong Here', 3, { source: 'seattle' }),
  pos('salish_shaman', 'Salish Shaman', 9, { source: 'seattle' }),
  pos('big_brothers_blindspot', "Big Brother's Blindspot", 14, { source: 'seattle' }),
  pos('northgate_optimist', 'Northgate Optimist', 3, { source: 'seattle' }),
  pos('bilko_contacts', 'Bilko Contacts', 7, { source: 'seattle', multi: true }),
  pos('water_born', 'Water Born', 5, { source: 'seattle', maxLevel: 2 }),
  pos('briar_patch', 'The Briar Patch', 5, { source: 'seattle', maxLevel: 2 }),
  pos('what_doesnt_kill_you', "What Doesn't Kill You", 3, { source: 'seattle' }),
  pos('good_ol_folks', "Good Ol' Folks", 7, { source: 'seattle' }),
  pos('clean_living', 'Clean Living', 10, { source: 'seattle' }),
  pos('import_export', 'Import/Export', 10, { source: 'seattle' }),
  pos('mental_mapmaker', 'Mental Mapmaker', 5, { source: 'seattle' }),
]

export const QUALITIES: Quality[] = [...CORE_QUALITIES, ...BERLIN_QUALITIES, ...SEATTLE_QUALITIES]
