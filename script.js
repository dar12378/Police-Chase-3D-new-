let activeUsername = 'אורח';
let playerAge = 10;
let difficultyMultiplier = 1.0;

let audioCtx = null;
let musicInterval = null;
let isMusicOn = true;
let isSfxOn = true;

// 🔊 מנוע מוזיקה פנימי (Web Audio Synth) ללא תקיעות או קבצים חסרים
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSynthNote(freq, duration, type = 'sine') {
    if (!isMusicOn || !audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

function playCoinSound() {
    if (!isSfxOn) return;
    initAudio();
    playSynthNote(987.77, 0.1, 'triangle'); // B5
}

function startBackgroundMusic() {
    initAudio();
    if (musicInterval) clearInterval(musicInterval);
    const notes = [220, 261.63, 293.66, 329.63, 392.00, 329.63, 293.66, 261.63];
    let step = 0;
    musicInterval = setInterval(() => {
        if (gameState === 'PLAYING' && isMusicOn) {
            playSynthNote(notes[step % notes.length], 0.2, 'sawtooth');
            step++;
        }
    }, 250);
}

window.toggleFullScreen = function() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {});
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
};

window.confirmAgeAndStart = function() {
    const ageVal = parseInt(document.getElementById('age-input').value) || 10;
    playerAge = ageVal;
    
    // 🎯 חישוב קושי לפי גיל
    if (playerAge <= 6) {
        difficultyMultiplier = 0.7; // קל לילדים קטנים
        document.getElementById('difficulty-badge').innerText = 'קל מאוד (גיל ' + playerAge + ')';
    } else if (playerAge <= 12) {
        difficultyMultiplier = 1.0; // רגיל
        document.getElementById('difficulty-badge').innerText = 'בינוני (גיל ' + playerAge + ')';
    } else {
        difficultyMultiplier = 1.35; // מאתגר
        document.getElementById('difficulty-badge').innerText = 'קשה (גיל ' + playerAge + ')';
    }

    document.getElementById('age-modal').classList.remove('active');
    document.getElementById('start-screen').classList.add('active');
};

window.toggleMusicSetting = function() {
    isMusicOn = !isMusicOn;
    document.getElementById('music-toggle-btn').innerText = isMusicOn ? 'מופעל 🔊' : 'כבוי 🔇';
};

window.toggleSfxSetting = function() {
    isSfxOn = !isSfxOn;
    document.getElementById('sfx-toggle-btn').innerText = isSfxOn ? 'מופעל 🔔' : 'כבוי 🔕';
};

window.updateNameFromDirectInput = function() {
    const inputEl = document.getElementById('direct-user-input');
    if (inputEl) {
        const newName = inputEl.value.trim();
        if (newName.length > 0) {
            activeUsername = newName;
            saveGameData();
        }
    }
};

function showEventToast(text) {
    const toast = document.getElementById('game-event-toast');
    if (toast) {
        toast.innerText = text;
        toast.style.display = 'flex';
        toast.style.opacity = '1';
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => { toast.style.display = 'none'; }, 300);
        }, 2800);
    }
}

let gameData = {
    coins: 0,
    highScore: 0,
    totalCoinsEarned: 0,
    gamesPlayed: 0,
    hasDog: false,
    hasGlasses: false,
    shirtColor: 'blue',
    upgrades: { speed: 1, jump: 1, magnet: 0, multiplier: 1 }
};

function saveGameData() {
    localStorage.setItem('policeChaseSaveData_v13', JSON.stringify(gameData));
    updateUI();
}

function loadGameData() {
    const saved = localStorage.getItem('policeChaseSaveData_v13');
    if (saved) {
        try { gameData = { ...gameData, ...JSON.parse(saved) }; } catch(e) {}
    }
    updateUI();
}

function updateUI() {
    document.getElementById('home-coins').innerText = gameData.coins;
    document.getElementById('shop-coins').innerText = gameData.coins;
    document.getElementById('home-high-score').innerText = Math.floor(gameData.highScore);
    document.getElementById('rec-high-score').innerText = Math.floor(gameData.highScore);
    document.getElementById('rec-total-coins').innerText = gameData.totalCoinsEarned;
    document.getElementById('rec-games-played').innerText = gameData.gamesPlayed;

    // כפתור כלב
    const dogBtn = document.getElementById('buy-dog-btn');
    if (dogBtn) {
        if (gameData.hasDog) {
            dogBtn.innerText = 'בבעלותך 🐶';
            dogBtn.disabled = true;
        } else {
            dogBtn.innerText = 'קנה כלב (500 🪙)';
            dogBtn.disabled = gameData.coins < 500;
        }
    }

    // משקפיים
    const glassesBtn = document.getElementById('buy-glasses-btn');
    if (glassesBtn) {
        if (gameData.hasGlasses) {
            glassesBtn.innerText = 'מופעל 🕶️';
        } else {
            glassesBtn.innerText = 'קנה משקפיים (200 🪙)';
        }
    }

    updateShopItem('speed', 100);
    updateShopItem('jump', 150);
    updateShopItem('multiplier', 250);
}

