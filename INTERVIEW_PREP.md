# Cube Master — Interview Prep Brief

> Verified against commit `b5c8195` (branch `claude/vigilant-goldberg-ty38tt`).
> All file:line references point at that revision.

---

## 1. What the project does

An Expo/React Native app (Android + web builds present) that solves a physical Rubik's Cube. You input cube state either by photographing all six faces with the camera or by tapping colors into a 2D net; the app validates the state, runs Kociemba's two-phase algorithm locally via `cubejs`, and animates the solution move-by-move on a Three.js cube you can drag, scrub, and step through. A Python FastAPI + OpenCV service handles sticker-color classification from each photo. Secondary features: scramble generator, speedcubing timer, and persistent solve history with session stats, all stored locally in AsyncStorage.

---

## 2. Architecture and end-to-end data flow

Everything converges on one Zustand store: `stores/cubeStore.ts` → `cubeState: Record<FaceName, FaceState>`.

**Path A — scan.** `app/(tabs)/scan.tsx` runs a 6-phase state machine (`idle → orientation → camera → review → validate → manual`) over `SCAN_ORDER = [U,F,R,B,L,D]` (`lib/constants.ts:40`).

`handleCapture()` → `takePictureAsync({quality:0.7})` → `detectCubeColors()` (`lib/detectFromImage.ts:164`) → resize to 800px / JPEG / base64 → `POST /api/detect-colors` with a 2500 ms `AbortController` → backend `detect_colors()` (`backend/cv-service/main.py:145`) → `extract_face()` 60% center crop → 300×300 → `detect_colors_from_face()` → 9 color strings. Any failure falls through to `localDetectColors()` (HSV, on-device). `handleConfirm()` → `runValidation()` → `validateCubeState()` (`lib/cubeState.ts:55`) → `setCubeState()`.

**Path B — scramble.** `solve.tsx:handleNewScramble` → `generateScramble(20)` → `applyScramble()` animates each scramble move in sequence → `getScrambledState()` → `solveFromScramble()`.

**Solve.** `app/(tabs)/solve.tsx:167` watches `cubeState` and auto-solves any non-solved, non-repeat state. `solveCubeState()` → `cubeStateToString()` (54 chars, U R F D L B order) → `CubeJS.fromString().solve()` → `expandMoves()` splits `R2` → `R R`. `getIntermediateStatesFromState()` precomputes one `CubeState` snapshot per move (N+1 total).

**Animate.** `solve.tsx` holds `activeMove` (from `parseMove`, `components/cube/Cube3D.tsx:50`) and `step`. `Cube3D.tsx:Scene` drives the pivot rotation, then calls `onMoveComplete` → `handleMoveComplete()` (`solve.tsx:335`), which advances `step` and assigns `cubeState = cubeSnapshots[targetStepRef.current + 1]`.

**Persist.** `saveSolve()` (`lib/storage.ts:52`) on solve completion and on timer save; `getSessionStats()` derives Ao5/Ao12.

**Boot.** `app/_layout.tsx:70` fires `initSolverAsync()` inside `InteractionManager.runAfterInteractions`.

---

## 3. The five most technically interesting parts

### (a) "Smoke & Mirrors" pivot animation — `Cube3D.tsx:227-313`

On a new `currentMove`, iterate the cube group's children and `pivotRef.attach(c)` every cubie whose `position[axis]` is within `0.1` of `layer * spacing` (`attach` preserves world transform across the reparent). `useFrame` drives `pivot.rotation[axis] = dir * (π/2) * angle * easeInOut(progress)`. At `progress >= 1`, re-`attach` to the cube group and then **discard the animated transform**: position is re-derived by parsing the object's `name` (`cubie_x_y_z`), `rotation.set(0,0,0)`, `pivot.rotation.set(0,0,0)`. The meshes are permanently static; only the *colors* move. Drift is structurally impossible because nothing accumulates.

### (b) Six position→index mappers — `Cube3D.tsx:85-105`

