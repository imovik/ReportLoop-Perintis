// Kontroler tampilan Profil Akun untuk Mahasiswa dan Admin Sarpras.
// Daftar laporan dan progres pengerjaan ada di halaman Laporan Saya (myReports.js).

import { state } from '../state/store.js';
import {
  getSession,
  updateSessionProfile,
  logout,
  ROLE_LOGIN,
  getProfilePhoto,
  setProfilePhoto,
  clearProfilePhoto,
} from '../services/auth.js';
import { openAvatarCropper, validateAvatarFile } from './avatarCropper.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { showToast } from '../utils/toast.js';

export function renderProfilePanel(onSessionUpdated) {
  const container = document.getElementById('profile-container');
  const session = getSession();
  if (!container || !session) return;

  const isAdmin = session.role === 'admin';
  const roleTitle = isAdmin ? 'Petugas Admin Sarpras' : 'Mahasiswa Pelapor';
  const idLabel = isAdmin ? 'Email Terdaftar' : 'Nomor Induk Mahasiswa (NIM)';
  const authMethodLabel = session.provider === 'google' ? 'Google OAuth' : isAdmin ? 'Email & Kata Sandi' : 'NIM & Kata Sandi';
  const sessionDurationLabel = session.rememberMe ? '7 hari (Ingat Saya)' : '8 jam';
  const registeredEmail = session.email || (isAdmin ? session.id : 'Belum diatur');
  const initials = (session.name || 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();

  const photo = getProfilePhoto(session);
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Kartu Identitas Akun -->
      <div class="lg:col-span-5 card p-5 sm:p-6 space-y-5">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-brand-700 text-white font-extrabold text-xl flex items-center justify-center shrink-0 overflow-hidden">
            ${
              photo
                ? `<img src="${escapeHtml(photo)}" alt="Foto profil ${escapeHtml(session.name)}" width="128" height="128" class="w-full h-full object-cover" />`
                : escapeHtml(initials)
            }
          </div>
          <div class="min-w-0">
            <span class="badge badge-cat">${escapeHtml(roleTitle)}</span>
            <h1 class="mt-1.5 text-xl font-extrabold text-ink-900 dark:text-white truncate">${escapeHtml(session.name)}</h1>
            <p class="text-xs font-mono text-ink-600 dark:text-ink-300 truncate">${escapeHtml(session.id)}</p>
          </div>
        </div>

        <div>
          <input id="profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" hidden />
          <div class="flex flex-col sm:flex-row gap-2">
            <button id="btn-photo-pick" type="button" class="btn btn-sm btn-ghost w-full sm:w-auto">${photo ? 'Ganti foto' : 'Unggah foto'}</button>
            ${photo ? '<button id="btn-photo-remove" type="button" class="btn btn-sm btn-danger-ghost w-full sm:w-auto">Hapus foto</button>' : ''}
          </div>
          <p class="hint">JPG, PNG, atau WebP, maks. 5 MB. Foto bisa dipangkas sebelum disimpan.</p>
        </div>

        <dl class="divide-y divide-ink-200 dark:divide-ink-800 border-y border-ink-200 dark:border-ink-800 text-sm">
          <div class="py-3 flex items-center justify-between gap-3">
            <dt class="text-ink-600 dark:text-ink-300">${idLabel}</dt>
            <dd class="font-mono font-semibold text-ink-900 dark:text-white">${escapeHtml(session.id)}</dd>
          </div>
          ${
            !isAdmin
              ? `<div class="py-3 flex items-center justify-between gap-3">
                  <dt class="text-ink-600 dark:text-ink-300">Email Google</dt>
                  <dd class="font-mono text-xs font-semibold text-ink-900 dark:text-white truncate">${escapeHtml(registeredEmail)}</dd>
                </div>`
              : ''
          }
          <div class="py-3 flex items-center justify-between gap-3">
            <dt class="text-ink-600 dark:text-ink-300">Metode Masuk</dt>
            <dd class="font-semibold text-ink-900 dark:text-white">${escapeHtml(authMethodLabel)}</dd>
          </div>
          <div class="py-3 flex items-center justify-between gap-3">
            <dt class="text-ink-600 dark:text-ink-300">Masa Aktif Sesi</dt>
            <dd class="font-semibold text-ink-900 dark:text-white">${escapeHtml(sessionDurationLabel)}</dd>
          </div>
          <div class="py-3 flex items-center justify-between gap-3">
            <dt class="text-ink-600 dark:text-ink-300">Institusi</dt>
            <dd class="font-semibold text-ink-900 dark:text-white text-right">Politeknik Negeri Indramayu</dd>
          </div>
          <div class="py-3 flex items-center justify-between gap-3">
            <dt class="text-ink-600 dark:text-ink-300">Sumber Data</dt>
            <dd class="font-semibold text-ink-900 dark:text-white">${state.isLiveApi ? 'Server FastAPI Lokal' : 'Mode Demo Lokal'}</dd>
          </div>
        </dl>

        <!-- Form Ubah Nama & Email Akun -->
        <form id="profile-name-form" class="space-y-3">
          <div>
            <label for="profile-input-name" class="label">Nama tampilan</label>
            <input id="profile-input-name" type="text" required minlength="3" value="${escapeHtml(session.name)}" class="field" />
          </div>
          ${
            !isAdmin
              ? `<div>
                  <label for="profile-input-email" class="label">Email Pemulihan</label>
                  <input id="profile-input-email" type="email" required placeholder="nama@gmail.com" value="${escapeHtml(session.email || '')}" class="field" />
                </div>`
              : ''
          }
          <div class="flex flex-wrap gap-2">
            <button type="submit" class="btn btn-primary flex-1">Simpan Perubahan</button>
            <button id="btn-profile-logout" type="button" class="btn btn-danger-ghost">Keluar Akun</button>
          </div>
        </form>
      </div>

      <!-- Kolom Kanan: Pintasan Menu. Ringkasan aktivitas ada di Laporan Saya (mahasiswa) dan Antrean Triase (admin). -->
      <div class="lg:col-span-7 space-y-6">
        <div class="card p-5 sm:p-6">
          <h2 class="text-lg font-extrabold text-ink-900 dark:text-white">Pintasan</h2>
          <p class="hint">${isAdmin ? 'Ringkasan pekerjaan ada di Antrean Triase.' : 'Ringkasan aktivitas Anda ada di Laporan Saya.'}</p>

          <div class="mt-4 flex flex-wrap gap-2">
            ${
              isAdmin
                ? `<button type="button" data-nav-view="antrean" class="btn btn-sm btn-primary">Buka Antrean Triase</button>
                   <button type="button" data-nav-view="peta" class="btn btn-sm btn-ghost">Buka Peta Kampus</button>`
                : `<button type="button" data-nav-view="lapor" class="btn btn-sm btn-primary">Buat Laporan Baru</button>
                   <button type="button" data-nav-view="laporan-saya" class="btn btn-sm btn-ghost">Buka Laporan Saya</button>`
            }
          </div>
        </div>
      </div>
    </div>
  `;

  const nameForm = document.getElementById('profile-name-form');
  if (nameForm) {
    nameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('profile-input-name');
      const emailInput = document.getElementById('profile-input-email');
      try {
        const updates = { name: nameInput.value };
        if (!isAdmin && emailInput) {
          updates.email = emailInput.value;
        }
        const updated = updateSessionProfile(updates);
        if (onSessionUpdated) onSessionUpdated(updated);
        renderProfilePanel(onSessionUpdated);
        showToast('Profil akun berhasil diperbarui.', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  const photoInput = document.getElementById('profile-photo-input');
  document.getElementById('btn-photo-pick')?.addEventListener('click', () => photoInput?.click());
  photoInput?.addEventListener('change', async () => {
    const file = photoInput.files && photoInput.files[0];
    photoInput.value = '';
    if (!file) return;

    const problem = validateAvatarFile(file);
    if (problem) {
      showToast(problem, 'error');
      return;
    }
    try {
      const cropped = await openAvatarCropper(file);
      if (!cropped) return;
      setProfilePhoto(cropped);
      if (onSessionUpdated) onSessionUpdated(getSession());
      renderProfilePanel(onSessionUpdated);
      showToast('Foto profil diperbarui.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('btn-photo-remove')?.addEventListener('click', () => {
    clearProfilePhoto();
    if (onSessionUpdated) onSessionUpdated(getSession());
    renderProfilePanel(onSessionUpdated);
    showToast('Foto profil dihapus. Inisial dipakai kembali.', 'info');
  });

  const logoutBtn = document.getElementById('btn-profile-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
      window.location.replace(ROLE_LOGIN[session.role]);
    });
  }
}
