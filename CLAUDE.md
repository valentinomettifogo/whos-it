# CLAUDE.md — Who's It

## Project overview

Single-page PWA for multitouch finger selection. No backend, no database, no auth. Everything runs client-side.

Users place fingers on the screen → 2-second countdown → one random finger is declared the winner. Used for quick game arbitration (who goes first, who picks, etc.).

## Stack

| Layer | Tech | Version |
|-------|------|---------|
| Framework | SvelteKit | 2.x |
| UI | Svelte 5 (runes) | 5.x |
| Language | TypeScript | 6.x |
| Styling | Tailwind CSS | 4.x |
| Build | Vite | 8.x |
| Deployment | Vercel (adapter-auto) | — |

## Key files

```
src/routes/+page.svelte     — entire app logic and UI (single page)
src/routes/+layout.svelte   — minimal layout wrapper
src/routes/layout.css       — global styles (Orbitron/Space fonts, animations)
src/service-worker.ts       — PWA cache strategy (cache-first for build assets)
static/manifest.json        — PWA manifest (name, icons, display: standalone)
.github/repository-metadata.yml  — GitHub repo metadata (description, topics)
.github/push-metadata.sh         — script to push metadata to GitHub via gh CLI
```

## Dev commands

```bash
npm run dev        # dev server with --host (accessible on LAN for mobile testing)
npm run build      # production build
npm run preview    # preview production build
npm run check      # svelte-check + TypeScript
```

## Game state machine

The app has three states managed with Svelte 5 `$state`:

| State | Description |
|-------|-------------|
| `attesa` | Waiting — no fingers detected |
| `conteggio` | Counting — fingers on screen, 2s timer running |
| `finito` | Done — winner selected, visual highlight active |

## Core data type

```typescript
interface Dito {
  id: number           // TouchEvent.identifier
  x: number
  y: number
  color: string        // one of 7 sci-fi accent colors
  vincitore: boolean
}
```

Touch points are tracked by `TouchEvent.identifier`. Each finger gets a persistent color for the session. On reset (all fingers lifted + 300ms grace window), state returns to `attesa`.

## Conventions

- Svelte 5 runes only (`$state`, `$props`) — no legacy stores or `reactive`
- No tests at the moment — the app is a single interactive surface
- Italian variable names in game logic (`dito`, `vincitore`, `attesa`, etc.) — keep consistent
- No backend calls, no environment variables needed
