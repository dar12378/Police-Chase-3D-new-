let activeUsername = 'אורח';

window.toggleFullScreen = function() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {});
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
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
    upgrades: { speed: 1, jump: 1, magnet: 0, multiplier: 1 }
};

function saveGameData() {
    localStorage.setItem('policeChaseSaveData_v12', JSON.stringify(gameData));
    updateUI();
}

function loadGameData() {
    const saved = localStorage.getItem('policeChaseSaveData_v12');
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

    updateShopItem('speed', 100);
    updateShopItem('jump', 150);
    updateShopItem('magnet', 200);
    updateShopItem('multiplier', 250);
}

function updateShopItem(type, baseCost) {
    const lvl = gameData.upgrades[type];
    const cost = baseCost * lvl;
    const lvlText = document.getElementById(`${type}-lvl-text`);
    const btn = document.getElementById(`buy-${type}-btn`);

    if (lvl >= 5) {
        lvlText.innerText = 'רמה: מקסימום (5)';
        btn.innerText = 'מקס';
        btn.disabled = true;
        btn.style.opacity = '0.5';
    } else {
        lvlText.innerText = `רמה: ${lvl} / 5`;
        btn.innerText = `שדרג (${cost} 🪙)`;
        btn.disabled = gameData.coins < cost;
        btn.style.opacity = gameData.coins < cost ? '0.5' : '1';
    }
}

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

// 🏎️ מנוע המהירות: מ-200 עד 20,000!
let currentDisplaySpeed = 200;
let minDisplaySpeed = 200;
let maxDisplaySpeed = 20000;

let worldSpeed = 0.6; // מהירות התנועה בעולם
let lastTime = 0;
let spawnTimer = 0;
let kidState = 'BIKE';

const container = document.getElementById('game-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1128); // שמים ליליים עמוקים
scene.fog = new THREE.FogExp2(0x0a1128, 0.005);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, 9.5, 9.5);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.5);
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

// 🏙️ בניית עיר תלת-ממדית בצדדים
const cityGroup = new THREE.Group();
const buildingColors = [0x0f172a, 0x1e3a8a, 0x1e293b, 0x334155, 0x0284c7];

for (let i = 0; i < 40; i++) {
    const h = 16 + Math.random() * 25;
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

    // חלונות מוארים מנצנצים בעיר
    if (i % 2 === 0) {
        const winMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
        const winL = new THREE.Mesh(new THREE.BoxGeometry(0.1, h * 0.7, 8), winMat);
        winL.position.set(-roadWidth / 2 - 3.9, h / 2, -i * 10);
        cityGroup.add(winL);

        const winR = new THREE.Mesh(new THREE.BoxGeometry(0.1, h * 0.7, 8), winMat);
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

// 🚘 מודל מכונית מפורט
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

// 🚌 מודל אוטובוס
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

// 👮‍♂️ דמות השוטר ברזולוציה גבוהה
const playerGroup = new THREE.Group();
scene.add(playerGroup);

const policeAvatarGroup = new THREE.Group();
policeAvatarGroup.rotation.y = Math.PI;

const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 }); 
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 }); 
const skinMat = new THREE.MeshStandardMaterial({ color: 0xf8b88b, roughness: 0.5 }); 

const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.55, 1.4, 24), shirtMat);
bodyMesh.position.y = 1.1;
policeAvatarGroup.add(bodyMesh);

const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 24), skinMat);
headMesh.position.y = 2.1;
policeAvatarGroup.add(headMesh);

const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.48, 0.25, 24), shirtMat);
hatTop.position.y = 2.45;
policeAvatarGroup.add(hatTop);

playerGroup.add(policeAvatarGroup);

// 👶 דמות הילד השובב
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

kidGroup.position.set(0, 0, -30);

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
    worldSpeed = 0.6;

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
    kidGroup.position.set(0, 0, -30);

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

        score += deltaTime * 100;
        let displayScore = Math.floor(score);
        document.getElementById('time-display').innerText = displayScore;

        // 🏎️ עליית מהירות מ-200 עד 20,000!
        currentDisplaySpeed = Math.min(maxDisplaySpeed, Math.floor(minDisplaySpeed + (score * 19.8)));
        document.getElementById('speed-display').innerText = currentDisplaySpeed;

        worldSpeed = 0.6 + (currentDisplaySpeed / 20000) * 1.3;

        if (displayScore >= 275 && kidState === 'BIKE') {
            kidState = 'FOOT';
            kidBike.visible = false;
            showEventToast("⛽ נגמר הדלק לילד! הילד עבר לרוץ ברגל!");
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
        if (spawnTimer > 22) {
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
