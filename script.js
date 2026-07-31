const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// נתוני שחקן ושמירה
let gameData = {
    coins: 0,
    highScore: 0,
    hasDog: false,
    shirtColor: 'blue'
};

function loadData() {
    const saved = localStorage.getItem('policeCanvasSave');
    if (saved) {
        try { gameData = { ...gameData, ...JSON.parse(saved) }; } catch(e){}
    }
    updateUI();
}

function saveData() {
    localStorage.setItem('policeCanvasSave', JSON.stringify(gameData));
    updateUI();
}

function updateUI() {
    document.getElementById('total-coins-val').innerText = gameData.coins;
    document.getElementById('shop-coins-val').innerText = gameData.coins;
    document.getElementById('high-score-val').innerText = Math.floor(gameData.highScore);
    
    const dogBtn = document.getElementById('buy-dog-btn');
    if (dogBtn) {
        if (gameData.hasDog) {
            dogBtn.innerText = 'בבעלותך 🐶';
            dogBtn.disabled = true;
        } else {
            dogBtn.innerText = 'קנה (10,000 🪙)';
            dogBtn.disabled = false;
        }
    }
}

let age = 10;
let difficulty = 1.0;
let isMusicOn = true;

function confirmAge() {
    age = parseInt(document.getElementById('age-input').value) || 10;
    if (age <= 5) difficulty = 0.6;
    else if (age <= 9) difficulty = 0.85;
    else if (age <= 14) difficulty = 1.1;
    else difficulty = 1.45;

    // הסרת המדריך במידה והיה פתוח ברקע
    document.getElementById('tutorial-overlay').classList.add('hidden');
    openScreen('start-screen');
}

function openScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    if (id) document.getElementById(id).classList.remove('hidden');
}

function buyDog() {
    if (!gameData.hasDog && gameData.coins >= 10000) {
        gameData.coins -= 10000;
        gameData.hasDog = true;
        saveData();
    }
}

function setShirt(color) {
    if (gameData.coins >= 150) {
        gameData.coins -= 150;
        gameData.shirtColor = color;
        saveData();
    }
}

function toggleMusic() {
    isMusicOn = !isMusicOn;
    document.getElementById('music-btn').innerText = isMusicOn ? 'מופעל 🔊' : 'כבוי 🔇';
}

// סאונד מבוסס Web Audio
let audioCtx = null;
function playTone(freq, duration) {
    if (!isMusicOn) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e){}
}

// משתני מנוע משחק
let gameState = 'MENU';
let lane = 1; // 0, 1, 2
let playerY = 0;
let isJumping = false;
let jumpVel = 0;
let score = 0;
let sessionCoins = 0;
let currentSpeed = 200;
let obstacles = [];
let coinsList = [];
let spawnTimer = 0;

let isTutorial = false;
let tutStep = 0; // 0: Left, 1: Right, 2: Jump

function startCadetCourse() {
    isTutorial = true;
    tutStep = 0;
    updateTutUI();
    startGame();
}

function startRegularGame() {
    isTutorial = false;
    document.getElementById('tutorial-overlay').classList.add('hidden');
    startGame();
}

function updateTutUI() {
    const overlay = document.getElementById('tutorial-overlay');
    const arrow = document.getElementById('tut-arrow');
    const text = document.getElementById('tut-text');

    if (!isTutorial) {
        overlay.classList.add('hidden');
        return;
    }
    overlay.classList.remove('hidden');

    if (tutStep === 0) {
        arrow.innerText = '⬅️';
        text.innerText = 'שלב 1: לחץ חץ שמאלה (◄) או A לזוז שמאלה!';
    } else if (tutStep === 1) {
        arrow.innerText = '➡️';
        text.innerText = 'שלב 2: לחץ חץ ימינה (►) או D לזוז ימינה!';
    } else if (tutStep === 2) {
        arrow.innerText = '⬆️';
        text.innerText = 'שלב 3: לחץ חץ למעלה (▲) או רווח לקפוץ!';
    }
}

function startGame() {
    openScreen(null);
    document.getElementById('hud').classList.remove('hidden');
    gameState = 'PLAYING';
    score = 0;
    sessionCoins = 0;
    lane = 1;
    playerY = 0;
    isJumping = false;
    obstacles = [];
    coinsList = [];
    currentSpeed = 200;
}

function finishTutorialSuccess() {
    isTutorial = false;
    gameState = 'MENU';
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('tutorial-overlay').classList.add('hidden');
    document.getElementById('course-success-msg').classList.remove('hidden');
    openScreen('start-screen');
}

// מקשים
window.addEventListener('keydown', e => {
    if (gameState !== 'PLAYING') return;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (lane > 0) {
            lane--;
            playTone(300, 0.05);
            if (isTutorial && tutStep === 0) { tutStep = 1; updateTutUI(); }
        }
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (lane < 2) {
            lane++;
            playTone(300, 0.05);
            if (isTutorial && tutStep === 1) { tutStep = 2; updateTutUI(); }
        }
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        if (!isJumping) {
            isJumping = true;
            jumpVel = 12;
            playTone(500, 0.08);
            if (isTutorial && tutStep === 2) {
                // סיום קורס מתלמד בהצלחה!
                finishTutorialSuccess();
            }
        }
    }
});

// הלולאה הראשית של המשחק
let lastTime = performance.now();

