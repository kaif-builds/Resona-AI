"""
Resona AI - Voice Cloning Backend
FastAPI + Coqui TTS
Deploy on Railway
"""

import os
import uuid
import shutil
import logging
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Resona AI Backend",
    description="Voice Cloning & TTS API powered by Coqui TTS",
    version="1.0.0"
)


ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3002").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


BASE_DIR      = Path("./data")
SAMPLES_DIR   = BASE_DIR / "samples"
PROFILES_DIR  = BASE_DIR / "profiles"
OUTPUTS_DIR   = BASE_DIR / "outputs"

for d in [SAMPLES_DIR, PROFILES_DIR, OUTPUTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)


_tts_model = None

def get_tts():
    global _tts_model
    if _tts_model is None:
        logger.info("Loading Coqui TTS model (first boot — may take a minute)...")
        os.environ["COQUI_TOS_AGREED"] = "1"
        from TTS.api import TTS
        _tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
        logger.info("TTS model loaded ✓")
    return _tts_model






class SynthesizeRequest(BaseModel):
    text: str
    profile_id: str
    language: str = "en"


class ProfileMeta(BaseModel):
    profile_id: str
    name: str
    sample_duration: Optional[float] = None
    created_at: str






@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "Resona AI Backend"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}



@app.post("/api/profiles/create", tags=["Voice Profiles"])
async def create_profile(
    name: str,
    file: UploadFile = File(...)
):
    """
    Upload a WAV/MP3 voice sample.
    Returns a profile_id that you use for synthesis later.
    No fine-tuning needed — XTTS-v2 does zero-shot cloning from your sample.
    """
    allowed = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".webm"}
    suffix = Path(file.filename).suffix.lower()
    if suffix not in allowed:
        raise HTTPException(400, f"Unsupported format '{suffix}'. Use: {allowed}")

    profile_id = str(uuid.uuid4())
    profile_dir = PROFILES_DIR / profile_id
    profile_dir.mkdir(parents=True)

    sample_path = profile_dir / f"sample{suffix}"
    with open(sample_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    wav_path = profile_dir / "sample.wav"
    if suffix != ".wav":
        _convert_to_wav(sample_path, wav_path)
        sample_path.unlink()
    else:
        sample_path.rename(wav_path)

    duration = _get_audio_duration(wav_path)
    if duration < 6:
        shutil.rmtree(profile_dir)
        raise HTTPException(400, f"Sample too short ({duration:.1f}s). Please provide at least 6 seconds.")

    import json, datetime
    meta = {
        "profile_id": profile_id,
        "name": name,
        "sample_path": str(wav_path.resolve()),
        "sample_duration": round(duration, 2),
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    with open(profile_dir / "meta.json", "w") as f:
        json.dump(meta, f, indent=2)

    logger.info(f"Profile created: {profile_id} | name={name} | duration={duration:.1f}s")
    return {
        "success": True,
        "profile_id": profile_id,
        "name": name,
        "sample_duration": round(duration, 2),
        "message": f"Voice profile '{name}' created successfully!"
    }



@app.get("/api/profiles", tags=["Voice Profiles"])
def list_profiles():
    import json
    profiles = []
    for meta_file in PROFILES_DIR.glob("*/meta.json"):
        with open(meta_file) as f:
            profiles.append(json.load(f))
    profiles.sort(key=lambda x: x["created_at"], reverse=True)
    return {"profiles": profiles}



@app.delete("/api/profiles/{profile_id}", tags=["Voice Profiles"])
def delete_profile(profile_id: str):
    profile_dir = PROFILES_DIR / profile_id
    if not profile_dir.exists():
        raise HTTPException(404, "Profile not found")
    shutil.rmtree(profile_dir)
    return {"success": True, "message": f"Profile {profile_id} deleted"}



@app.post("/api/synthesize", tags=["Synthesis"])
def synthesize(req: SynthesizeRequest, background_tasks: BackgroundTasks):
    """
    Generate speech from text using a saved voice profile.
    Returns the audio file directly.
    """
    if not req.text.strip():
        raise HTTPException(400, "Text cannot be empty")
    if len(req.text.split()) > 500:
        raise HTTPException(400, "Text exceeds 500 word limit for v1.0")

    import json
    profile_dir = PROFILES_DIR / req.profile_id
    meta_path = profile_dir / "meta.json"
    if not meta_path.exists():
        raise HTTPException(404, f"Profile '{req.profile_id}' not found")

    with open(meta_path) as f:
        meta = json.load(f)

    sample_wav = Path(meta["sample_path"])
    if not sample_wav.exists():
        raise HTTPException(500, "Voice sample file missing — please re-create profile")

    output_id   = str(uuid.uuid4())
    output_path = OUTPUTS_DIR / f"{output_id}.wav"

    try:
        tts = get_tts()
        logger.info(f"Synthesizing: profile={req.profile_id} | chars={len(req.text)}")
        tts.tts_to_file(
            text=req.text,
            speaker_wav=str(sample_wav),
            language=req.language,
            file_path=str(output_path)
        )
    except Exception as e:
        logger.error(f"Synthesis failed: {e}")
        raise HTTPException(500, f"Synthesis error: {str(e)}")

    background_tasks.add_task(_cleanup_file, output_path, delay=600)

    return FileResponse(
        path=str(output_path),
        media_type="audio/wav",
        filename=f"resona_{output_id[:8]}.wav"
    )



@app.get("/api/profiles/{profile_id}/sample", tags=["Voice Profiles"])
def get_sample(profile_id: str):
    sample = PROFILES_DIR / profile_id / "sample.wav"
    if not sample.exists():
        raise HTTPException(404, "Sample not found")
    return FileResponse(str(sample), media_type="audio/wav")






def _find_executable(name: str) -> str:
    """Find an executable by name, checking common Homebrew paths as fallback."""
    path = shutil.which(name)
    if path:
        return path
    for prefix in ["/opt/homebrew/bin", "/usr/local/bin"]:
        candidate = os.path.join(prefix, name)
        if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
            return candidate
    return name  


def _convert_to_wav(src: Path, dst: Path):
    """Convert any audio format to 22050Hz mono WAV using ffmpeg."""
    import subprocess
    ffmpeg = _find_executable("ffmpeg")
    logger.info(f"Using ffmpeg at: {ffmpeg}")
    result = subprocess.run(
        [ffmpeg, "-y", "-i", str(src), "-ar", "22050", "-ac", "1", str(dst)],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise HTTPException(500, f"Audio conversion failed: {result.stderr}")


def _get_audio_duration(audio_path: Path) -> float:
    """Return duration of an audio file in seconds."""
    try:
        import subprocess, json as _json
        ffprobe = _find_executable("ffprobe")
        result = subprocess.run(
            [ffprobe, "-v", "quiet", "-print_format", "json",
             "-show_streams", str(audio_path)],
            capture_output=True, text=True
        )
        if result.returncode == 0 and result.stdout.strip():
            data = _json.loads(result.stdout)
            for stream in data.get("streams", []):
                dur = stream.get("duration")
                if dur:
                    return float(dur)
    except Exception as e:
        logger.warning(f"ffprobe duration detection failed: {e}")

    try:
        import wave
        with wave.open(str(audio_path), "rb") as wf:
            return wf.getnframes() / wf.getframerate()
    except Exception as e:
        logger.warning(f"wave module duration detection failed: {e}")
        return 0.0


async def _cleanup_file(path: Path, delay: int = 600):
    """Delete a file after `delay` seconds."""
    import asyncio
    await asyncio.sleep(delay)
    if path.exists():
        path.unlink()
        logger.info(f"Cleaned up: {path}")
