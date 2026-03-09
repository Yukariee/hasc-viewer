// ── Three.js setup ──────────────────────────────────────────────────────────
const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7f6f3);
scene.fog = new THREE.Fog(0xf7f6f3, 80, 300);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(20, 15, 30);

// ── Lighting ────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.4);
sunLight.position.set(50, 80, 40);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;
sunLight.shadow.camera.left = -80;
sunLight.shadow.camera.right = 80;
sunLight.shadow.camera.top = 80;
sunLight.shadow.camera.bottom = -80;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0xddeeff, 0.4);
fillLight.position.set(-30, 20, -20);
scene.add(fillLight);

// Ground plane
const groundGeo = new THREE.PlaneGeometry(500, 500);
const groundMat = new THREE.MeshLambertMaterial({ color: 0xeae7e0 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ── Orbit Controls ──────────────────────────────────────────────────────────
let isOrbitMouseDown = false;
let isPanMouseDown = false;
let prevMouseX = 0, prevMouseY = 0;
let spherical = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 50 };
let target = new THREE.Vector3(0, 0, 0);
let autoRotate = false;
let autoRotateSpeed = 0.003;
let idleTimer = null;
let modelLoaded = false;
let currentModel = null;

function updateCamera() {
  const x = target.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
  const y = target.y + spherical.radius * Math.cos(spherical.phi);
  const z = target.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
  camera.position.set(x, y, z);
  camera.lookAt(target);
}

canvas.addEventListener('mousedown', e => {
  if (e.button === 0) isOrbitMouseDown = true;
  if (e.button === 2) isPanMouseDown = true;
  prevMouseX = e.clientX; prevMouseY = e.clientY;
  stopAutoRotate();
  resetIdleTimer();
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('mousemove', e => {
  if (!isOrbitMouseDown && !isPanMouseDown) return;
  const dx = e.clientX - prevMouseX;
  const dy = e.clientY - prevMouseY;
  prevMouseX = e.clientX; prevMouseY = e.clientY;

  if (isOrbitMouseDown) {
    spherical.theta -= dx * 0.006;
    spherical.phi = Math.max(0.08, Math.min(Math.PI * 0.85, spherical.phi - dy * 0.006));
  }
  if (isPanMouseDown) {
    const panSpeed = spherical.radius * 0.001;
    const right = new THREE.Vector3();
    right.crossVectors(camera.getWorldDirection(new THREE.Vector3()), camera.up).normalize();
    target.addScaledVector(right, -dx * panSpeed);
    target.addScaledVector(camera.up, dy * panSpeed);
  }
  updateCamera();
});

window.addEventListener('mouseup', () => { isOrbitMouseDown = false; isPanMouseDown = false; });

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  spherical.radius = Math.max(2, Math.min(300, spherical.radius * (1 + e.deltaY * 0.001)));
  updateCamera();
  stopAutoRotate();
  resetIdleTimer();
}, { passive: false });

// Touch support
let lastTouchDist = 0;
canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
    isOrbitMouseDown = true;
  } else if (e.touches.length === 2) {
    isOrbitMouseDown = false;
    lastTouchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
  stopAutoRotate(); resetIdleTimer();
});
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (e.touches.length === 1 && isOrbitMouseDown) {
    const dx = e.touches[0].clientX - prevMouseX;
    const dy = e.touches[0].clientY - prevMouseY;
    spherical.theta -= dx * 0.006;
    spherical.phi = Math.max(0.08, Math.min(Math.PI * 0.85, spherical.phi - dy * 0.006));
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
    updateCamera();
  } else if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    spherical.radius = Math.max(2, Math.min(300, spherical.radius * (lastTouchDist / dist)));
    lastTouchDist = dist;
    updateCamera();
  }
}, { passive: false });
canvas.addEventListener('touchend', () => { isOrbitMouseDown = false; });

function stopAutoRotate() { autoRotate = false; document.getElementById('autoRotateBtn').classList.remove('rotating'); }
function resetIdleTimer() {
  clearTimeout(idleTimer);
  if (modelLoaded) {
    idleTimer = setTimeout(() => { autoRotate = true; document.getElementById('autoRotateBtn').classList.add('rotating'); }, 8000);
  }
}

