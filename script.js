const mv        = document.getElementById('mv');
const splash    = document.getElementById('splash');
const splashBar = document.getElementById('splashBar');
const splashStatus = document.getElementById('splashStatus');
const sidebar   = document.getElementById('sidebar');
const overlay   = document.getElementById('sidebarOverlay');

// ── Sidebar drawer (mobile / tablet) ────────────────────
function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}
// Close on ESC
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });
// Close on swipe-left inside sidebar
let swipeStartX = 0;
sidebar.addEventListener('touchstart', e => { swipeStartX = e.touches[0].clientX; }, { passive:true });
sidebar.addEventListener('touchend', e => {
  if (swipeStartX - e.changedTouches[0].clientX > 60) closeSidebar();
}, { passive:true });

// ── Splash ───────────────────────────────────────────────
function setSplash(pct, msg) {
  splashBar.style.width = pct + '%';
  splashStatus.textContent = msg;
}

// Fake early progress so loader doesn't sit blank
let fakeP = 0;
const fakeInterval = setInterval(() => {
  fakeP += 8;
  if (fakeP >= 35) { clearInterval(fakeInterval); return; }
  setSplash(fakeP, 'Initializing…');
}, 100);

mv.addEventListener('progress', e => {
  const pct = Math.round(e.detail.totalProgress * 100);
  setSplash(Math.max(fakeP, pct), `Loading model… ${pct}%`);
  const prog = document.getElementById('infoProgress');
  if (prog) prog.textContent = pct + '%';
  const row = document.getElementById('infoSizeRow');
  if (row) row.style.display = 'flex';
});

mv.addEventListener('load', () => {
  clearInterval(fakeInterval);
  setSplash(100, 'Ready');
  setTimeout(() => splash.classList.add('hidden'), 500);
  const badge = document.getElementById('infoStatus');
  if (badge) { badge.textContent = 'Loaded ✓'; badge.className = 'badge-ready'; }
  const row = document.getElementById('infoSizeRow');
  if (row) row.style.display = 'none';
});

mv.addEventListener('error', () => {
  clearInterval(fakeInterval);
  setSplash(100, '⚠ hasc.glb not found');
  setTimeout(() => splash.classList.add('hidden'), 2500);
  const badge = document.getElementById('infoStatus');
  if (badge) { badge.textContent = 'Not found'; badge.className = 'badge-error'; }
  showToast('hasc.glb not found — make sure it is in the same folder.');
});

// ── Environment ──────────────────────────────────────────
document.getElementById('envSelect').addEventListener('change', function() {
  mv.environmentImage = this.value;
  if (document.getElementById('skyboxToggle').checked) mv.skyboxImage = this.value;
});

// ── Exposure ─────────────────────────────────────────────
document.getElementById('exposureSlider').addEventListener('input', function() {
  mv.exposure = parseFloat(this.value);
  document.getElementById('exposureVal').textContent = parseFloat(this.value).toFixed(2);
});

// ── Shadow ───────────────────────────────────────────────
document.getElementById('shadowSlider').addEventListener('input', function() {
  mv.shadowIntensity = parseFloat(this.value);
  document.getElementById('shadowVal').textContent = parseFloat(this.value).toFixed(2);
});

// ── FOV ──────────────────────────────────────────────────
document.getElementById('fovSlider').addEventListener('input', function() {
  mv.fieldOfView = this.value + 'deg';
  document.getElementById('fovVal').textContent = this.value + '°';
});

// ── Auto-rotate ──────────────────────────────────────────
const rotateGroup = document.getElementById('rotateSpeedGroup');
document.getElementById('autoRotateToggle').addEventListener('change', function() {
  this.checked ? mv.setAttribute('auto-rotate','') : mv.removeAttribute('auto-rotate');
  rotateGroup.classList.toggle('dimmed', !this.checked);
});

document.getElementById('rotateSpeedSlider').addEventListener('input', function() {
  mv.style.setProperty('--auto-rotate-speed', (30 / parseInt(this.value)) + 'rad/s');
  document.getElementById('rotateSpeedVal').textContent = this.value + 's';
});

// ── Skybox ───────────────────────────────────────────────
document.getElementById('skyboxToggle').addEventListener('change', function() {
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
  const step = 40;
  gctx.strokeStyle = '#4f8ef7';
  gctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += step) { gctx.beginPath(); gctx.moveTo(x,0); gctx.lineTo(x,h); gctx.stroke(); }
  for (let y = 0; y <= h; y += step) { gctx.beginPath(); gctx.moveTo(0,y); gctx.lineTo(w,y); gctx.stroke(); }
}
document.getElementById('gridToggle').addEventListener('change', function() {
  showGrid = this.checked; drawGrid();
});
window.addEventListener('resize', drawGrid);
drawGrid();

// ── Reset camera ─────────────────────────────────────────
function resetCamera() {
  mv.cameraOrbit = 'auto auto auto';
  mv.cameraTarget = 'auto auto auto';
  mv.fieldOfView = 'auto';
  document.getElementById('fovSlider').value = 45;
  document.getElementById('fovVal').textContent = '45°';
}

// ── AR ───────────────────────────────────────────────────
function launchAR() {
  if (mv.canActivateAR) {
    mv.activateAR();
  } else {
    showToast('AR is not supported on this device or browser.');
  }
}

// ── Fullscreen ───────────────────────────────────────────
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => showToast('Fullscreen not available'));
  } else {
    document.exitFullscreen();
  }
}

// ── Toast ────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}
