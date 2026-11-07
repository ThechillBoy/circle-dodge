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

## Game modes (picked on the landing screen)
| Mode | Speed | Balls per wave | Spawns |
|---|---|---|---|
| 😊 **EASY** | 25% slower | starts at 1, +1 every 3 levels (max 4) | relaxed |
| 🔥 **HARD** | baseline | starts at 1, +1 every 2 levels (max 5) | normal |
| ⚡ **EXTREME** | 35% faster | starts at 2, +1 every 2 levels (max 5) | faster |
| 💀 **INSANE** | 80% faster | starts at 3 (max 6) | fastest |

The mode never changes by itself - you tap it on the landing screen and it stays for the whole run. Higher levels still roll more fast/zigzag enemies in every mode.

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
