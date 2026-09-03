<!-- Generated from paired bilingual sources; update both languages together. Source: docs/source/GAME_DESIGN.json -->

# Game design specification

[繁體中文](GAME_DESIGN.md)

<!-- section: section-00 -->

This document retains the full design goals; it does not claim every feature is complete. The current implementation uses Three.js + Vite in a local browser. See [development status](ROADMAP.en.md) for implemented features and limitations.

<!-- section: section-01 -->

## Positioning

A modern, realistic 3D formula racing game focused on braking weight transfer, cornering grip limits and controlled acceleration out of corners. A complete single-player computer experience comes first; the current platform is a local browser.

<!-- section: section-02 -->

## Art and sound

Realistic bodywork, carbon fibre and metal, tyre wear, dynamic shadows, raindrops and spray. Environments include pit areas, grandstands, runoff and day/night weather. Camera goals include cockpit, roof, chase and replay views. The HUD shows speed, gear, lap delta, tyres, energy and flags. Engine, gearshift, tyre, kerb and engineer sounds provide feedback; shake and motion blur are adjustable.

<!-- section: section-03 -->

## Physics core

Use a fixed timestep with physics separated from rendering; start with a tunable simplified tyre model.

| System | Simulation content |
| --- | --- |
| Tyres | Temperature, wear, moisture and combined longitudinal/lateral grip |
| Body | Acceleration, braking and cornering load transfer, centre of gravity and inertia |
| Aerodynamics | Speed-dependent downforce and drag |
| Suspension | Springs, damping, kerbs and floor contact |
| Powertrain | Torque curves, gears and engine braking |
| Brakes | Front/rear bias, locking and temperature |
| Damage | Handling effects of front-wing, tyre and suspension damage |
| Weather | Wet grip, standing water and a drying racing line |

The first release does not promise team-engineering simulation precision. Acceptance focuses on consistent, explainable handling and measurable physics behaviour.

<!-- section: section-04 -->

## Difficulty

| Item | Easy | Advanced | Pro |
| --- | --- | --- | --- |
| Assists | Automatic shifting, ABS, traction and stability | Progressively removable | Main assists off by default |
| Racing line | Full guidance | Optional corner hints | Off by default |
| AI | Slower pace, wider avoidance margins | Competitive, occasional mistakes | Consistent pace and tactics |
| Damage | Minor effects | Component effects on handling | Severe damage may cause retirement |
| Rules | Primarily warnings | Main penalties | Complete flags and restrictions |
| Strategy | Automatic management | Partly manual | Fully manual |
| Recovery | Rewind and retry | Optional rewind limits | No rewind in ranked challenges |

Support custom assists and AI strength, with leaderboards separated by assist settings. AI obeys the same vehicle limits as the player, without hidden acceleration boosts.

<!-- section: section-05 -->

## Circuits and challenges

| Circuit | Character | Learning objective |
| --- | --- | --- |
| Academy Circuit | Wide, short layout | Basic steering and braking |
| Azure Coast | Medium-speed corners and straights | Braking points and exits |
| Highland Ring | Elevation and blind corners | Weight transfer |
| Emerald Park | Fast linked corners | Downforce and rhythm |
| Port Velocity | Narrow walls | Precise lines and overtaking |
| Dune Grand Prix | Heat and high wear | Tyres and pit strategy |
| Silver Rain | Low grip and changing weather | Throttle control and tyre timing |
| Neon Metropolis | Compound corners and long distance | Combined driving and strategy |

Each circuit offers skill, timing and race challenges, for 24 in total. Timed challenges offer bronze, silver and gold targets plus a personal ghost.

<!-- section: section-06 -->

## Modes and race flow

Modes: driving academy, quick race, time trial, championship and career.

Flow: event selection → setup → practice → qualifying → race → results and analysis.

Full goals include starting lights, false starts, checkpoints, laps, positions, AI following/overtaking/avoidance, tyre changes and repairs, energy recovery, overtaking-assist zones, yellow/blue flags, track limits and time penalties. Pause, retry, settings, autosave and post-race lap analysis are basic features. Career unlocks events, liveries and setup choices.

<!-- section: section-07 -->

## Architecture and platform

Modules: vehicle physics, input/assists, AI, race rules, scene rendering, interface and saves. Circuits and difficulty use data-driven configuration.

The full goal favours desktop delivery; the browser prototype validates handling while controlling graphics, grid size and peripheral support. Keyboard and gamepad come first; steering wheels and force feedback depend on the platform. The implementation currently uses Three.js + Vite; native desktop packaging remains under evaluation.

<!-- section: section-08 -->

## Remaining decisions

Minimum hardware, performance targets and native packaging still need decisions. Multiplayer is outside the first milestone. Full content may change based on prototype results; the features described here are plans, not a statement of completion.
