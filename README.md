# Amadeus - Mozart's Musical Quest

A browser-based HTML5 Canvas platformer where young Mozart battles musical enemies on his quest to become the world's greatest musician.

## How to Play

Open `index.html` in a browser (or serve with any static file server).

**Controls:**
- Arrow keys / WASD — Move and jump
- X — Melee attack
- Jump on enemies to stomp them

## Enemy Types

| Enemy | Behavior |
|-------|----------|
| **Singer** | Patrols, detects player, sings musical note projectiles |
| **Drum Troll** | Patrols, jumps high and slams creating shockwaves on landing |
| **Conductor Ghost** | Teleports away from player, summons ghost minions |
| **Sheet Music Bats** | Fly in V-formation, swoop at player; followers promote to leader if leader dies |
| **Metronome Sentinel** | Stationary, attacks on a predictable beat with visual wind-up telegraph |

## AI Features

- **State machines** — Each enemy uses patrol → alert → attack → cooldown states
- **Player detection** — Enemies react to player proximity with configurable detection radius
- **Telegraphing** — All attacks have visual warnings (shaking, flashing, windup animations)
- **Formation system** — Bats maintain V-formation with leader/follower dynamics

## Difficulty Scaling

Enemies scale per level with capped multipliers:
- Speed: up to 2x
- Attack rate: cooldowns reduce to 50% minimum
- Health: up to 2.5x
- Detection range: increases from 200 to 400px
- Summon/projectile caps increase gradually

## Project Structure

```
index.html          — Game entry point
js/
  game.js           — Main loop, rendering, input, game state
  player.js         — Mozart player character with platformer physics
  enemy.js          — Base enemy class + all enemy type implementations
  projectile.js     — Projectiles (notes, shockwaves, beat pulses)
  level.js          — Level definitions with enemy placement
  utils.js          — Collision detection, math helpers
```
