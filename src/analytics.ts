// Anonymous usage counting with GoatCounter (no cookies, no personal data).
// Only event names are sent: never character names, notes, or any other content people type.

export const GOATCOUNTER_CODE = 'shadowrun-awakening'

declare global {
  interface Window {
    goatcounter?: { count: (vars: { path: string; title?: string; event?: boolean }) => void }
  }
}

const sent = new Set<string>()

/** Count an event. `once` events are counted at most once per page load. */
export function track(event: string, title?: string, once = false): void {
  if (once) {
    if (sent.has(event)) return
    sent.add(event)
  }
  try {
    // Skip local development so testing doesn't inflate the numbers.
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return
    window.goatcounter?.count({ path: event, title: title ?? event, event: true })
  } catch {
    // Analytics must never break the app.
  }
}
