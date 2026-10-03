import { useCallback } from 'react'
import './App.css'
import { Editor } from './components/Editor'
import { Roster } from './components/Roster'
import type { Character } from './engine/types'
import { useCharacters } from './state/store'

export default function App() {
  const { chars, active, setActiveId, update, create, add, remove } = useCharacters()

  const set = useCallback((fn: (c: Character) => Character) => {
    if (active) update(active.id, fn)
  }, [active, update])

  if (active) return <Editor key={active.id} c={active} set={set} onClose={() => setActiveId(null)} />

  return (
    <Roster
      chars={chars}
      onOpen={setActiveId}
      onCreate={create}
      onImport={add}
      onDelete={remove}
      onDuplicate={c => add({ ...c, alias: c.alias ? `${c.alias} (copy)` : c.alias, name: !c.alias && c.name ? `${c.name} (copy)` : c.name })}
    />
  )
}
