# Resona AI — Voice Cloning Platform

A web-based voice cloning platform powered by **Coqui TTS (XTTS-v2)**. Upload a short voice sample and generate text-to-speech audio in your own voice.

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** FastAPI + Coqui TTS (XTTS-v2 zero-shot cloning)

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

> ⏳ This installs PyTorch (~2GB) + Coqui TTS + dependencies. May take 5-10 minutes.

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

- 🕐 **First synthesis takes 1-2 minutes** — the XTTS-v2 model (~1.8GB) downloads automatically on the first "Generate Audio" click. After that, it's cached locally.
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
| CORS errors in browser | Make sure the backend's port (8000) is running and frontend URL is in CORS origins |
| `python3.11 not found` | Download Python 3.11 specifically — Coqui TTS requires 3.9–3.11 |

---

## Developers

- **Alkaif Gajdhar** — [GitHub](https://github.com/kaif-builds) · [LinkedIn](https://www.linkedin.com/in/alkaif-gajdhar-b6033328b)
- **Akshat Jain** — [GitHub](https://github.com/Akshat-Commit) · [LinkedIn](https://www.linkedin.com/in/akshatjaindevs/)

---

© 2026 Resona AI