`uIdx / dIdx / fIdx / bIdx / rIdx / lIdx` convert a cubie's (x,y,z) into the 0–8 index of a scanned face array, each encoding how the user physically held the cube for that face (e.g. `bIdx = (1-y)*3 + (1-x)` flips x because you rotate over the back). This is where the whole scan-orientation contract lives — get one wrong and a face mirrors.

### (c) Non-blocking Kociemba warm-up — `lib/solver.ts:33-164`

cubejs's own `initSolver()` blocks the JS thread for seconds building four pruning tables (commit `5dba598`: *"was hanging on local solver"*). You re-implemented the BFS in app code: 4-bit-per-entry packed `Uint32Array` (`getPruning`/`setPruning` via `idx>>3` slot and `(idx%8)<<2` shift), per-table coordinate and successor functions over `CubeJS.moveTables`, and `await setTimeout(0)` every 5000 indices when >16 ms has elapsed. Phase 1 uses all 18 moves; phase 2 the restricted set `[0,1,2,4,7,9,10,11,13,16]`.

### (d) Ref-based animation queue — `solve.tsx:252-403`

`isAnimatingRef` is the lock (a ref, not state, to dodge stale closures in `useFrame` callbacks). `handleMoveComplete` has three distinct exits: scramble queue (unlock immediately, `setTimeout(next, 30)`), chip-tapped manual move (recompute the entire solution from the new state), or playback (pull the precomputed snapshot). `useFocusEffect` clears all of it on tab focus, and both a mount effect and a `useFrame` branch re-home cubies stranded inside the pivot by a mid-animation navigation.

### (e) Demand-mode rendering with a manual invalidate bridge — `Cube3D.tsx:164-172, 438-440`

`frameloop` is `"always"` only while `currentMove || autoRotate || isDragging`, else `"demand"`. `InvalidateBridge` captures `useThree().invalidate` into a ref so `PanResponder` handlers and a `useEffect` on `cubeState` can force repaints. This was the fix in commit `e771de7`.

---

## 4. Every constant and threshold

| Value | Where | Rationale visible in code |
|---|---|---|
| `SCAN_ORDER = [U,F,R,B,L,D]` | `constants.ts:40` | — |
| `DEFAULT/MIN/MAX_ANIMATION_SPEED = 500/100/2000` | `constants.ts:99-101` | **only feeds the Zustand default; solve screen never reads them** |
| prod API `rubiks-backend-ydk.onrender.com`; dev `hostUri:8000` | `constants.ts:68-83` | "works over WiFi with Expo Go" |
| 2500 ms fetch abort | `detectFromImage.ts:177` | "short timeout" |
| resize 800px, JPEG compress 0.8 | `detectFromImage.ts:170-171` | — |
| fallback crop 75% of shorter side → 3×3 px | `detectFromImage.ts:120-128` | "reduce background noise" |
| white gate `s < 18 && v > 50` | `detectFromImage.ts:84` | — |
| HSV weights: `hue*3.0 + sat*0.8 + val*0.8`; white `sat*1.8 + (100-v)*1.5` | `detectFromImage.ts:92-97` | hue weighted ~4× (most discriminative channel) |
| `REF_BGR` six LAB centroids | `main.py:36-43` | "Calibrated from user's stickerless cube under warm indoor lighting" |
| center crop `0.60`, normalize 300×300, `cell=100`, `radius=20` (40×40 sample) | `main.py:111-125` | "avoid aspect-ratio distortion"; "median… robust to outliers/shadows" |
| GaussianBlur (5,5); input `max_dim = 800` | `main.py:122,156` | "reduce noise" |
| `radius = 18` in calibration | `calibrate.py:67` | **inconsistent with the 20 the service uses** |
| `spacing = 1.02`; layer epsilon `< 0.1` | `Cube3D.tsx:47,240` | — |
| cubie 0.96³ (bevel 4 / 0.08); sticker 0.82², offset 0.485 | `Cube3D.tsx:143,118,152` | — |
| `animationSpeed = 3.0` (~333 ms/quarter turn); autoRotate `0.35` rad/s; drag `0.005` rad/px; camera `[5,4,6]` fov 45 | `Cube3D.tsx:178,252,419,449` | — |
| `stepDelay` local default 1000; manual delay 100 | `solve.tsx:118,390` | — |
| `animationSpeed = isScrambling ? 8.0 : max(1.5, 3000/stepDelay)` | `solve.tsx:503` | — |
| 50 ms unlock; 30 ms scramble-queue; 150 ms remount; 80 ms auto-solve defer; 500 ms ready-poll; 100 ms tick; 2000 ms overlay hold | `solve.tsx:351,343,207,198,145,162,235` | "lets Three.js fully snap cubies before next input"; "unlock immediately so next move can start after 30ms" |
| step delay clamp 100–2500 ms (±200 native / step 100 web) | `PlaybackCard.tsx:166-197` | — |
| `HISTORY_CAP = 100` | `storage.ts:13` | — |
| defaults: `Cuber` / dark / `autoModeDefault:true` / `stepDelay:1200` | `storage.ts:16-21` | — |
| Ao5 needs ≥5, Ao12 needs ≥12 | `storage.ts:98-99` | — |
| `N_SLICE1 495, N_SLICE2 24, N_TWIST 2187, N_FLIP 2048, N_URFtoDLF/URtoDF 20160, N_PARITY 2` | `solver.ts:42-48` | Kociemba coordinate sizes |
| yield every 5000 idx if >16 ms | `solver.ts:144` | "keep JS thread running at 60 FPS" |
| `generateScramble(length = 20)` | `solver.ts:241` | — |
| countdown `[3,2,1,"GO!"]` @1000 ms, 800 ms pop, 300 ms fade, `setInterval(10)` | `timer.tsx:26,148,163,168` | — |

