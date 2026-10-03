import type { Character } from '../engine/types'

const KEY = 'sr6-awakening.characters.v1'
const ACTIVE_KEY = 'sr6-awakening.active.v1'

// Storage can throw (private mode, blocked site data); the app must keep working without it.

export function loadCharacters(): Character[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCharacters(chars: Character[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(chars))
  } catch {
    // ignore: persistence is best effort
  }
}

export function loadActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch {
    return null
  }
}

export function saveActiveId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id)
    else localStorage.removeItem(ACTIVE_KEY)
  } catch {
    // ignore
  }
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
