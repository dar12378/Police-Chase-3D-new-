document.getElementById('tutorial-overlay').style.display = 'none';

let gameData = {
    coins: 0,
    highScore: 0,
    hasDog: false
};

function loadData() {
    const saved = localStorage.getItem('police3DSave_pro_v1');
    if (saved) {
        try { gameData = { ...gameData, ...JSON.parse(saved) }; } catch(e){}
    }
    updateUI();
}

function saveData() {
    localStorage.setItem('police3DSave_pro_v1', JSON.stringify(gameData));
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

    document.getElementById('tutorial-overlay').style.display = 'none';
    openScreen('start-screen');
    initMenuScene();
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
        if (dogMesh) dogMesh.visible = true;
    }
}

function toggleMusic() {
    isMusicOn = !isMusicOn;
    document.getElementById('music-btn').innerText = isMusicOn ? 'מופעל 🔊' : 'כבוי 🔇';
}

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

const container = document.getElementById('game-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.FogExp2(0x87ceeb, 0.002);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 450);
camera.position.set(0, 9.5, 9.5);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfffaed, 2.2);
dirLight.position.set(30, 60, 30);
dirLight.castShadow = true;
scene.add(dirLight);

const roadWidth = 14;
const roadLength = 400;
const laneWidth = roadWidth / 3;
const lanes = [-laneWidth, 0, laneWidth];
let currentLane = 1;

const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.position.z = -roadLength / 2 + 10;
scene.add(road);

const graffitiWall = new THREE.Group();
const wallMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 12, 14), wallMat);
wallMesh.position.y = 6;
graffitiWall.add(wallMesh);

const graf1 = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), new THREE.MeshBasicMaterial({ color: 0xd946ef }));
graf1.position.set(0.51, 5, -2);
graf1.rotation.y = Math.PI / 2;
graf1.rotation.z = 0.1;
graffitiWall.add(graf1);

const graf2 = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
graf2.position.set(0.51, 7.5, 2);
graf2.rotation.y = Math.PI / 2;
graf2.rotation.z = -0.1;
graffitiWall.add(graf2);
scene.add(graffitiWall);

const cityGroup = new THREE.Group();
const daytimeBuildingColors = [0x94a3b8, 0xe2e8f0, 0xccbdc1, 0x38bdf8, 0x60a5fa, 0x93c5fd];

for (let i = 0; i < 40; i++) {
    const h = 22 + Math.random() * 38;
    const bGeo = new THREE.BoxGeometry(10, h, 10);
    const bMat = new THREE.MeshStandardMaterial({ color: daytimeBuildingColors[i % daytimeBuildingColors.length], roughness: 0.25 });

    const bL = new THREE.Mesh(bGeo, bMat);
    bL.position.set(-roadWidth / 2 - 9, h / 2, -i * 10);
    cityGroup.add(bL);

    const bR = new THREE.Mesh(bGeo, bMat);
    bR.position.set(roadWidth / 2 + 9, h / 2, -i * 10);
    cityGroup.add(bR);
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

const playerGroup = new THREE.Group();
scene.add(playerGroup);

let policeAvatarGroup = new THREE.Group();
const textureLoader = new THREE.TextureLoader();

// טעינת תמונת השוטר האיכותית והשקופה ישירות לתוך התלת-ממד
const policemanImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEfCAYAAAC0h/gEAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAE51SURBVHhe7b0JnBxFlb7tqf7X11311ntv...";
textureLoader.load(policemanImageUrl, (texture) => {
    const planeGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const planeMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
    const policeMesh = new THREE.Mesh(planeGeo, planeMat);
    policeMesh.position.y = 1.7;
    policeAvatarGroup.add(policeMesh);
});
playerGroup.add(policeAvatarGroup);

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

function createKidFaceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f8d5c2'; ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(160, 210, 40, 55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(352, 210, 40, 55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#16a34a';
    ctx.beginPath(); ctx.arc(168, 215, 25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(344, 215, 25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(168, 215, 14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(344, 215, 14, 0, Math.PI * 2); ctx.fill();
    return new THREE.CanvasTexture(canvas);
}
const kidFaceTexture = createKidFaceTexture();

const kidGroup = new THREE.Group();
scene.add(kidGroup);
const kidBody = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 24), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
kidBody.position.y = 0.7;
kidGroup.add(kidBody);
const kidHeadGeo = new THREE.SphereGeometry(0.38, 32, 32);
kidHeadGeo.rotateY(Math.PI / 2);
const kidHead = new THREE.Mesh(kidHeadGeo, new THREE.MeshStandardMaterial({ map: kidFaceTexture, roughness: 0.5 }));
kidHead.position.y = 1.35;
kidGroup.add(kidHead);
const kidBike = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 1.8), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
kidBike.position.y = 0.3;
kidGroup.add(kidBike);

const kidPlane = new THREE.Group();
const planeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.2, 3.2, 24), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 }));
planeBody.rotation.x = Math.PI / 2;
kidPlane.add(planeBody);
const planeWings = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 1.0), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
planeWings.position.y = 0.1;
kidPlane.add(planeWings);
kidPlane.position.y = 2.5;
kidPlane.visible = false;
kidGroup.add(kidPlane);