---

## 5. Known weaknesses, shortcuts, unfinished work

1. **The README is stale on its two headline claims** — it still documents `cubieSlots` and quaternion baking, both deleted in `8858686` / `b5c8195`. It also says the backend uses HSV (it's LAB), lists Pillow (not in `requirements.txt`), and says Expo 55 / RN 0.83 (package.json: 56 / 0.85.3).
2. **`kmeans_refine` does no K-means** (`main.py:80-102`). The name and the module docstring both claim clustering; the body is a plain nearest-LAB-centroid loop identical to `classify_by_nearest_lab`. `sample_cell_color` is dead code.
3. **No cube detection at all.** `extract_face` is a fixed 60% center crop — no contour finding, no perspective correction, no white balance. An off-center or angled photo silently yields wrong colors.
4. **Reference centroids are hardcoded from one cube under one lighting condition.** `calibrate.py` is a manual offline script whose label table still has six `"?"` (uncertain) cells.
5. **The offline fallback likely doesn't work on native.** `localDetectColors` uses `require('pngjs/browser')`; commit `3d2ed16` says pngjs was *"broken on native"* — that's why the server exists. On failure it returns `Array(9).fill("white")` and the UI presents that as a real scan.
6. **2500 ms timeout vs. Render free-tier cold start** — a sleeping instance takes tens of seconds to wake, so the first scan after idle reliably falls into that fallback.
7. **The solver races itself.** `initSolver()` only short-circuits when `ready`, and `initSolverAsync` sets `ready = true` only at the very end. Tapping Solve mid-warm-up triggers cubejs's full *synchronous* init, freezing the UI and redoing the work.
8. **Playback force-ends at solved** (`solve.tsx:400` sets `SOLVED_STATE` rather than the final snapshot) — masks desync instead of surfacing it.
9. **Dead settings.** `settings.stepDelay` (default 1200) is persisted and user-editable but never read — `solve.tsx:118` uses a local `useState(1000)`. `autoModeDefault` exists in the type and default only. The `SESSION_STATS` key is only ever cleared, never written.
10. **Error handling gaps.** `handleSolve`'s catch only `console.error`s (`solve.tsx:319`) — the button just re-enables. The chip branch swallows everything (`catch (_) {}`). `lib/api.ts` is dead code. The backend returns raw exception strings in HTTP 500 detail, `allow_origins=["*"]`, no auth, no rate limit, no max image size.
11. **Validation is shallow.** `validateCubeState` checks color counts and centers only — no permutation or orientation parity — so an impossible cube passes and then throws inside cubejs, surfacing as the generic "Unsolvable Cube" alert.
12. **No tests, no CI, no lint script.** No `.github/`. Web has no error boundary (the native `Cube3DErrorBoundary` isn't in `Cube3D.web.tsx`) and defaults to `frameloop="always"`.
13. **Backend README documents the wrong API** — `POST /detect` on port 5000 returning `contour_detection`; the real one is `POST /api/detect-colors` on 8000.
14. **`API_BASE_URL`** (`constants.ts:93`) is evaluated eagerly at import, defeating the lazy `getApiUrl()` written right above it.

---

## 6. Design tradeoffs an interviewer could challenge

- **Smoke & Mirrors vs. a stateful scene graph.** Your scene is a pure function of `cubeState`, which is robust and self-healing — but every move re-renders 27 components and 54 materials through React rather than mutating Three.js objects directly.
- **On-device solver vs. server solver.** You went local after `5dba598` tried the server. The cost was a multi-second table build you then had to hand-reimplement asynchronously. Alternatives: ship precomputed tables as a binary asset, or solve on the FastAPI service you already run.
- **A thin CV microservice.** The backend does roughly five lines of real work but adds a network hop, a cold start, a timeout, and an availability dependency. Expect *"why isn't this a local WASM/OpenCV call or a VisionCamera frame processor?"*
- **Independent per-cell classification, when you have a hard global constraint.** 54 stickers must be exactly 9 of each color. Clustering all 54 samples into 6 groups and assigning via Hungarian matching would be lighting-invariant and is the strongest available critique of the current design.
- **`expandMoves` splitting `R2` into `R R`.** Simplifies the animation loop (every step is one 90° turn) but inflates the displayed and stored move count above the half-turn metric Kociemba optimizes.
- **Precomputed snapshot array.** O(1) chip-jump and zero drift, at the cost of N+1 cube objects and a full recompute after any manual move.
- **`setInterval` on the JS thread for a precision stopwatch**, when Reanimated worklets are already a dependency.
- **Persisting `cubeState` and `solution`** means a stale mid-solve cube survives app restarts.

---

# Resume claims vs. the code

## Fully accurate

- **"Integrated Kociemba's Two-Phase Algorithm via cubejs."** `solver.ts:3`, `cubejs ^1.3.2`.
- **"encoding cube state as compact integer coordinates with precomputed O(1) move tables."** True — but that's cubejs's design, not yours. **Your actual contribution is better:** you re-implemented the pruning-table BFS with 4-bit packed `Uint32Array`s and 16 ms cooperative yields because the library's sync init froze the UI. Lead with that instead; it's a much stronger story and it's entirely yours.
- **"cloud-deployed Python FastAPI and OpenCV microservice."** Real and deployed.
- **"persistent solve history."** `lib/storage.ts` + AsyncStorage, capped at 100, rendered in `history.tsx`.

## Partly accurate

- **"pivot group animation system… 9 cubies dynamically re-parented, rotated, and re-attached"** — accurate. **"with world-space quaternion baking to eliminate floating-point drift"** — not in the current code. `Cube3D.tsx:296-304` does the *opposite*: it throws the animated transform away, re-deriving position from the object's name and zeroing rotation. The inline comment at `:204` calls this "Smoke and Mirrors." Quaternion baking *was* real at commit `41b062f` (`getWorldQuaternion` → `quaternion.copy` → snap Euler to π/2, commented *"avoids floating-point drift corrupting 180° (U2/F2/etc.) snaps"*) — you deleted it in `8858686`. Either describe HEAD ("…re-attached with a deterministic snap-back that makes drift structurally impossible") or keep the wording and be ready to say *"that was v1, here's why I replaced it."* Don't claim both.
- **"sub-20-move solutions."** Kociemba returns ≤20 HTM, but `expandMoves` splits every `R2` into two moves, and the UI's MOVES counter and stored `moveCount` use the *expanded* length. A 20-HTM solve commonly displays ~26–30. If the interviewer opens the app and counts, it won't read "sub-20."
- **"Ao5/Ao12 rolling averages."** They exist and update live, but `getSessionStats` (`storage.ts:96-100`) is a **plain arithmetic mean** of the most recent 5/12 times. A WCA Ao5 drops best and worst and averages the middle 3. Any interviewer who cubes will catch this in one question — and it's a five-line fix.
- **"Stackmat-style competitive timer."** What's there: tap-to-start with a 3-2-1-GO countdown, tap-to-stop, centisecond display, scramble generation, best/Ao5/Ao12 cards. What makes a timer Stackmat-style isn't: no hold-to-arm-then-release trigger (the defining interaction), no 15-second WCA inspection, no +2/DNF penalties, and a stopped timer can be **resumed** by tapping again (`timer.tsx:190-197`), which no competition timer permits. Safer phrasing: *"speedcubing timer with countdown start, centisecond precision, scramble generation, and session stats."*
- **"Shipped cross-platform to iOS and Android via EAS Build."** The code is genuinely cross-platform (`.web.tsx` variants, `Platform` branches), but `eas.json` defines **Android profiles only** — `preview` → apk, `production` → app-bundle, no `ios` block in either. `app.json`'s `ios` section has only `supportsTablet`; there's no `bundleIdentifier`. This repo cannot produce an iOS build as configured.

## Not supported by the code

- **"maintaining a `cubieSlots` state array tracking each cubie's physical grid position in React."** `grep cubieSlots` returns nothing outside `README.md`. It was real at `41b062f` (`useState` + a `rotateSlot()` helper using `THREE.Quaternion`) and was removed in the same refactor as the quaternion baking. **The problem you describe is real and you did solve it** — just by a different mechanism: the meshes snap back to fixed slots so grid coordinates never change, and `solve.tsx:381-387` feeds `cubeState` from the precomputed `cubeSnapshots` array while `Cubie` re-derives every sticker through the six index mappers.

  Suggested rewrite: *"Solved React–Three.js desync by making the 3D meshes stateless — they snap back to fixed slots after each animation while a precomputed per-move `CubeState` snapshot array drives sticker color lookups, so React and the scene graph cannot diverge."*

- **"in under 100 ms."** No benchmark, timing instrumentation, or perf note exists anywhere in the repo or commit history. The search itself is plausibly in that range *once tables are built*, but the code's own evidence cuts the other way: a "Solver initializing…" banner polled every 500 ms, a splash-time pre-warm, and an entire async table-build written specifically because init was slow. If you keep the number, qualify it as post-warm-up solve time — and measure it first.

- **"robust sticker detection under varied lighting."** This is the claim most likely to get dismantled. The pipeline is: fixed 60% center crop → 300×300 → per-cell 40×40 median BGR → nearest Euclidean LAB distance to six centroids the code itself annotates as *"Calibrated from user's stickerless cube under warm indoor lighting."* No white balance, no illuminant estimation, no adaptive thresholding, no cube detection, no per-image normalization — and the one function named for adaptive behaviour doesn't cluster at all. The defensible version: *"LAB-space nearest-centroid classification with median-of-region sampling for outlier and shadow resistance"* — both of those are true and both are real engineering choices.

---

## Two cheap fixes before the interview

1. Make Ao5/Ao12 actual trimmed averages (`storage.ts:98`).
2. Either add an iOS profile to `eas.json` or drop iOS from that bullet.

Both take minutes, and both are claims someone can check in under a minute.
