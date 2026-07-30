import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
    localStorage.setItem('policeChaseSaveData_v11', JSON.stringify(gameData));
    updateUI();
}

function loadGameData() {
    const saved = localStorage.getItem('policeChaseSaveData_v11');
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
    
    const nameInput = document.getElementById('direct-user-input');
    if (nameInput && document.activeElement !== nameInput) nameInput.value = activeUsername;

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
const WIN_SCORE = 100000;
let gameSpeed = 0.55;
let maxGameSpeed = 1.85;
let lastTime = 0;
let spawnTimer = 0;
let kidState = 'BIKE';

const container = document.getElementById('game-container');
const scene = new THREE.Scene();

// 💡 שקיפות קנבס מלאה כדי שרקע ניו יורק לא ייחסם לעולם!
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setClearColor(0x000000, 0); // שקוף לחלוטין
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 4));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
container.appendChild(renderer.domElement);

// 🎥 מצלמת Subway Surfers זווית עליונה
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 350);
camera.position.set(0, 9.5, 9.5);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.65);
dirLight.position.set(-25, 45, 25);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 4096;
dirLight.shadow.mapSize.height = 4096;
scene.add(dirLight);

const roadWidth = 14;
const roadLength = 350;
const laneWidth = roadWidth / 3;
const lanes = [-laneWidth, 0, laneWidth];
let currentLane = 1;

const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.position.z = -roadLength / 2 + 10;
road.receiveShadow = true;
scene.add(road);

// 🛍️ בניינים, חנויות ושלטי ניאון בצדדי המסלול
const envGroup = new THREE.Group();
const bColors = [0x1e3a8a, 0x0f172a, 0x334155, 0x475569, 0x1e293b];
const neonColors = [0xef4444, 0x38bdf8, 0xfacc15, 0xa855f7, 0x22c55e];

for (let i = 0; i < 32; i++) {
    const h = 14 + Math.random() * 20;
    const bGeo = new THREE.BoxGeometry(8, h, 9);
    const bMat = new THREE.MeshStandardMaterial({ color: bColors[i % bColors.length], roughness: 0.4 });
    
    // בניין שמאלי
    const bL = new THREE.Mesh(bGeo, bMat);
    bL.position.set(-roadWidth / 2 - 8.5, h / 2, -i * 11);
    bL.castShadow = true;
    envGroup.add(bL);

    // חנות
    const shopFrontL = new THREE.Mesh(
        new THREE.BoxGeometry(8.1, 3.2, 8.8),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8 })
    );
    shopFrontL.position.set(-roadWidth / 2 - 8.5, 1.6, -i * 11);
    envGroup.add(shopFrontL);

    // גגון צבעוני
    const awningL = new THREE.Mesh(
        new THREE.BoxGeometry(8.5, 0.4, 1.8),
        new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xef4444 : 0xfacc15 })
    );
    awningL.position.set(-roadWidth / 2 - 4.8, 3.3, -i * 11);
    awningL.rotation.z = -0.15;
    envGroup.add(awningL);

    // בניין ימני
    const bR = new THREE.Mesh(bGeo, bMat);
    bR.position.set(roadWidth / 2 + 8.5, h / 2, -i * 11);
    bR.castShadow = true;
    envGroup.add(bR);

    const shopFrontR = shopFrontL.clone();
    shopFrontR.position.x = roadWidth / 2 + 8.5;
    envGroup.add(shopFrontR);

    const awningR = awningL.clone();
    awningR.position.x = roadWidth / 2 + 4.8;
    awningR.rotation.z = 0.15;
    envGroup.add(awningR);

    // שלט ניאון
    if (i % 3 === 0) {
        const neonMat = new THREE.MeshBasicMaterial({ color: neonColors[i % neonColors.length] });
        const signL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 4.5), neonMat);
        signL.position.set(-roadWidth / 2 - 4.2, 5.5, -i * 11);
        envGroup.add(signL);

        const signR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 4.5), neonMat);
        signR.position.set(roadWidth / 2 + 4.2, 5.5, -i * 11);
        envGroup.add(signR);
    }
}
scene.add(envGroup);

