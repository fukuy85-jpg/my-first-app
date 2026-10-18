const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#game-overlay");
const overlayMessage = document.querySelector("#overlay-message");
const restartButton = document.querySelector("#restart-button");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const WORLD_WIDTH = 2500;
const GRAVITY = 1800;
const MOVE_SPEED = 300;
const JUMP_SPEED = 690;

const platforms = [
  { x: 0, y: 455, width: 650, height: 120 },
  { x: 760, y: 455, width: 570, height: 120 },
  { x: 1450, y: 455, width: 650, height: 120 },
  { x: 2190, y: 455, width: 310, height: 120 },
  { x: 570, y: 360, width: 120, height: 18 },
  { x: 1030, y: 350, width: 130, height: 18 },
  { x: 1240, y: 300, width: 120, height: 18 },
  { x: 1620, y: 360, width: 130, height: 18 },
  { x: 1870, y: 320, width: 130, height: 18 },
];

const spikes = [
  { x: 430, y: 423, width: 54, height: 32 },
  { x: 900, y: 423, width: 54, height: 32 },
  { x: 1740, y: 423, width: 54, height: 32 },
];

const input = { left: false, right: false, jump: false };
const player = { x: 72, y: 380, width: 34, height: 46, vx: 0, vy: 0, grounded: false };
let cameraX = 0;
let gameState = "playing";
let lastTime = 0;
let jumpWasDown = false;

function resetGame() {
  player.x = 72;
  player.y = 380;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
  cameraX = 0;
  gameState = "playing";
  overlay.hidden = true;
  jumpWasDown = false;
  for (const key of Object.keys(input)) input[key] = false;
}

function finishGame(state) {
  gameState = state;
  overlayMessage.textContent = state === "won" ? "ゴール！やったね！" : "おっと、落ちちゃった！";
  overlay.hidden = false;
}

function isOverlapping(a, b) {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

function update(delta) {
  if (gameState !== "playing") return;

  player.vx = (Number(input.right) - Number(input.left)) * MOVE_SPEED;
  player.x += player.vx * delta;
  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x));

  for (const platform of platforms) {
    if (isOverlapping(player, platform)) {
      if (player.vx > 0) player.x = platform.x - player.width;
      if (player.vx < 0) player.x = platform.x + platform.width;
    }
  }

  if (input.jump && !jumpWasDown && player.grounded) {
    player.vy = -JUMP_SPEED;
    player.grounded = false;
  }
  jumpWasDown = input.jump;
  player.vy += GRAVITY * delta;
  const previousBottom = player.y + player.height;
  player.y += player.vy * delta;
  player.grounded = false;

  for (const platform of platforms) {
    if (!isOverlapping(player, platform)) continue;
    if (player.vy >= 0 && previousBottom <= platform.y + 2) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.grounded = true;
    } else if (player.vy < 0) {
      player.y = platform.y + platform.height;
      player.vy = 0;
    }
  }

  if (spikes.some((spike) => isOverlapping(player, spike))) {
    resetGame();
    return;
  }
  if (player.y > HEIGHT + 100) {
    finishGame("fell");
    return;
  }
  if (player.x + player.width >= 2380) finishGame("won");

  cameraX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, player.x - WIDTH * 0.36));
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#83d7ed");
  sky.addColorStop(1, "#e4f6d5");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  for (const cloud of [{ x: 120, y: 100 }, { x: 490, y: 155 }, { x: 850, y: 85 }, { x: 1210, y: 130 }]) {
    const x = ((cloud.x - cameraX * 0.2) % (WIDTH + 180) + WIDTH + 180) % (WIDTH + 180) - 80;
    ctx.beginPath();
    ctx.arc(x, cloud.y, 24, 0, Math.PI * 2);
    ctx.arc(x + 28, cloud.y - 10, 30, 0, Math.PI * 2);
    ctx.arc(x + 60, cloud.y, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#9acb9a";
  for (let i = 0; i < 7; i++) {
    const x = i * 210 - (cameraX * 0.35 % 210);
    ctx.beginPath();
    ctx.ellipse(x + 100, 462, 150, 145, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  }
}

function drawWorld() {
  ctx.save();
  ctx.translate(-cameraX, 0);

  for (const platform of platforms) {
    ctx.fillStyle = "#8b5a3c";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    ctx.fillStyle = "#50a35a";
    ctx.fillRect(platform.x, platform.y, platform.width, 12);
    ctx.fillStyle = "#70c66a";
    for (let x = platform.x + 14; x < platform.x + platform.width; x += 42) {
      ctx.fillRect(x, platform.y + 16, 16, 5);
    }
  }

  for (const spike of spikes) {
    ctx.fillStyle = "#e65353";
    ctx.beginPath();
    ctx.moveTo(spike.x, spike.y + spike.height);
    ctx.lineTo(spike.x + spike.width / 2, spike.y);
    ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#34495e";
  ctx.fillRect(2390, 320, 8, 135);
  ctx.fillStyle = "#ffca4b";
  ctx.beginPath();
  ctx.moveTo(2398, 322);
  ctx.lineTo(2450, 341);
  ctx.lineTo(2398, 360);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f29e4c";
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = "#fff7e6";
  ctx.fillRect(player.x + 20, player.y + 10, 7, 7);
  ctx.fillStyle = "#243447";
  ctx.fillRect(player.x + 23, player.y + 12, 3, 4);
  ctx.restore();
}

function render() {
  drawBackground();
  drawWorld();
}

function gameLoop(timestamp) {
  const delta = Math.min((timestamp - lastTime) / 1000 || 0, 1 / 30);
  lastTime = timestamp;
  update(delta);
  render();
  requestAnimationFrame(gameLoop);
}

const keyMap = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "jump",
  Space: "jump",
  KeyW: "jump",
};

window.addEventListener("keydown", (event) => {
  const control = keyMap[event.code];
  if (!control) return;
  event.preventDefault();
  input[control] = true;
});

window.addEventListener("keyup", (event) => {
  const control = keyMap[event.code];
  if (control) input[control] = false;
});

window.addEventListener("blur", () => {
  for (const key of Object.keys(input)) input[key] = false;
});

document.querySelectorAll("[data-control]").forEach((button) => {
  const control = button.dataset.control;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    input[control] = true;
    button.setPointerCapture(event.pointerId);
  });
  const release = () => { input[control] = false; };
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

restartButton.addEventListener("click", resetGame);
requestAnimationFrame(gameLoop);
