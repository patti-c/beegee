# beegee

A point-and-click mystery investigation game running in the browser. Inspired by Phoenix Wright and Disco Elysium.

## Stack

- **Vite + React + TypeScript** — UI and application shell
- **PixiJS v8** — canvas rendering (scenes, hotspots, navigation)
- **inkjs v2** — narrative scripting; `.ink` files compiled at build time via a custom Vite plugin
- **Zustand** — global game state
- **localStorage** — save/load

## Features

- Scene navigation across multiple locations
- Hotspot interactions that trigger ink dialogue branches
- NPC character dialogue with an animated overlay, emotional states that shift per branch, and visited choices tracked persistently
- Skill check system: d10 roll + stat vs DC, with a modal result display
- Inner monologue feed: skills narrate observations when they pass a threshold roll
- Skill discovery: some skills are locked until story events unlock them
- Inventory with slot-based equipment (left hand, right hand, headgear, pocket) and per-item slot restrictions
- Item acquisition via story events, with a separate item catalog for discoverable items
- Persistent flags readable in ink, enabling cross-scene state (`photo_examined` → new dialogue option with Vera)
- Save/load persists: scene, flags, equipped items, discovered skills, visited choices, acquired items

## Ink external functions

These are available to all `.ink` scene files:

| Function | Description |
|---|---|
| `skillCheck(skillId, threshold)` | Rolls d10 + stat; shows modal; returns 1/0 |
| `triggerMonologue(skillId, threshold, line)` | Ambient inner monologue if skill discovered + roll passes |
| `grantSkill(skillId)` / `removeSkill(skillId)` | Discover or hide a skill |
| `setEmotion(characterId, emotion)` | Shift a character's emotional state (affects sprite) |
| `setFlag(key, value)` / `getFlag(key)` | Persistent cross-scene flags; `getFlag` returns 1/0 |
| `giveItem(itemId)` | Add a catalog item to inventory (idempotent) |

## Dev

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output to dist/
```

Scene ink files live in `src/ink/`. `story.ink` is the root — it declares all externals and includes the per-scene files. Add a new scene by creating a `.ink` file and adding `INCLUDE yourscene.ink` to `story.ink`.