function updateShopItem(type, baseCost) {
    const lvl = gameData.upgrades[type];
    const cost = baseCost * lvl;
    const lvlText = document.getElementById(`${type}-lvl-text`);
    const btn = document.getElementById(`buy-${type}-btn`);

    if (lvlText && btn) {
        if (lvl >= 5) {
            lvlText.innerText = 'רמה: מקסימום (5)';
            btn.innerText = 'מקס';
            btn.disabled = true;
        } else {
            lvlText.innerText = `רמה: ${lvl} / 5`;
            btn.innerText = `שדרג (${cost} 🪙)`;
            btn.disabled = gameData.coins < cost;
        }
    }
}

window.buyDogCompanion = function() {
    if (!gameData.hasDog && gameData.coins >= 500) {
        gameData.coins -= 500;
        gameData.hasDog = true;
        saveGameData();
        if (dogMesh) dogMesh.visible = true;
    }
};

window.changeOutfit = function(color) {
    if (gameData.coins >= 150 || gameData.shirtColor === color) {
        if (gameData.shirtColor !== color) gameData.coins -= 150;
        gameData.shirtColor = color;
        saveGameData();
        updatePlayerMaterials();
    }
};

window.toggleGlasses = function() {
    if (!gameData.hasGlasses && gameData.coins >= 200) {
        gameData.coins -= 200;
        gameData.hasGlasses = true;
        saveGameData();
        if (glassesMesh) glassesMesh.visible = true;
    }
};

window.buyUpgrade = function(type) {
    const costs = { speed: 100, jump: 150, magnet: 200, multiplier: 250 };
    const lvl = gameData.upgrades[type];
    const cost = costs[type] * lvl;

    if (lvl < 5 && gameData.coins >= cost) {
        gameData.coins -= cost;
        gameData.upgrades[type]++;
        saveGameData();
    }
};

let gameState = 'START';
let score = 0;
let sessionCoins = 0;

let currentDisplaySpeed = 200;
let minDisplaySpeed = 200;
let maxDisplaySpeed = 20000;

let worldSpeed = 0.6;
let lastTime = 0;
let spawnTimer = 0;
let kidState = 'BIKE'; // 'BIKE', 'PLANE' (50,000+), 'FOOT' (200,000+)

const container = document.getElementById('game-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1128); // עיר לילה נקייה
scene.fog = new THREE.FogExp2(0x0a1128, 0.0045);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, 9.5, 9.5);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.6);
dirLight.position.set(-25, 45, 25);
dirLight.castShadow = true;
scene.add(dirLight);

const roadWidth = 14;
const roadLength = 400;
const laneWidth = roadWidth / 3;
const lanes = [-laneWidth, 0, laneWidth];
let currentLane = 1;

// 🛣️ כביש ומדרכות
const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.position.z = -roadLength / 2 + 10;
road.receiveShadow = true;
scene.add(road);

// 🏙️ בנייני עיר משודרגים ונקיים בצדדים (ללא שלטים מציקים!)
const cityGroup = new THREE.Group();
const buildingColors = [0x0f172a, 0x1e3a8a, 0x1e293b, 0x334155, 0x0284c7, 0x475569];

for (let i = 0; i < 40; i++) {
    const h = 18 + Math.random() * 30;
    const bGeo = new THREE.BoxGeometry(10, h, 10);
    const bMat = new THREE.MeshStandardMaterial({ color: buildingColors[i % buildingColors.length], roughness: 0.3 });

    // בניין שמאל
    const bL = new THREE.Mesh(bGeo, bMat);
    bL.position.set(-roadWidth / 2 - 9, h / 2, -i * 10);
    cityGroup.add(bL);

    // בניין ימין
    const bR = new THREE.Mesh(bGeo, bMat);
    bR.position.set(roadWidth / 2 + 9, h / 2, -i * 10);
    cityGroup.add(bR);

    // חלונות מוארים מודרניים
    if (i % 2 === 0) {
        const winMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
        const winL = new THREE.Mesh(new THREE.BoxGeometry(0.1, h * 0.7, 7.5), winMat);
        winL.position.set(-roadWidth / 2 - 3.9, h / 2, -i * 10);
        cityGroup.add(winL);

        const winR = new THREE.Mesh(new THREE.BoxGeometry(0.1, h * 0.7, 7.5), winMat);
        winR.position.set(roadWidth / 2 + 3.9, h / 2, -i * 10);
        cityGroup.add(winR);
    }
}
scene.add(cityGroup);