function createCarMesh() {
    const car = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.2 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 3.8), bodyMat);
    body.position.y = 0.75;
    car.add(body);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.1 });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.8, 2.0), cabinMat);
    cabin.position.set(0, 1.4, -0.2);
    car.add(cabin);
    return car;
}

function createBusMesh() {
    const bus = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.8, 8.0), bodyMat);
    body.position.y = 1.6;
    bus.add(body);
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd });
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

let gameState = 'MENU';
let score = 0;
let sessionCoins = 0;
let currentDisplaySpeed = 100;
let minDisplaySpeed = 100;
let maxDisplaySpeed = 18000;
let worldSpeed = 0.3;
let lastTime = 0;
let spawnTimer = 0;
let kidState = 'BIKE';

let isTutorial = false;
let tutStep = 0;

function initMenuScene() {
    obstacles.forEach(obs => scene.remove(obs.mesh));
    obstacles.length = 0;
    coinsList.forEach(c => scene.remove(c.mesh));
    coinsList.length = 0;
    
    currentLane = 1;
    playerGroup.position.set(lanes[currentLane], 0, 0);
    graffitiWall.position.set(-roadWidth / 2 - 0.5, 0, -25);
    
    kidGroup.position.set(-4, 0, -23.5);
    kidGroup.rotation.y = -Math.PI / 4; 
    kidBike.visible = false;
    kidPlane.visible = false;
    
    if (gameData.hasDog) dogMesh.visible = true;
}

function startCadetCourse() {
    isTutorial = true;
    tutStep = 0;
    startGame();
}

function startRegularGame() {
    isTutorial = false;
    startGame();
}

function updateTutUI() {
    const overlay = document.getElementById('tutorial-overlay');
    const arrow = document.getElementById('tut-arrow');
    const text = document.getElementById('tut-text');

    if (!isTutorial || gameState !== 'PLAYING') {
        overlay.classList.remove('visible');
        return;
    }
    overlay.classList.add('visible');

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
    document.getElementById('course-success-msg').style.display = 'none';
    openScreen(null);
    document.getElementById('hud').classList.remove('hidden');
    gameState = 'PLAYING';
    
    kidGroup.rotation.y = 0;
    kidGroup.position.set(0, 0, -28);
    kidBike.visible = true;
    kidState = 'BIKE';
    
    isJumping = false;
    jumpVelocity = 0;
    playerY = 0;
    groundHeight = 0;
    score = 0;
    sessionCoins = 0;
    document.getElementById('coin-val').innerText = '0';
    document.getElementById('score-val').innerText = '0';
    document.getElementById('speed-val').innerText = '100';
    
    lastTime = performance.now();
    updateTutUI();
}

