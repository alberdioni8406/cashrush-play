# CASHRUSH

**Run. Survive. Collect. Own.**

A lightweight, fast-paced endless runner browser game inspired by the culture and visual identity of Bitcoin Cash and open digital economies. Fully original gameplay, characters, and art direction.

Play instantly in any modern browser. No account. No wallet. No backend required for Version 1.

---

## Features

- Endless runner with progressive difficulty
- Jump, duck, collect sats, Cash Drops & Token Orbs
- Power-ups: Token Magnet, Block Shield, Speed Boost, **HashRush**
- Combo multiplier system
- Four modular characters (CASH default + unlockables)
- Local achievements & persistent high scores
- Progressive Web App — works offline after first load
- Touch + keyboard controls
- Pure canvas pixel-art style, zero heavy frameworks
- Prepared architecture for future optional Bitcoin Cash / CashToken features

---

## Quick Start (Local)

```bash
# Clone or download the project
cd cashrush

# Serve with any static server, e.g.:
npx serve .
# or
python3 -m http.server 8080
```

Open `http://localhost:8080` (or the port shown).

> Service Worker requires a secure context (localhost or HTTPS).

---

## Deploy to Vercel

1. Push the `cashrush` folder to a GitHub repository.
2. Import the repo in [Vercel](https://vercel.com).
3. Framework Preset: **Other** (static).
4. Deploy. The included `vercel.json` handles static serving and SW headers.

Alternatively:

```bash
npx vercel
```

---

## Controls

| Action   | Desktop              | Mobile          |
|----------|----------------------|-----------------|
| Jump     | Space / ↑            | Tap             |
| Duck     | ↓                    | Swipe down      |
| Pause    | P / Esc              | Pause button    |
| Ability  | E / F (when charged) | —               |

Optional on-screen mobile buttons can be enabled in Settings.

---

## Project Structure

```
cashrush/
├── index.html
├── manifest.json          # PWA manifest
├── sw.js                  # Service Worker (offline cache)
├── vercel.json
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── main.js            # App bootstrap & UI
│   ├── game.js            # Core loop, world, scoring
│   ├── player.js
│   ├── obstacles.js
│   ├── collectibles.js
│   ├── powerups.js
│   ├── characters.js
│   ├── achievements.js
│   ├── storage.js         # Safe localStorage
│   ├── audio.js           # Procedural Web Audio
│   └── config.js          # Tunables + character/achievement defs
├── assets/
│   ├── images/            # Icons
│   ├── sprites/           # (reserved)
│   └── sounds/            # (reserved — audio is procedural)
└── integrations/          # Future BCH / CashToken modules (inert in V1)
    ├── wallet.js
    ├── cashtokens.js
    └── verification.js
```

---

## Offline / PWA

After the first successful visit the Service Worker caches:

- HTML, CSS, JavaScript
- Icons & static assets

The game remains fully playable without a network connection. Core gameplay never depends on external APIs.

---

## Local Storage

Progress is stored under the key `cashrush_v1`:

- High score, total distance, total virtual sats
- Unlocked characters, achievements, settings

Corrupted data is automatically replaced with safe defaults.

---

## Future Bitcoin Cash Integration

Version 1 deliberately contains **no** real wallet or blockchain dependency.

The `integrations/` folder is the designated place for:

- Optional wallet connection (`wallet.js`)
- CashToken rewards / NFT trophies (`cashtokens.js`)
- Online verification or tournaments (`verification.js`)

Normal gameplay must always remain available without a wallet.

---

## Design Notes

- **No copyrighted characters** — CASH and the unlockables are original.
- Visual identity uses Bitcoin Cash–inspired greens and retro-futuristic pixel aesthetics without spamming logos.
- All collectibles (sats, orbs) are **virtual** in Version 1.
- Performance-first: `requestAnimationFrame`, canvas rendering, minimal DOM, procedural audio.

---

## Support the Founder

CASHRUSH is free and playable offline forever. If you'd like to support development, you can send Bitcoin Cash to:

```
bitcoincash:qrlluw2ekm2zmp4qn52ashn4qt9xhhg405gcrzehu5
```

The address is also available in-game (main menu → SUPPORT, or Settings).

---

## License

This project is provided as an independent open browser game. Feel free to fork, host, and extend. Attribution appreciated.

---

*Built for the open digital economy — but first and foremost, a game.*
