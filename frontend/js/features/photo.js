// Fitur foto bukti: unggah kamera langsung atau pilih file terbaru (maks 24 jam), validasi MIME & ukuran maks 5 MB.

import { state } from '../state/store.js';
import { showToast } from '../utils/toast.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PHOTO_AGE_MS = 24 * 60 * 60 * 1000;

function syncSubmitButtonState() {
  const submitBtn = document.getElementById('btn-submit-report');
  if (!submitBtn) return;
  submitBtn.disabled = Boolean(state.isStalePhoto);
}

function resetPhotoInputs(exceptInput = null) {
  const cameraInput = document.getElementById('input-photo-camera');
  const fileInput = document.getElementById('input-photo');
  if (cameraInput && cameraInput !== exceptInput) cameraInput.value = '';
  if (fileInput && fileInput !== exceptInput) fileInput.value = '';
}

export function handlePhotoChange(event) {
  const targetInput = event.target;
  const file = targetInput?.files?.[0];
  if (!file) return;

  resetPhotoInputs(targetInput);

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    targetInput.value = '';
    state.currentPhotoDataUrl = null;
    state.currentPhotoFile = null;
    state.isStalePhoto = false;
    const wrapper = document.getElementById('photo-preview-wrapper');
    if (wrapper) wrapper.classList.add('hidden');
    hideStaleAlert();
    syncSubmitButtonState();
    showToast('Format foto harus JPG, PNG, atau WebP.', 'error');
    return;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    targetInput.value = '';
    state.currentPhotoDataUrl = null;
    state.currentPhotoFile = null;
    state.isStalePhoto = false;
    const wrapper = document.getElementById('photo-preview-wrapper');
    if (wrapper) wrapper.classList.add('hidden');
    hideStaleAlert();
    syncSubmitButtonState();
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    showToast(`Ukuran foto (${sizeMb} MB) melebihi batas maksimal 5 MB.`, 'error');
    return;
  }

  const isStale = Number.isFinite(file.lastModified) && (Date.now() - file.lastModified) > MAX_PHOTO_AGE_MS;
  state.isStalePhoto = isStale;
  state.currentPhotoFile = file;

  const reader = new FileReader();
  reader.onload = function (e) {
    state.currentPhotoDataUrl = e.target.result;
    const previewImg = document.getElementById('photo-preview-img');
    const filenameEl = document.getElementById('photo-filename');
    const wrapper = document.getElementById('photo-preview-wrapper');
    if (previewImg) previewImg.src = state.currentPhotoDataUrl;
    const kb = Math.round(file.size / 1024);
    if (filenameEl) filenameEl.textContent = `${file.name} (${kb} KB)`;
    if (wrapper) wrapper.classList.remove('hidden');
  };
  reader.onerror = function () {
    targetInput.value = '';
    state.currentPhotoDataUrl = null;
    state.currentPhotoFile = null;
    state.isStalePhoto = false;
    syncSubmitButtonState();
    showToast('Foto tidak bisa dibaca. Pilih file gambar lain.', 'error');
  };
  reader.readAsDataURL(file);

  if (isStale) {
    showStaleAlert();
    syncSubmitButtonState();
    showToast('Foto lama (lebih dari 24 jam) ditolak. Ambil atau pilih foto terbaru (maks. 24 jam).', 'error');
  } else {
    hideStaleAlert();
    syncSubmitButtonState();
  }
}

export function clearPhoto() {
  state.currentPhotoDataUrl = null;
  state.currentPhotoFile = null;
  state.isStalePhoto = false;
  hideStaleAlert();
  syncSubmitButtonState();
  resetPhotoInputs();
  const previewImg = document.getElementById('photo-preview-img');
  const filenameEl = document.getElementById('photo-filename');
  const wrapper = document.getElementById('photo-preview-wrapper');
  if (previewImg) previewImg.src = '';
  if (filenameEl) filenameEl.textContent = '';
  if (wrapper) wrapper.classList.add('hidden');
}

export function showStaleAlert() {
  const el = document.getElementById('stale-photo-alert');
  if (el) el.classList.remove('hidden');
}

export function hideStaleAlert() {
  const el = document.getElementById('stale-photo-alert');
  if (el) el.classList.add('hidden');
}

export function bindPhotoEvents() {
  const cameraInput = document.getElementById('input-photo-camera');
  const fileInput = document.getElementById('input-photo');
  const captureBtn = document.getElementById('btn-capture-photo');
  const pickBtn = document.getElementById('btn-pick-photo');
  const clearBtn = document.getElementById('btn-clear-photo');
  const hideStaleBtn = document.getElementById('btn-hide-stale');

  if (cameraInput) cameraInput.addEventListener('change', handlePhotoChange);
  if (fileInput) fileInput.addEventListener('change', handlePhotoChange);
  if (captureBtn && cameraInput) {
    captureBtn.addEventListener('click', () => cameraInput.click());
  }
  if (pickBtn && fileInput) {
    pickBtn.addEventListener('click', () => fileInput.click());
  }
  if (clearBtn) clearBtn.addEventListener('click', clearPhoto);
  if (hideStaleBtn) hideStaleBtn.addEventListener('click', hideStaleAlert);
}
