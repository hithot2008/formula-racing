# FORMULA / 01

A playable 3D formula racing game with eight original circuits, three difficulty levels and English / Traditional Chinese interfaces.

## Play locally

Requires Node.js 22+ and a WebGL-capable browser.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite, usually http://127.0.0.1:5173. On macOS, you can also double-click `啟動遊戲.command`.

Choose **English** in the **Language** menu at the top. Your choice persists after reloading. Changing language preserves your medals, lap records and ghost laps. Records are stored in this browser; clearing browser data removes them.

## Controls

| Action | Key |
| --- | --- |
| Throttle / brake | W / S or ↑ / ↓ |
| Steer left / right | A / D or ← / → |
| Energy boost | Space |
| Change camera | C |
| Pause / resume | Esc |
| Reset car, with a five-second stop | R |
| Pit service | Stop in the green box on the right after the start line, then press P |

Standard gamepads use the left stick for steering, RT for throttle, LT for braking and A for boost. Physical gamepad compatibility has not been verified.

## Modes

- **Grand Prix:** three laps against five AI drivers; medals depend on finishing position.
- **Time trial:** two laps, valid lap records and a personal best ghost. Off-track driving or resetting invalidates the lap.
- **Skill challenge:** one lap within the white lines, without resetting and with less than 5% damage.

Each circuit offers all three modes, giving 24 challenge combinations. Records are separated by circuit, mode and difficulty. Easy, Advanced and Pro adjust driving assistance, AI pace and damage.

## Development checks

```sh
npm test
npm run build
# With the local development server running on port 5173:
npm run test:english
npm run test:steering
npm run test:browser
```

Browser tests default to Google Chrome on macOS. Set `CHROME_PATH` to use a different Chrome executable. The accelerated race verification interface is available only in development builds.

## Current scope

This is a playable first release using procedural 3D assets and simplified vehicle physics. Full career progression, qualifying, dynamic weather, detailed suspension and tyre-temperature grip modelling, manual transmission, full pit-lane rules and steering-wheel force feedback are not implemented. It is an original game, not an official F1 product or engineering-grade simulator.

[繁體中文說明](README.md)


## Background music

Choose from six original synthesized arrangements: **Apex Energy** (Electro House, 128 BPM), **Neon Drive** (Synthwave, 110), **Redline Rush** (Drum & Bass, 174), **Tunnel Pulse** (Techno, 138), **Horizon Sprint** (Trance, 140), and **Grid Breaks** (Breakbeat, 132).

Use the Background music section to preview a track and set its volume independently of engine sound. Preferences persist. During a race, press **M** or use the Music button to toggle playback. Music starts after a preview/start gesture and stops on pause, finish or window blur. Resume the race to continue playback.

Audio is synthesized locally with Web Audio: drums, bass, melodies and arrangement variations. No external songs, samples or streaming services are used. Run `npm run test:music` with the development server running to verify audio rendering and playback controls.
