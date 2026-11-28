import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_LABEL, getCategoryBadgeClass } from '../lib/badges.js';
import { predictNlpCategory } from '../lib/nlp.js';
import { useAppStore } from '../store/useAppStore.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PHOTO_AGE_MS = 24 * 60 * 60 * 1000;

export function ReportForm({ onSubmitted }) {
  const selectedCoords = useAppStore((s) => s.selectedCoords);
  const setSelectedCoords = useAppStore((s) => s.setSelectedCoords);
  const submitNewReport = useAppStore((s) => s.submitNewReport);
  const pushToast = useAppStore((s) => s.pushToast);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latInput, setLatInput] = useState(() => String(selectedCoords?.lat ?? -6.4092));
  const [lngInput, setLngInput] = useState(() => String(selectedCoords?.lng ?? 108.2825));
  const [photoFile, setPhotoFile] = useState(null);
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [photoFilename, setPhotoFilename] = useState('');
  const [isStalePhoto, setIsStalePhoto] = useState(false);
  const [showStaleBanner, setShowStaleBanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!selectedCoords) return;
    setLatInput(String(selectedCoords.lat));
    setLngInput(String(selectedCoords.lng));
  }, [selectedCoords?.lat, selectedCoords?.lng]);

  const nlpPrediction = useMemo(() => predictNlpCategory(title, description), [title, description]);
  const hasText = title.trim().length > 0 || description.trim().length > 0;

  const handleCoordChange = (nextLatStr, nextLngStr) => {
    setLatInput(nextLatStr);
    setLngInput(nextLngStr);
    const parsedLat = Number(nextLatStr);
    const parsedLng = Number(nextLngStr);
    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
      setSelectedCoords(parsedLat, parsedLng);
    }
  };

  const resetPhotoInputs = (exceptRef = null) => {
    if (cameraInputRef.current && cameraInputRef !== exceptRef) cameraInputRef.current.value = '';
    if (fileInputRef.current && fileInputRef !== exceptRef) fileInputRef.current.value = '';
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoDataUrl('');
    setPhotoFilename('');
    setIsStalePhoto(false);
    setShowStaleBanner(false);
    resetPhotoInputs();
  };

  const handlePhotoChange = (e, sourceRef) => {
    const file = e.target.files?.[0];
    if (!file) return;

    resetPhotoInputs(sourceRef);
    setFormError('');

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      e.target.value = '';
      clearPhoto();
      const msg = 'Format foto harus JPG, PNG, atau WebP.';
      setFormError(msg);
      pushToast(msg, 'error');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      e.target.value = '';
      clearPhoto();
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const msg = `Ukuran foto (${sizeMb} MB) melebihi batas maksimal 5 MB.`;
      setFormError(msg);
      pushToast(msg, 'error');
      return;
    }

    const stale = Number.isFinite(file.lastModified) && Date.now() - file.lastModified > MAX_PHOTO_AGE_MS;
    setPhotoFile(file);
    setIsStalePhoto(stale);
    setShowStaleBanner(stale);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoDataUrl(String(ev.target?.result || ''));
      const kb = Math.round(file.size / 1024);
      setPhotoFilename(`${file.name} (${kb} KB)`);
    };
    reader.onerror = () => {
      e.target.value = '';
      clearPhoto();
      const msg = 'Foto tidak bisa dibaca. Pilih file gambar lain.';
      setFormError(msg);
      pushToast(msg, 'error');
    };
    reader.readAsDataURL(file);

    if (stale) {
      pushToast('Foto lama (lebih dari 24 jam) ditolak. Ambil foto terbaru langsung di lokasi.', 'error');
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setDescription('');
    setFormError('');
    clearPhoto();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const cleanTitle = title.trim();
    const cleanDesc = description.trim();
    const numLat = Number(latInput);
    const numLng = Number(lngInput);

    if (!cleanTitle || !cleanDesc) {
      setFormError('Judul dan deskripsi laporan wajib diisi.');
      return;
    }
    if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) {
      setFormError('Koordinat latitude dan longitude harus berupa angka valid.');
      return;
    }
    if (!photoFile) {
      setFormError('Ambil foto atau pilih file foto bukti terbaru terlebih dahulu.');
      return;
    }
    if (isStalePhoto) {
      setShowStaleBanner(true);
      setFormError('Foto lama (lebih dari 24 jam) ditolak. Ambil atau pilih foto terbaru (maks. 24 jam).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitNewReport({
        title: cleanTitle,
        description: cleanDesc,
        latitude: numLat,
        longitude: numLng,
        photoFile,
        photoUrl: photoDataUrl || null,
        isStalePhoto,
      });
      if (res?.ok) {
        handleResetForm();
        onSubmitted?.(res.report);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-4 sm:p-5">
      <h2 className="text-lg sm:text-xl font-extrabold text-ink-900 dark:text-white">Buat laporan baru</h2>
      <p className="hint">Kategori terisi otomatis dari judul &amp; deskripsi.</p>

      {showStaleBanner && (
        <div
          id="stale-photo-alert"
          role="alert"
          className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/70 p-3.5 text-sm text-red-900 dark:text-red-200"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-bold min-w-0 flex-1">Foto ditolak: diambil lebih dari 24 jam lalu</p>
            <button
              type="button"
              onClick={() => setShowStaleBanner(false)}
              aria-label="Tutup peringatan foto lama"
              className="btn btn-sm btn-danger-ghost shrink-0 whitespace-nowrap"
            >
              Tutup
            </button>
          </div>
          <p className="mt-1">Ambil foto langsung atau pilih file foto terbaru (maksimal 24 jam), lalu kirim ulang.</p>
        </div>
      )}

      {formError && !showStaleBanner && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200"
        >
          {formError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4" aria-label="Formulir laporan fasilitas">
        <div>
          <label htmlFor="input-title" className="label">Judul keluhan</label>
          <input
            id="input-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="field"
            placeholder="Judul singkat kerusakan"
          />
        </div>

        <div>
          <label htmlFor="input-description" className="label">Deskripsi kondisi</label>
          <textarea
            id="input-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="field"
            placeholder="Jelaskan apa yang rusak dan sejak kapan"
          />
        </div>

        <div
          className="rounded-lg bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800 px-3.5 py-3"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="text-xs font-semibold text-ink-700 dark:text-ink-300">Tebakan kategori</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={getCategoryBadgeClass(nlpPrediction.category)}>
              {CATEGORY_LABEL[nlpPrediction.category] || nlpPrediction.category}
            </span>
            <span className="text-xs font-mono text-ink-700 dark:text-ink-300">
              {hasText ? `Keyakinan: ${(nlpPrediction.confidence * 100).toFixed(0)}%` : 'Keyakinan: -'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="input-lat" className="label">Latitude</label>
            <input
              id="input-lat"
              type="number"
              step="any"
              value={latInput}
              onChange={(e) => handleCoordChange(e.target.value, lngInput)}
              required
              className="field font-mono"
            />
          </div>
          <div>
            <label htmlFor="input-lng" className="label">Longitude</label>
            <input
              id="input-lng"
              type="number"
              step="any"
              value={lngInput}
              onChange={(e) => handleCoordChange(latInput, e.target.value)}
              required
              className="field font-mono"
            />
          </div>
        </div>

        <div>
          <span id="photo-group-label" className="label">Foto bukti kerusakan</span>
          <div role="group" aria-labelledby="photo-group-label" className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="btn btn-sm btn-ghost w-full justify-center min-h-[44px]"
            >
              <svg className="w-4 h-4 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
              <span>Ambil foto</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-sm btn-ghost w-full justify-center min-h-[44px]"
            >
              <svg className="w-4 h-4 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <span>Pilih file foto</span>
            </button>
          </div>
          <input
            ref={cameraInputRef}
            id="input-photo-camera"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={(e) => handlePhotoChange(e, cameraInputRef)}
            className="sr-only"
            tabIndex={-1}
          />
          <input
            ref={fileInputRef}
            id="input-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handlePhotoChange(e, fileInputRef)}
            className="sr-only"
            tabIndex={-1}
          />
          <p className="hint">JPG, PNG, WebP, Maks. 5 MB, Usia foto maks. 24 jam</p>

          {photoDataUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border border-ink-200 dark:border-ink-800 bg-ink-100 dark:bg-ink-900">
              <img
                src={photoDataUrl}
                alt="Pratinjau foto bukti"
                width="640"
                height="360"
                className="w-full h-36 object-cover"
              />
              <div className="flex items-center justify-between gap-2 bg-ink-50 dark:bg-ink-900 px-3 py-2 border-t border-ink-200 dark:border-ink-800">
                <span className="truncate text-xs font-mono text-ink-700 dark:text-ink-200">{photoFilename}</span>
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="btn btn-sm btn-danger-ghost"
                >
                  Hapus foto
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          id="btn-submit-report"
          type="submit"
          disabled={submitting || isStalePhoto}
          className="btn btn-primary w-full min-h-[44px] disabled:opacity-50"
        >
          {submitting ? 'Mengirim laporan...' : 'Kirim laporan ke Sarpras'}
        </button>
      </form>
    </div>
  );
}
