# Shadowrun Awakening: free Shadowrun 6e character creator

A free, open-source **Shadowrun Sixth World (SR6 / 6th Edition) character creator** that runs in your browser. **Use it here: https://desilatorrx.github.io/shadowrun-awakening/**

**Ruleset:** *Shadowrun, Sixth World Core Rulebook: City Edition - Berlin* (Catalyst Game Labs, November 2023), which includes all errata to that date. Creation rules were checked against that book, with page references in `src/engine/rules.ts`.

It needs no install and no account. Characters are saved in your browser, and you can export them as JSON to back them up or share them.

## Features

- **Priority creation**, step by step: concept, priorities, metatype, attributes, magic/resonance, qualities, skills, gear, contacts and lifestyle, then a character sheet.
- **Live budgets.** A sidebar tracks adjustment points, attribute points, skill points, karma, nuyen, free spells/forms, power points, knowledge slots and contact points.
- **Rule validation.** Problems are flagged on the step where they happen and summarized on the sheet. The validator checks:
  - one attribute at maximum
  - at most 6 qualities, with net bonus karma of 20 or less
  - the availability cap
  - Magic of 6 or less
  - contact ratings no higher than Charisma
  - unspent points
  - …and more.
- **Magic and Resonance:**
  - traditions and mentor spirits
  - 73 core spells
  - adept powers
  - the mystic adept power point / spell split
  - complex forms
- **City Edition qualities** for Berlin and Seattle, filtered by your campaign setting.
- **Gear catalog** with weapons, armor, commlinks, decks, rigger consoles, rated cyberware and bioware with Essence tracking, and karma-to-nuyen conversion.
- **Rules as written by default**, with page references in the code, plus optional house-rule switches:
  - availability cap of 7 instead of 6
  - extra spells/complex forms bought with karma at creation (allowed in the original 2019 book)
  - extra contact points bought with karma (Sixth World Companion option)
- **Item details on hover or tap** (ⓘ): an own-words description, full stats, and the rulebook page for every gear item.
- **Print or save as PDF** from a clean printable sheet.
- Works on desktop and phone.

## Running locally

```bash
npm install
npm run dev      # development server
npm test         # rules engine unit tests
npm run build    # production build in dist/
```

## Project layout

| Path | What lives there |
| --- | --- |
| `src/data/` | Game data: priority table, metatypes, skills, qualities, spells, powers, gear. **Most corrections go here.** |
| `src/engine/rules.ts` | Creation-rule constants (karma costs, caps) and table-rule options. |
| `src/engine/calc.ts` | Point budgets, karma costs, derived stats. |
| `src/engine/validate.ts` | Creation rule checks. |
| `src/components/` | React UI, one file per creation step. |

## Roadmap

See [ROADMAP.md](ROADMAP.md): GM mode for quick NPCs and grunt groups, career mode, and more build methods are planned.

## Contributing

Found a wrong number? Fix it in `src/data/` and open a pull request, citing the book and page. Data was checked against the Berlin City Edition (2023); the gear catalog is still a subset of the book, so additions are welcome.

Good next steps:
- cyberware grades
- vehicles and drones
- metavariants from the Sixth World Companion
- Sum-to-Ten, point-buy and life path creation
- career mode (karma advancement)
- Foundry VTT export

## Legal

- The code is MIT licensed (see `LICENSE`).
- This is an unofficial fan project. Shadowrun and related marks are trademarks of The Topps Company, Inc. This project is not affiliated with or endorsed by Topps or Catalyst Game Labs.
- The tool contains game statistics (names and numbers) only. It reproduces no rules text or descriptions, so you need the rulebooks to play.

## Credits

Inspired by [Commlink6](https://github.com/taranion/Commlink6) by Stefan Prelle. Shadowrun Awakening is an independent reimplementation and contains none of Commlink6's code.
