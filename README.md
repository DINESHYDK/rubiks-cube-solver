<div align="center">

# Cube Master — Rubik's Cube Solver

### Scan it. Solve it. Watch it animate in real time.

[![React Native](https://img.shields.io/badge/React%20Native-0.83-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020?logo=expo&logoColor=white)](https://expo.dev)
[![Three.js](https://img.shields.io/badge/Three.js-r177-black?logo=three.js&logoColor=white)](https://threejs.org)
[![Python](https://img.shields.io/badge/Python-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![OpenCV](https://img.shields.io/badge/OpenCV-Color%20Detection-5C3EE8?logo=opencv&logoColor=white)](https://opencv.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![EAS Build](https://img.shields.io/badge/EAS-Build-4630EB?logo=expo&logoColor=white)](https://docs.expo.dev/build/introduction)

</div>

---

## What Is This?

Cube Master is a **full-stack mobile application** that solves any scrambled Rubik's Cube from a live camera scan and animates the full solution step-by-step on an interactive 3D cube — rendered entirely in WebGL inside a React Native app.

Point your phone at all six faces of a scrambled cube. The app scans them using **computer vision**, computes the shortest possible solution using the **Kociemba Two-Phase Algorithm** (the same class of algorithm used by competitive Rubik's Cube solving robots and world-record attempts), and animates each move on a real-time 3D cube you can rotate, inspect, and replay at any speed.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                    │
│                                                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────┐   │
│  │  Scan    │   │  Solve   │   │    History /     │   │
│  │  Tab     │──▶│  Tab     │──▶│    Timer Tab     │   │
│  │(6 faces) │   │(3D Cube) │   │  (AsyncStorage)  │   │
│  └────┬─────┘   └────┬─────┘   └──────────────────┘   │
│       │              │                                  │
│       │ base64 JPEG  │ cubejs (Kociemba)               │
│       ▼              ▼                                  │
│  expo-camera    Three.js + R3F                         │
│  expo-image-    (WebGL inside RN)                      │
│  manipulator                                           │
└───────┬─────────────────────────────────────────────────┘
        │ POST /api/detect-colors
        ▼
┌─────────────────────────────┐
│   Python FastAPI Backend    │
│   (Render.com)              │
│                             │
│   OpenCV → color grid       │
│   → 9 CubeColor values      │
└─────────────────────────────┘
```

---

## Tech Stack

### Mobile — React Native + Expo

| Technology | Version | Role |
|---|---|---|
| **React Native** | 0.83 | Cross-platform mobile framework |
| **Expo SDK** | 55 | Native module management, camera, build pipeline |
| **Expo Router** | 4 | File-based tab navigation |
| **TypeScript** | 5.9 | Full type safety across the entire codebase |
| **Zustand** | 5 | Lightweight global state for cube state, animation, scan progress |
| **AsyncStorage** | 2.2 | Persistent solve history, settings, best times |

### 3D Rendering — WebGL inside React Native

| Technology | Version | Role |
|---|---|---|
| **Three.js** | r177 | 3D scene graph: 27 cubies, sticker geometry, lighting |
| **@react-three/fiber** | 9.5 | React renderer for Three.js on native (via expo-gl) |
| **expo-gl** | 55 | OpenGL ES context bridge for iOS & Android |
| **RoundedBoxGeometry** | drei | Smooth-edged cubie geometry |
| **meshPhysicalMaterial** | three | PBR shading with clearcoat for realistic plastic look |

> Integrating Three.js into a React Native application is a non-trivial engineering challenge. The rendering pipeline goes through React → R3F reconciler → Three.js scene graph → OpenGL ES → native GPU — all inside Expo's JavaScript engine.

### Computer Vision — Python Backend

| Technology | Role |
|---|---|
| **FastAPI** | Async REST API serving the color detection endpoint |
| **OpenCV** | HSV color-space analysis to classify each of the 54 stickers into one of 6 cube colors |
| **Pillow** | Image pre-processing before color classification |
| **Render.com** | Cloud deployment with auto-scaling |

### Solver — The Algorithm

| Technology | Role |
|---|---|
| **cubejs** (Kociemba) | JavaScript implementation of the Kociemba Two-Phase Algorithm |

---

## The Algorithm: Kociemba's Two-Phase Method

> *This is the most computationally significant piece of the project. Understanding it is what separates a Rubik's Cube app from a Rubik's Cube solver.*

The Rubik's Cube has **43,252,003,274,489,856,000** possible states (43 quintillion). Brute-force search is completely intractable. What makes Cube Master fast — returning a solution in milliseconds — is the **Kociemba Two-Phase Algorithm**, invented by German mathematician Herbert Kociemba in 1992.

### Why it's remarkable

**God's Number** — the maximum number of moves needed to solve any Rubik's Cube from any state — is exactly **20**. This was proven in 2010 using 35 CPU-years of computation on Google's infrastructure. Kociemba's algorithm consistently finds solutions at or near this bound.

### How it works

The algorithm works by dividing the problem into two separate, tractable searches using **group theory**:

**Phase 1 — Reduce to subgroup G1**

The algorithm searches for a short sequence of moves that brings the cube into a special subgroup `G1 = <U, D, F², B², L², R²>`. A cube is in G1 when three conditions are simultaneously satisfied:
- All **12 edges** are correctly oriented (zero flip)
- All **8 corners** are correctly oriented (zero twist)
- All **4 UD-slice edges** (FR, FL, BR, BL) are inside the UD-slice layer

This narrows the search from 43 quintillion states down to roughly **663 million** — still large, but structured.

**Phase 2 — Solve within G1**

With the cube in G1, only the restricted move set `{U, D, F², B², L², R²}` is allowed (no quarter-turns of F, B, L, R). Within this subspace, the remaining state is described by just three integer coordinates:
- **Corner permutation:** 8! = 40,320 states
- **Edge permutation:** 8! = 40,320 states
- **UD-slice permutation:** 4! = 24 states

Phase 2 solves this subspace completely.

**Why it's fast**

Both phases use **IDA\*** (Iterative Deepening A\*) search with precomputed **pruning tables** as admissible heuristics. The cube state is encoded not as raw sticker data but as compact integers:

| Coordinate | States | Description |
|---|---|---|
| `cornerOrientation` | 3⁷ = 2,187 | 7 corners × 3 twist values |
| `edgeOrientation` | 2¹¹ = 2,048 | 11 edges × 2 flip values |
| `UDSlice` | C(12,4) = 495 | Which 4 of 12 edge slots hold UD-slice edges |

Move tables precompute: *"given this state integer, applying move M gives state integer N."* One array lookup per move, instead of recomputing from scratch. This is what makes the solver run in **milliseconds on a mobile device**.

**The elegance** is that neither phase alone is tractable, but two bounded IDA\* searches in sequence are extremely fast. It's divide-and-conquer applied to a group theory problem.

---

## Key Engineering Challenges

### 1. Three.js inside React Native
Embedding a full WebGL rendering pipeline into a React Native app requires bridging R3F's fiber reconciler through `expo-gl`'s OpenGL ES context. The animation system uses a **pivot group technique**: during a face rotation, 9 cubies are detached from the main cube group, parented to a pivot object at the origin, rotated, then re-parented with world-space quaternion baking to prevent floating-point drift across multiple moves.

### 2. React–Three.js position synchronization
After each animation, the Three.js objects are physically at new grid positions. A naive implementation applies color lookups using each cubie's *original* coordinates — causing stickers to appear on wrong faces after every move. The solution: a `cubieSlots` state array tracks each cubie's *current* physical grid position in React. After each animation, the rotation is applied in pure JavaScript (using `THREE.Quaternion`) to update the slot array, ensuring React's render and Three.js's scene graph are always in sync.

### 3. Animation queue without threads
JavaScript is single-threaded. The scramble and playback systems use a **ref-based producer-consumer queue** (`scrambleQueueRef`) with a 30ms inter-move delay. Crucially, the scramble path bypasses the standard 50ms unlock delay (which exists to let Three.js fully snap cubies between manual moves), preventing queue deadlock during rapid sequential animations.

### 4. Computer vision color classification
Each face is captured as a JPEG, resized to 800px, and base64-encoded before being sent to the FastAPI backend. OpenCV analyses the image in HSV color space (more robust to lighting variation than RGB) and classifies each of the 9 grid cells into one of 6 cube colors. The result is a `CubeColor[9]` array that populates the face in the Zustand cube state.

### 5. Scan orientation correctness
The 3D orientation guide renders a ghost cube using a camera positioned at negative-x coordinates, ensuring the Red face (+x axis) appears on the **right** side of the diagram — matching the physical orientation the user must hold. Incorrect camera positioning caused the orientation guide to mirror the cube, which flipped the left/right sticker column mapping sent to the backend.

---

## Features

- **Camera scanning** — Scan all 6 faces sequentially with a live camera, guided by an interactive 3D orientation diagram for each face
- **Manual input** — Tap-to-edit 2D cube net for cases where scanning isn't ideal
- **Real-time 3D solution** — Watch the solution animate step-by-step on a WebGL cube with physics-based PBR shading
- **Auto / Manual playback** — Configurable step delay (100ms–2500ms) or manual next/prev navigation
- **Algorithm chips** — Tap any move in the solution sequence to jump directly to that state
- **Move notation guide** — Tap any standard move (R, U', F2, etc.) to execute it live on the cube
- **Solve history** — Persistent records of every solve: scramble, solution, move count, time
- **Ao5 / Ao12 stats** — Rolling averages computed from timed solve history
- **Stackmat-style timer** — For competitive timing sessions
- **Dark / Light theme** — Full adaptive theming with zero hardcoded colors
- **Confetti** on solve completion

---

## Project Structure

```
rubiks-cube-app/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx        # Home — greeting, cube preview, stats
│   │   ├── scan.tsx         # 6-phase scan flow (idle → orientation → camera → review → validate → manual)
│   │   ├── solve.tsx        # 3D cube, playback controls, algorithm chips
│   │   ├── history.tsx      # Solve history with rank badges
│   │   └── timer.tsx        # Stackmat-style timer
│   ├── settings.tsx
│   ├── onboarding.tsx
│   └── splash.tsx
├── components/
│   ├── cube/
│   │   ├── Cube3D.tsx       # Three.js scene: pivot animation, cubieSlots sync, PanResponder
│   │   ├── Cube3D.web.tsx   # Web-specific variant (OrbitControls)
│   │   ├── CubeNet.tsx      # 2D flat net editor
│   │   └── OrientationGuide.tsx  # 3D ghost cube for scan orientation
│   ├── solve/
│   │   ├── PlaybackCard.tsx # Mode toggle, speed control, transport buttons
│   │   └── AlgorithmChips.tsx    # Animated move sequence display
│   └── effects/
│       └── ConfettiEffect.tsx
├── lib/
│   ├── solver.ts            # Kociemba wrapper: initSolver, solveCubeState, getIntermediateStates
│   ├── cubeState.ts         # 54-char string serialization, validateCubeState
│   ├── detectFromImage.ts   # expo-image-manipulator → base64 → FastAPI
│   ├── storage.ts           # AsyncStorage CRUD: history, settings, stats
│   ├── theme.ts             # Dark/Light token objects, useTheme() hook
│   └── constants.ts         # SOLVED_STATE, FACE_COLOR_MAP, API URL resolution
├── stores/
│   └── cubeStore.ts         # Zustand: cubeState, setCubeState, resetCube
└── types/
    └── cube.ts              # CubeState, CubeColor, SolveRecord, Settings
```

---

## Running Locally

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Python 3.10+ (for backend)

### Mobile App

```bash
cd rubiks-cube-app
npm install
npx expo start
```

Scan the QR code with the Expo Go app (iOS/Android) for development.

### Backend (Python)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Production Build (Android APK)

```bash
eas login
eas build --profile preview --platform android
```

---

## Deployment

| Service | Purpose |
|---|---|
| **EAS Build** (Expo) | Managed Android APK and AAB builds with automatic keystore |
| **Render.com** | Python FastAPI backend, auto-deployed from GitHub |

---

## What I Learned

- How to integrate a WebGL rendering pipeline (Three.js) inside a React Native application using `expo-gl` and `@react-three/fiber`
- The mathematics of Kociemba's Two-Phase Algorithm: group theory, IDA\* search, coordinate encoding, and pruning tables
- Synchronizing React's declarative rendering model with Three.js's imperative scene graph — specifically tracking cubie slot positions in React state to keep color lookups consistent with physical mesh positions
- Building a computer vision pipeline with OpenCV for real-world color classification under variable lighting
- Designing a ref-based animation queue system in single-threaded JavaScript to handle sequential move playback without blocking the UI

---

## Author

**Dinesh YDK**

Built as a portfolio project combining mobile engineering, 3D graphics, computer vision, and algorithmic problem-solving.

---

<div align="center">
  <sub>Algorithm credit: Herbert Kociemba (1992) — <i>Two-Phase Algorithm for solving Rubik's Cube</i></sub>
</div>
