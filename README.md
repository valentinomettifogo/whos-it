# Who's It

Multitouch finger picker PWA — place fingers on the screen, one is chosen at random.

**[Live demo →](https://whos-it-peach.vercel.app)**

## How it works

1. Everyone places a finger on the screen at the same time
2. A 2-second countdown locks in all detected touch points
3. One finger is randomly selected as the winner — everyone else is out

Great for deciding who goes first in card games, board games, or anything else where you need a quick, fair pick.

## Tech stack

- [SvelteKit 2](https://svelte.dev/docs/kit) + [Svelte 5](https://svelte.dev/docs/svelte) (runes)
- TypeScript
- Tailwind CSS 4
- PWA with offline support via service worker

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` on a touch device or use Chrome DevTools touch simulation.

Other commands:

```bash
npm run build      # production build
npm run preview    # preview production build locally
npm run check      # TypeScript + Svelte type check
```

## Install as PWA

On mobile, tap **Add to Home Screen** from the browser menu. The app runs in standalone mode (no browser chrome) and works offline.
