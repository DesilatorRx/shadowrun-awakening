# Roadmap

The main goal right now is **new player-character creation** under the Berlin City Edition (2023) rules.
Longer term, the same engine should also let a gamemaster build NPCs fast, track runners after creation,
and support the Sixth World Companion's other build methods.

## The core idea: three separate layers

Each character keeps three independent settings, so a new mode doesn't need a rewrite:

| Layer | What it decides | Today | Later |
| --- | --- | --- | --- |
| **Ruleset** | Which book rules apply | Berlin 2023 + house-rule switches | Original 2019 book, Companion options |
| **Build method** | How the character is paid for and checked | Priority | **GM / Free**, Point Buy, Life Path, Career (advancement) |
| **Kind** | What the character *is* | Player runner | **Grunt group**, named NPC, prime runner, contact, spirit/critter |

Things shared by every combination stay in one place: game data (`src/data`), derived stats, augmentation
effects, gear popovers, the character sheet, and exports. Each **build method** brings only two things:
a *budget* (which points exist and what has been spent) and a *validator* (which rules are enforced).
GM mode is simply "no budget, sanity checks only."

## Phases

### Phase 1: Player creation (now)
- [x] Priority creation, Berlin 2023 rules, verified against the book
- [x] Augmentation effects, gear popovers, skill qualities, specializations
- [x] Full gear catalog from the Berlin City Edition (~590 items: weapons, ammo, explosives, armor, electronics, software, augmentations, magic, drugs, vehicles, drones, Berlin gear)
- [ ] Popover descriptions for qualities, spells, adept powers, complex forms
- [ ] Improved Physical Attribute (adept power with an attribute choice)

### Phase 2: GM mode and quick NPCs
- **Free build method:** type attributes and skill ratings directly with no point pools, so an NPC takes seconds.
  Validation only flags impossible values (above metatype max + augmentation, or Essence below 0).
- **Grunt groups** (book p. 203): pick a Professional Rating 0–10 and a head count; the group shares an Edge
  pool equal to its Professional Rating. Add an optional lieutenant, and track each grunt's condition monitor.
- **Quick templates:** start from a typical grunt per Professional Rating (ganger, security, SWAT, special forces),
  then adjust. Templates hold stats only; read the book for flavor.
- **Compact stat block:** a one-card view of dice pools, Defense Rating, initiative and weapons, printable as
  encounter cards.
- **Roster folders:** keep PCs, NPCs and grunt groups apart, with tags such as campaign, faction or location
  (for example "Kreuzberg", "Vory", "Saeder-Krupp").

### Phase 3: Runners in play (career mode)
- After creation, lock the build and spend earned karma with the advancement costs (p. 68); positive
  qualities cost double after creation.
- Keep a karma and nuyen log per run.
- Track lifestyle months and contact changes.

### Phase 4: More build methods and integrations
- Sixth World Companion build methods: Point Buy, Life Path, Prime Runner and Street Level variants.
- Export to Foundry VTT and Roll20, plus shareable read-only character links.

## Data model notes
- `Character` will gain `build` (`'priority' | 'free' | …`) and `kind` (`'runner' | 'grunts' | …`). Older
  saves default to `priority`/`runner`, so existing characters keep working.
- Validators become per-build-method modules that share the common checks: Essence, augmentation limits
  and incompatible implants.
- Game data stays rules-agnostic. Any number that changes between printings lives in `src/engine/rules.ts`.

## Contributing
Data fixes are the easiest way to help: correct a number in `src/data/` and cite the page. Please don't paste
rulebook text; descriptions in this project are written in our own words.
