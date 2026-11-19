# ANGKOR WAT RUN 🇰🇭

An original Cambodian 3D endless-runner game set around the Angkor temple complex.

## Current playable MVP
- Three running lanes
- Mobile swipe and on-screen touch controls
- Keyboard controls for desktop
- Jumping and sliding
- Procedurally spawned obstacles and collectible coins
- Collision detection, score, distance and best-score saving
- Pause, restart and sound toggle
- Three.js 3D scene

## Run locally
This is a static browser game. Serve the repository root with any local static HTTP server, then open `/zombie-chase.html`. The root `index.html` forwards players to the game.

## Deploy with Cloudflare Pages
- Connect `sreynetsaret-dot/Candy-match-3` to the existing Pages project.
- Production branch: `main`.
- Build command: leave empty.
- Build output directory: `/` (or `.`, as accepted by the Pages dashboard).
- The game entry is `zombie-chase.html`.

## Android
The repository retains the Capacitor configuration and Android build workflow as a starting point. The native Android project/build still needs device testing and release preparation.

## Project status
This is an evolving MVP, not yet a finished commercial release. Visual quality, device performance, sound, accessibility, and gameplay balance must be tested on real Android and iPhone devices before publishing.
