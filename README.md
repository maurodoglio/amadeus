# Amadeus 🎵

A platform game where young Mozart is on a quest to become the best musician of the world.

## How to Play

Open `index.html` in a modern browser — no build step required.

### Controls

| Key | Action |
|-----|--------|
| ← → | Move left/right |
| Space | Jump |
| X | Attack (uses instrument abilities) |

### Power-Up System

Collecting instruments unlocks permanent abilities for subsequent levels:

| Instrument | Unlock | Ability | How to Use |
|------------|--------|---------|------------|
| 🎻 Violin | Level 1 | Sound Wave projectile | Press X on ground |
| 🪈 Flute | Level 2 | Float/Glide (double jump) | Press Space mid-air |
| 🎹 Piano | Level 3 | Ground Pound (stuns enemies) | Press X mid-air |

**Priority rules:**
- On ground + X → Violin sound wave
- In air + X → Piano ground pound (if collected), otherwise Violin sound wave
- In air + Space → Flute float (if collected, one use per jump)

### Levels

1. **The Concert Hall** — Collect the Violin, then test your sound wave on enemies
2. **The Rooftops** — Collect the Flute, then float across wide gaps
3. **The Grand Stage** — Collect the Piano, then ground pound clusters of enemies

## Development

Single-file HTML5 Canvas game with no dependencies. Just edit `index.html`.
