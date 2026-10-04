import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

const OPEN_DELAY = 250
const CLOSE_DELAY = 150

/**
 * Popover that opens on hover (desktop) or on tapping the ⓘ button (touch / keyboard).
 * Uses fixed positioning so it isn't clipped by scrolling tables.
 */
export function InfoTip({ label, children, content }: { label: string; children: ReactNode; content: () => ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null)
  const anchor = useRef<HTMLSpanElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const id = useId()

  const schedule = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(fn, ms)
  }
  const close = useCallback(() => { setOpen(false); setPinned(false) }, [])

  useLayoutEffect(() => {
    if (!open || !anchor.current) return
    const r = anchor.current.getBoundingClientRect()
    const h = card.current?.offsetHeight ?? 180
    const w = Math.min(340, window.innerWidth - 32)
    const above = r.bottom + h + 12 > window.innerHeight && r.top > h + 12
    setPos({
      top: above ? r.top - h - 6 : r.bottom + 6,
      left: Math.max(16, Math.min(r.left, window.innerWidth - w - 16)),
      above,
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!anchor.current?.contains(t) && !card.current?.contains(t)) close()
    }
    const onScroll = () => { if (!pinned) close() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, pinned, close])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const hoverIn = (e: React.PointerEvent) => { if (e.pointerType === 'mouse') schedule(() => setOpen(true), OPEN_DELAY) }
  const hoverOut = (e: React.PointerEvent) => { if (e.pointerType === 'mouse' && !pinned) schedule(() => setOpen(false), CLOSE_DELAY) }

  return (
    <span className="infotip" ref={anchor} onPointerEnter={hoverIn} onPointerLeave={hoverOut}>
      {children}
      <button
        type="button"
        className="infotip-btn"
        aria-label={`Details for ${label}`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={e => {
          e.stopPropagation()
          window.clearTimeout(timer.current)
          if (open && pinned) close()
          else { setOpen(true); setPinned(true) }
        }}
      >ⓘ</button>
      {open && (
        <div
          id={id}
          ref={card}
          role="dialog"
          aria-label={label}
          className="infotip-card"
          style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden', top: 0, left: 0 }}
          onPointerEnter={() => window.clearTimeout(timer.current)}
          onPointerLeave={hoverOut}
        >
          {content()}
        </div>
      )}
    </span>
  )
}
