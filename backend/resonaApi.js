

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


/**
 * Upload a voice sample and create a new voice profile.
 * @param {string} name      - Display name for this voice
 * @param {File}   audioFile - WAV / MP3 / OGG file from <input type="file">
 * @returns {Promise<{ profile_id, name, sample_duration, message }>}
 */
export async function createProfile(name, audioFile) {
  const form = new FormData();
  form.append("name", name);
  form.append("file", audioFile);

  const res = await fetch(`${BASE_URL}/api/profiles/create?name=${encodeURIComponent(name)}`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create voice profile");
  }
  return res.json();
}

/**
 * List all saved voice profiles.
 * @returns {Promise<{ profiles: ProfileMeta[] }>}
 */
export async function listProfiles() {
  const res = await fetch(`${BASE_URL}/api/profiles`);
  if (!res.ok) throw new Error("Failed to fetch profiles");
  return res.json();
}

/**
 * Delete a voice profile by ID.
 * @param {string} profileId
 */
export async function deleteProfile(profileId) {
  const res = await fetch(`${BASE_URL}/api/profiles/${profileId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete profile");
  return res.json();
}

/**
 * Get the URL to preview a profile's original voice sample.
 * Use directly as an <audio src> attribute.
 * @param {string} profileId
 * @returns {string} URL
 */
export function getSampleUrl(profileId) {
  return `${BASE_URL}/api/profiles/${profileId}/sample`;
}


/**
 * Synthesize text → audio using a saved voice profile.
 * Returns a Blob URL you can play or trigger a download for.
 *
 * @param {string} text       - Text to synthesize (max 500 words)
 * @param {string} profileId  - ID from createProfile()
 * @param {string} language   - BCP-47 code, default "en"
 * @returns {Promise<string>} blobUrl — pass to <audio src> or <a href>
 */
export async function synthesizeSpeech(text, profileId, language = "en") {
  const res = await fetch(`${BASE_URL}/api/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, profile_id: profileId, language }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Synthesis failed");
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);  // use this as <audio src>
}

/**
 * Trigger a download of a generated audio blob URL.
 * @param {string} blobUrl  - from synthesizeSpeech()
 * @param {string} filename - e.g. "resona_output.wav"
 */
export function downloadAudio(blobUrl, filename = "resona_output.wav") {
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
}