const lineGroup = new THREE.Group();
const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
for (let i = 0; i < 35; i++) {
    const lineGeom = new THREE.PlaneGeometry(0.2, 4);
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

// 🎨 טקסטורת פנים של השוטר
function createPoliceFaceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8b88b'; ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = 'rgba(244, 114, 182, 0.4)';
    ctx.beginPath(); ctx.arc(130, 290, 48, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(382, 290, 48, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(160, 215, 42, 58, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(352, 215, 42, 58, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#2563eb';
    ctx.beginPath(); ctx.arc(165, 220, 26, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(347, 220, 26, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(165, 220, 15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(347, 220, 15, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(155, 208, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(337, 208, 9, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#331800'; ctx.lineWidth = 14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(160, 145, 48, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.beginPath(); ctx.arc(352, 145, 48, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();

    ctx.fillStyle = '#e0a078';
    ctx.beginPath(); ctx.arc(256, 265, 20, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#881337'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.arc(256, 305, 65, Math.PI * 0.12, Math.PI * 0.88); ctx.stroke();

    return new THREE.CanvasTexture(canvas);
}

// 🎨 טקסטורת פנים של הילד
function createKidFaceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8b88b'; ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.beginPath(); ctx.arc(140, 295, 45, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(372, 295, 45, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(160, 210, 40, 55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(352, 210, 40, 55, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#16a34a'; // עיניים ירוקות
    ctx.beginPath(); ctx.arc(168, 215, 25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(344, 215, 25, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(168, 215, 14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(344, 215, 14, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(158, 202, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(334, 202, 8, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#451a03'; ctx.lineWidth = 14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(110, 160); ctx.lineTo(210, 140); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(302, 140); ctx.lineTo(402, 160); ctx.stroke();

    ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.arc(265, 305, 55, Math.PI * 0.1, Math.PI * 0.8); ctx.stroke();

    return new THREE.CanvasTexture(canvas);
}

const faceTexture = createPoliceFaceTexture();
const kidFaceTexture = createKidFaceTexture();

// 🚘 גלגל מפורט
function createDetailedWheel() {
    const wheelGroup = new THREE.Group();
    const tireGeo = new THREE.TorusGeometry(0.35, 0.16, 20, 32);
    tireGeo.rotateY(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    wheelGroup.add(tire);

    const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.34, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wheelGroup.add(rim);

    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.35), rimMat);
    wheelGroup.add(spoke);

    return wheelGroup;
}

function createCarMesh() {
    const car = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.2, metalness: 0.3 });
    
    const bodyGeo = new THREE.SphereGeometry(1.2, 32, 24);
    bodyGeo.scale(1.0, 0.65, 1.6);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.75;
    body.castShadow = true;
    car.add(body);

    const cabinGeo = new THREE.SphereGeometry(0.9, 24, 20);
    cabinGeo.scale(0.9, 0.6, 1.1);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.9 });
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 1.35, -0.1);
    car.add(cabin);

    const wheelPositions = [
        [-1.0, 0.45, -1.1], [1.0, 0.45, -1.1],
        [-1.0, 0.45, 1.1], [1.0, 0.45, 1.1]
    ];
    car.wheels = [];
    wheelPositions.forEach(pos => {
        const w = createDetailedWheel();
        w.position.set(...pos);
        car.add(w);
        car.wheels.push(w);
    });

    return car;
}

function createBusMesh() {
    const bus = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.2 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.7, 8.5), bodyMat);
    body.position.y = 1.55;
    body.castShadow = true;
    bus.add(body);

    const windowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const sideWindows = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.8, 7.5), windowMat);
    sideWindows.position.y = 1.9;
    bus.add(sideWindows);

    bus.wheels = [];
    const wPositions = [
        [-1.2, 0.4, -3.0], [1.2, 0.4, -3.0],
        [-1.2, 0.4, 0], [1.2, 0.4, 0],
        [-1.2, 0.4, 3.0], [1.2, 0.4, 3.0]
    ];
    wPositions.forEach(pos => {
        const w = createDetailedWheel();
        w.position.set(...pos);
        bus.add(w);
        bus.wheels.push(w);
    });

    return bus;
}

function createMotorcycleMesh() {
    const bike = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 1.8), frameMat);
    frame.position.y = 0.65;
    bike.add(frame);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.7), seatMat);
    seat.position.set(0, 0.9, -0.2);
    bike.add(seat);

    const wFront = createDetailedWheel();
    wFront.position.set(0, 0.45, 1.0);
    const wBack = createDetailedWheel();
    wBack.position.set(0, 0.45, -1.0);
    bike.add(wFront, wBack);

    bike.wheels = [wFront, wBack];
    return bike;
}

// 👮‍♂️ דמות השוטר (High Poly)
const playerGroup = new THREE.Group();
scene.add(playerGroup);

const policeAvatarGroup = new THREE.Group();
policeAvatarGroup.rotation.y = Math.PI;

const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 }); 
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 }); 
const skinMat = new THREE.MeshStandardMaterial({ color: 0xf8b88b, roughness: 0.6 }); 
const hairMat = new THREE.MeshStandardMaterial({ color: 0x422006, roughness: 0.8 }); 
const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 }); 
const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.1 }); 

