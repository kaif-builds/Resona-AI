# Voice Cloning / Coqui TTS Integration Issue Log

## Project Setup
- **Frontend:** React / Vite (`npm run dev` running on port 3001)
- **Backend:** FastAPI running locally on port 8000
- **AI Tool:** Coqui TTS (XTTS-v2 for zero-shot voice cloning)
- **OS:** macOS

## The Goal
We are trying to build a feature where a user uploads a short voice sample (mp3/m4a/wav), the backend saves it to a "profile", and then uses Coqui TTS to generate new text-to-speech audio using that voice sample.

## Current Problem
The frontend successfully lets a user upload a voice sample, but it is not successfully converting that sample into a usable voice profile on the backend, and Coqui TTS is failing to connect / generate speech.

## What We Have Diagnosed & Fixed So Far

### 1. Frontend API Fix (`src/resonaApi.js` & `src/App.tsx`)
- **Issue:** The backend `POST /api/profiles/create` endpoint required two parameters: `file` (the uploaded audio) and `name` (a string in the query params). The frontend was only sending `file`, causing the backend to silently reject or fail the upload.
- **Fix:** We updated `uploadVoiceSample` to automatically generate and send a name (e.g., `"My Voice 1713824901234"`) in the URL queries.

### 2. Backend Environment Fix (`backend/venv`)
- **Issue:** The `/backend` folder contained a Windows virtual environment (`Lib` and `Scripts` folders). This broke the macOS execution because it requires the Linux/Mac structure (`lib` and `bin`).
- **Fix:** We deleted the broken Windows `venv` folder and generated a fresh one using Python 3.11 (`python3.11 -m venv venv`), then successfully pip-installed `requirements.txt` (including FastAPI, Coqui TTS, and CPU-only PyTorch). 

### 3. PyTorch Dependency Fix (`backend/requirements.txt`)
- **Issue:** The original requirements file explicitly asked for `torch==2.2.2+cpu` and `--extra-index-url https://download.pytorch.org/whl/cpu`. pip on macOS rejects the `+cpu` versioning specifier.
- **Fix:** We edited `requirements.txt` to remove `+cpu`, reverting to the standard `torch==2.2.2` and `torchaudio==2.2.2` which install perfectly on macOS.

### 4. FFmpeg Audio Conversion Fix (`backend/main.py`)
- **Issue:** Users were uploading `.mp3` files, but Coqui TTS strictly requires `.wav` files. The Python backend has a function (`_convert_to_wav`) that uses the system `ffmpeg` command to convert the sample on the fly. 
- **Issue:** `ffmpeg` was not installed globally on the Mac, causing the `subprocess.run(["ffmpeg", ...])` command to crash silently. The backend would save the MP3 but fail to finish generating the profile's `meta.json` inside `/data/profiles/`.
- **Fix:** We installed `ffmpeg` via Homebrew (`brew install ffmpeg`), resolving the missing dependency. We then cleared out the corrupted/unfinished profiles inside `backend/data/profiles/*`.

## Current State
Despite all dependencies seemingly resolving correctly (FastAPI starts successfully on 8000, React starts on 3001, `ffmpeg` is globally available, and the missing API parameters have been addressed), the system still fails to generate text-to-speech audio when requested from the UI. 

**Next Steps / Questions for Senior Dev:**
1. Are there still hidden crashes in the uvicorn terminal when `_convert_to_wav` is invoked?
2. Is the background download of the `xtts_v2` model (an ~1.8GB file) timing out or failing when the user hits "generate" for the first time?
3. Is CORS or the Axios/Fetch layer in `resonaApi.js` quietly blocking the audio blob download?
