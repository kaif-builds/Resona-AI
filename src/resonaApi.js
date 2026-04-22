const API_BASE_URL = import.meta.env.VITE_RESONA_API_BASE_URL || 'http://localhost:8000';

function toApiError(status, payload) {
  const fallback = `Request failed with status ${status}`;
  if (!payload) return new Error(fallback);
  if (typeof payload === 'string') return new Error(payload);
  if (payload.detail) {
    if (typeof payload.detail === 'string') return new Error(payload.detail);
    if (Array.isArray(payload.detail) && payload.detail[0]?.msg) return new Error(payload.detail[0].msg);
  }
  if (payload.error) return new Error(payload.error);
  if (payload.message) return new Error(payload.message);
  return new Error(fallback);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    let payload = null;
    try {
      payload = contentType.includes('application/json') ? await response.json() : await response.text();
    } catch {
      payload = null;
    }
    throw toApiError(response.status, payload);
  }

  if (contentType.includes('application/json')) return response.json();
  if (contentType.includes('audio/')) return response.blob();
  return response.text();
}

export async function uploadVoiceSample(audioFile, name = 'My Voice') {
  const formData = new FormData();
  formData.append('file', audioFile);

  return request(`/api/profiles/create?name=${encodeURIComponent(name)}`, {
    method: 'POST',
    body: formData,
  });
}

export async function synthesizeSpeech(payload) {
  return request('/api/synthesize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function listProfiles() {
  return request('/api/profiles', {
    method: 'GET',
  });
}

export async function deleteProfile(profileId) {
  return request(`/api/profiles/${encodeURIComponent(profileId)}`, {
    method: 'DELETE',
  });
}

export function getProfileSampleUrl(profileId) {
  return `${API_BASE_URL}/api/profiles/${encodeURIComponent(profileId)}/sample`;
}