const belly = new THREE.Mesh(new THREE.SphereGeometry(0.78, 32, 32), shirtMat);
belly.position.y = 1.15;
belly.castShadow = true;
policeAvatarGroup.add(belly);

const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.18, 32), blackMat);
belt.position.y = 0.72;
policeAvatarGroup.add(belt);

const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.1), goldMat);
buckle.position.set(0, 0.72, 0.81);
policeAvatarGroup.add(buckle);

const headGroup = new THREE.Group();
headGroup.position.y = 2.18;

const headGeo = new THREE.SphereGeometry(0.5, 32, 32);
headGeo.rotateY(Math.PI / 2);
const faceMaterial = new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.5 });

const head = new THREE.Mesh(headGeo, faceMaterial);
head.castShadow = true;
headGroup.add(head);

const hairBackGeo = new THREE.SphereGeometry(0.52, 24, 24);
hairBackGeo.scale(1.02, 0.6, 1.02);
const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
hairBack.position.set(0, 0.12, -0.05);
headGroup.add(hairBack);

const hairSideL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.25), hairMat);
hairSideL.position.set(-0.48, 0.05, 0.1);
const hairSideR = hairSideL.clone();
hairSideR.position.x = 0.48;
headGroup.add(hairSideL, hairSideR);

const hatTop = new THREE.Mesh(new THREE.SphereGeometry(0.52, 32, 24), shirtMat);
hatTop.scale.set(1.05, 0.45, 1.05);
hatTop.position.y = 0.42;
headGroup.add(hatTop);

const hatVisor = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.58, 0.05, 32, 1, false, 0, Math.PI), blackMat);
hatVisor.position.set(0, 0.32, 0.15);
hatVisor.rotation.x = 0.25;
headGroup.add(hatVisor);

const hatBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16), goldMat);
hatBadge.rotation.x = Math.PI / 2;
hatBadge.position.set(0, 0.48, 0.49);
headGroup.add(hatBadge);

policeAvatarGroup.add(headGroup);

const armSkinGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.6, 20);
const fistGeo = new THREE.SphereGeometry(0.18, 16, 16);

const armGroupL = new THREE.Group();
armGroupL.position.set(-0.78, 1.35, 0);
const sleeveL = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 20), shirtMat);
const armSkinL = new THREE.Mesh(armSkinGeo, skinMat);
armSkinL.position.set(-0.05, -0.35, 0);
const fistL = new THREE.Mesh(fistGeo, skinMat);
fistL.position.set(-0.08, -0.65, 0.1);
armGroupL.add(sleeveL, armSkinL, fistL);

const armGroupR = new THREE.Group();
armGroupR.position.set(0.78, 1.35, 0);
const sleeveR = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 20), shirtMat);
const armSkinR = new THREE.Mesh(armSkinGeo, skinMat);
armSkinR.position.set(0.05, -0.35, 0);
const fistR = new THREE.Mesh(fistGeo, skinMat);
fistR.position.set(0.08, -0.65, 0.1);
armGroupR.add(sleeveR, armSkinR, fistR);

policeAvatarGroup.add(armGroupL, armGroupR);

const legGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.55, 20);
const bootGeo = new THREE.SphereGeometry(0.28, 20, 20);
bootGeo.scale(0.9, 0.7, 1.3);

const legL = new THREE.Mesh(legGeo, pantsMat);
legL.position.set(-0.32, 0.38, 0);
const bootL = new THREE.Mesh(bootGeo, blackMat);
bootL.position.set(-0.32, 0.16, 0.1);