function gameLoop(now) {
    let dt = (now - lastTime) / 1000;
    lastTime = now;

    // סלואו מושן בזמן קורס מתלמד
    if (isTutorial) {
        dt *= 0.35;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. ציור שמים
    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let horizonY = canvas.height * 0.35;
    let centerX = canvas.width / 2;

    // 2. ציור בניינים
    ctx.fillStyle = '#1e293b';
    for(let i=0; i<6; i++) {
        let h = 120 + i * 30;
        ctx.fillRect(centerX - 250 - i*80, horizonY - h, 70, h + canvas.height);
        ctx.fillRect(centerX + 180 + i*80, horizonY - h, 70, h + canvas.height);
    }

    // 3. ציור כביש
    let roadBottomWidth = canvas.width * 0.75;
    let roadTopWidth = 80;

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(centerX - roadTopWidth/2, horizonY);
    ctx.lineTo(centerX + roadTopWidth/2, horizonY);
    ctx.lineTo(centerX + roadBottomWidth/2, canvas.height);
    ctx.lineTo(centerX - roadBottomWidth/2, canvas.height);
    ctx.closePath();
    ctx.fill();

    // פסי הפרדה צהובים
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    for(let i=1; i<3; i++) {
        let topX = centerX - roadTopWidth/2 + (roadTopWidth/3)*i;
        let botX = centerX - roadBottomWidth/2 + (roadBottomWidth/3)*i;
        ctx.beginPath();
        ctx.moveTo(topX, horizonY);
        ctx.lineTo(botX, canvas.height);
        ctx.stroke();
    }

    if (gameState === 'PLAYING') {
        score += dt * 100 * difficulty;
        currentSpeed = Math.min(20000, Math.floor(200 + score * 15));

        document.getElementById('score-val').innerText = Math.floor(score);
        document.getElementById('speed-val').innerText = currentSpeed;
        document.getElementById('coin-val').innerText = sessionCoins;

        // קפיצה
        if (isJumping) {
            playerY += jumpVel;
            jumpVel -= 0.6;
            if (playerY <= 0) {
                playerY = 0;
                isJumping = false;
            }
        }

        // יצירת מכשולים ומטבעות
        spawnTimer += dt * difficulty;
        if (spawnTimer > 1.2) {
            let l = Math.floor(Math.random() * 3);
            if (Math.random() < 0.6) {
                obstacles.push({ lane: l, z: 1.0, type: Math.random() < 0.5 ? 'car' : 'bus' });
            } else {
                coinsList.push({ lane: l, z: 1.0 });
            }
            spawnTimer = 0;
        }

        let speedFactor = (0.2 + (currentSpeed / 20000) * 0.5) * dt;

        // מכשולים
        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.z -= speedFactor;

            let obsY = horizonY + (canvas.height - horizonY) * (1 - obs.z);
            let scale = 1 - obs.z;
            let laneX = centerX + (-1 + obs.lane) * (roadBottomWidth/3) * scale;
            let size = 40 * scale + 15;

            ctx.fillStyle = obs.type === 'car' ? '#e11d48' : '#f97316';
            ctx.fillRect(laneX - size/2, obsY - size, size, size);

            // התנגשות
            if (obs.z < 0.15 && obs.z > 0.01 && obs.lane === lane && playerY < 20) {
                if (isTutorial) {
                    startGame();
                    return;
                } else {
                    gameState = 'GAMEOVER';
                    if (score > gameData.highScore) gameData.highScore = score;
                    saveData();

                    document.getElementById('final-score').innerText = Math.floor(score);
                    document.getElementById('final-coins').innerText = sessionCoins;
                    document.getElementById('hud').classList.add('hidden');
                    openScreen('gameover-screen');
                }
            }

            if (obs.z <= 0) obstacles.splice(i, 1);
        }

        // מטבעות
        for (let i = coinsList.length - 1; i >= 0; i--) {
            let coin = coinsList[i];
            coin.z -= speedFactor;

            let coinY = horizonY + (canvas.height - horizonY) * (1 - coin.z);
            let scale = 1 - coin.z;
            let laneX = centerX + (-1 + coin.lane) * (roadBottomWidth/3) * scale;
            let size = 15 * scale + 8;

            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(laneX, coinY - size, size, 0, Math.PI*2);
            ctx.fill();

            if (coin.z < 0.15 && coin.z > 0.01 && coin.lane === lane) {
                sessionCoins++;
                gameData.coins++;
                playTone(800, 0.08);
                coinsList.splice(i, 1);
                saveData();
            } else if (coin.z <= 0) {
                coinsList.splice(i, 1);
            }
        }

        // הילד מקדימה
        let kidY = horizonY + (canvas.height - horizonY) * 0.35;
        ctx.fillStyle = score >= 50000 ? '#f59e0b' : '#ef4444';
        ctx.beginPath();
        ctx.arc(centerX, kidY - 20, 14, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(centerX - 5, kidY - 23, 3, 3);
        ctx.fillRect(centerX + 2, kidY - 23, 3, 3);

        // השוטר
        let playerX = centerX + (-1 + lane) * (roadBottomWidth/3) * 0.85;
        let drawY = canvas.height - 80 - playerY;

        ctx.fillStyle = gameData.shirtColor === 'red' ? '#ef4444' : '#2563eb';
        ctx.fillRect(playerX - 20, drawY - 40, 40, 45);

        ctx.fillStyle = '#f8d5c2';
        ctx.beginPath();
        ctx.arc(playerX, drawY - 55, 18, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(playerX - 7, drawY - 58, 4, 4);
        ctx.fillRect(playerX + 3, drawY - 58, 4, 4);

        ctx.fillStyle = gameData.shirtColor === 'red' ? '#ef4444' : '#1e3a8a';
        ctx.fillRect(playerX - 18, drawY - 73, 36, 10);

        if (gameData.hasDog) {
            ctx.fillStyle = '#78350f';
            ctx.fillRect(playerX + 30, drawY - 25, 20, 20);
        }
    }

    requestAnimationFrame(gameLoop);
}

loadData();
requestAnimationFrame(gameLoop);
