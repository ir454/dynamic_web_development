import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const socket = io();

// === Setup Three.js ===
const container = document.getElementById("window");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  container.offsetWidth / container.offsetHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(container.offsetWidth, container.offsetHeight);
container.appendChild(renderer.domElement);

// Floor
const floorSize = 20;
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(floorSize, floorSize),
  new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Cubes
const cubeColors = [0xff00ff, 0x00ffff, 0xffff00, 0xff5500];
const cubes = [];
for (let i = 0; i < 4; i++) {
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial({ color: cubeColors[i] })
  );
  cube.position.set(-5 + i * 3, 1, 0);
  scene.add(cube);
  cubes.push(cube);
}

// Receive positions from server
socket.on("positions", (positions) => {
  positions.forEach((p, i) => {
    cubes[i].position.set(p.x, 1, p.z);
  });
});

// Movement
const keys = {};
document.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
document.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

function updateMovement() {
  const speed = 0.1;
  const forward = new THREE.Vector3(-Math.sin(camera.rotation.y), 0, -Math.cos(camera.rotation.y));
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));

  if (keys["w"]) camera.position.addScaledVector(forward, speed);
  if (keys["s"]) camera.position.addScaledVector(forward, -speed);
  if (keys["a"]) camera.position.addScaledVector(right, -speed);
  if (keys["d"]) camera.position.addScaledVector(right, speed);

  if (keys["arrowleft"]) camera.rotation.y += 0.02;
  if (keys["arrowright"]) camera.rotation.y -= 0.02;
  if (keys["arrowup"]) camera.rotation.x += 0.02;
  if (keys["arrowdown"]) camera.rotation.x -= 0.02;
}

// Move cubes with keys 1-4
document.addEventListener("keydown", (e) => {
  const key = parseInt(e.key);
  if (key >= 1 && key <= 4) {
    const cube = cubes[key - 1];
    cube.position.set(camera.position.x, 1, camera.position.z);
    socket.emit("update", { index: key - 1, x: cube.position.x, z: cube.position.z });
  }
});

// Mini-map setup
const miniMap = document.getElementById("miniMap");
const ctx = miniMap.getContext("2d");
const dpi = window.devicePixelRatio || 1;
miniMap.width = miniMap.clientWidth * dpi;
miniMap.height = miniMap.clientHeight * dpi;
ctx.scale(dpi, dpi);

let selectedCube = null;
function miniToWorld(mx, my) {
  const worldX = (mx / miniMap.clientWidth) * floorSize - floorSize / 2;
  const worldZ = (my / miniMap.clientHeight) * floorSize - floorSize / 2;
  return { worldX, worldZ };
}

function startDrag(e) {
  e.preventDefault();
  const rect = miniMap.getBoundingClientRect();
  const mx = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left);
  const my = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top);

  selectedCube = null;
  for (let i = 0; i < cubes.length; i++) {
    const c = cubes[i];
    const cx = ((c.position.x + floorSize / 2) / floorSize) * miniMap.clientWidth;
    const cy = ((c.position.z + floorSize / 2) / floorSize) * miniMap.clientHeight;
    if ((mx - cx) ** 2 + (my - cy) ** 2 < 100) { selectedCube = c; return; }
  }
}

function dragMove(e) {
  if (!selectedCube) return;
  const rect = miniMap.getBoundingClientRect();
  const mx = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left);
  const my = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top);
  const { worldX, worldZ } = miniToWorld(mx, my);
  selectedCube.position.set(worldX, 1, worldZ);
  const idx = cubes.indexOf(selectedCube);
  socket.emit("update", { index: idx, x: worldX, z: worldZ });
}

function endDrag() { selectedCube = null; }

miniMap.addEventListener("mousedown", startDrag);
miniMap.addEventListener("mousemove", dragMove);
miniMap.addEventListener("mouseup", endDrag);
miniMap.addEventListener("mouseleave", endDrag);
miniMap.addEventListener("touchstart", startDrag);
miniMap.addEventListener("touchmove", dragMove);
miniMap.addEventListener("touchend", endDrag);

// Reset button
document.getElementById("resetButton").addEventListener("click", () => {
  socket.emit("reset");
});

// Draw mini-map
function drawMiniMap() {
  ctx.clearRect(0, 0, miniMap.clientWidth, miniMap.clientHeight);

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, miniMap.clientWidth, miniMap.clientHeight);

  cubes.forEach((c) => {
    const x = ((c.position.x + floorSize / 2) / floorSize) * miniMap.clientWidth;
    const y = ((c.position.z + floorSize / 2) / floorSize) * miniMap.clientHeight;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = `#${c.material.color.getHexString()}`;
    ctx.fill();
  });

  const camX = ((camera.position.x + floorSize / 2) / floorSize) * miniMap.clientWidth;
  const camY = ((camera.position.z + floorSize / 2) / floorSize) * miniMap.clientHeight;
  ctx.beginPath();
  ctx.arc(camX, camY, 8, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
}

function animate() {
  requestAnimationFrame(animate);
  updateMovement();
  drawMiniMap();
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  miniMap.width = miniMap.clientWidth * dpi;
  miniMap.height = miniMap.clientHeight * dpi;
  ctx.scale(dpi, dpi);
});
