// Cloudinary upload service
// Uses unsigned upload preset. Configure via Vite env vars:
// VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET

export async function uploadToCloudinary(file) {
  const cloudName = (import.meta && import.meta.env && import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) || 'dpyjezkla';
  const uploadPreset = (import.meta && import.meta.env && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) || 'carlomagg';

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;
  const fd = new FormData();
  // Cloudinary supports remote fetch if 'file' is a URL string
  fd.append('file', typeof file === 'string' ? file : file);
  fd.append('upload_preset', uploadPreset);

  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) {
    let msg = 'Cloudinary upload failed';
    try { const t = await res.text(); msg = t || msg; } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  // Prefer secure_url
  return { url: data.secure_url || data.url, public_id: data.public_id, resource_type: data.resource_type };
}
