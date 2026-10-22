# Aero-Roadster — Coastal Sunset 3D

A high-velocity, arcade stunt driving and thruster parking game built with Three.js.

---

## 🚀 Key Features

* **3D Roadster Vehicle**:
  * High-gloss clearcoat reflections dynamically capturing the sunset sky.
  * Sculpted aerodynamic front fascia with cyber LED headlights.
  * Full-width cyber LED taillight bar.
  * Dual-strut active aerodynamic rear wing that articulates during boost and flight.
  * 5-spoke sport rims with visible red brake calipers.
  * Built-in `GLTFLoader` hook in [`js/car.js`](file:///c:/Users/Rokan/Downloads/game/js/car.js) for external 3D `.glb` models.
* **Road Pickups & Power-Ups (Roadster Dash Inspired)**:
  * ⚡ **Air Canister**: Instantly refills your cold-gas air thrusters to 100%.
  * ⭐ **Starman Shield**: 7 seconds of glowing rainbow invincibility where colliding with traffic launches them into the stratosphere!
  * 🚀 **Rocket Fever**: 5.5 seconds of hypersonic boost speed, double stunt score multipliers, and dynamic warp speed lines.
* **Hull Integrity & Game Over Loop**:
  * Hull Integrity health bar (100% health / 3 hits).
  * Real-time distance tracking in meters (`m`).
  * Game Over crash slide and summary modal showing Distance, Score, and All-Time Best records saved to `localStorage`.
  * Instant retry via Spacebar or Tap.
* **Procedural Web Audio Synth** (Zero external MP3 dependencies):
  * Dynamic electric engine whine responding to vehicle speed.
  * Bandpass-filtered cold-gas thruster hiss on Jump and Boost.
  * Harmonic chimes on Stunts (Barrel Rolls, Flips, Perfect Landings).
  * Impact crunch and crash thud.
  * Audio toggle with `M` key and HUD button.
* **Arcade Stunt System**:
  * Barrel Rolls, Zero-G Flips, Thruster Slams, Perfect Landings, Shield Smashes, Air Clears, and Near Misses.
  * Streak multipliers (up to ×99) with time decay.

---

## 📁 Project Structure

```text
├── index.html            # Main HTML document
├── ai_studio_code.html   # Synced alternate entry point
├── server.js             # Zero-dependency local Node static server
├── README.md             # Documentation & Tuning Guide
├── css/
│   └── style.css         # HUD, Hull gauge, Item badge, Canvas, and Game Over modal
└── js/
    ├── config.js         # Centralized tuning: speeds, physics, colors, stunt points, items
    ├── audio.js          # Procedural Web Audio synthesizer (engine, thrusters, chimes, crashes)
    ├── textures.js       # Procedural asphalt bump maps, reflections, and sunset sky
    ├── world.js          # Highway spline, ocean, beach, cliffs, distant bay & lighting
    ├── car.js            # 3D player vehicle model, clearcoat, active wing & rolling wheels
    ├── particles.js      # Cold-gas condensation plume particle system
    ├── items.js          # Floating road pickups (Air, Starman Shield, Rocket Fever)
    ├── traffic.js        # Highway AI traffic obstacles & jump/smash/crash collisions
    ├── input.js          # Touch virtual joystick, action buttons & keyboard controller
    ├── ui.js             # Score calculation, streak multiplier, HUD popups & Game Over
    └── game.js           # Main physics loop, camera tracking & scene coordinator
```

---

## 🕹️ Controls

| Action | Keyboard | Touch Controls |
| :--- | :--- | :--- |
| **Steer & Air Roll** | `A` / `D` or `←` / `→` | Left Virtual Joystick |
| **Air Pitch (Flip)** | `W` / `S` or `↑` / `↓` | Left Virtual Joystick (Up/Down) |
| **Air Jump (Lift)** | `Space` | **LIFT** Button |
| **Cryo Boost** | `Shift` | **BOOST** Button |
| **Thruster Slam** | `C` or `Ctrl` | **SLAM** Button |
| **Toggle Audio** | `M` | Audio HUD Button |
| **Restart (Game Over)** | `Space` | Tap "Retry" Button |

---

## ⚙️ Running Locally

1. **Option A (Instant Local Server)**:
   ```bash
   node server.js
   ```
   Open `http://localhost:8080` in your browser.

2. **Option B (Direct File)**:
   Double-click [`index.html`](file:///c:/Users/Rokan/Downloads/game/index.html) directly in any modern web browser.