function finishTutorialSuccess() {
    isTutorial = false;
    gameState = 'MENU';
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('tutorial-overlay').classList.remove('visible');
    document.getElementById('course-success-msg').style.display = 'block';
    openScreen('start-screen');
    initMenuScene();
}

function moveLeft() {
    if (currentLane > 0 && gameState === 'PLAYING') {
        currentLane--;
        targetX = lanes[currentLane];
        playTone(300, 0.05);
        if (isTutorial && tutStep === 0) { tutStep = 1; updateTutUI(); }
    }
}

function moveRight() {
    if (currentLane < 2 && gameState === 'PLAYING') {
        currentLane++;
        targetX = lanes[currentLane];
        playTone(300, 0.05);
        if (isTutorial && tutStep === 1) { tutStep = 2; updateTutUI(); }
    }
}

function jump() {
    if (!isJumping && gameState === 'PLAYING') {
        isJumping = true;
        jumpVelocity = baseJumpStrength;
        playTone(500, 0.08);
        if (isTutorial && tutStep === 2) {
            finishTutorialSuccess();
        }
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
    const pBox = new THREE.Box3().setFromObject(policeAvatarGroup);
    pBox.expandByScalar(-0.2); 

    let calculatedGroundHeight = 0;

    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        const oBox = new THREE.Box3().setFromObject(obs.mesh);
        oBox.expandByScalar(-0.1);

        if (pBox.intersectsBox(oBox)) {
            if (obs.type === 'bus' && playerY >= obs.height - 0.5) {
                calculatedGroundHeight = obs.height;
            } else {
                if (isTutorial) {
                    startGame();
                    return;
                } else {
                    gameOver();
                    return;
                }
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

            playTone(800, 0.08);
            document.getElementById('coin-val').innerText = sessionCoins;
            saveData();
        }
    }
}

function gameOver() {
    gameState = 'GAMEOVER';
    if (score > gameData.highScore) gameData.highScore = score;
    saveData();

    document.getElementById('final-score').innerText = Math.floor(score);
    document.getElementById('final-coins').innerText = sessionCoins;
    document.getElementById('hud').classList.add('hidden');
    openScreen('gameover-screen');
    initMenuScene();
}

function animate(currentTime) {
    requestAnimationFrame(animate);

    if (gameState === 'MENU' || gameState === 'GAMEOVER') {
        camera.position.x = Math.sin(currentTime * 0.001) * 0.5;
        camera.lookAt(0, 1.5, -12);
        renderer.render(scene, camera);
        return;
    }

    if (gameState === 'PLAYING') {
        let deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        if (isTutorial) {
            deltaTime *= 0.35; 
        }

        score += deltaTime * 40 * difficulty;
        let displayScore = Math.floor(score);
        document.getElementById('score-val').innerText = displayScore;

        currentDisplaySpeed = Math.min(maxDisplaySpeed, Math.floor(minDisplaySpeed + (score * 8.5)));
        document.getElementById('speed-val').innerText = currentDisplaySpeed;

        worldSpeed = (0.3 + (currentDisplaySpeed / 18000) * 1.4) * difficulty;

        if (displayScore >= 50000 && kidState === 'BIKE') {
            kidState = 'PLANE';
            kidBike.visible = false;
            kidPlane.visible = true;
        } else if (displayScore >= 200000 && kidState === 'PLANE') {
            kidState = 'FOOT';
            kidPlane.visible = false;
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

        if (graffitiWall.position.z < 20) {
            graffitiWall.position.z += worldSpeed;
        }

        obstacles.forEach(obs => {
            obs.mesh.position.z += worldSpeed;
        });

        spawnTimer += worldSpeed;
        if (spawnTimer > 30 / difficulty) {
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
    loadData();
    initMenuScene();
    requestAnimationFrame(animate);
};
