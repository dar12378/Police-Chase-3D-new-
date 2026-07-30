<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Police Chase 3D - AI Edition</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        window.FirebaseModules = {
            initializeApp, getAuth, signInAnonymously, signInWithCustomToken,
            getFirestore, doc, getDoc, setDoc
        };
    </script>

    <style>
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Rubik:wght@600;800&display=swap');
        
        * {
            user-select: none;
            -webkit-user-select: none;
        }

        body {
            margin: 0;
            overflow: hidden;
            font-family: 'Fredoka One', 'Rubik', cursive, sans-serif;
            background-color: #0f172a;
            touch-action: none;
        }
        
        #game-container {
            width: 100vw;
            height: 100vh;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
        }

        .ui-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10;
            pointer-events: none;
        }

        .screen {
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(8px);
            pointer-events: auto;
            animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }

        .screen.active {
            display: flex;
        }

        .hud {
            display: none;
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            justify-content: space-between;
            pointer-events: none;
            z-index: 12;
        }

        .hud.active {
            display: flex;
        }

        .btn {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            border: 3px solid #bbf7d0;
            border-radius: 16px;
            color: white;
            padding: 14px 36px;
            font-size: 22px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(34, 197, 94, 0.4), inset 0 2px 0 rgba(255,255,255,0.4);
            transition: all 0.15s ease;
            text-shadow: 0 2px 4px rgba(0,0,0,0.4);
            margin: 8px;
        }

        .btn:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 12px 24px rgba(34, 197, 94, 0.5), inset 0 2px 0 rgba(255,255,255,0.4);
        }

        .btn-orange {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border-color: #fef08a;
            box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
        }

        .btn-purple {
            background: linear-gradient(135deg, #a855f7, #7e22ce);
            border-color: #f5d0fe;
            box-shadow: 0 8px 20px rgba(168, 85, 247, 0.4);
        }

        .btn-gray {
            background: linear-gradient(135deg, #64748b, #334155);
            border-color: #cbd5e1;
            box-shadow: 0 8px 20px rgba(100, 116, 139, 0.4);
        }

        .title {
            font-size: 68px;
            font-weight: 800;
            color: #fbbf24;
            text-shadow: 0 6px 0 #b45309, 0 10px 20px rgba(0,0,0,0.6);
            margin-bottom: 25px;
            text-align: center;
            letter-spacing: 2px;
        }

        .hud-card {
            color: white;
            font-size: 22px;
            font-weight: bold;
            background: rgba(15, 23, 42, 0.7);
            border: 2px solid rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 14px;
            backdrop-filter: blur(6px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .stats-box {
            background: rgba(255, 255, 255, 0.95);
            padding: 25px 35px;
            border-radius: 24px;
            border: 4px solid #38bdf8;
            text-align: center;
            margin-bottom: 25px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            max-width: 480px;
            width: 90%;
        }

        .grid-upgrades {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 16px;
            width: 100%;
            max-width: 680px;
            max-height: 55vh;
            overflow-y: auto;
            padding: 10px;
        }

        .upgrade-card {
            background: rgba(255, 255, 255, 0.95);
            border: 3px solid #0284c7;
            border-radius: 18px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }

        .btn-sm {
            padding: 10px 20px;
            font-size: 16px;
            border-radius: 12px;
            margin: 0;
            width: 100%;
        }

        .nav-row {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            justify-content: center;
        }

        #cloud-toast, #game-event-toast {
            position: fixed;
            top: 25px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.92);
            color: #fbbf24;
            border: 2px solid #fbbf24;
            padding: 12px 28px;
            border-radius: 16px;
            font-size: 20px;
            font-weight: bold;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 100;
            display: none;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
        }

        /* ↘️ כפתור מסך מלא למטה בצד ימין */
        .fullscreen-btn {
            position: fixed;
            bottom: 15px;
            right: 15px;
            z-index: 100;
            background: rgba(15, 23, 42, 0.85);
            border: 2px solid #38bdf8;
            color: white;
            padding: 8px 16px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            backdrop-filter: blur(6px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            pointer-events: auto;
        }

        .fullscreen-btn:hover {
            background: #0284c7;
            transform: scale(1.05);
        }

        .story-card {
            background: rgba(15, 23, 42, 0.85);
            border: 3px solid #0284c7;
            border-radius: 20px;
            padding: 20px 24px;
            color: white;
            text-align: right;
            max-width: 580px;
            width: 92%;
            max-height: 52vh;
            overflow-y: auto;
            margin-bottom: 20px;
            box-shadow: 0 15px 30px rgba(0,0,0,0.5);
            backdrop-filter: blur(10px);
        }

        .direct-name-input {
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid #38bdf8;
            border-radius: 10px;
            padding: 4px 10px;
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
            outline: none;
            width: 160px;
            text-align: center;
        }
    </style>
</head>
<body>

    <div id="game-container"></div>

    <!-- כפתור מסך מלא למטה בצד ימין -->
    <button class="fullscreen-btn" onclick="toggleFullScreen()">⛶ מסך מלא</button>
    <div id="cloud-toast">☁️ התקדמות נשמרה בענן!</div>
    <div id="game-event-toast">⛽ נגמר הדלק לילד! הילד עבר לרוץ ברגל!</div>

    <div class="ui-layer">
        
        <!-- HUD בזמן משחק -->
        <div id="hud" class="hud">
            <div class="hud-card">🪙 <span id="coin-display">0</span></div>
            <div id="booster-card" class="hud-card" style="display: none; background: rgba(245, 158, 11, 0.9); border-color: #fef08a;">
                <span id="booster-icon">🦘</span> <span id="booster-text">קנגורו: 20s</span>
            </div>
            <div class="hud-card">🎯 <span id="time-display">0</span></div>
        </div>

        <!-- מסך פתיחה -->
        <div id="start-screen" class="screen active">
            <h1 class="title" style="margin-bottom: 12px; font-size: 58px;">POLICE CHASE 3D</h1>
            
            <div class="story-card">
                <div class="flex justify-between items-center bg-slate-800/90 p-3 rounded-xl mb-4 border border-sky-500/40">
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-sky-400 font-bold">שם שחקן:</span>
                        <input type="text" id="direct-user-input" class="direct-name-input" value="אורח" onblur="updateNameFromDirectInput()">
                    </div>
                    <button class="btn btn-orange btn-sm text-xs py-1 px-3" onclick="updateNameFromDirectInput()">עדכן שם ✏️</button>
                </div>

                <div class="text-amber-400 font-bold text-lg mb-2">📖 המרדף החל!</div>
                <div class="text-slate-300 text-sm mb-3">
                    הילד השובב בורח על אופנוע מהרגע הראשון! ב-275 נקודות נגמר לו הדלק והוא ירוץ ברגל. תפוס אותו לפני שהוא ישיג אופנוע-על ב-1,000 נקודות!
                </div>

                <div class="bg-amber-500/20 border border-amber-400/50 rounded-xl p-3 text-center mt-3">
                    <div class="text-amber-300 font-extrabold text-lg">🏆 שיא אישי: <span id="home-high-score">0</span></div>
                    <div class="text-xs text-amber-200/80 mt-1">מטבעות: <span id="home-coins">0</span> 🪙</div>
                </div>
            </div>
            
            <div class="nav-row">
                <button class="btn" onclick="startIntroCutscene()">צא למרדף! 🚨</button>
                <button class="btn btn-orange" onclick="showScreen('shop-screen')">חנות ושדרוגים 🛒</button>
                <button class="btn btn-purple" onclick="showScreen('records-screen')">שיאים 🏆</button>
            </div>
        </div>

        <!-- מסך חנות -->
        <div id="shop-screen" class="screen">
            <h1 class="title" style="font-size: 52px; margin-bottom: 10px;">חנות שדרוגים 🛒</h1>
            <div style="color: white; font-size: 24px; margin-bottom: 15px;">
                מטבעות: <span id="shop-coins">0</span> 🪙
            </div>

            <div class="grid-upgrades">
                <div class="upgrade-card">
                    <div>
                        <div class="text-xl font-bold text-slate-900">⚡ מהירות ריצה</div>
                        <div class="text-sm text-slate-500" id="speed-lvl-text">רמה: 1 / 5</div>
                    </div>
                    <button class="btn btn-sm" id="buy-speed-btn" onclick="buyUpgrade('speed')">שדרג (100 🪙)</button>
                </div>

                <div class="upgrade-card">
                    <div>
                        <div class="text-xl font-bold text-slate-900">🦘 גובה קפיצה</div>
                        <div class="text-sm text-slate-500" id="jump-lvl-text">רמה: 1 / 5</div>
                    </div>
                    <button class="btn btn-sm" id="buy-jump-btn" onclick="buyUpgrade('jump')">שדרג (150 🪙)</button>
                </div>

                <div class="upgrade-card">
                    <div>
                        <div class="text-xl font-bold text-slate-900">🧲 מגנט מטבעות</div>
                        <div class="text-sm text-slate-500" id="magnet-lvl-text">רמה: 0 / 5</div>
                    </div>
                    <button class="btn btn-sm" id="buy-magnet-btn" onclick="buyUpgrade('magnet')">שדרג (200 🪙)</button>
                </div>

                <div class="upgrade-card">
                    <div>
                        <div class="text-xl font-bold text-slate-900">💰 מכפיל מטבעות</div>
                        <div class="text-sm text-slate-500" id="multiplier-lvl-text">רמה: 1 / 5</div>
                    </div>
                    <button class="btn btn-sm" id="buy-multiplier-btn" onclick="buyUpgrade('multiplier')">שדרג (250 🪙)</button>
                </div>
            </div>

            <button class="btn btn-gray" style="margin-top: 20px;" onclick="showStartScreen()">חזרה לתחנה 🏠</button>
        </div>

        <!-- מסך שיאים -->
        <div id="records-screen" class="screen">
            <h1 class="title" style="font-size: 52px; margin-bottom: 20px;">לוח שיאים 🏆</h1>
            <div class="stats-box">
                <p class="text-xl text-slate-800 my-2">🥇 שיא ניקוד: <span id="rec-high-score">0</span></p>
                <p class="text-xl text-slate-800 my-2">🪙 סך מטבעות שנאספו: <span id="rec-total-coins">0</span></p>
                <p class="text-xl text-slate-800 my-2">🎮 משחקים ששוחקו: <span id="rec-games-played">0</span></p>
            </div>
            <button class="btn btn-gray" onclick="showStartScreen()">חזרה לתחנה 🏠</button>
        </div>

        <!-- מסך הפסד -->
        <div id="game-over-screen" class="screen">
            <h1 class="title" style="color: #ef4444;">נתקעת!</h1>
            <div class="stats-box">
                <h2 class="text-3xl text-red-500 font-bold mb-3">המשחק נגמר</h2>
                <p class="text-lg text-slate-800">ניקוד שהושג: <span id="final-time">0</span></p>
                <p class="text-lg text-slate-800">מטבעות שנאספו: <span id="final-coins">0</span> 🪙</p>
                <p class="text-lg text-slate-800">שיא אישי: <span id="high-score-end">0</span></p>
            </div>
            <div class="nav-row">
                <button class="btn" onclick="resetGame()">נסה שוב 🔄</button>
                <button class="btn btn-purple" onclick="showStartScreen()">לתחנה 🏠</button>
            </div>
        </div>

        <!-- מסך ניצחון -->
        <div id="victory-screen" class="screen">
            <h1 class="title" style="color: #4ade80;">תפסת אותו!</h1>
            <div class="stats-box">
                <h2 class="text-3xl text-green-600 font-bold mb-2">ניצחון היסטורי!</h2>
                <p class="text-lg text-slate-800">הצלחת להגיע ל-100,000 נקודות!</p>
            </div>
            <div class="nav-row">
                <button class="btn" onclick="resetGame()">שחק שוב 🔄</button>
                <button class="btn btn-purple" onclick="showStartScreen()">לתחנה 🏠</button>
            </div>
        </div>
    </div>

    <script>
        let activeUsername = 'אורח';
        function toggleFullScreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {});
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        }

        function updateNameFromDirectInput() {
            const inputEl = document.getElementById('direct-user-input');
            if (inputEl) {
                const newName = inputEl.value.trim();
                if (newName.length > 0) {
                    activeUsername = newName;
                    saveGameData();
                }
            }
        }

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
            localStorage.setItem('policeChaseSaveData_v6', JSON.stringify(gameData));
            updateUI();
        }

        function loadGameData() {
            const saved = localStorage.getItem('policeChaseSaveData_v6');
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

        function buyUpgrade(type) {
            const costs = { speed: 100, jump: 150, magnet: 200, multiplier: 250 };
            const lvl = gameData.upgrades[type];
            const cost = costs[type] * lvl;

            if (lvl < 5 && gameData.coins >= cost) {
                gameData.coins -= cost;
                gameData.upgrades[type]++;
                saveGameData();
            }
        }

        let gameState = 'START';
        let score = 0;
        let sessionCoins = 0;
        const WIN_SCORE = 100000;
        let gameSpeed = 0.5;
        let maxGameSpeed = 1.8;
        let lastTime = 0;
        let spawnTimer = 0;
        let cutsceneTimer = 0;
        let kidState = 'BIKE'; // 'BIKE' (0-275), 'FOOT' (275-1000), 'SUPERBIKE' (1000+)

        const container = document.getElementById('game-container');
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x38bdf8);
        scene.fog = new THREE.FogExp2(0x38bdf8, 0.007);

        // 🎥 מצלמת Subway Surfers מוגבהת במיוחד מעל השוטר
        const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 350);
        camera.position.set(0, 9.5, 9.5);

        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 4));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.5);
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

        // 🎨 יצירת טקסטורת פנים מפורטת (AI Stylized Face Canvas Texture)
        function createPoliceFaceTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');

            // עור אפרסק-ורדרד בריא
            ctx.fillStyle = '#f8c8a0';
            ctx.fillRect(0, 0, 512, 512);

            // לחיים ורודות וחמודות
            ctx.fillStyle = 'rgba(244, 114, 182, 0.4)';
            ctx.beginPath(); ctx.arc(130, 290, 48, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(382, 290, 48, 0, Math.PI * 2); ctx.fill();

            // עיניים מצוירות גדולות (לבן)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.ellipse(160, 215, 42, 58, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(352, 215, 42, 58, 0, 0, Math.PI * 2); ctx.fill();

            // אישונים כחולים
            ctx.fillStyle = '#2563eb';
            ctx.beginPath(); ctx.arc(165, 220, 26, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(347, 220, 26, 0, Math.PI * 2); ctx.fill();

            // מרכז אישון כהה
            ctx.fillStyle = '#0f172a';
            ctx.beginPath(); ctx.arc(165, 220, 15, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(347, 220, 15, 0, Math.PI * 2); ctx.fill();

            // ברק עיניים (Highlight shine)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(155, 208, 9, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(337, 208, 9, 0, Math.PI * 2); ctx.fill();

            // גבות
            ctx.strokeStyle = '#331800';
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(160, 145, 48, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
            ctx.beginPath(); ctx.arc(352, 145, 48, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();

            // אף עגול
            ctx.fillStyle = '#e0a078';
            ctx.beginPath(); ctx.arc(256, 265, 20, 0, Math.PI * 2); ctx.fill();

            // חיוך רחב וחברותי
            ctx.strokeStyle = '#881337';
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.arc(256, 305, 65, Math.PI * 0.12, Math.PI * 0.88);
            ctx.stroke();

            return new THREE.CanvasTexture(canvas);
        }

        const faceTexture = createPoliceFaceTexture();

        // 🚘 גלגל מפורט
        function createDetailedWheel() {
            const wheelGroup = new THREE.Group();
            
            const tireGeo = new THREE.TorusGeometry(0.35, 0.16, 16, 24);
            tireGeo.rotateY(Math.PI / 2);
            const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
            const tire = new THREE.Mesh(tireGeo, tireMat);
            tire.castShadow = true;
            wheelGroup.add(tire);

            const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.34, 12);
            rimGeo.rotateZ(Math.PI / 2);
            const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
            const rim = new THREE.Mesh(rimGeo, rimMat);
            wheelGroup.add(rim);

            const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.35), rimMat);
            wheelGroup.add(spoke);

            return wheelGroup;
        }

        // 🚗 מכונית מפורטת
        function createCarMesh() {
            const car = new THREE.Group();
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.2, metalness: 0.3 });
            
            const bodyGeo = new THREE.SphereGeometry(1.2, 24, 16);
            bodyGeo.scale(1.0, 0.65, 1.6);
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.75;
            body.castShadow = true;
            car.add(body);

            const cabinGeo = new THREE.SphereGeometry(0.9, 16, 16);
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

        // 👮‍♂️ דמות השוטר (פונה קדימה לכיוון הריצה, מסתכל מדי פעם אחורה!)
        const playerGroup = new THREE.Group();
        scene.add(playerGroup);

        const policeAvatarGroup = new THREE.Group();
        
        // השוטר רץ קדימה בכיוון השלילי (-Z)
        policeAvatarGroup.rotation.y = Math.PI; 

        const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 }); 
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 }); 
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.6 }); 
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 }); 
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.1 }); 

        // בטן עגולה ושמנמנה
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.78, 24, 24), shirtMat);
        belly.position.y = 1.15;
        belly.castShadow = true;
        policeAvatarGroup.add(belly);

        // חגורה ואבזם
        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.18, 24), blackMat);
        belt.position.y = 0.72;
        policeAvatarGroup.add(belt);

        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.1), goldMat);
        buckle.position.set(0, 0.72, 0.81);
        policeAvatarGroup.add(buckle);

        // 🧑 ראש השוטר עם טקסטורת פנים (קבוצה נפרדת כדי לבצע סיבוב מבט לאחור!)
        const headGroup = new THREE.Group();
        headGroup.position.y = 2.18;

        const headGeo = new THREE.SphereGeometry(0.5, 32, 32);
        headGeo.rotateY(Math.PI / 2); // כיוון טקסטורת הפנים לחזית
        const faceMaterial = new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.5 });

        const head = new THREE.Mesh(headGeo, faceMaterial);
        head.castShadow = true;
        headGroup.add(head);

        // כובע שוטר עגול עם מצחייה ותג
        const hatTop = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 16), shirtMat);
        hatTop.scale.set(1.05, 0.45, 1.05);
        hatTop.position.y = 0.42;
        headGroup.add(hatTop);

        const hatVisor = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.58, 0.05, 24, 1, false, 0, Math.PI), blackMat);
        hatVisor.position.set(0, 0.32, 0.15);
        hatVisor.rotation.x = 0.25;
        headGroup.add(hatVisor);

        const hatBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 12), goldMat);
        hatBadge.rotation.x = Math.PI / 2;
        hatBadge.position.set(0, 0.48, 0.49);
        headGroup.add(hatBadge);

        policeAvatarGroup.add(headGroup);

        // זרועות ורגליים
        const armSkinGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.6, 16);
        const fistGeo = new THREE.SphereGeometry(0.18, 12, 12);

        const armGroupL = new THREE.Group();
        armGroupL.position.set(-0.78, 1.35, 0);
        const sleeveL = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), shirtMat);
        const armSkinL = new THREE.Mesh(armSkinGeo, skinMat);
        armSkinL.position.set(-0.05, -0.35, 0);
        const fistL = new THREE.Mesh(fistGeo, skinMat);
        fistL.position.set(-0.08, -0.65, 0.1);
        armGroupL.add(sleeveL, armSkinL, fistL);

        const armGroupR = new THREE.Group();
        armGroupR.position.set(0.78, 1.35, 0);
        const sleeveR = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), shirtMat);
        const armSkinR = new THREE.Mesh(armSkinGeo, skinMat);
        armSkinR.position.set(0.05, -0.35, 0);
        const fistR = new THREE.Mesh(fistGeo, skinMat);
        fistR.position.set(0.08, -0.65, 0.1);
        armGroupR.add(sleeveR, armSkinR, fistR);

        policeAvatarGroup.add(armGroupL, armGroupR);

        const legGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.55, 16);
        const bootGeo = new THREE.SphereGeometry(0.28, 16, 16);
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

        // 👶 דמות הילד השובב (מופיע מההתחלה - Score 0!)
        const kidGroup = new THREE.Group();
        scene.add(kidGroup);

        const kidBody = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
        kidBody.position.y = 0.7;
        kidGroup.add(kidBody);

        const kidHeadMesh = head.clone();
        kidHeadMesh.position.y = 1.4;
        kidHeadMesh.scale.set(0.7, 0.7, 0.7);
        kidGroup.add(kidHeadMesh);

        const kidBike = createMotorcycleMesh();
        kidBike.position.y = -0.2;
        kidGroup.add(kidBike);

        kidGroup.position.set(0, 0, -30);

        // עשן אופנוע
        const smokeParticles = [];
        function emitBikeSmoke() {
            if (kidState === 'FOOT') return;
            const p = new THREE.Mesh(
                new THREE.SphereGeometry(0.15 + Math.random()*0.1, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.6 })
            );
            p.position.copy(kidGroup.position);
            p.position.y += 0.3;
            p.position.z += 0.8;
            scene.add(p);
            smokeParticles.push({ mesh: p, life: 20 });
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

        function showScreen(screenId) {
            document.querySelectorAll('.screen, .hud').forEach(el => el.classList.remove('active'));
            if (screenId) document.getElementById(screenId).classList.add('active');
        }

        function showStartScreen() {
            resetGameEnvironment();
            showScreen('start-screen');
            gameState = 'START';
            
            camera.position.set(0, 9.5, 9.5);
            camera.lookAt(0, 1.0, -12);
        }

        function startIntroCutscene() {
            showScreen(null);
            gameState = 'INTRO_CUTSCENE';
            cutsceneTimer = 0;

            playerGroup.position.set(0, 0, 0);
            camera.position.set(1.5, 2.5, -4);
            camera.lookAt(0, 1.5, -10);
        }

        function startGame() {
            gameState = 'PLAYING';
            gameData.gamesPlayed++;
            saveGameData();

            gameSpeed = 0.55;
            showScreen('hud');
            lastTime = performance.now();
        }

        function gameOver() {
            gameState = 'GAMEOVER';
            if (score > gameData.highScore) gameData.highScore = score;
            saveGameData();

            document.getElementById('final-time').innerText = Math.floor(score);
            document.getElementById('final-coins').innerText = sessionCoins;
            document.getElementById('high-score-end').innerText = Math.floor(gameData.highScore);
            showScreen('game-over-screen');
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

        function resetGame() {
            resetGameEnvironment();
            startGame();
        }

        let animStep = 0;
        let lookBackTimer = 0;
        let isLookingBack = false;

        function animate() {
            requestAnimationFrame(animate);

            if (gameState === 'INTRO_CUTSCENE') {
                cutsceneTimer += 0.02;

                if (cutsceneTimer >= 1.8) {
                    camera.position.lerp(new THREE.Vector3(playerGroup.position.x * 0.45, 9.5, 9.5), 0.1);
                    camera.lookAt(0, 1.2, -12);

                    if (cutsceneTimer >= 2.6) startGame();
                }
            }
            else if (gameState === 'PLAYING') {
                const currentTime = performance.now();
                const deltaTime = (currentTime - lastTime) / 1000;
                lastTime = currentTime;

                score += deltaTime * 100;
                let displayScore = Math.floor(score);
                document.getElementById('time-display').innerText = displayScore;

                // ⛽ נקודות ציון מעודכנות: 275 דלק נגמר, 1,000 אופנוע-על!
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
                
                // 🎥 מצלמה גבוהה עוקבת
                camera.position.x = playerGroup.position.x * 0.45;
                camera.position.y = 9.5 + (playerY * 0.5);
                camera.position.z = 9.5;
                camera.lookAt(playerGroup.position.x * 0.25, 1.2 + (playerY * 0.35), -12);

                // 🏃‍♂️ אנימציית ריצה
                animStep += gameSpeed * 0.25;
                armGroupL.rotation.x = Math.sin(animStep) * 0.7;
                armGroupR.rotation.x = -Math.sin(animStep) * 0.7;

                // 👀 השוטר מסתכל אחורה מדי פעם אל המצלמה!
                lookBackTimer += deltaTime;
                if (lookBackTimer > 6.0 && !isLookingBack) {
                    if (Math.random() < 0.6) {
                        isLookingBack = true;
                        setTimeout(() => {
                            isLookingBack = false;
                            lookBackTimer = 0;
                        }, 1800);
                    } else {
                        lookBackTimer = 3.0;
                    }
                }
                
                headGroup.rotation.y = THREE.MathUtils.lerp(
                    headGroup.rotation.y, 
                    isLookingBack ? Math.PI : 0, 
                    0.1
                );

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

                // 👶 תנועת הילד והאופנוע
                kidGroup.position.z = -28 + Math.sin(currentTime * 0.003) * 3;
                if (kidState !== 'FOOT') {
                    emitBikeSmoke();
                }

                // 💨 סיבוב גלגלים של רכבים בתנועה!
                obstacles.forEach(obs => {
                    obs.mesh.position.z += gameSpeed;
                    if (obs.mesh.wheels) {
                        obs.mesh.wheels.forEach(w => w.rotation.x += gameSpeed * 0.5);
                    }
                });

                if (kidBike.wheels) {
                    kidBike.wheels.forEach(w => w.rotation.x += gameSpeed * 0.5);
                }

                // עשן
                for (let i = smokeParticles.length - 1; i >= 0; i--) {
                    const sp = smokeParticles[i];
                    sp.mesh.position.z += gameSpeed * 0.8;
                    sp.life--;
                    if (sp.life <= 0) {
                        scene.remove(sp.mesh);
                        smokeParticles.splice(i, 1);
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
    </script>
</body>
</html>
