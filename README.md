<div align="center">

# 🎙️ Resona AI
### Zero-Shot Voice Cloning & Text-to-Speech Platform

**Clone any voice from 6 seconds of audio. No training. No fine-tuning. Instant.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-BaaS-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Railway](https://img.shields.io/badge/Deployed-Railway-0B0D0E?style=flat&logo=railway&logoColor=white)](https://railway.app/)

</div>

---

## 🌟 What is Resona AI?

Resona AI is a **premium web-based voice cloning platform** that lets anyone synthesize speech in a cloned voice — without recording studios, datasets, or machine learning expertise.

Upload a short audio clip (6+ seconds), type any text, and Resona generates speech that sounds like the original speaker. Under the hood, it uses **Coqui XTTS-v2**, a state-of-the-art zero-shot multi-lingual TTS model capable of voice cloning from a single reference sample.

> Built by [Alkaif Gajdhar](https://github.com/kaif-builds) and [Akshat Jain](https://github.com/Akshat-Commit) as a full-stack AI engineering project.

---

## ✨ Key Features

| Feature | Description |
|--------|-------------|
| 🔁 **Zero-Shot Cloning** | Clone any voice from just 6 seconds of audio — no training required |
| 🎙️ **Browser Recording** | Record directly in-browser via the MediaRecorder API |
| 📂 **Multi-format Upload** | Accepts `.wav`, `.mp3`, `.ogg`, `.flac`, `.m4a` — backend normalizes all formats |
| 🎭 **Preset Voices** | 4 built-in voices (Zara, Alex, Marcus, Emma) with smart client-side caching |
| 🌍 **Multi-language TTS** | XTTS-v2 supports synthesis across multiple languages |
| ☁️ **Firebase Sync** | Voice profiles backed up to Firebase Storage for future multi-device support |
| 🔐 **Auto Cleanup** | Generated audio auto-deletes from server after 10 minutes via background tasks |

---

## 🖼️ Demo & Screenshots

> **Note:** Add your screenshots to a `/docs/screenshots/` folder and update the paths below.

### Landing Page
![Landing Page](<img width="1468" height="869" alt="Screenshot 2026-04-25 at 2 57 32 PM" src="https://github.com/user-attachments/assets/23db1b31-a38d-459a-bbeb-bbf20a7dc9a9" />
)
*The Resona AI home screen — premium dark aesthetic with burnt orange gradient accents.*

### Voice Cloning Workspace
![Workspace - Clone Mode](<img width="1468" height="869" alt="Screenshot 2026-04-25 at 2 57 24 PM" src="https://github.com/user-attachments/assets/c4c227ac-617e-4c30-944e-4abb14e9a771" />
)
*Upload or record a voice sample, then type any text to synthesize speech in that voice.*

### Preset Voice TTS
![Workspace - TTS Mode](docs/screenshots/workspace_tts.png)
*Choose from built-in preset voices — smart caching avoids redundant backend uploads.*

### Generated Audio Player
![Audio Output](docs/screenshots/audio_player.png)
*After synthesis, an inline audio player renders the cloned voice output directly in the UI.*

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                    │
│  WorkspacePage.tsx ─┬─ Clone Mode (user audio upload/record) │
│                     └─ TTS Mode   (preset voices + cache)    │
│                                                              │
│  resonaApi.js  →  POST /api/profiles/create                  │
│                →  POST /api/synthesize                       │
│                                                              │
│  firebase.ts   →  Firebase Storage (sample backup)          │
│                →  Firestore (profile metadata logging)       │
└────────────────────────────┬─────────────────────────────────┘
                             │ HTTP (JSON + multipart)
┌────────────────────────────▼─────────────────────────────────┐
│               FastAPI Backend (Python 3.11)                  │
│                                                              │
│  POST /api/profiles/create                                   │
│    └─ Receive UploadFile → FFmpeg → 22050Hz Mono WAV         │
│    └─ Validate duration (≥6s) via ffprobe / wave module      │
│    └─ Store in data/profiles/{uuid}/ + write meta.json       │
│                                                              │
│  POST /api/synthesize                                        │
│    └─ Validate SynthesizeRequest (Pydantic, <500 words)      │
│    └─ Load sample.wav for profile_id                         │
│    └─ Run XTTS-v2 tts_to_file() → resona_{id}.wav           │
│    └─ Return FileResponse (binary WAV stream)                │
│    └─ Schedule BackgroundTask → delete file after 10 min     │
│                                                              │
│  get_tts()  →  Lazy-loads XTTS-v2 (~1.8GB) on first call    │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│              Coqui XTTS-v2 (Zero-Shot Voice Cloning)         │
│  Input:  text string + reference sample.wav                  │
│  Output: synthesized .wav matching the reference voice       │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚙️ How It Works

### 1. Voice Profile Creation
When a user uploads audio (or Resona loads a preset), the backend:
1. Receives the file via `POST /api/profiles/create` as `multipart/form-data`
2. Converts it to **22050Hz Mono WAV** using FFmpeg — the exact format XTTS-v2 expects
3. Validates the audio is at least 6 seconds long
4. Stores it at `data/profiles/{uuid}/sample.wav` with a `meta.json` sidecar file
5. Returns the `profile_id` UUID to the frontend

### 2. Speech Synthesis
When the user clicks "Generate":
1. Frontend sends `POST /api/synthesize` with `{ text, profile_id, language }`
2. Pydantic validates the payload (schema + word count limit)
3. FastAPI loads the reference `sample.wav` for the given UUID
4. XTTS-v2 maps the vocal characteristics from the reference and synthesizes the text
5. Output `resona_{id}.wav` is streamed back as `FileResponse`
6. A `BackgroundTask` schedules file deletion after 10 minutes
7. React receives the blob, creates an object URL, and renders the audio player

### 3. Smart Caching (Preset Voices)
Rather than re-uploading `zara.mp3` every generation:
- On first use of a preset, the frontend fetches the asset locally and creates a backend profile
- The returned `profile_id` is cached in React state (`cachedProfiles`)
- Subsequent generations skip the upload step entirely and hit `/api/synthesize` directly

---

## 🧰 Tech Stack

### Frontend
| Tool | Purpose |
|------|---------|
| React 19 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| Framer Motion | Micro-animations |
| Lucide React | Icon library |
| Firebase (Firestore + Storage) | Cloud profile backup & metadata |

### Backend
| Tool | Purpose |
|------|---------|
| FastAPI (Python 3.11) | REST API framework |
| Coqui XTTS-v2 | Zero-shot voice cloning model |
| Pydantic | Request validation & schema enforcement |
| FFmpeg | Audio format normalization |
| ffprobe / wave | Audio duration validation |
| asyncio + BackgroundTasks | Async file cleanup scheduling |

### Infrastructure
| Tool | Purpose |
|------|---------|
| Railway | Backend hosting (via `railway.toml`) |
| Vercel / Netlify | Frontend static hosting |
| Firebase | BaaS for storage + real-time DB |

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| **Python** | 3.11 (required — Coqui TTS doesn't support 3.12+) | [python.org/downloads](https://www.python.org/downloads/release/python-3119/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **ffmpeg** | any | See below |
| **Git** | any | [git-scm.com](https://git-scm.com/) |

### Installing ffmpeg

<details>
<summary><strong>Windows</strong></summary>

**Option A — winget (recommended):**
```powershell
winget install Gyan.FFmpeg
```

**Option B — Chocolatey:**
```powershell
choco install ffmpeg
```

**Option C — Manual:**
1. Download from [ffmpeg.org/download.html](https://ffmpeg.org/download.html)
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to your system PATH

Verify: `ffmpeg -version`
</details>

<details>
<summary><strong>macOS</strong></summary>

```bash
brew install ffmpeg
```
</details>

<details>
<summary><strong>Linux</strong></summary>

```bash
sudo apt install ffmpeg    # Debian/Ubuntu
sudo dnf install ffmpeg    # Fedora
```
</details>

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/kaif-builds/Resona_AI.git
cd Resona_AI
```

### 2. Backend setup

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

**macOS / Linux:**
```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

> ⏳ This installs PyTorch (~2GB) + Coqui TTS + dependencies. May take 5–10 minutes.

### 3. Frontend setup

Open a **new terminal** in the project root:

```bash
npm install
```

---

## Running

You need **two terminals** running simultaneously:

### Terminal 1 — Backend (port 8000)

**Windows:**
```powershell
cd backend
.\venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**macOS / Linux:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2 — Frontend (port 3000)

```bash
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## First-time usage notes

- 🕐 **First synthesis takes 1–2 minutes** — the XTTS-v2 model (~1.8GB) downloads automatically on the first "Generate Audio" click. After that, it's cached locally.
- 🎙️ **Voice samples need ≥ 6 seconds** of clear speech for best results.
- 🔊 Supported upload formats: `.wav`, `.mp3`, `.ogg`, `.flac`, `.m4a`

---

## Project Structure

```
Resona_AI/
├── src/                    # React frontend
│   ├── App.tsx             # Main app (home + voice cloning UI)
│   ├── resonaApi.js        # API client for backend
│   ├── firebase.ts         # Firebase config (optional)
│   └── index.css           # Global styles
├── backend/
│   ├── main.py             # FastAPI server + TTS endpoints
│   ├── requirements.txt    # Python dependencies
│   └── data/               # Local voice profiles & outputs (gitignored)
├── docs/
│   └── screenshots/        # Add your UI screenshots here
├── package.json            # Frontend dependencies
├── vite.config.ts          # Vite config
└── index.html              # Entry HTML
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ffmpeg: command not found` | Install ffmpeg and ensure it's in your system PATH |
| `ImportError: BeamSearchScorer` | Run `pip install "transformers<4.48.0"` |
| Synthesis hangs silently | The TTS model is downloading (~1.8GB). Check backend terminal for progress |
| CORS errors in browser | Make sure the backend (port 8000) is running and frontend URL is in CORS origins |
| `python3.11 not found` | Download Python 3.11 specifically — Coqui TTS requires 3.9–3.11 |

---

## Developers

- **Alkaif Gajdhar** — [GitHub](https://github.com/kaif-builds) · [LinkedIn](https://www.linkedin.com/in/alkaif-gajdhar-b6033328b)
- **Akshat Jain** — [GitHub](https://github.com/Akshat-Commit) · [LinkedIn](https://www.linkedin.com/in/akshatjaindevs/)

---

© 2026 Resona AI