const lineGroup = new THREE.Group();
const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
for (let i = 0; i < 40; i++) {
    const lineGeom = new THREE.PlaneGeometry(0.25, 4);
    const lineL = new THREE.Mesh(lineGeom, lineMat);
    lineL.rotation.x = -Math.PI / 2;
    lineL.position.set(-laneWidth / 2, 0.02, -i * 10);
    lineGroup.add(lineL);

    const lineR = new THREE.Mesh(lineGeom, lineMat);
    lineR.rotation.x = -Math.PI / 2;
    lineR.position.set(laneWidth / 2, 0.02, -i * 10);
    lineGroup.add(lineR);
}
scene.add(lineGroup);

// 👮‍♂️ דמות השוטר (עם צבע גוף טבעי משודרג + בגדים משתנים + משקפיים)
const playerGroup = new THREE.Group();
scene.add(playerGroup);

const policeAvatarGroup = new THREE.Group();
policeAvatarGroup.rotation.y = Math.PI;

// 🎨 צבע גוף טבעי וריאליסטי כפי שביקשת!
const skinMat = new THREE.MeshStandardMaterial({ color: 0xf8d5c2, roughness: 0.5 });
const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 });
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 });

const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.55, 1.4, 24), shirtMat);
bodyMesh.position.y = 1.1;
policeAvatarGroup.add(bodyMesh);

const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 24), skinMat);
headMesh.position.y = 2.1;
policeAvatarGroup.add(headMesh);

const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.48, 0.25, 24), shirtMat);
hatTop.position.y = 2.45;
policeAvatarGroup.add(hatTop);

// משקפי שמש קניות
const glassesGeo = new THREE.BoxGeometry(0.5, 0.12, 0.15);
const glassesMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
const glassesMesh = new THREE.Mesh(glassesGeo, glassesMat);
glassesMesh.position.set(0, 2.15, 0.4);
glassesMesh.visible = false;
policeAvatarGroup.add(glassesMesh);

playerGroup.add(policeAvatarGroup);

function updatePlayerMaterials() {
    const c = gameData.shirtColor === 'red' ? 0xef4444 : 0x2563eb;
    shirtMat.color.setHex(c);
    hatTop.material.color.setHex(c);
}

// 🐶 כלב משטרתי K9 שרץ איתך כל המשחק!
const dogMesh = new THREE.Group();
const dogBody = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.9), new THREE.MeshStandardMaterial({ color: 0x78350f }));
dogBody.position.y = 0.35;
dogMesh.add(dogBody);
const dogHead = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.4), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
dogHead.position.set(0, 0.6, 0.35);
dogMesh.add(dogHead);
dogMesh.position.set(1.2, 0, 0);
dogMesh.visible = false;
playerGroup.add(dogMesh);

// 👶 דמות הילד השובב + אופנוע + מטוס מטורף ב-50,000!
const kidGroup = new THREE.Group();
scene.add(kidGroup);

const kidBody = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 20), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
kidBody.position.y = 0.7;
kidGroup.add(kidBody);

const kidHead = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 20), skinMat);
kidHead.position.y = 1.35;
kidGroup.add(kidHead);

const kidBike = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 1.8), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
kidBike.position.y = 0.3;
kidGroup.add(kidBike);

// ✈️ מטוס סילון מטורף ב-50,000 נקודות!
const kidPlane = new THREE.Group();
const planeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.2, 3.2, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 }));
planeBody.rotation.x = Math.PI / 2;
kidPlane.add(planeBody);
const planeWings = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 1.0), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
planeWings.position.y = 0.1;
kidPlane.add(planeWings);
kidPlane.position.y = 2.5;
kidPlane.visible = false;
kidGroup.add(kidPlane);

kidGroup.position.set(0, 0, -30);

function createCarMesh() {
    const car = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.2 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 3.8), bodyMat);
    body.position.y = 0.75;
    body.castShadow = true;
    car.add(body);

    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1 });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.8, 2.0), cabinMat);
    cabin.position.set(0, 1.4, -0.2);
    car.add(cabin);

    return car;
}

