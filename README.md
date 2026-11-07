# Circle Dodge

## 🎮 PLAY NOW 👉 https://thechillboy.github.io/circle-dodge

Repo: https://github.com/ThechillBoy/circle-dodge

Endless mouse-dodge arcade game in pure vanilla HTML/CSS/JS - zero dependencies, no assets (all sound is synthesized with WebAudio).

## How to play
- Move your **cyan** circle with the mouse (or touch). Press **P** to pause.
- **Dodge** red, orange & pink circles - touch one and it is over... unless you have an extra life!
- **Collect** green (+1) and gold (+5) circles
- Every **5 points = next level**: enemies get faster and fiercer
- Level 3+ zigzag enemies will hunt you. Good luck!

## Difficulty tiers
| Level | Tier | What happens |
|---|---|---|
| 5+ | **HARD** | 25% faster enemies, tighter spawn rate |
| 7+ | **EXTREME** | 50% faster, spawns even quicker |
| 9+ | **INSANE** | 80% faster, maximum pressure |

Red balls multiply every level: 1 per wave at first, then 2, 3, 4... up to **5 per wave** at level 9+. Higher levels also roll more fast/zigzag enemies.

## Features
- **Combo system** - chain pickups quickly for up to x5 score multiplier
- **Power-ups** - Shield (5s invincible), Slow-Mo, Magnet (pulls goodies to you), extra Life
- **Synthesized sound effects** & **procedural background music** (tempo rises with level)
- Screen shake on death, floating score popups, level-up banners, player glow trail
- Level progress bar on top of the screen
- Best-score saved locally

## Not seeing the latest version?
Press **Ctrl+F5** (hard refresh) or open the link in a new incognito window.
Every code push auto-redeploys via the **pages build and deployment** workflow on the Actions tab - wait for its green check, then hard-refresh.

## Files
- index.html - page & UI
- style.css - styling
- script.js - game logic + audio engine
- favicon.svg - tab icon
