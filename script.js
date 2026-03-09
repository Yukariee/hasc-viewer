// ── model-viewer reference ───────────────────────────────────────────────────
const mv = document.getElementById('mv');
const splash = document.getElementById('splash');
const splashBar = document.getElementById('splashBar');
const splashStatus = document.getElementById('splashStatus');

// ── Splash / loading ─────────────────────────────────────────────────────────
function setSplash(pct, msg) {
  splashBar.style.width = pct + '%';
  splashStatus.textContent = msg;
}

mv.addEventListener('progress', e => {
  const pct = Math.round(e.detail.totalProgress * 100);
  setSplash(pct, `Loading model… ${pct}%`);
  const prog = document.getElementById('infoProgress');
  if (prog) prog.textContent = pct + '%';
  const sizeRow = document.getElementById('infoSizeRow');
  if (sizeRow) sizeRow.style.display = 'flex';
});

mv.addEventListener('load', () => {
  setSplash(100, 'Ready');
  setTimeout(() => splash.classList.add('hidden'), 600);
  const badge = document.getElementById('infoStatus');
  if (badge) { badge.textContent = 'Loaded ✓'; badge.className = 'badge-ready'; }
  const sizeRow = document.getElementById('infoSizeRow');
  if (sizeRow) sizeRow.style.display = 'none';
});

mv.addEventListener('error', () => {
  setSplash(100, '⚠ Could not load hasc.glb');
  setTimeout(() => splash.classList.add('hidden'), 2000);
  const badge = document.getElementById('infoStatus');
  if (badge) { badge.textContent = 'Not found'; badge.className = 'badge-error'; }
  showToast('hasc.glb not found — make sure it is in the same folder.');
});

// Fake initial splash progress so it doesn't just sit at 0
let fakeP = 0;
const fakeInterval = setInterval(() => {
  fakeP += 6;
  if (fakeP >= 40) { clearInterval(fakeInterval); return; }
  setSplash(fakeP, 'Initializing…');
}, 100);

// ── Environment ──────────────────────────────────────────────────────────────
document.getElementById('envSelect').addEventListener('change', function() {
  mv.environmentImage = this.value;
  if (document.getElementById('skyboxToggle').checked) {
    mv.skyboxImage = this.value;
  }
});

// ── Exposure ─────────────────────────────────────────────────────────────────
document.getElementById('exposureSlider').addEventListener('input', function() {
  mv.exposure = parseFloat(this.value);
  document.getElementById('exposureVal').textContent = parseFloat(this.value).toFixed(2);
});

// ── Shadow ───────────────────────────────────────────────────────────────────
document.getElementById('shadowSlider').addEventListener('input', function() {
  mv.shadowIntensity = parseFloat(this.value);
  document.getElementById('shadowVal').textContent = parseFloat(this.value).toFixed(2);
});

// ── FOV ──────────────────────────────────────────────────────────────────────
document.getElementById('fovSlider').addEventListener('input', function() {
  mv.fieldOfView = this.value + 'deg';
  document.getElementById('fovVal').textContent = this.value + '°';
});

// ── Auto-rotate ──────────────────────────────────────────────────────────────
const rotateSpeedGroup = document.getElementById('rotateSpeedGroup');

document.getElementById('autoRotateToggle').addEventListener('change', function() {
  if (this.checked) {
    mv.setAttribute('auto-rotate', '');
    rotateSpeedGroup.style.opacity = '1';
    rotateSpeedGroup.style.pointerEvents = 'auto';
  } else {
    mv.removeAttribute('auto-rotate');
    rotateSpeedGroup.style.opacity = '0.4';
    rotateSpeedGroup.style.pointerEvents = 'none';
  }
});

document.getElementById('rotateSpeedSlider').addEventListener('input', function() {
  mv.autoRotateDelay = 0;
  // model-viewer uses rotation-per-second via CSS custom property
  mv.style.setProperty('--auto-rotate-speed', (30 / parseInt(this.value)) + 'rad/s');
  document.getElementById('rotateSpeedVal').textContent = this.value + 's';
});

// Init rotate speed group state
rotateSpeedGroup.style.opacity = '0.4';
rotateSpeedGroup.style.pointerEvents = 'none';

// ── Skybox ───────────────────────────────────────────────────────────────────
document.getElementById('skyboxToggle').addEventListener('change', function() {
  if (this.checked) {
    mv.skyboxImage = document.getElementById('envSelect').value;
  } else {
    mv.skyboxImage = null;
  }
});

// ── Grid canvas ──────────────────────────────────────────────────────────────
const gridCanvas = document.getElementById('gridCanvas');
const gctx = gridCanvas.getContext('2d');
let showGrid = true;

function drawGrid() {
  const w = gridCanvas.width = gridCanvas.offsetWidth;
  const h = gridCanvas.height = gridCanvas.offsetHeight;
  gctx.clearRect(0, 0, w, h);
  if (!showGrid) return;

  const step = 40;
  gctx.strokeStyle = '#4f8ef7';
  gctx.lineWidth = 0.5;

  for (let x = 0; x <= w; x += step) {
    gctx.beginPath(); gctx.moveTo(x, 0); gctx.lineTo(x, h); gctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    gctx.beginPath(); gctx.moveTo(0, y); gctx.lineTo(w, y); gctx.stroke();
  }
}

document.getElementById('gridToggle').addEventListener('change', function() {
  showGrid = this.checked;
  drawGrid();
});

window.addEventListener('resize', drawGrid);
drawGrid();

// ── Reset camera ─────────────────────────────────────────────────────────────
function resetCamera() {
  mv.cameraOrbit = 'auto auto auto';
  mv.cameraTarget = 'auto auto auto';
  mv.fieldOfView = 'auto';
  document.getElementById('fovSlider').value = 45;
  document.getElementById('fovVal').textContent = '45°';
}

// ── AR ───────────────────────────────────────────────────────────────────────
function launchAR() {
  if (mv.canActivateAR) {
    mv.activateAR();
  } else {
    showToast('AR is not available on this device or browser.');
  }
}

// ── Fullscreen ───────────────────────────────────────────────────────────────
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => showToast('Fullscreen not available'));
  } else {
    document.exitFullscreen();
  }
}

// ── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}