function createBusMesh() {
    const bus = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.8, 8.0), bodyMat);
    body.position.y = 1.6;
    body.castShadow = true;
    bus.add(body);

    const windowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const windows = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.8, 7.0), windowMat);
    windows.position.y = 2.0;
    bus.add(windows);

    return bus;
}

let targetX = lanes[currentLane];
let isJumping = false;
let jumpVelocity = 0;
let playerY = 0;
let gravity = -0.016;
let baseJumpStrength = 0.35;
let groundHeight = 0;

const obstacles = [];
const coinsList = [];

function spawnObstaclePattern() {
    const lane = Math.floor(Math.random() * 3);
    const r = Math.random();

    if (r < 0.5) {
        const mesh = createCarMesh();
        mesh.position.set(lanes[lane], 0, -150);
        scene.add(mesh);
        obstacles.push({ mesh, type: 'car', lane, height: 1.4 });
    } else {
        const mesh = createBusMesh();
        mesh.position.set(lanes[lane], 0, -150);
        scene.add(mesh);
        obstacles.push({ mesh, type: 'bus', lane, height: 2.8 });
    }
}

const coinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 16);
coinGeo.rotateX(Math.PI / 2);
const coinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9 });

function spawnCoinLine(lane, startZ, count = 5) {
    for (let i = 0; i < count; i++) {
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.position.set(lanes[lane], 1.0, startZ + (i * 2.2));
        scene.add(coin);
        coinsList.push({ mesh: coin });
    }
}

function moveLeft() {
    if (currentLane > 0 && gameState === 'PLAYING') {
        currentLane--;
        targetX = lanes[currentLane];
    }
}

function moveRight() {
    if (currentLane < 2 && gameState === 'PLAYING') {
        currentLane++;
        targetX = lanes[currentLane];
    }
}

function jump() {
    if (!isJumping && gameState === 'PLAYING') {
        isJumping = true;
        jumpVelocity = baseJumpStrength;
    }
}

window.addEventListener('keydown', (e) => {
    if (gameState !== 'PLAYING') return;
    switch(e.key) {
        case 'ArrowLeft': case 'a': case 'A': moveLeft(); break;
        case 'ArrowRight': case 'd': case 'D': moveRight(); break;
        case 'ArrowUp': case 'w': case 'W': case ' ': jump(); break;
    }
});

function checkCollisions() {
    const pBox = new THREE.Box3().setFromObject(playerGroup);
    pBox.expandByScalar(-0.25);

    let calculatedGroundHeight = 0;

    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        const oBox = new THREE.Box3().setFromObject(obs.mesh);

        if (pBox.intersectsBox(oBox)) {
            if (obs.type === 'bus' && playerY >= obs.height - 0.4) {
                calculatedGroundHeight = obs.height;
            } else {
                gameOver();
                return;
            }
        }
    }

    groundHeight = calculatedGroundHeight;

    for (let i = coinsList.length - 1; i >= 0; i--) {
        const coinMesh = coinsList[i].mesh;
        const cBox = new THREE.Box3().setFromObject(coinMesh);
        if (pBox.intersectsBox(cBox)) {
            scene.remove(coinMesh);
            coinsList.splice(i, 1);

            sessionCoins += 1;
            gameData.coins += 1;
            gameData.totalCoinsEarned += 1;

            playCoinSound();
            document.getElementById('coin-display').innerText = sessionCoins;
            saveGameData();
        }
    }
}

window.showScreen = function(screenId) {
    document.querySelectorAll('.screen, .hud').forEach(el => el.classList.remove('active'));
    if (screenId) document.getElementById(screenId).classList.add('active');
};

window.showStartScreen = function() {
    resetGameEnvironment();
    window.showScreen('start-screen');
    gameState = 'START';
    
    camera.position.set(0, 9.5, 9.5);
    camera.lookAt(0, 1.0, -12);
};

window.startGameDirectly = function() {
    resetGameEnvironment();
    gameState = 'PLAYING';
    gameData.gamesPlayed++;
    saveGameData();

    currentDisplaySpeed = minDisplaySpeed;
    worldSpeed = 0.6 * difficultyMultiplier;

    startBackgroundMusic();
    window.showScreen('hud');
    lastTime = performance.now();
};

function gameOver() {
    gameState = 'GAMEOVER';
    if (score > gameData.highScore) gameData.highScore = score;
    saveGameData();

    document.getElementById('final-time').innerText = Math.floor(score);
    document.getElementById('final-coins').innerText = sessionCoins;
    document.getElementById('high-score-end').innerText = Math.floor(gameData.highScore);
    window.showScreen('game-over-screen');
}