const legR = new THREE.Mesh(legGeo, pantsMat);
legR.position.set(0.32, 0.38, 0);
const bootR = new THREE.Mesh(bootGeo, blackMat);
bootR.position.set(0.32, 0.16, 0.1);

policeAvatarGroup.add(legL, bootL, legR, bootR);
playerGroup.add(policeAvatarGroup);

// 👶 דמות הילד השובב
const kidGroup = new THREE.Group();
scene.add(kidGroup);

const kidBody = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 24), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }));
kidBody.position.y = 0.7;
kidGroup.add(kidBody);

const kidHeadGroup = new THREE.Group();
kidHeadGroup.position.y = 1.45;

const kidHeadGeo = new THREE.SphereGeometry(0.38, 32, 32);
kidHeadGeo.rotateY(Math.PI / 2);
const kidHeadMesh = new THREE.Mesh(kidHeadGeo, new THREE.MeshStandardMaterial({ map: kidFaceTexture, roughness: 0.5 }));
kidHeadGroup.add(kidHeadMesh);

const kidHairMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.7 });
const kidHairTop = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), kidHairMat);
kidHairTop.scale.set(1.05, 0.65, 1.05);
kidHairTop.position.set(0, 0.18, -0.02);
kidHeadGroup.add(kidHairTop);

for (let s = 0; s < 5; s++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 8), kidHairMat);
    spike.rotation.x = -0.4;
    spike.position.set((s - 2) * 0.12, 0.32, 0.15);
    kidHeadGroup.add(spike);
}

kidGroup.add(kidHeadGroup);

const kidBike = createMotorcycleMesh();
kidBike.position.y = -0.2;
kidGroup.add(kidBike);

kidGroup.position.set(0, 0, -30);

// 🎨 ספריי צבעוני נפלט מהאופנוע
const sprayTrailParticles = [];
const sprayColorsList = [0xef4444, 0x22c55e, 0x38bdf8, 0xfacc15, 0xa855f7];

function emitBikeSprayTrail() {
    if (kidState === 'FOOT') return;
    const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.12 + Math.random() * 0.08, 8, 8),
        new THREE.MeshBasicMaterial({ color: sprayColorsList[Math.floor(Math.random() * sprayColorsList.length)] })
    );
    p.position.copy(kidGroup.position);
    p.position.y += 0.4;
    p.position.z += 0.8;
    p.position.x += (Math.random() - 0.5) * 0.4;
    scene.add(p);
    sprayTrailParticles.push({ mesh: p, life: 25 });
}

let targetX = lanes[currentLane];
let isJumping = false;
let jumpVelocity = 0;
let playerY = 0;
let gravity = -0.016;
let baseJumpStrength = 0.35;
let isRolling = false;
let rollTimer = 0;
let groundHeight = 0;

const obstacles = [];
const coinsList = [];

function spawnObstaclePattern() {
    const lane = Math.floor(Math.random() * 3);
    const r = Math.random();

    if (r < 0.4) {
        const mesh = createCarMesh();
        mesh.position.set(lanes[lane], 0, -140);
        scene.add(mesh);
        obstacles.push({ mesh, type: 'car', lane, height: 1.4 });
    } else if (r < 0.7) {
        const mesh = createBusMesh();
        mesh.position.set(lanes[lane], 0, -140);
        scene.add(mesh);
        obstacles.push({ mesh, type: 'bus', lane, height: 2.8 });
    }
}

const coinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 16);
coinGeo.rotateX(Math.PI / 2);
const coinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.2 });

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
    if (!isJumping && !isRolling && gameState === 'PLAYING') {
        isJumping = true;
        jumpVelocity = baseJumpStrength;
    }
}

function roll() {
    if (gameState === 'PLAYING') {
        if (isJumping) jumpVelocity = -0.38;
        if (!isRolling) {
            isRolling = true;
            rollTimer = 30;
            playerGroup.scale.y = 0.5;
        }
    }
}