// ── Load hasc.glb automatically ─────────────────────────────────────────────
function initGLTFLoader(callback) {
  // Load GLTFLoader first, then DRACOLoader (needed for compressed .glb files)
  const s1 = document.createElement('script');
  s1.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
  s1.onerror = () => {
    showToast('Could not load 3D engine. Check your internet connection.');
    document.getElementById('statusText').textContent = 'Failed to load viewer engine';
  };
  s1.onload = () => {
    const s2 = document.createElement('script');
    s2.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js';
    s2.onerror = () => callback(); // fallback without draco
    s2.onload = callback;
    document.head.appendChild(s2);
  };
  document.head.appendChild(s1);
}

function placeModel(gltf) {
  if (currentModel) scene.remove(currentModel);

  const model = gltf.scene;
  model.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Auto-center and scale to fit nicely
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = 30 / maxDim;

  model.scale.setScalar(scaleFactor);
  model.position.sub(center.multiplyScalar(scaleFactor));
  model.position.y += (size.y * scaleFactor) / 2;

  scene.add(model);
  currentModel = model;
  modelLoaded = true;

  // Fit camera to model
  const scaledBox = new THREE.Box3().setFromObject(model);
  const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
  const scaledSize = scaledBox.getSize(new THREE.Vector3());
  target.copy(scaledCenter);
  spherical.radius = Math.max(scaledSize.x, scaledSize.y, scaledSize.z) * 1.6;
  updateCamera();

  document.getElementById('statusText').textContent = 'HASC Campus — Use mouse to explore';
  resetIdleTimer();
}

function autoLoadModel() {
  updateLoaderProgress(20);
  document.getElementById('loaderPercent').textContent = 'Loading campus model…';

  initGLTFLoader(() => {
    updateLoaderProgress(50);
    const loader = new THREE.GLTFLoader();

    // Attach DRACOLoader if available — required for Roblox compressed exports
    if (THREE.DRACOLoader) {
      const draco = new THREE.DRACOLoader();
      // Use Google's hosted Draco decoder (no extra files needed)
      draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      draco.setDecoderConfig({ type: 'js' });
      loader.setDRACOLoader(draco);
    }

    loader.load(
      'hasc.glb',
      gltf => {
        updateLoaderProgress(95);
        setTimeout(() => {
          placeModel(gltf);
          updateLoaderProgress(100);
          setTimeout(hideLoader, 400);
        }, 100);
      },
      xhr => {
        if (xhr.lengthComputable) {
          const pct = 50 + Math.round((xhr.loaded / xhr.total) * 45);
          updateLoaderProgress(pct);
          document.getElementById('loaderPercent').textContent = `Loading… ${pct}%`;
        }
      },
      err => {
        console.error('Model load error:', err);
        showToast('Could not load hasc.glb — make sure it is in the same folder as this HTML file.');
        document.getElementById('statusText').textContent = 'Model not found — place hasc.glb in the same folder';
        document.getElementById('loaderPercent').textContent = 'hasc.glb not found';
        // Still hide loader after delay
        setTimeout(hideLoader, 2500);
      }
    );
  });
}

// ── Loader UI helpers ────────────────────────────────────────────────────────
function updateLoaderProgress(pct) {
  document.getElementById('loaderBar').style.width = pct + '%';
  if (pct < 100) document.getElementById('loaderPercent').textContent = pct + '%';
}
function hideLoader() {
  document.getElementById('loader').classList.add('hidden');
}

// ── Controls ─────────────────────────────────────────────────────────────────
function toggleAutoRotate() {
  autoRotate = !autoRotate;
  document.getElementById('autoRotateBtn').classList.toggle('rotating', autoRotate);
}

function resetCamera() {
  if (currentModel) {
    const box = new THREE.Box3().setFromObject(currentModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    target.copy(center);
    spherical.radius = Math.max(size.x, size.y, size.z) * 1.6;
    spherical.theta = Math.PI / 4;
    spherical.phi = Math.PI / 3;
  } else {
    spherical = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 50 };
    target.set(0, 0, 0);
  }
  updateCamera();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => showToast('Fullscreen not available'));
    document.getElementById('fullscreenBtn').classList.add('active');
  } else {
    document.exitFullscreen();
    document.getElementById('fullscreenBtn').classList.remove('active');
  }
}
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) document.getElementById('fullscreenBtn').classList.remove('active');
});

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// ── Resize ───────────────────────────────────────────────────────────────────
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

// ── Render loop ───────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  if (autoRotate) { spherical.theta += autoRotateSpeed; updateCamera(); }
  renderer.render(scene, camera);
}

// ── Init ──────────────────────────────────────────────────────────────────────
updateCamera();
animate();
autoLoadModel();