const mv           = document.getElementById('mv');
const splash       = document.getElementById('splash');
const splashBar    = document.getElementById('splashBar');
const splashStatus = document.getElementById('splashStatus');
const sidebar      = document.getElementById('sidebar');
const overlay      = document.getElementById('sidebarOverlay');

// ── Sidebar ──────────────────────────────────────────────
function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('show');
}
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });

// Swipe-left on sidebar to close
let swipeStartX = 0;
sidebar.addEventListener('touchstart', e => { swipeStartX = e.touches[0].clientX; }, { passive: true });
sidebar.addEventListener('touchend', e => {
  if (swipeStartX - e.changedTouches[0].clientX > 50) closeSidebar();
}, { passive: true });

// ── Splash ───────────────────────────────────────────────
let fakeP = 0;
const fakeTimer = setInterval(() => {
  fakeP += 7;
  if (fakeP >= 30) { clearInterval(fakeTimer); return; }
  splashBar.style.width = fakeP + '%';
  splashStatus.textContent = 'Initializing…';
}, 100);

mv.addEventListener('progress', e => {
  const pct = Math.round(e.detail.totalProgress * 100);
  splashBar.style.width = Math.max(fakeP, pct) + '%';
  splashStatus.textContent = 'Loading model… ' + pct + '%';
  const el = document.getElementById('infoProgress');
  if (el) el.textContent = pct + '%';
  const row = document.getElementById('infoSizeRow');
  if (row) row.style.display = 'flex';
});

mv.addEventListener('load', () => {
  clearInterval(fakeTimer);
  splashBar.style.width = '100%';
  splashStatus.textContent = 'Ready!';
  setTimeout(() => splash.classList.add('hidden'), 500);
  const badge = document.getElementById('infoStatus');
  if (badge) { badge.textContent = 'Loaded ✓'; badge.className = 'badge-ready'; }
  const row = document.getElementById('infoSizeRow');
  if (row) row.style.display = 'none';
});

mv.addEventListener('error', () => {
  clearInterval(fakeTimer);
  splashStatus.textContent = '⚠ hasc.glb not found';
  setTimeout(() => splash.classList.add('hidden'), 2500);
  const badge = document.getElementById('infoStatus');
  if (badge) { badge.textContent = 'Error'; badge.className = 'badge-error'; }
  showToast('hasc.glb not found — make sure it is in the same folder.');
});

// ── Controls ─────────────────────────────────────────────
document.getElementById('envSelect').addEventListener('change', function () {
  mv.environmentImage = this.value;
  if (document.getElementById('skyboxToggle').checked) mv.skyboxImage = this.value;
});

document.getElementById('exposureSlider').addEventListener('input', function () {
  mv.exposure = parseFloat(this.value);
  document.getElementById('exposureVal').textContent = parseFloat(this.value).toFixed(2);
});

document.getElementById('shadowSlider').addEventListener('input', function () {
  mv.shadowIntensity = parseFloat(this.value);
  document.getElementById('shadowVal').textContent = parseFloat(this.value).toFixed(2);
});

document.getElementById('fovSlider').addEventListener('input', function () {
  mv.fieldOfView = this.value + 'deg';
  document.getElementById('fovVal').textContent = this.value + '°';
});

document.getElementById('autoRotateToggle').addEventListener('change', function () {
  this.checked ? mv.setAttribute('auto-rotate', '') : mv.removeAttribute('auto-rotate');
});

document.getElementById('skyboxToggle').addEventListener('change', function () {
  mv.skyboxImage = this.checked ? document.getElementById('envSelect').value : null;
});

// ── Grid ─────────────────────────────────────────────────
const gridCanvas = document.getElementById('gridCanvas');
const gctx = gridCanvas.getContext('2d');
let showGrid = true;

function drawGrid() {
  const w = gridCanvas.width  = gridCanvas.offsetWidth;
  const h = gridCanvas.height = gridCanvas.offsetHeight;
  gctx.clearRect(0, 0, w, h);
  if (!showGrid) return;
  gctx.strokeStyle = '#4f8ef7';
  gctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += 40) { gctx.beginPath(); gctx.moveTo(x,0); gctx.lineTo(x,h); gctx.stroke(); }
  for (let y = 0; y <= h; y += 40) { gctx.beginPath(); gctx.moveTo(0,y); gctx.lineTo(w,y); gctx.stroke(); }
}
document.getElementById('gridToggle').addEventListener('change', function () {
  showGrid = this.checked; drawGrid();
});
window.addEventListener('resize', drawGrid);
drawGrid();

// ── Reset / AR / Fullscreen ───────────────────────────────
function resetCamera() {
  mv.cameraOrbit = 'auto auto auto';
  mv.cameraTarget = 'auto auto auto';
  mv.fieldOfView = 'auto';
  document.getElementById('fovSlider').value = 45;
  document.getElementById('fovVal').textContent = '45°';
}

function launchAR() {
  if (mv.canActivateAR) {
    mv.activateAR();
  } else {
    showToast('AR is not supported on this device or browser.');
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => showToast('Fullscreen not available'));
  } else {
    document.exitFullscreen();
  }
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}