window.addEventListener('keydown', (e) => {
    if (gameState !== 'PLAYING') return;
    switch(e.key) {
        case 'ArrowLeft': case 'a': case 'A': moveLeft(); break;
        case 'ArrowRight': case 'd': case 'D': moveRight(); break;
        case 'ArrowUp': case 'w': case 'W': case ' ': jump(); break;
        case 'ArrowDown': case 's': case 'S': roll(); break;
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
            if (obs.type === 'bus' && (playerY >= obs.height - 0.4 || playerGroup.position.y >= obs.height - 0.4)) {
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

// 🚀 התחלת משחק מידית וחלקלקה ללא שום קיר או סצנה תקועה
window.startGameDirectly = function() {
    resetGameEnvironment();
    gameState = 'PLAYING';
    gameData.gamesPlayed++;
    saveGameData();

    gameSpeed = 0.55;
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
    isRolling = false;
    playerGroup.scale.y = 1;

    kidState = 'BIKE';
    kidBike.visible = true;
    kidGroup.position.set(0, 0, -30);

    score = 0;
    sessionCoins = 0;
    document.getElementById('coin-display').innerText = '0';
    document.getElementById('time-display').innerText = '0';
}

window.resetGame = function() {
    resetGameEnvironment();
    window.startGameDirectly();
};

let animStep = 0;

function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'PLAYING') {
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        score += deltaTime * 100;
        let displayScore = Math.floor(score);
        document.getElementById('time-display').innerText = displayScore;

        if (displayScore >= 275 && kidState === 'BIKE') {
            kidState = 'FOOT';
            kidBike.visible = false;
            showEventToast("⛽ נגמר הדלק לילד! הוא עבר לרוץ ברגל!");
        } else if (displayScore >= 1000 && kidState === 'FOOT') {
            kidState = 'SUPERBIKE';
            kidBike.visible = true;
            showEventToast("🚀 הילד מצא אופנוע-על והאיץ מחדש!");
        }

        if (displayScore >= WIN_SCORE) gameOver();

        gameSpeed = Math.min(maxGameSpeed, gameSpeed + (deltaTime * 0.003));

        playerGroup.position.x += (targetX - playerGroup.position.x) * 0.22;
        
        camera.position.x = playerGroup.position.x * 0.45;
        camera.position.y = 9.5 + (playerY * 0.5);
        camera.position.z = 9.5;
        camera.lookAt(playerGroup.position.x * 0.25, 1.2 + (playerY * 0.35), -12);

        animStep += gameSpeed * 0.25;
        armGroupL.rotation.x = Math.sin(animStep) * 0.7;
        armGroupR.rotation.x = -Math.sin(animStep) * 0.7;

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

        if (isRolling) {
            rollTimer--;
            if (rollTimer <= 0) {
                isRolling = false;
                playerGroup.scale.y = 1;
            }
        }

        kidGroup.position.z = -28 + Math.sin(currentTime * 0.003) * 3;
        if (kidState !== 'FOOT') {
            emitBikeSprayTrail();
        }

        obstacles.forEach(obs => {
            obs.mesh.position.z += gameSpeed;
            if (obs.mesh.wheels) {
                obs.mesh.wheels.forEach(w => w.rotation.x += gameSpeed * 0.5);
            }
        });

        if (kidBike.wheels) {
            kidBike.wheels.forEach(w => w.rotation.x += gameSpeed * 0.5);
        }

        for (let i = sprayTrailParticles.length - 1; i >= 0; i--) {
            const sp = sprayTrailParticles[i];
            sp.mesh.position.z += gameSpeed * 0.8;
            sp.life--;
            if (sp.life <= 0) {
                scene.remove(sp.mesh);
                sprayTrailParticles.splice(i, 1);
            }
        }

        spawnTimer += gameSpeed;
        if (spawnTimer > 20) {
            spawnObstaclePattern();
            if (Math.random() < 0.5) {
                spawnCoinLine(Math.floor(Math.random() * 3), -140, 5);
            }
            spawnTimer = 0;
        }

        lineGroup.position.z += gameSpeed;
        if (lineGroup.position.z > 10) lineGroup.position.z -= 10;

        for (let i = obstacles.length - 1; i >= 0; i--) {
            if (obstacles[i].mesh.position.z > 15) {
                scene.remove(obstacles[i].mesh);
                obstacles.splice(i, 1);
            }
        }

        for (let i = coinsList.length - 1; i >= 0; i--) {
            coinsList[i].mesh.position.z += gameSpeed;
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