function resetGameEnvironment() {
    obstacles.forEach(obs => scene.remove(obs.mesh));
    obstacles.length = 0;
    coinsList.forEach(c => scene.remove(c.mesh));
    coinsList.length = 0;

    currentLane = 1;
    targetX = lanes[currentLane];
    playerGroup.position.set(targetX, 0, 0);
    isJumping = false;
    jumpVelocity = 0;
    playerY = 0;
    groundHeight = 0;

    kidState = 'BIKE';
    kidBike.visible = true;
    kidPlane.visible = false;
    kidGroup.position.set(0, 0, -30);

    if (gameData.hasDog) dogMesh.visible = true;
    if (gameData.hasGlasses) glassesMesh.visible = true;
    updatePlayerMaterials();

    score = 0;
    sessionCoins = 0;
    document.getElementById('coin-display').innerText = '0';
    document.getElementById('time-display').innerText = '0';
    document.getElementById('speed-display').innerText = '200';
}

window.resetGame = function() {
    resetGameEnvironment();
    window.startGameDirectly();
};

function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'PLAYING') {
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        score += deltaTime * 100 * difficultyMultiplier;
        let displayScore = Math.floor(score);
        document.getElementById('time-display').innerText = displayScore;

        // 🏎️ מהירות מ-200 ל-20,000 עם התאמת קושי
        currentDisplaySpeed = Math.min(maxDisplaySpeed, Math.floor(minDisplaySpeed + (score * 19.8)));
        document.getElementById('speed-display').innerText = currentDisplaySpeed;

        worldSpeed = (0.6 + (currentDisplaySpeed / 20000) * 1.3) * difficultyMultiplier;

        // ✈️ 50,000 מטוס! ⛽ 200,000 ריצה ברגל!
        if (displayScore >= 50000 && kidState === 'BIKE') {
            kidState = 'PLANE';
            kidBike.visible = false;
            kidPlane.visible = true;
            showEventToast("✈️ הילד המריא על מטוס סילון מטורף ב-50,000!");
        } else if (displayScore >= 200000 && kidState === 'PLANE') {
            kidState = 'FOOT';
            kidPlane.visible = false;
            showEventToast("⛽ נגמר הדלק ב-200,000! הילד עבר לרוץ ברגל!");
        }

        playerGroup.position.x += (targetX - playerGroup.position.x) * 0.22;
        
        camera.position.x = playerGroup.position.x * 0.45;
        camera.position.y = 9.5 + (playerY * 0.5);
        camera.position.z = 9.5;
        camera.lookAt(playerGroup.position.x * 0.25, 1.2 + (playerY * 0.35), -12);

        if (isJumping || playerY > groundHeight) {
            playerY += jumpVelocity;
            jumpVelocity += gravity;

            if (playerY <= groundHeight) {
                playerY = groundHeight;
                isJumping = false;
                jumpVelocity = 0;
            }
        } else {
            playerY = groundHeight;
        }
        playerGroup.position.y = playerY;

        kidGroup.position.z = -28 + Math.sin(currentTime * 0.003) * 3;

        obstacles.forEach(obs => {
            obs.mesh.position.z += worldSpeed;
        });

        spawnTimer += worldSpeed;
        if (spawnTimer > 22 / difficultyMultiplier) {
            spawnObstaclePattern();
            if (Math.random() < 0.5) {
                spawnCoinLine(Math.floor(Math.random() * 3), -150, 5);
            }
            spawnTimer = 0;
        }

        lineGroup.position.z += worldSpeed;
        if (lineGroup.position.z > 10) lineGroup.position.z -= 10;

        cityGroup.position.z += worldSpeed;
        if (cityGroup.position.z > 20) cityGroup.position.z -= 20;

        for (let i = obstacles.length - 1; i >= 0; i--) {
            if (obstacles[i].mesh.position.z > 15) {
                scene.remove(obstacles[i].mesh);
                obstacles.splice(i, 1);
            }
        }

        for (let i = coinsList.length - 1; i >= 0; i--) {
            coinsList[i].mesh.position.z += worldSpeed;
            coinsList[i].mesh.rotation.y += 0.08;
            if (coinsList[i].mesh.position.z > 15) {
                scene.remove(coinsList[i].mesh);
                coinsList.splice(i, 1);
            }
        }

        checkCollisions();
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.onload = function() {
    loadGameData();
    animate();
};
