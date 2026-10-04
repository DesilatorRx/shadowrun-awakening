import { describe, expect, it } from 'vitest'
import { gearAvail, gearEssence, gearUnitCost } from '../engine/calc'
import { GEAR } from './gear'
import { GEAR_INFO } from './gearInfo'

describe('gear catalog integrity', () => {
  it('has unique ids', () => {
    const seen = new Set<string>()
    const dupes = GEAR.filter(g => (seen.has(g.id) ? true : (seen.add(g.id), false))).map(g => g.id)
    expect(dupes).toEqual([])
  })

  it('has sane numbers at every rating', () => {
    const bad: string[] = []
    for (const g of GEAR) {
      const ratings = g.rated ? Array.from({ length: g.rated.max - g.rated.min + 1 }, (_, i) => g.rated!.min + i) : [undefined]
      if (g.rated && g.rated.min > g.rated.max) bad.push(`${g.id}: rating range`)
      for (const r of ratings) {
        const cost = gearUnitCost(g, r), avail = gearAvail(g, r), ess = gearEssence(g, r)
        if (!Number.isFinite(cost) || cost < 0) bad.push(`${g.id}@${r}: cost ${cost}`)
        if (!Number.isFinite(avail) || avail < 0 || avail > 12) bad.push(`${g.id}@${r}: avail ${avail}`)
        if (!Number.isFinite(ess) || ess < 0 || ess > 6) bad.push(`${g.id}@${r}: essence ${ess}`)
      }
      for (const [k, arr] of Object.entries(g.byRating ?? {})) {
        if (!g.rated || arr.length !== g.rated.max - g.rated.min + 1) bad.push(`${g.id}: byRating.${k} length`)
      }
    }
    expect(bad).toEqual([])
  })

  it('only references real items in conflicts', () => {
    const ids = new Set(GEAR.map(g => g.id))
    const bad = GEAR.flatMap(g => (g.conflicts ?? []).filter(c => !ids.has(c)).map(c => `${g.id} -> ${c}`))
    expect(bad).toEqual([])
  })

  it('has a description and page for every item', () => {
    const missing = GEAR.filter(g => !GEAR_INFO[g.id]?.summary).map(g => g.id)
    expect(missing).toEqual([])
  })
})
