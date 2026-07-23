const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const overlay = document.querySelector("#gameOverlay");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayText = document.querySelector("#overlayText");
const startButton = document.querySelector("#startButton");
const helpButton = document.querySelector("#helpButton");
const soundButton = document.querySelector("#soundButton");

const WIDTH = 945;
const HEIGHT = 600;
const STARTING_LIVES = 5;
const STARTING_SPEED = 300;
const SPEED_STEP = 60;
const CLOWN_SIZE = 64;
const ASSET = "catch_the_clown_assets/";

const background = loadImage(`${ASSET}background.png`);
const clownImage = loadImage(`${ASSET}clown.png`);
const sounds = {
  click: new Audio(`${ASSET}click_sound.wav`),
  miss: new Audio(`${ASSET}miss_sound.wav`),
  music: new Audio(`${ASSET}ctc_background_music.wav`),
};
sounds.music.loop = true;
sounds.music.volume = .38;

const helpTitle = overlayTitle.textContent;
const helpMarkup = overlayText.innerHTML;
let score = 0;
let lives = STARTING_LIVES;
let speed = STARTING_SPEED;
let directionX = randomDirection();
let directionY = randomDirection();
let clownX = WIDTH / 2 - CLOWN_SIZE / 2;
let clownY = HEIGHT / 2 - CLOWN_SIZE / 2;
let running = false;
let hasStarted = false;
let finished = false;
let soundEnabled = true;
let overlayMode = "start";
let lastTime = 0;

function loadImage(source) {
  const image = new Image();
  image.src = source;
  return image;
}

function randomDirection() {
  return Math.random() < .5 ? -1 : 1;
}

function playSound(name) {
  if (!soundEnabled) return;
  const sound = sounds[name];
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function resetGame() {
  score = 0;
  lives = STARTING_LIVES;
  speed = STARTING_SPEED;
  directionX = randomDirection();
  directionY = randomDirection();
  clownX = WIDTH / 2 - CLOWN_SIZE / 2;
  clownY = HEIGHT / 2 - CLOWN_SIZE / 2;
  finished = false;
}

function startGame() {
  resetGame();
  overlay.classList.remove("is-visible");
  startButton.textContent = "Tekrar oyna";
  running = true;
  hasStarted = true;
  overlayMode = "resume";
  lastTime = performance.now();
  if (soundEnabled) sounds.music.play().catch(() => {});
  requestAnimationFrame(loop);
}

function finishGame() {
  running = false;
  hasStarted = false;
  finished = true;
  overlayMode = "restart";
  sounds.music.pause();
  overlayTitle.textContent = `Final skor: ${score}`;
  overlayText.innerHTML =
    "<p>Beş canını kullandın. Daha hızlı ve daha dikkatli bir seri için yeniden başlayabilirsin.</p>";
  startButton.textContent = "Tekrar oyna";
  overlay.classList.add("is-visible");
}

function showHelp() {
  const canResume = hasStarted && !finished;
  running = false;
  sounds.music.pause();
  overlayMode = canResume ? "resume" : "start";
  overlayTitle.textContent = helpTitle;
  overlayText.innerHTML = helpMarkup;
  startButton.textContent = canResume ? "Oyuna dön" : "Oyuna başla";
  overlay.classList.add("is-visible");
}

function handleOverlayAction() {
  if (overlayMode === "resume") {
    overlay.classList.remove("is-visible");
    running = true;
    lastTime = performance.now();
    if (soundEnabled) sounds.music.play().catch(() => {});
    requestAnimationFrame(loop);
    return;
  }
  startGame();
}

function update(deltaTime) {
  clownX += directionX * speed * deltaTime;
  clownY += directionY * speed * deltaTime;

  if (clownX <= 0 || clownX + CLOWN_SIZE >= WIDTH) {
    clownX = Math.max(0, Math.min(WIDTH - CLOWN_SIZE, clownX));
    directionX *= -1;
  }
  if (clownY <= 0 || clownY + CLOWN_SIZE >= HEIGHT) {
    clownY = Math.max(0, Math.min(HEIGHT - CLOWN_SIZE, clownY));
    directionY *= -1;
  }
}

function draw() {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  if (background.complete) context.drawImage(background, 0, 0, WIDTH, HEIGHT);
  else {
    context.fillStyle = "#071726";
    context.fillRect(0, 0, WIDTH, HEIGHT);
  }

  context.textBaseline = "top";
  context.font = "42px Franxurter, Impact, sans-serif";
  context.fillStyle = "#01afd1";
  context.fillText("Catch the Clown", 42, 18);
  context.textAlign = "right";
  context.fillStyle = "#f8e71c";
  context.fillText(`Score: ${score}`, WIDTH - 42, 18);
  context.fillText(`Lives: ${lives}`, WIDTH - 42, 62);
  context.textAlign = "left";

  if (clownImage.complete) {
    context.drawImage(clownImage, clownX, clownY, CLOWN_SIZE, CLOWN_SIZE);
  }
}

function loop(now) {
  if (!running) return;
  const deltaTime = Math.min((now - lastTime) / 1000, .034);
  lastTime = now;
  update(deltaTime);
  draw();
  if (running) requestAnimationFrame(loop);
}

function pointFromEvent(event) {
  const rectangle = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rectangle.left) / rectangle.width) * WIDTH,
    y: ((event.clientY - rectangle.top) / rectangle.height) * HEIGHT,
  };
}

canvas.addEventListener("pointerdown", (event) => {
  if (!running) return;
  event.preventDefault();
  const point = pointFromEvent(event);
  const hit =
    point.x >= clownX &&
    point.x <= clownX + CLOWN_SIZE &&
    point.y >= clownY &&
    point.y <= clownY + CLOWN_SIZE;

  if (hit) {
    playSound("click");
    score += 1;
    speed += SPEED_STEP;
    const previousX = directionX;
    const previousY = directionY;
    while (previousX === directionX && previousY === directionY) {
      directionX = randomDirection();
      directionY = randomDirection();
    }
  } else {
    playSound("miss");
    lives -= 1;
    if (lives <= 0) finishGame();
  }
  draw();
});

startButton.addEventListener("click", handleOverlayAction);
helpButton.addEventListener("click", showHelp);
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "Ses açık" : "Ses kapalı";
  soundButton.setAttribute("aria-pressed", String(soundEnabled));
  Object.values(sounds).forEach((sound) => {
    sound.muted = !soundEnabled;
  });
  if (soundEnabled && running) sounds.music.play().catch(() => {});
  else sounds.music.pause();
});

window.addEventListener("blur", () => {
  if (running) showHelp();
});

Promise.allSettled([
  document.fonts?.ready,
  background.decode?.(),
  clownImage.decode?.(),
]).finally(draw);
