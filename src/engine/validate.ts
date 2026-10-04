import {
  ATTR_NAMES, attrRange, attrValue, castsSpells, computeBudget, edgeValue, essenceValue, gearAvail, gearConflict,
  gearCount, gearItem, gearLimit,
  magicOption, magicValue, metatypeOf, qualityById, qualitySkill, remaining, resonanceValue, rowFor, skillById, skillCap,
  skillRating,
} from './calc'
import { RULES } from './rules'
import type { Character } from './types'
import { ATTRS, PRIORITY_CATEGORIES } from './types'

export type StepId =
  | 'concept' | 'priorities' | 'attributes' | 'magic' | 'skills' | 'qualities' | 'gear' | 'contacts' | 'sheet'

export interface Issue {
  step: StepId
  severity: 'error' | 'warning'
  message: string
}

export function validate(c: Character): Issue[] {
  const out: Issue[] = []
  const err = (step: StepId, message: string) => out.push({ step, severity: 'error', message })
  const warn = (step: StepId, message: string) => out.push({ step, severity: 'warning', message })
  const b = computeBudget(c)
  const meta = metatypeOf(c)

  // Concept
  if (!c.name.trim() && !c.alias.trim()) warn('concept', 'Give your runner a name or street alias.')

  // Priorities: each letter exactly once.
  const used = PRIORITY_CATEGORIES.map(k => c.priorities[k])
  if (new Set(used).size !== used.length) err('priorities', 'Each priority letter A–E must be used exactly once.')
  if (rowFor(c, 'metatype').metatypes[c.metatype] === undefined)
    err('priorities', `${meta.name} is not available at metatype priority ${c.priorities.metatype}.`)
  if (c.magicType !== 'mundane' && !magicOption(c))
    err('priorities', `Magic priority ${c.priorities.magic} does not offer this magic/resonance type.`)

  // Point pools: priority points must be spent fully; they don't carry over.
  const pool = (step: StepId, label: string, p: { total: number; spent: number }) => {
    if (p.spent > p.total) err(step, `${label}: overspent by ${p.spent - p.total}.`)
    else if (p.spent < p.total) warn(step, `${label}: ${p.total - p.spent} unspent (lost after creation).`)
  }
  pool('attributes', 'Adjustment points', b.adjustment)
  pool('attributes', 'Attribute points', b.attributes)
  pool('skills', 'Skill points', b.skills)

  const karmaLeft = remaining(b.karma)
  if (karmaLeft < 0) err('sheet', `Karma overspent by ${-karmaLeft}.`)
  else if (karmaLeft > RULES.maxKarmaCarryover)
    warn('sheet', `${karmaLeft} karma unspent; only ${RULES.maxKarmaCarryover} carries into play.`)

  const nuyenLeft = remaining(b.nuyen)
  if (nuyenLeft < 0) err('gear', `Nuyen overspent by ${(-nuyenLeft).toLocaleString()}¥.`)
  else if (nuyenLeft > RULES.maxNuyenCarryover)
    err('gear', `${nuyenLeft.toLocaleString()}¥ unspent; you can start play with at most ${RULES.maxNuyenCarryover.toLocaleString()}¥. Buy more gear or prepay lifestyle.`)

  // Attributes
  let atMax = 0
  for (const a of ATTRS) {
    const r = attrRange(c, a)
    const val = attrValue(c, a)
    if (val > r.max) err('attributes', `${ATTR_NAMES[a]} ${val} exceeds the ${meta.name} maximum of ${r.max}.`)
    if (val === r.max) atMax++
    if (c.attributes[a].adjust > 0 && !meta.adjustable.includes(a))
      err('attributes', `Adjustment points can't raise ${ATTR_NAMES[a]} for a ${meta.name}.`)
  }
  if (atMax > RULES.attributesAtMax)
    err('attributes', `Only ${RULES.attributesAtMax} attribute may be at its natural maximum at creation (you have ${atMax}).`)
  if (c.edge.points > 0 || c.magic.points > 0 || c.resonance.points > 0)
    err('attributes', 'Attribute points cannot raise Edge, Magic, or Resonance.')
  if (edgeValue(c) > attrRange(c, 'edg').max) err('attributes', `Edge exceeds the maximum of ${attrRange(c, 'edg').max}.`)
  if (magicValue(c) > RULES.maxMagic) err('attributes', `Magic cannot exceed ${RULES.maxMagic} at creation.`)
  if (resonanceValue(c) > RULES.maxMagic) err('attributes', `Resonance cannot exceed ${RULES.maxMagic} at creation.`)

  // Magic
  if ((c.magicType === 'magician' || c.magicType === 'aspected' || c.magicType === 'mysticAdept') && !c.tradition)
    err('magic', 'Choose a magical tradition.')
  if (c.magicType === 'aspected' && !c.aspectedSkill)
    err('magic', 'Aspected magicians must choose Sorcery, Conjuring, or Enchanting.')
  if (!castsSpells(c.magicType) && c.spells.length > 0) err('magic', 'Only magicians and mystic adepts know spells.')
  if (c.magicType !== 'technomancer' && c.complexForms.length > 0) err('magic', 'Only technomancers know complex forms.')
  if (!c.options.karmaSpellsAtCreation) {
    if (c.spells.length > b.freeSpells.total)
      err('magic', `You know ${c.spells.length} spells but only ${b.freeSpells.total} are free; extra spells can't be bought at creation under your table rules.`)
    if (c.complexForms.length > b.freeForms.total)
      err('magic', `You know ${c.complexForms.length} complex forms but only ${b.freeForms.total} are free.`)
  }
  if (c.magicType === 'mysticAdept') {
    const base = magicOption(c)?.rating ?? 0
    if (c.powerPointsBought > base) err('magic', `Mystic adepts can move at most ${base} Magic into power points.`)
  }
  if (b.powerPoints.spent > b.powerPoints.total)
    err('magic', `Power points overspent: ${b.powerPoints.spent} of ${b.powerPoints.total}.`)
  if (c.mentorSpirit && !c.qualities.some(q => q.id === 'mentor_spirit'))
    warn('magic', 'A mentor spirit needs the Mentor Spirit quality.')

  // Skills
  let skillsAtCap = 0
  for (const [id, s] of Object.entries(c.skills)) {
    const skill = skillById(id)
    if (!skill) continue
    const r = skillRating(c, id)
    const cap = skillCap(c, id)
    if (cap === 0 && r > 0) err('skills', `${skill.name}: you're Incompetent in this skill and can't have ranks in it.`)
    else if (r > cap) err('skills', `${skill.name} ${r} exceeds the creation maximum of ${cap}.`)
    if (r >= RULES.maxSkillRating) skillsAtCap++
    if (s.specialization && r === 0) err('skills', `${skill.name}: needs a rating before taking a specialization.`)
    if (id === 'exotic_weapons' && r > 0 && !s.specialization?.trim())
      warn('skills', "Exotic Weapons has ranks but no weapon named. The skill only works with weapons you specialize in, so those ranks can't be used yet (p. 96).")
    if (id !== 'exotic_weapons' && (s.extraSpecs?.length ?? 0) > 0)
      err('skills', `${skill.name}: only one specialization per skill at creation.`)
    if (skill.attr === 'mag' && !['magician', 'aspected', 'mysticAdept'].includes(c.magicType) && r > 0 && !(id === 'astral' && c.magicType === 'adept'))
      err('skills', `${skill.name} requires a magician or mystic adept.`)
    if (skill.attr === 'res' && c.magicType !== 'technomancer' && r > 0) err('skills', `${skill.name} requires Resonance.`)
    if (c.magicType === 'aspected' && c.aspectedSkill && ['sorcery', 'conjuring', 'enchanting'].includes(id) && id !== c.aspectedSkill && r > 0)
      err('skills', `An aspected ${c.aspectedSkill} magician can't take ${skill.name}.`)
  }
  if (skillsAtCap > RULES.skillsAtMax)
    err('skills', `Only ${RULES.skillsAtMax} skill may be at the creation maximum (${RULES.maxSkillRating}, or ${RULES.maxSkillRating + 1} with Aptitude); you have ${skillsAtCap}.`)
  const natives = c.languages.filter(l => l.native).length
  if (natives === 0) warn('skills', 'Pick a native language.')
  if (natives > 1) err('skills', 'Only one native language is allowed (qualities like Agent of the Flux State add theirs automatically).')

  // Qualities
  if (c.qualities.length > RULES.maxQualities)
    err('qualities', `At most ${RULES.maxQualities} qualities at creation (you have ${c.qualities.length}).`)
  const net = b.negativeQualityKarma - b.positiveQualityKarma
  if (net > RULES.maxNetQualityKarma)
    err('qualities', `Qualities net you ${net} karma; the limit is ${RULES.maxNetQualityKarma}.`)
  for (const t of c.qualities) {
    const q = qualityById(t.id)
    if (!q) continue
    if (q.skillChoice && !t.skill) err('qualities', `${q.name}: choose a skill.`)
    if (q.attributeChoice && !t.attr) err('qualities', `${q.name}: choose an attribute.`)
    else if (q.needsDetail && !t.detail?.trim()) warn('qualities', `${q.name}: describe the specifics.`)
    if (q.metatypes && !q.metatypes.includes(c.metatype)) err('qualities', `${q.name} isn't available to a ${meta.name}.`)
    if (q.id === 'sensitive_system' && c.magicType !== 'mundane') err('qualities', 'Sensitive System is only for mundane characters.')
    if (q.id === 'incompetent' && t.skill) {
      const sk = skillById(t.skill)
      if (sk?.attr === 'mag' && c.magicType === 'mundane') err('qualities', `Incompetent: you can't pick ${sk.name} without a Magic rating.`)
      if (sk?.attr === 'res' && c.magicType !== 'technomancer') err('qualities', `Incompetent: you can't pick ${sk.name} without a Resonance rating.`)
    }
  }

  const apt = qualitySkill(c, 'aptitude')
  const inc = qualitySkill(c, 'incompetent')
  for (const id of apt) if (inc.includes(id)) err('qualities', `You can't have both Aptitude and Incompetent in ${skillById(id)?.name}.`)

  // Gear
  for (const g of c.gear) {
    const item = gearItem(g.id)
    if (!item) continue
    const av = gearAvail(item, g.rating)
    if (av > c.options.maxAvailability)
      err('gear', `${item.name} has Availability ${av}; the creation limit is ${c.options.maxAvailability}.`)
  }
  const checked = new Set<string>()
  for (const g of c.gear) {
    const item = gearItem(g.id)
    if (!item || checked.has(item.id)) continue
    checked.add(item.id)
    const n = gearCount(c, item.id)
    if (n > gearLimit(item))
      err('gear', gearLimit(item) === 1 ? `${item.name} can only be installed once (you have ${n}).` : `At most ${gearLimit(item)} × ${item.name} (you have ${n}).`)
    const clash = gearConflict(c, item)
    if (clash && !checked.has(clash.id)) err('gear', `${item.name} can't be combined with ${clash.name}.`)
  }
  if (c.gear.some(g => g.id.startsWith('wired_reflexes')) && c.gear.some(g => g.id === 'reaction_enhancers'))
    warn('gear', 'Wired reflexes and reaction enhancers only work together while the wired reflexes are wireless.')
  if (essenceValue(c) <= 0) err('gear', 'Essence is zero or below. The character would die.')

  // Contacts
  const cha = attrValue(c, 'cha')
  for (const ct of c.contacts) {
    const label = ct.name.trim() || 'Unnamed contact'
    if (ct.connection > cha || ct.loyalty > cha)
      err('contacts', `${label}: Connection and Loyalty can't exceed Charisma (${cha}) at creation.`)
  }
  if (!c.options.karmaForContacts && b.contacts.spent > b.contacts.total)
    err('contacts', `Contacts use ${b.contacts.spent} of ${b.contacts.total} free points.`)
  if (!c.lifestyle) warn('contacts', 'Choose a starting lifestyle.')

  return out
}
