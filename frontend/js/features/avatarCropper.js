// Pangkas foto profil: dialog dengan pratinjau bulat, geser, dan zoom.
// Hasil berupa data URL JPEG 256x256, cukup kecil untuk disimpan di localStorage.

const OUTPUT_SIZE = 256;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;
const KEY_STEP = 12;

// Mengembalikan pesan galat, atau string kosong bila file layak dipakai.
export function validateAvatarFile(file) {
  if (!file) return 'Pilih file foto terlebih dahulu.';
  if (!ALLOWED_TYPES.includes(file.type)) return 'Format foto harus JPG, PNG, atau WebP.';
  if (file.size > MAX_BYTES) return 'Ukuran foto maksimal 5 MB.';
  return '';
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Foto tidak bisa dibaca. Coba pilih file gambar lain.'));
    };
    img.src = url;
  });
}

// Membuka dialog pangkas. Resolve dengan data URL, atau null bila dibatalkan.
export async function openAvatarCropper(file) {
  const { img, url } = await loadImage(file);

  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.setAttribute('aria-labelledby', 'avatar-crop-title');
    dialog.className =
      'card p-4 sm:p-5 m-auto w-[min(24rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-1.5rem)] overflow-y-auto text-ink-900 dark:text-white backdrop:bg-black/40';
    dialog.innerHTML = `
      <h2 id="avatar-crop-title" class="text-lg font-extrabold">Pangkas foto profil</h2>
      <p class="hint">Geser foto, atau fokus ke pratinjau lalu pakai tombol panah.</p>
      <div class="mt-3 flex justify-center">
        <canvas id="avatar-crop-canvas" width="${OUTPUT_SIZE}" height="${OUTPUT_SIZE}" tabindex="0" role="img"
          aria-label="Pratinjau pangkas foto profil"
          class="rounded-full border border-ink-200 dark:border-ink-700"
          style="width:${OUTPUT_SIZE}px;max-width:100%;height:auto;aspect-ratio:1/1;touch-action:none;cursor:grab"></canvas>
      </div>
      <div class="mt-4">
        <label for="avatar-zoom" class="label">Zoom</label>
        <input id="avatar-zoom" type="range" min="1" max="3" step="0.01" value="1" class="w-full min-h-[44px]" />
      </div>
      <div class="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button type="button" id="avatar-crop-cancel" class="btn btn-ghost w-full sm:w-auto">Batal</button>
        <button type="button" id="avatar-crop-save" class="btn btn-primary w-full sm:w-auto">Gunakan foto ini</button>
      </div>
    `;
    document.body.appendChild(dialog);

    const canvas = dialog.querySelector('#avatar-crop-canvas');
    const zoomEl = dialog.querySelector('#avatar-zoom');
    const ctx = canvas.getContext('2d');

    const baseScale = OUTPUT_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
    let zoom = 1;
    let offX = 0;
    let offY = 0;

    function clamp() {
      const scale = baseScale * zoom;
      const maxX = Math.max(0, (img.naturalWidth * scale - OUTPUT_SIZE) / 2);
      const maxY = Math.max(0, (img.naturalHeight * scale - OUTPUT_SIZE) / 2);
      offX = Math.min(maxX, Math.max(-maxX, offX));
      offY = Math.min(maxY, Math.max(-maxY, offY));
    }

    function draw() {
      clamp();
      const scale = baseScale * zoom;
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      // Latar putih supaya PNG transparan tidak menjadi hitam saat jadi JPEG
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      ctx.drawImage(img, (OUTPUT_SIZE - w) / 2 + offX, (OUTPUT_SIZE - h) / 2 + offY, w, h);
    }

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    canvas.addEventListener('pointerdown', (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const ratio = OUTPUT_SIZE / canvas.getBoundingClientRect().width;
      offX += (e.clientX - lastX) * ratio;
      offY += (e.clientY - lastY) * ratio;
      lastX = e.clientX;
      lastY = e.clientY;
      draw();
    });
    const endDrag = () => {
      dragging = false;
      canvas.style.cursor = 'grab';
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    canvas.addEventListener('keydown', (e) => {
      const moves = {
        ArrowLeft: [KEY_STEP, 0],
        ArrowRight: [-KEY_STEP, 0],
        ArrowUp: [0, KEY_STEP],
        ArrowDown: [0, -KEY_STEP],
      };
      if (!moves[e.key]) return;
      e.preventDefault();
      offX += moves[e.key][0];
      offY += moves[e.key][1];
      draw();
    });

    zoomEl.addEventListener('input', () => {
      zoom = parseFloat(zoomEl.value) || 1;
      draw();
    });

    let settled = false;
    function finish(result) {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      if (dialog.open) dialog.close();
      dialog.remove();
      resolve(result);
    }

    dialog.querySelector('#avatar-crop-cancel').addEventListener('click', () => finish(null));
    dialog.querySelector('#avatar-crop-save').addEventListener('click', () => {
      finish(canvas.toDataURL('image/jpeg', 0.85));
    });
    // Escape pada dialog native memicu event cancel
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      finish(null);
    });

    draw();
    dialog.showModal();
    canvas.focus();
  });
}
