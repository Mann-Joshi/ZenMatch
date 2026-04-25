# Mahjong Relax 🀄

A premium Mahjong Solitaire game built with **Expo + React Native + TypeScript**.

---

## Getting Started (Development)

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `w` for web.

---

## Audio Assets

All audio files live in `assets/audio/`. The game uses:

| File | Purpose |
|---|---|
| `tile_select.wav` | Tile selection tap |
| `tile_match.wav` | Successful pair match |
| `tile_no_match.wav` | Mismatch / blocked tile |
| `combo.mp3` | Combo streak sound |
| `hint_reveal.wav` | Hint button used |
| `level_complete.mp3` | Level cleared fanfare |
| `dragon-studio-game-over-retro-8bit-sfx-499656.mp3` | Board stuck / game over |
| `Background music - Triple Healing Frequency...mp3` | Looping ambient music |

Sound and music can be toggled ON/OFF in **Settings → Audio**.

---

## Building for Android (.aab)

### Prerequisites

```bash
npm install -g eas-cli
```

### Step 1 — Login to your Expo account

```bash
eas login
```

### Step 2 — Configure EAS (first time only)

```bash
eas build:configure
```

This generates `eas.json`. Accept the defaults for a managed workflow.

### Step 3 — Build the Android App Bundle

```bash
eas build -p android --profile production
```

This produces a `.aab` file ready to upload to the **Google Play Console**.

> The build happens in the cloud — no Android Studio or local SDK required.

### Sample eas.json (auto-generated, customize as needed)

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

---

## App Configuration

Defined in `app.json`:

- **Name:** Mahjong Relax
- **Package:** `com.mahjongrelax.app`
- **Version:** 1.0.0 (versionCode: 1)

---

## Project Structure

```
app/               → Expo Router screens
  home.tsx         → Main menu
  settings.tsx     → Sound, music, theme settings
  game/            → Game board
  daily.tsx        → Daily streak challenge
  world-map.tsx    → Level select
  shop.tsx         → Hint/shuffle shop

src/
  store/
    gameStore.ts      → Game state (tiles, score, combo)
    progressStore.ts  → Level stars, streaks, banked hints
    settingsStore.ts  → Sound, music, theme, haptics

  utils/
    audio.ts          → Sound effects + background music engine

  game/
    mahjongLogic.ts   → Tile matching, scoring, board logic
    layoutEngine.ts   → Difficulty config, board layouts

assets/
  audio/            → All .mp3 and .wav sound files
  images/           → Tile artwork
```
