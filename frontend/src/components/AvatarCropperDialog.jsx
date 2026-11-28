import { useEffect, useRef, useState } from 'react';
import { MAX_AVATAR_BYTES } from '../config/constants.js';

const OUTPUT_SIZE = 256;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;
const KEY_STEP = 12;

export function validateAvatarFile(file) {
  if (!file) return 'Pilih file foto terlebih dahulu.';
  if (!ALLOWED_TYPES.includes(file.type)) return 'Format foto harus JPG, PNG, atau WebP.';
  if (file.size > MAX_BYTES) return 'Ukuran foto maksimal 5 MB.';
  return '';
}

export function AvatarCropperDialog({
  file,
  title = 'Pangkas foto profil',
  confirmLabel = 'Gunakan foto ini',
  onConfirm,
  onClose,
}) {
  const dialogRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imageReady, setImageReady] = useState(false);

  const clampPan = (nx, ny, z, img) => {
    if (!img) return { x: 0, y: 0 };
    const baseScale = OUTPUT_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
    const scale = baseScale * z;
    const maxX = Math.max(0, (img.naturalWidth * scale - OUTPUT_SIZE) / 2);
    const maxY = Math.max(0, (img.naturalHeight * scale - OUTPUT_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, nx)),
      y: Math.min(maxY, Math.max(-maxY, ny)),
    };
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!file) {
      imageRef.current = null;
      setImageReady(false);
      if (dialog.open) dialog.close();
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setImageReady(true);
      if (!dialog.open) {
        dialog.showModal();
      }
      requestAnimationFrame(() => canvasRef.current?.focus());
    };
    img.onerror = () => {
      imageRef.current = null;
      setImageReady(false);
      onClose?.();
    };
    img.src = objectUrl;

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageReady) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseScale = OUTPUT_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
    const scale = baseScale * zoom;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;

    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.drawImage(img, (OUTPUT_SIZE - w) / 2 + pan.x, (OUTPUT_SIZE - h) / 2 + pan.y, w, h);
  }, [zoom, pan, imageReady]);

  const handleZoomChange = (nextZoom) => {
    const clampedZ = Math.max(1, Math.min(3, parseFloat(nextZoom) || 1));
    setZoom(clampedZ);
    setPan((prev) => clampPan(prev.x, prev.y, clampedZ, imageRef.current));
  };

  const handlePointerDown = (e) => {
    if (!imageReady) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.active) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = rect.width > 0 ? OUTPUT_SIZE / rect.width : 1;
    const dx = (e.clientX - dragRef.current.startX) * ratio;
    const dy = (e.clientY - dragRef.current.startY) * ratio;
    setPan(
      clampPan(
        dragRef.current.originX + dx,
        dragRef.current.originY + dy,
        zoom,
        imageRef.current
      )
    );
  };

  const handlePointerUp = (e) => {
    if (dragRef.current.active && e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current.active = false;
  };

  const handleCanvasKeyDown = (e) => {
    const moves = {
      ArrowLeft: [KEY_STEP, 0],
      ArrowRight: [-KEY_STEP, 0],
      ArrowUp: [0, KEY_STEP],
      ArrowDown: [0, -KEY_STEP],
    };
    if (!moves[e.key]) return;
    e.preventDefault();
    const [dx, dy] = moves[e.key];
    setPan((prev) => clampPan(prev.x + dx, prev.y + dy, zoom, imageRef.current));
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageReady) return;

    let quality = 0.85;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (MAX_AVATAR_BYTES && dataUrl.length * 0.75 > MAX_AVATAR_BYTES && quality > 0.45) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    onConfirm?.(dataUrl);
  };

  const handleCancel = (e) => {
    if (e) e.preventDefault();
    onClose?.();
  };

  return (
    <dialog
      ref={dialogRef}
      id="avatar-cropper-dialog"
      aria-labelledby="avatar-crop-title"
      onCancel={handleCancel}
      onClose={() => onClose?.()}
      className="card p-4 sm:p-5 m-auto w-[min(24rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-1.5rem)] overflow-y-auto text-ink-900 dark:text-white backdrop:bg-black/40"
    >
      <h2 id="avatar-crop-title" className="text-lg font-extrabold">
        {title}
      </h2>
      <p className="hint">Geser foto, atau fokus ke pratinjau lalu pakai tombol panah.</p>

      <div className="mt-3 flex justify-center">
        <canvas
          ref={canvasRef}
          id="avatar-crop-canvas"
          width={OUTPUT_SIZE}
          height={OUTPUT_SIZE}
          tabIndex={0}
          role="img"
          aria-label="Pratinjau pangkas foto profil"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleCanvasKeyDown}
          style={{
            width: `${OUTPUT_SIZE}px`,
            maxWidth: '100%',
            height: 'auto',
            aspectRatio: '1 / 1',
            touchAction: 'none',
          }}
          className="rounded-full border border-ink-200 dark:border-ink-700 cursor-grab active:cursor-grabbing"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="avatar-zoom" className="label">
          Zoom
        </label>
        <input
          id="avatar-zoom"
          type="range"
          min="1"
          max="3"
          step="0.01"
          value={zoom}
          onChange={(e) => handleZoomChange(e.target.value)}
          className="w-full min-h-[44px]"
        />
      </div>

      <div className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button
          type="button"
          id="avatar-crop-cancel"
          onClick={handleCancel}
          className="btn btn-ghost w-full sm:w-auto min-h-[44px]"
        >
          Batal
        </button>
        <button
          type="button"
          id="avatar-crop-save"
          onClick={handleConfirm}
          disabled={!imageReady}
          className="btn btn-primary w-full sm:w-auto min-h-[44px] disabled:opacity-50"
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
