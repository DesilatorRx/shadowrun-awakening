import { useCallback, useEffect, useState } from 'react'
import { BERLIN_2023_OPTIONS } from '../engine/rules'
import type { AttrAlloc, Character } from '../engine/types'
import { loadActiveId, loadCharacters, saveActiveId, saveCharacters } from './storage'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

const zero = (): AttrAlloc => ({ points: 0, adjust: 0, karma: 0 })

export function newCharacter(setting: Character['setting'] = 'berlin'): Character {
  const now = new Date().toISOString()
  return {
    id: uid(),
    schema: 1,
    created: now,
    updated: now,
    name: '',
    alias: '',
    concept: '',
    notes: '',
    setting,
    options: { ...BERLIN_2023_OPTIONS },
    priorities: { metatype: 'D', attributes: 'A', magic: 'E', skills: 'B', resources: 'C' },
    metatype: 'human',
    magicType: 'mundane',
    attributes: { bod: zero(), agi: zero(), rea: zero(), str: zero(), wil: zero(), log: zero(), int: zero(), cha: zero() },
    edge: zero(),
    magic: zero(),
    resonance: zero(),
    skills: {},
    knowledge: [],
    languages: [{ id: uid(), name: setting === 'berlin' ? 'German' : 'English', native: true, level: 0 }],
    qualities: [],
    spells: [],
    complexForms: [],
    adeptPowers: [],
    powerPointsBought: 0,
    gear: [],
    contacts: [],
    lifestyle: '',
    lifestyleMonths: 1,
    karmaToNuyen: 0,
  }
}

/** Fill any fields missing from older or hand-edited saves. */
export function normalize(raw: Partial<Character>): Character {
  const base = newCharacter(raw.setting ?? 'berlin')
  return {
    ...base,
    ...raw,
    options: { ...base.options, ...raw.options },
    priorities: { ...base.priorities, ...raw.priorities },
    attributes: { ...base.attributes, ...raw.attributes },
    id: raw.id ?? base.id,
  } as Character
}

export function useCharacters() {
  const [chars, setChars] = useState<Character[]>(() => loadCharacters().map(normalize))
  const [activeId, setActiveId] = useState<string | null>(() => loadActiveId())

  useEffect(() => saveCharacters(chars), [chars])
  useEffect(() => saveActiveId(activeId), [activeId])

  const active = chars.find(c => c.id === activeId) ?? null

  const update = useCallback((id: string, fn: (c: Character) => Character) => {
    setChars(list => list.map(c => (c.id === id ? { ...fn(c), updated: new Date().toISOString() } : c)))
  }, [])

  const create = useCallback((setting: Character['setting']) => {
    const c = newCharacter(setting)
    setChars(list => [...list, c])
    setActiveId(c.id)
  }, [])

  const add = useCallback((c: Character) => {
    const copy = { ...normalize(c), id: uid() }
    setChars(list => [...list, copy])
    setActiveId(copy.id)
  }, [])

  const remove = useCallback((id: string) => {
    setChars(list => list.filter(c => c.id !== id))
    setActiveId(cur => (cur === id ? null : cur))
  }, [])

  return { chars, active, activeId, setActiveId, update, create, add, remove }
}
