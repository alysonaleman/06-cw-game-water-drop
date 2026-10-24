// Variables to control game state
let gameRunning = false;
let dropMaker;
let score = 0;
let timeLeft = 20;
let targetScore = 15;
let dropIntervalSpeed = 800;
let countdownTimer;

// Audio LevelUp Support (Web Audio API sound synthesis)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'collect') {
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } else if (type === 'penalty') {
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
}

// Milestone LevelUp Support
const milestones = [
  { score: 5, message: "Great start! Clean water is flowing! 💧" },
  { score: 10, message: "Halfway there! Keep collecting! 🌟" },
  { score: 15, message: "Amazing! Target score reached! 🎉" }
];

function checkMilestones(currentScore) {
  const milestone = milestones.find(m => m.score === currentScore);
  if (milestone) {
    const banner = document.getElementById('milestone-banner');
    banner.textContent = milestone.message;
    banner.classList.remove('hidden');
    setTimeout(() => {
      banner.classList.add('hidden');
    }, 2500);
  }
}

// Messages
const winMessages = [
  "Amazing job! You brought clean water closer to reality! 💧",
  "Fantastic work! Every drop counts towards a better future! 🌟",
  "You crushed it! Clean water for everyone is within reach! 🎉"
];

const loseMessages = [
  "Good effort! Let's try again and catch even more drops! 💪",
  "Not quite the target, but practice makes progress! Give it another shot! 💧",
  "So close! Try again to make an even bigger splash! 🌊"
];

// Apply difficulty rules
function applyDifficultySettings() {
  const difficulty = document.getElementById("difficulty").value;
  if (difficulty === "easy") {
    timeLeft = 30;
    targetScore = 10;
    dropIntervalSpeed = 1000;
  } else if (difficulty === "normal") {
    timeLeft = 20;
    targetScore = 15;
    dropIntervalSpeed = 800;
  } else if (difficulty === "hard") {
    timeLeft = 15;
    targetScore = 20;
    dropIntervalSpeed = 550;
  }
  document.getElementById("time").textContent = timeLeft;
  document.getElementById("target-score").textContent = targetScore;
}

// Event Listener for Start / Reset Button
document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("difficulty").addEventListener("change", () => {
  if (!gameRunning) {
    applyDifficultySettings();
  }
});

function startGame() {
  // Reset any running loops if clicking Reset mid-game
  clearInterval(dropMaker);
  clearInterval(countdownTimer);

  gameRunning = true;
  score = 0;
  applyDifficultySettings();

  // Update UI Displays
  document.getElementById("score").textContent = score;
  
  // Change button text to indicate active reset capability
  const startBtn = document.getElementById("start-btn");
  startBtn.textContent = "Reset Game";

  // Clear container screen & banner
  const container = document.getElementById("game-container");
  container.innerHTML = "";
  document.getElementById("milestone-banner").classList.add("hidden");

  // Drop creation loop
  dropMaker = setInterval(createDrop, dropIntervalSpeed);

  // Timer loop
  countdownTimer = setInterval(() => {
    timeLeft--;
    document.getElementById("time").textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function createDrop() {
  if (!gameRunning) return;

  const drop = document.createElement("div");
  
  // 25% chance to generate a "Dirty Water" bad drop
  const isBadDrop = Math.random() < 0.25;
  drop.className = isBadDrop ? "water-drop bad-drop" : "water-drop";

  // Size calculation
  const initialSize = 55;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = `${size}px`;
  drop.style.height = `${size}px`;

  // Position within game container
  const gameContainer = document.getElementById("game-container");
  const gameWidth = gameContainer.offsetWidth;
  const xPosition = Math.random() * (gameWidth - size);
  drop.style.left = `${xPosition}px`;

  drop.style.animationDuration = "3.5s";

  // Click / Tap listener (DOM element removal on interaction)
  drop.addEventListener("mousedown", () => {
    if (!gameRunning) return;

    if (isBadDrop) {
      score = Math.max(0, score - 2); // Deduct 2 points for bad drop
      playSound('penalty');
    } else {
      score++; // Add 1 point for good drop
      playSound('collect');
    }

    document.getElementById("score").textContent = score;
    checkMilestones(score);
    drop.remove();
  });

  gameContainer.appendChild(drop);

  // Clean up drops reaching bottom
  drop.addEventListener("animationend", () => {
    drop.remove();
  });
}

function endGame() {
  gameRunning = false;
  clearInterval(dropMaker);
  clearInterval(countdownTimer);

  document.getElementById("game-container").innerHTML = "";
  document.getElementById("milestone-banner").classList.add("hidden");
  
  const startBtn = document.getElementById("start-btn");
  startBtn.textContent = "Play Again";

  const isWin = score >= targetScore;
  let finalMessage = "";

  if (isWin) {
    const randomIndex = Math.floor(Math.random() * winMessages.length);
    finalMessage = winMessages[randomIndex];
    triggerConfetti();
  } else {
    const randomIndex = Math.floor(Math.random() * loseMessages.length);
    finalMessage = loseMessages[randomIndex];
  }

  const container = document.getElementById("game-container");
  container.innerHTML = `
    <div class="game-over-screen">
      <h2>${isWin ? "🎉 Victory!" : "Game Over!"}</h2>
      <p>Your Final Score: <strong>${score}</strong> (Target: ${targetScore})</p>
      <p class="end-message">${finalMessage}</p>
    </div>
  `;
}

function triggerConfetti() {
  const container = document.getElementById("game-container");
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = Math.random() * 100 + "%";
    confetti.style.backgroundColor = ["#FFC200", "#4facfe", "#2ed573", "#ff4757"][
      Math.floor(Math.random() * 4)
    ];
    confetti.style.animationDelay = Math.random() * 2 + "s";
    container.appendChild(confetti);
  }
}