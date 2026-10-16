# Florensia Build Planner

A character build planner for the MMORPG **Florensia**: classes and jobs, stat points, weapons, armor, dresses, hats, accessories, upgrade levels, essences (core and meta), seals, item sets, skill tree, passives and buffs (including pet buffs).

It is a static site: no server and no database. Everything lives in `index.html` and its data files.

**Live site:** https://gorosoe.github.io/florensia-builder-planner/

## Run it locally

- Double-click `index.html`
- or run `lancer.bat` (Windows), which starts a small local server on http://localhost:8080 (requires Python)

## How stats are calculated

- **Base values** come from the character's class, level and stat points (formulas from the Flandria planner).
- **Percentage bonuses** (dresses, hats, accessories…) apply to that base value, plus the weapon's base damage for attack. They do not apply to flat bonuses.
- **Flat bonuses** are added on top: upgrade levels, essences, seals, set bonuses, passives and buffs.
- **Defense** is the exception: its percentage bonuses apply after all other bonuses.
- Mercenary base attack is calibrated against in-game character sheets at level 112. Other classes may be slightly off.

## Files

| File | Purpose |
|---|---|
| `index.html` | the application (HTML, CSS and JavaScript) |
| `data.js` / `data.json` | game data (items, essences, sets, upgrades, skills…), the same content in two formats |
| `icons.webp` | icon sprite sheet |
| `tree-*.png` | skill tree backgrounds for each class |
| `lancer.bat` | local launcher for Windows |

## Credits and license

- Stat formulas, skill trees and data extraction are based on [Flandria](https://github.com/HealYouDown/flandria) by HealYouDown, licensed under AGPL-3.0.
- This project is distributed under the same license: **GNU AGPL v3**. See [LICENSE](LICENSE).
- Game data from the Florensia patch of October 16, 2026.

**Unofficial fan project.** Florensia and its names, data and icons belong to their respective owners. This site is not affiliated with the game's publisher.
