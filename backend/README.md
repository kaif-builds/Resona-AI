# Resona AI — Backend

FastAPI + Coqui TTS (XTTS-v2) voice cloning backend.
Deploy on **Railway** · Frontend on **Vercel**

---

## How it works

Resona uses **XTTS-v2** — Coqui's best zero-shot model.
Zero-shot means: **no fine-tuning needed**. You just upload a 6-30 second
voice sample and XTTS clones it on the fly during synthesis. Instant results.

```
User uploads sample → /api/profiles/create  →  profile_id saved
User types text     → /api/synthesize        →  .wav returned immediately
```

---

## Local Development

### 1. Create Python 3.11 environment and install dependencies (Windows)
```bat
setup.bat
```
This script:
- verifies `py -3.11` is installed
- creates `venv`
- upgrades `pip`
- installs `requirements.txt`

If Python 3.11 is not installed, download:
https://www.python.org/downloads/release/python-3119/

### 2. Start the backend
```bat
start-backend.bat
```

### 3. Manual fallback commands
```bash
py -3.11 -m venv venv
venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Open API docs
```
http://localhost:8000/docs
```
Interactive Swagger UI — test every endpoint from your browser.

---

## Deploy to Railway

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Resona AI backend"
gh repo create resona-backend --public --push
```

### Step 2 — Create Railway project
1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo** → pick `resona-backend`
3. Railway auto-detects Python via `nixpacks` — no config needed

### Step 3 — Set environment variable
In Railway dashboard → your service → **Variables**:
```
ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Step 4 — Get your Railway URL
Railway gives you a URL like:
```
https://resona-backend-production.up.railway.app
```

### Step 5 — Set Vercel env variable
In Vercel dashboard → your project → **Settings → Environment Variables**:
```
NEXT_PUBLIC_API_URL=https://resona-backend-production.up.railway.app
```

---

## Connect to your React Frontend

Copy `resonaApi.js` → `src/lib/resonaApi.js` in your frontend repo.

### Example: Upload a recording
```jsx
import { createProfile } from "@/lib/resonaApi";

const handleUpload = async (audioBlob, profileName) => {
  const file = new File([audioBlob], "sample.wav", { type: "audio/wav" });
  const { profile_id } = await createProfile(profileName, file);
  // save profile_id to state
};
```

### Example: Synthesize speech
```jsx
import { synthesizeSpeech, downloadAudio } from "@/lib/resonaApi";

const handleGenerate = async () => {
  const blobUrl = await synthesizeSpeech(text, profileId);
  // play it:
  audioRef.current.src = blobUrl;
  // or download it:
  downloadAudio(blobUrl, "my_voiceover.wav");
};
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/profiles/create` | Upload voice sample → create profile |
| GET | `/api/profiles` | List all profiles |
| DELETE | `/api/profiles/{id}` | Delete a profile |
| GET | `/api/profiles/{id}/sample` | Play back original sample |
| POST | `/api/synthesize` | Text → cloned voice audio |

Full interactive docs at `/docs` (Swagger UI).

---

## Important Notes

- **First boot is slow** (~2-3 min): XTTS-v2 model (~1.8GB) downloads on first request
  and is then cached. Railway free tier has enough disk for this.
- **CPU only on Railway free tier**: synthesis takes ~20-40s per request.
  Acceptable for a college project; upgrade to a GPU instance for production.
- **Data persistence**: Railway free tier volumes are ephemeral.
  Profiles are lost on redeploy. For persistence, add a Railway Volume
  mounted at `/app/data` in the Railway dashboard.
- **Language**: English (`"en"`) by default. XTTS-v2 supports 17 languages.

---

## File Structure

```
resona-backend/
├── main.py          # FastAPI app — all routes & logic
├── requirements.txt # Python dependencies
├── Procfile         # Railway start command
├── railway.toml     # Railway build config (installs ffmpeg)
├── resonaApi.js     # Frontend JS client — copy to your React app
└── data/            # Created at runtime (gitignored)
    ├── profiles/    # Voice samples + metadata
    └── outputs/     # Temporary synthesized audio (auto-deleted)
```
