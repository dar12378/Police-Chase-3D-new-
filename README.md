<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Police Chase 3D</title>
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

        .btn:active {
            transform: translateY(2px);
            box-shadow: 0 4px 10px rgba(34, 197, 94, 0.4);
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

        .stats-box h2 {
            color: #ef4444;
            font-size: 36px;
            margin-bottom: 12px;
        }

        .stats-box p {
            color: #1e293b;
            font-size: 20px;
            margin: 8px 0;
            font-weight: 600;
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

        .upgrade-title {
            font-size: 20px;
            color: #0f172a;
            font-weight: bold;
        }

        .upgrade-level {
            font-size: 14px;
            color: #64748b;
            margin-top: 4px;
            margin-bottom: 12px;
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

        .controls-hint {
            position: absolute;
            bottom: 15px;
            color: rgba(255,255,255,0.7);
            font-size: 14px;
            text-align: center;
            width: 100%;
            pointer-events: none;
        }

        #cloud-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(34, 197, 94, 0.95);
            color: white;
            padding: 12px 24px;
            border-radius: 14px;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 100;
            display: none;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }

        .modal-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(8px);
            z-index: 50;
            display: none;
            align-items: center;
            justify-content: center;
        }

        .modal-overlay.active {
            display: flex;
        }

        .fullscreen-btn {
            position: fixed;
            top: 15px;
            left: 15px;
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
            transition: all 0.2s ease;
            pointer-events: auto;
        }

        .fullscreen-btn:hover {
            transform: scale(1.05);
            background: #0284c7;
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

        .story-title {
            color: #fbbf24;
            font-size: 22px;
            font-weight: bold;
            border-bottom: 2px solid rgba(251, 191, 36, 0.3);
            padding-bottom: 6px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .story-text {
            font-size: 15px;
            line-height: 1.6;
            color: #cbd5e1;
            margin-bottom: 12px;
            font-family: 'Rubik', sans-serif;
        }

        .rules-list {
            list-style: none;
            padding: 0;
            margin: 0 0 12px 0;
            font-family: 'Rubik', sans-serif;
            font-size: 14px;
            color: #e2e8f0;
        }

        .rules-list li {
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
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
            transition: all 0.2s;
        }

        .direct-name-input:focus {
            border-color: #f59e0b;
            box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
        }
    </style>
</head>
<body>

    <div id="game-container"></div>

    <!-- כפתור מסך מלא -->
    <button class="fullscreen-btn" onclick="toggleFullScreen()">⛶ מסך מלא</button>

    <!-- Toast שמירה בענן -->
    <div id="cloud-toast">☁️ התקדמות נשמרה בענן!</div>

    <!-- מודל התחברות / יצירת משתמש -->
    <div id="account-modal" class="modal-overlay">
        <div class="stats-box" style="max-width: 400px; margin: 0;">
            <h2 style="color: #0284c7; font-size: 28px; margin-bottom: 16px;">👤 התחברות / החלפת משתמש</h2>
            <p style="font-size: 16px; color: #475569; margin-bottom: 16px;">הכנס שם משתמש כדי לשמור ולטעון את ההתקדמות שלך מכל מקום:</p>
            <input type="text" id="username-input" placeholder="שם משתמש (למשל: PolicePro)" 
                   class="w-full p-3 border-2 border-sky-400 rounded-xl text-center text-lg font-bold text-slate-800 outline-none mb-4 focus:border-sky-600">
            <div class="flex gap-2">
                <button class="btn btn-sm w-full" onclick="saveAccountFromModal()">התחבר / צור 🚀</button>
                <button class="btn btn-gray btn-sm w-full" onclick="closeAccountModal()">ביטול ✖️</button>
            </div>
        </div>
    </div>

    <div class="ui-layer">
        
        <!-- HUD בזמן משחק -->
        <div id="hud" class="hud">
            <div class="hud-card">🪙 <span id="coin-display">0</span></div>
            <div class="hud-card">⏱️ <span id="time-display">0</span>s</div>
        </div>

        <!-- מסך פתיחה - תחנת המשטרה -->
        <div id="start-screen" class="screen active">
            <h1 class="title" style="margin-bottom: 12px; font-size: 58px;">POLICE CHASE</h1>
            
            <div class="story-card">
                <!-- פרופיל משתמש עם אפשרות עריכת שם ישירה -->
                <div class="flex justify-between items-center bg-slate-800/90 p-3 rounded-xl mb-4 border border-sky-500/40">
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-sky-400 font-bold">שם שחקן:</span>
                        <input type="text" id="direct-user-input" class="direct-name-input" value="אורח" onblur="updateNameFromDirectInput()" onkeydown="if(event.key==='Enter') this.blur()">
                    </div>
                    <button class="btn btn-orange btn-sm text-xs py-1 px-3" onclick="updateNameFromDirectInput()">עדכן שם ✏️</button>
                </div>

                <div class="story-title">📖 סיפור הרקע</div>
                <div class="story-text">
                    ילד שובב ריסס גרפיטי ענקי על קיר תחנת המשטרה המרכזית! השוטר העצבני לא מוכן לעבור על זה בשתיקה ויוצא למרדף מרתק בעקבותיו ברחבי העיר.
                </div>

                <div class="story-title">📜 חוקי המשחק והסבר</div>
                <ul class="rules-list">
                    <li>🏃‍♂️ <b>שליטה:</b> חצים / החלקת אצבע ימינה ושמאלה למעבר מסלול, למעלה לקפיצה, למטה לגלגול.</li>
                    <li>🚌 <b>אוטובוסים:</b> אי אפשר לקפוץ מעליהם מהכביש, אבל אפשר לקפוץ על הגג שלהם ולרוץ עליהם!</li>
                    <li>🚧 <b>מחסומי גובה:</b> חובה להתגלגל מתחתיהם!</li>
                    <li>🪙 <b>מטבעות ושדרוגים:</b> אוסף מטבעות בשבילים כדי לשדרג מהירות, קפיצה ומגנט בחנות!</li>
                    <li>🏆 <b>מטרה:</b> לשרוד ולהגיע ל-100,000 שניות כדי לתפוס את הילד ולנצח!</li>
                </ul>

                <div class="bg-amber-500/20 border border-amber-400/50 rounded-xl p-3 text-center mt-3">
                    <div class="text-amber-300 font-extrabold text-lg">🏆 שיא השיאים שלך: <span id="home-high-score">0</span> שניות</div>
                    <div class="text-xs text-amber-200/80 mt-1">מטבעות זמינים בחשבון: <span id="home-coins">0</span> 🪙</div>
                </div>
            </div>
            
            <div class="nav-row">
                <button class="btn" onclick="startIntroCutscene()">צא למרדף! 🚨</button>
                <button class="btn btn-orange" onclick="showScreen('shop-screen')">חנות ושדרוגים 🛒</button>
                <button class="btn btn-purple" onclick="showScreen('records-screen')">שיאים 🏆</button>
            </div>

            <div class="controls-hint" style="position: relative; bottom: auto; margin-top: 10px;">
                מקשים: חצים/WASD | נייד: החלקת אצבע (Swipe) | ⛶ לחץ למסך מלא
            </div>
        </div>

        <!-- מסך חנות -->
        <div id="shop-screen" class="screen">
            <h1 class="title" style="font-size: 52px; margin-bottom: 10px;">חנות שדרוגים 🛒</h1>
            <div style="color: white; font-size: 24px; margin-bottom: 15px; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">
                מטבעות זמינים: <span id="shop-coins">0</span> 🪙
            </div>

            <div class="grid-upgrades">
                <div class="upgrade-card">
                    <div>
                        <div class="upgrade-title">⚡ מהירות ריצה</div>
                        <div class="upgrade-level" id="speed-lvl-text">רמה: 1 / 5</div>
                    </div>
                    <button class="btn btn-sm" id="buy-speed-btn" onclick="buyUpgrade('speed')">שדרג (100 🪙)</button>
                </div>

                <div class="upgrade-card">
                    <div>
                        <div class="upgrade-title">🦘 גובה קפיצה</div>
                        <div class="upgrade-level" id="jump-lvl-text">רמה: 1 / 5</div>
                    </div>
                    <button class="btn btn-sm" id="buy-jump-btn" onclick="buyUpgrade('jump')">שדרג (150 🪙)</button>
                </div>

                <div class="upgrade-card">
                    <div>
                        <div class="upgrade-title">🧲 מגנט מטבעות</div>
                        <div class="upgrade-level" id="magnet-lvl-text">רמה: 0 / 5</div>
                    </div>
                    <button class="btn btn-sm" id="buy-magnet-btn" onclick="buyUpgrade('magnet')">שדרג (200 🪙)</button>
                </div>

                <div class="upgrade-card">
                    <div>
                        <div class="upgrade-title">💰 מכפיל מטבעות</div>
                        <div class="upgrade-level" id="multiplier-lvl-text">רמה: 1 / 5</div>
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
                <p>🥇 שיא זמן: <span id="rec-high-score">0</span> שניות</p>
                <p>🪙 סך מטבעות שנאספו: <span id="rec-total-coins">0</span></p>
                <p>🎮 משחקים ששוחקו: <span id="rec-games-played">0</span></p>
            </div>
            <button class="btn btn-gray" onclick="showStartScreen()">חזרה לתחנה 🏠</button>
        </div>

        <!-- מסך הפסד -->
        <div id="game-over-screen" class="screen">
            <h1 class="title" style="color: #ef4444; text-shadow: 0 6px 0 #991b1b;">נתקעת!</h1>
            <div class="stats-box">
                <h2>המשחק נגמר</h2>
                <p>זמן הישרדות: <span id="final-time">0</span> שניות</p>
                <p>מטבעות שנאספו: <span id="final-coins">0</span> 🪙</p>
                <p>שיא אישי: <span id="high-score-end">0</span> שניות</p>
            </div>
            <div class="nav-row">
                <button class="btn" onclick="resetGame()">נסה שוב 🔄</button>
                <button class="btn btn-purple" onclick="showStartScreen()">לתחנת המשטרה 🏠</button>
            </div>
        </div>

        <!-- מסך ניצחון -->
        <div id="victory-screen" class="screen">
            <h1 class="title" style="color: #4ade80; text-shadow: 0 6px 0 #166534;">תפסת אותו!</h1>
            <div class="stats-box">
                <h2 style="color: #16a34a;">ניצחון היסטורי!</h2>
                <p>הצלחת לשרוד 100,000 שניות!</p>
                <p>השוטר העוצמתי הדביק את הילד!</p>
            </div>
            <div class="nav-row">
                <button class="btn" onclick="resetGame()">שחק שוב 🔄</button>
                <button class="btn btn-purple" onclick="showStartScreen()">לתחנת המשטרה 🏠</button>
            </div>
        </div>
    </div>

    <script>
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'police-chase-app';
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
        
        let db = null;
        let auth = null;
        let currentUser = null;
        let activeUsername = 'אורח';

        function toggleFullScreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
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

        let gameData = {
            coins: 0,
            highScore: 0,
            totalCoinsEarned: 0,
            gamesPlayed: 0,
            upgrades: {
                speed: 1,
                jump: 1,
                magnet: 0,
                multiplier: 1
            }
        };

        async function initCloudSync() {
            if (!firebaseConfig || !window.FirebaseModules) return;
            const { initializeApp, getAuth, signInAnonymously, signInWithCustomToken, getFirestore } = window.FirebaseModules;
            
            try {
                const app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                db = getFirestore(app);

                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
                currentUser = auth.currentUser;

                const localUser = localStorage.getItem('policeChaseUsername');
                if (localUser) {
                    activeUsername = localUser;
                } else {
                    activeUsername = `שוטר_${currentUser.uid.substring(0, 4)}`;
                }

                await loadCloudGameData();
            } catch (err) {
                console.error("Cloud Sync Init Error:", err);
            }
        }

        async function loadCloudGameData() {
            if (!db || !currentUser) return;
            const { doc, getDoc } = window.FirebaseModules;
            
            try {
                const userDocRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'game_data', 'profile');
                const docSnap = await getDoc(userDocRef);

                if (docSnap.exists()) {
                    const cloudData = docSnap.data();
                    if (cloudData.gameData) {
                        gameData = { ...gameData, ...cloudData.gameData };
                    }
                    if (cloudData.username) {
                        activeUsername = cloudData.username;
                    }
                }
            } catch (e) {
                console.error("Error loading from cloud:", e);
            }
            updateUI();
        }

        async function saveGameData() {
            localStorage.setItem('policeChaseSaveData_v3', JSON.stringify(gameData));
            localStorage.setItem('policeChaseUsername', activeUsername);
            updateUI();

            if (db && currentUser) {
                const { doc, setDoc } = window.FirebaseModules;
                try {
                    const userDocRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'game_data', 'profile');
                    await setDoc(userDocRef, {
                        username: activeUsername,
                        gameData: gameData,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });

                    showCloudToast();
                } catch (e) {
                    console.error("Cloud save failed:", e);
                }
            }
        }

        function showCloudToast() {
            const toast = document.getElementById('cloud-toast');
            if (toast) {
                toast.style.display = 'flex';
                toast.style.opacity = '1';
                setTimeout(() => {
                    toast.style.opacity = '0';
                    setTimeout(() => { toast.style.display = 'none'; }, 300);
                }, 1800);
            }
        }

        function openAccountModal() {
            document.getElementById('username-input').value = activeUsername;
            document.getElementById('account-modal').classList.add('active');
        }

        function closeAccountModal() {
            document.getElementById('account-modal').classList.remove('active');
        }

        async function saveAccountFromModal() {
            const newName = document.getElementById('username-input').value.trim();
            if (newName.length > 0) {
                activeUsername = newName;
                await saveGameData();
                closeAccountModal();
            }
        }

        function loadGameData() {
            const saved = localStorage.getItem('policeChaseSaveData_v3');
            if (saved) {
                try {
                    gameData = { ...gameData, ...JSON.parse(saved) };
                } catch(e) { console.error("Save load error", e); }
            }
            updateUI();
        }

        function updateUI() {
            document.getElementById('home-coins').innerText = gameData.coins;
            document.getElementById('shop-coins').innerText = gameData.coins;
            document.getElementById('home-high-score').innerText = Math.floor(gameData.highScore);
            
            const highScoreStart = document.getElementById('high-score-start');
            if (highScoreStart) highScoreStart.innerText = Math.floor(gameData.highScore);
            
            document.getElementById('rec-high-score').innerText = Math.floor(gameData.highScore);
            document.getElementById('rec-total-coins').innerText = gameData.totalCoinsEarned;
            document.getElementById('rec-games-played').innerText = gameData.gamesPlayed;
            
            const nameInput = document.getElementById('direct-user-input');
            if (nameInput && document.activeElement !== nameInput) {
                nameInput.value = activeUsername;
            }
            const userDisplay = document.getElementById('user-display-name');
            if (userDisplay) userDisplay.innerText = activeUsername;

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
        let gameSpeed = 0.6;
        let maxGameSpeed = 1.8;
        let lastTime = 0;
        let spawnTimer = 0;
        let cutsceneTimer = 0;

        const container = document.getElementById('game-container');
        const scene = new THREE.Scene();

        function makeSkyTexture() {
            const c = document.createElement('canvas');
            c.width = 4; c.height = 512;
            const ctx = c.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 0, 512);
            grad.addColorStop(0, '#1c6fd6');
            grad.addColorStop(0.35, '#3f9beb');
            grad.addColorStop(0.65, '#8fd4f5');
            grad.addColorStop(0.85, '#d9f2fb');
            grad.addColorStop(1, '#f3fbff');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 4, 512);
            const tex = new THREE.CanvasTexture(c);
            if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
            return tex;
        }

        const skyTexture = makeSkyTexture();
        scene.background = skyTexture;
        scene.fog = new THREE.FogExp2(0xb9e4f7, 0.0085);

        const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 350);
        camera.position.set(0, 4.2, 8.5);

        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 4));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        container.appendChild(renderer.domElement);

        const hemiLight = new THREE.HemisphereLight(0xbfe3ff, 0x4b4636, 0.65);
        scene.add(hemiLight);

        const ambientLight = new THREE.AmbientLight(0xfff1de, 0.4);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xfff2d9, 1.5);
        dirLight.position.set(-25, 45, 25);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 4096;
        dirLight.shadow.mapSize.height = 4096;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 200;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        dirLight.shadow.bias = -0.0002;
        dirLight.shadow.radius = 3;
        scene.add(dirLight);

        // כדור זוהר לשמש באופק
        function makeGlowSprite(colorHex, size, opacity) {
            const c = document.createElement('canvas');
            c.width = 128; c.height = 128;
            const ctx = c.getContext('2d');
            const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
            grad.addColorStop(0, `rgba(${colorHex}, ${opacity})`);
            grad.addColorStop(0.4, `rgba(${colorHex}, ${opacity * 0.5})`);
            grad.addColorStop(1, `rgba(${colorHex}, 0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 128, 128);
            const tex = new THREE.CanvasTexture(c);
            const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
            const sprite = new THREE.Sprite(mat);
            sprite.scale.set(size, size, 1);
            return sprite;
        }

        const sunSprite = makeGlowSprite('255,247,222', 55, 0.9);
        sunSprite.position.set(-60, 55, -140);
        scene.add(sunSprite);

        // עננים מרחפים ברקע
        const cloudsGroup = new THREE.Group();
        function makeCloudSprite() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 128;
            const ctx = c.getContext('2d');
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            for (let i = 0; i < 6; i++) {
                const cx = 40 + Math.random() * 176;
                const cy = 50 + Math.random() * 30;
                const r = 22 + Math.random() * 26;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();
            }
            const tex = new THREE.CanvasTexture(c);
            const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.85, depthWrite: false });
            return new THREE.Sprite(mat);
        }
        for (let i = 0; i < 10; i++) {
            const cloud = makeCloudSprite();
            const scale = 18 + Math.random() * 20;
            cloud.scale.set(scale, scale * 0.5, 1);
            cloud.position.set((Math.random() - 0.5) * 160, 30 + Math.random() * 20, -Math.random() * 300);
            cloudsGroup.add(cloud);
        }
        scene.add(cloudsGroup);

        const redSirenLight = new THREE.PointLight(0xef4444, 0, 30);
        redSirenLight.position.set(-3, 6, -10);
        scene.add(redSirenLight);

        const blueSirenLight = new THREE.PointLight(0x3b82f6, 0, 30);
        blueSirenLight.position.set(3, 6, -10);
        scene.add(blueSirenLight);

        const roadWidth = 14;
        const roadLength = 350;
        const laneWidth = roadWidth / 3;
        const lanes = [-laneWidth, 0, laneWidth];
        let currentLane = 1;

        function makeAsphaltTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#222e3f';
            ctx.fillRect(0, 0, 256, 256);
            for (let i = 0; i < 900; i++) {
                const shade = 20 + Math.random() * 25;
                ctx.fillStyle = `rgba(${shade + 10},${shade + 20},${shade + 35},${0.15 + Math.random() * 0.2})`;
                const s = Math.random() * 2.2;
                ctx.fillRect(Math.random() * 256, Math.random() * 256, s, s);
            }
            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(3, 30);
            return tex;
        }

        const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
        const roadMat = new THREE.MeshStandardMaterial({ color: 0x2b3a52, roughness: 0.85, map: makeAsphaltTexture() });
        const road = new THREE.Mesh(roadGeo, roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.z = -roadLength / 2 + 10;
        road.receiveShadow = true;
        scene.add(road);

        const stationGroup = new THREE.Group();
        
        const stationWall = new THREE.Mesh(
            new THREE.BoxGeometry(18, 7, 1.5),
            new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
        );
        stationWall.position.set(0, 3.5, -12);
        stationWall.castShadow = true;
        stationWall.receiveShadow = true;
        stationGroup.add(stationWall);

        const signMesh = new THREE.Mesh(
            new THREE.BoxGeometry(10, 1.8, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x1e3a8a })
        );
        signMesh.position.set(0, 6, -11.1);
        stationGroup.add(signMesh);

        const graffitiMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 2.5),
            new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.9 })
        );
        graffitiMesh.position.set(0, 3.2, -11.2);
        stationGroup.add(graffitiMesh);

        scene.add(stationGroup);

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

        const envGroup = new THREE.Group();
        const sidewalkGeo = new THREE.BoxGeometry(8, 0.4, roadLength);
        const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
        const swL = new THREE.Mesh(sidewalkGeo, sidewalkMat);
        swL.position.set(-roadWidth/2 - 4, 0.2, -roadLength/2 + 10);
        swL.receiveShadow = true;
        envGroup.add(swL);

        const swR = new THREE.Mesh(sidewalkGeo, sidewalkMat);
        swR.position.set(roadWidth/2 + 4, 0.2, -roadLength/2 + 10);
        swR.receiveShadow = true;
        envGroup.add(swR);

        const bColors = [0x2563eb, 0xd97706, 0x059669, 0xd97706, 0x7c3aed, 0xe11d48];

        function makeWindowTexture(baseColorHex, rows, cols) {
            const c = document.createElement('canvas');
            c.width = 128; c.height = 256;
            const ctx = c.getContext('2d');
            ctx.fillStyle = baseColorHex;
            ctx.fillRect(0, 0, 128, 256);
            const cellW = 128 / cols;
            const cellH = 256 / rows;
            for (let r = 0; r < rows; r++) {
                for (let col = 0; col < cols; col++) {
                    const lit = Math.random() < 0.35;
                    ctx.fillStyle = lit ? 'rgba(253, 224, 71, 0.85)' : 'rgba(15, 23, 42, 0.55)';
                    const pad = cellW * 0.18;
                    ctx.fillRect(col * cellW + pad, r * cellH + pad, cellW - pad * 2, cellH - pad * 2);
                }
            }
            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            return tex;
        }

        function createBuilding(colorHex, h) {
            const group = new THREE.Group();
            const rows = Math.max(4, Math.round(h / 2));
            const winTex = makeWindowTexture('#' + colorHex.toString(16).padStart(6, '0'), rows, 4);
            const bMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, map: winTex });
            const bGeo = new THREE.BoxGeometry(7, h, 8);
            const body = new THREE.Mesh(bGeo, bMat);
            body.position.y = h / 2;
            body.castShadow = true;
            body.receiveShadow = true;
            group.add(body);

            // גג ופרטי גימור
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });
            const roof = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.3, 8.2), roofMat);
            roof.position.y = h + 0.15;
            roof.castShadow = true;
            group.add(roof);

            if (Math.random() < 0.6) {
                const ac = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 1.2), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
                ac.position.set((Math.random() - 0.5) * 4, h + 0.65, (Math.random() - 0.5) * 4);
                ac.castShadow = true;
                group.add(ac);
            }
            if (Math.random() < 0.5) {
                const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6), new THREE.MeshStandardMaterial({ color: 0x334155 }));
                antenna.position.set((Math.random() - 0.5) * 2, h + 1.55, (Math.random() - 0.5) * 2);
                group.add(antenna);
            }

            return group;
        }

        for(let i = 0; i < 30; i++) {
            const h = 12 + Math.random() * 22;
            const color = bColors[i % bColors.length];

            const bL = createBuilding(color, h);
            bL.position.set(-roadWidth/2 - 8.5, 0, -i * 11 - Math.random()*2);
            envGroup.add(bL);

            const bR = createBuilding(color, h);
            bR.position.set(roadWidth/2 + 8.5, 0, -i * 11 - Math.random()*2);
            envGroup.add(bR);
        }

        // עצי רחוב
        function createTree() {
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18, 0.24, 2.2, 8),
                new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.9 })
            );
            trunk.position.y = 1.1;
            trunk.castShadow = true;
            tree.add(trunk);

            const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f9e4f, roughness: 0.7 });
            const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 8), leafMat);
            leaves.position.y = 2.9;
            leaves.scale.y = 1.15;
            leaves.castShadow = true;
            tree.add(leaves);
            return tree;
        }

        // פנסי רחוב
        function createStreetlight() {
            const lamp = new THREE.Group();
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.1, 5, 8),
                new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
            );
            pole.position.y = 2.5;
            pole.castShadow = true;
            lamp.add(pole);

            const arm = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 0.1, 0.1),
                new THREE.MeshStandardMaterial({ color: 0x334155 })
            );
            arm.position.set(0.55, 4.9, 0);
            lamp.add(arm);

            const bulb = new THREE.Mesh(
                new THREE.SphereGeometry(0.22, 10, 10),
                new THREE.MeshBasicMaterial({ color: 0xfde68a })
            );
            bulb.position.set(1.1, 4.75, 0);
            lamp.add(bulb);

            const glow = makeGlowSprite('253,230,138', 3.2, 0.55);
            glow.position.copy(bulb.position);
            lamp.add(glow);

            return lamp;
        }

        for (let i = 0; i < 16; i++) {
            const z = -i * 20 - 6;
            const treeL = createTree();
            treeL.position.set(-roadWidth/2 - 4.6, 0, z);
            envGroup.add(treeL);

            const lampR = createStreetlight();
            lampR.position.set(roadWidth/2 + 3.2, 0, z + 10);
            lampR.rotation.y = Math.PI;
            envGroup.add(lampR);
        }

        scene.add(envGroup);

        function createWheel() {
            const wheelGroup = new THREE.Group();
            const wGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
            wGeo.rotateZ(Math.PI / 2);
            const wMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
            const wheel = new THREE.Mesh(wGeo, wMat);
            wheel.castShadow = true;
            wheelGroup.add(wheel);

            const rimGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.26, 8);
            rimGeo.rotateZ(Math.PI / 2);
            const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 });
            const rim = new THREE.Mesh(rimGeo, rimMat);
            wheelGroup.add(rim);
            return wheelGroup;
        }

        const carPalette = [0xd97706, 0xdc2626, 0x0f766e, 0x64748b, 0x9333ea];

        function createCarMesh() {
            const car = new THREE.Group();
            const color = carPalette[Math.floor(Math.random() * carPalette.length)];
            const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.35 });
            const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 3.8), bodyMat);
            body.position.y = 0.6;
            body.castShadow = true;
            car.add(body);

            const bumperMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
            const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.35, 0.3), bumperMat);
            bumper.position.set(0, 0.3, -1.85);
            car.add(bumper);

            const glassMat = new THREE.MeshStandardMaterial({ color: 0x1e2a3a, roughness: 0.1, metalness: 0.9 });
            const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 2.0), glassMat);
            cabin.position.set(0, 1.25, -0.2);
            cabin.castShadow = true;
            car.add(cabin);

            const lightGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
            const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
            const lL = new THREE.Mesh(lightGeo, lightMat);
            lL.position.set(-0.7, 0.7, -1.9);
            const lR = lL.clone();
            lR.position.x = 0.7;
            car.add(lL, lR);

            // אורות בלימה אחוריים
            const brakeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
            const brakeGeo = new THREE.BoxGeometry(0.35, 0.2, 0.08);
            const brakeL = new THREE.Mesh(brakeGeo, brakeMat);
            brakeL.position.set(-0.75, 0.75, 1.91);
            const brakeR = brakeL.clone();
            brakeR.position.x = 0.75;
            car.add(brakeL, brakeR);

            // ספוילר קטן
            const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 });
            const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.35), spoilerMat);
            spoiler.position.set(0, 1.15, 1.75);
            car.add(spoiler);

            const wPositions = [
                [-1.0, 0.35, -1.2], [1.0, 0.35, -1.2],
                [-1.0, 0.35, 1.2], [1.0, 0.35, 1.2]
            ];
            wPositions.forEach(pos => {
                const w = createWheel();
                w.position.set(...pos);
                car.add(w);
            });

            return car;
        }

        const vanPalette = [0x0284c7, 0xffffff, 0xf59e0b, 0x475569];

        function createVanMesh() {
            const van = new THREE.Group();
            const bodyMat = new THREE.MeshStandardMaterial({ color: vanPalette[Math.floor(Math.random() * vanPalette.length)], roughness: 0.35, metalness: 0.15 });
            const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.8, 4.6), bodyMat);
            body.position.y = 1.1;
            body.castShadow = true;
            van.add(body);

            const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
            const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 0.1), glassMat);
            windshield.position.set(0, 1.4, -2.31);
            van.add(windshield);

            const brakeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
            const brakeGeo = new THREE.BoxGeometry(0.4, 0.25, 0.08);
            const brakeL = new THREE.Mesh(brakeGeo, brakeMat);
            brakeL.position.set(-0.9, 1.0, 2.31);
            const brakeR = brakeL.clone();
            brakeR.position.x = 0.9;
            van.add(brakeL, brakeR);

            const wPositions = [
                [-1.1, 0.35, -1.5], [1.1, 0.35, -1.5],
                [-1.1, 0.35, 1.5], [1.1, 0.35, 1.5]
            ];
            wPositions.forEach(pos => {
                const w = createWheel();
                w.position.set(...pos);
                van.add(w);
            });

            return van;
        }

        function createBusMesh() {
            const bus = new THREE.Group();
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.2 });
            const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.7, 8.5), bodyMat);
            body.position.y = 1.55;
            body.castShadow = true;
            bus.add(body);

            const roofMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });
            const roof = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 8.5), roofMat);
            roof.position.y = 2.92;
            bus.add(roof);

            const windowMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.15, metalness: 0.6 });
            const sideWindowGeo = new THREE.BoxGeometry(2.52, 0.8, 7.5);
            const sideWindows = new THREE.Mesh(sideWindowGeo, windowMat);
            sideWindows.position.y = 1.9;
            bus.add(sideWindows);

            const signMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
            const destSign = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 0.1), signMat);
            destSign.position.set(0, 2.55, -4.26);
            bus.add(destSign);

            const brakeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
            const brakeGeo = new THREE.BoxGeometry(0.4, 0.3, 0.08);
            const brakeL = new THREE.Mesh(brakeGeo, brakeMat);
            brakeL.position.set(-1.0, 1.2, 4.26);
            const brakeR = brakeL.clone();
            brakeR.position.x = 1.0;
            bus.add(brakeL, brakeR);

            const wPositions = [
                [-1.2, 0.4, -3.0], [1.2, 0.4, -3.0],
                [-1.2, 0.4, 0], [1.2, 0.4, 0],
                [-1.2, 0.4, 3.0], [1.2, 0.4, 3.0]
            ];
            wPositions.forEach(pos => {
                const w = createWheel();
                w.position.set(...pos);
                bus.add(w);
            });

            return bus;
        }

        function createOverheadBarrierMesh() {
            const barrier = new THREE.Group();
            
            const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.5);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
            const pL = new THREE.Mesh(poleGeo, poleMat);
            pL.position.set(-2.0, 1.75, 0);
            const pR = pL.clone();
            pR.position.x = 2.0;
            barrier.add(pL, pR);

            const barGeo = new THREE.BoxGeometry(4.2, 0.6, 0.3);
            const barMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
            const bar = new THREE.Mesh(barGeo, barMat);
            bar.position.set(0, 2.3, 0);
            barrier.add(bar);

            const signGeo = new THREE.BoxGeometry(2.2, 0.5, 0.1);
            const signMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
            const sign = new THREE.Mesh(signGeo, signMat);
            sign.position.set(0, 2.3, 0.2);
            barrier.add(sign);

            return barrier;
        }

        const playerGroup = new THREE.Group();
        scene.add(playerGroup);

        const pBodyGeo = new THREE.BoxGeometry(1.3, 1.6, 0.9);
        const pBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
        const playerBody = new THREE.Mesh(pBodyGeo, pBodyMat);
        playerBody.position.y = 1.1;
        playerBody.castShadow = true;
        playerGroup.add(playerBody);

        const badge = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 0.1),
            new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9 })
        );
        badge.position.set(-0.3, 1.4, 0.47);
        playerGroup.add(badge);

        const pHead = new THREE.Mesh(
            new THREE.BoxGeometry(0.75, 0.75, 0.75),
            new THREE.MeshStandardMaterial({ color: 0xfbcfe8 })
        );
        pHead.position.y = 2.2;
        pHead.castShadow = true;
        playerGroup.add(pHead);

        const hat = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.5, 0.25, 16),
            new THREE.MeshStandardMaterial({ color: 0x0f172a })
        );
        hat.position.y = 2.7;
        playerGroup.add(hat);

        // מגן זוהר קטן על הכובע
        const badgeGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
        );
        badgeGlow.position.set(0, 2.85, 0.35);
        playerGroup.add(badgeGlow);

        const armGeo = new THREE.BoxGeometry(0.3, 1.0, 0.3);
        const armL = new THREE.Mesh(armGeo, pBodyMat);
        armL.position.set(-0.85, 1.1, 0);
        const armR = new THREE.Mesh(armGeo, pBodyMat);
        armR.position.set(0.85, 1.1, 0);
        playerGroup.add(armL, armR);

        const kidGroup = new THREE.Group();
        scene.add(kidGroup);

        const kidBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 1.2, 0.6),
            new THREE.MeshStandardMaterial({ color: 0xef4444 })
        );
        kidBody.position.y = 0.7;
        kidBody.castShadow = true;
        kidGroup.add(kidBody);

        const kidHead = pHead.clone();
        kidHead.position.y = 1.5;
        kidHead.scale.set(0.8, 0.8, 0.8);
        kidGroup.add(kidHead);

        const can = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8),
            new THREE.MeshStandardMaterial({ color: 0x22c55e })
        );
        can.position.set(0.5, 0.8, 0.3);
        kidGroup.add(can);

        kidGroup.position.z = -45;

        const sprayParticles = [];
        const sprayGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const sprayColors = [0xef4444, 0x22c55e, 0x38bdf8, 0xfacc15, 0xa855f7];
        
        function emitSprayParticle() {
            const mat = new THREE.MeshBasicMaterial({ 
                color: sprayColors[Math.floor(Math.random() * sprayColors.length)] 
            });
            const p = new THREE.Mesh(sprayGeo, mat);
            p.position.copy(kidGroup.position);
            p.position.y += 0.8;
            p.position.x += (Math.random() - 0.5) * 0.3;
            scene.add(p);
            sprayParticles.push({ mesh: p, life: 30 });
        }

        const exhaustParticles = [];
        const exhaustGeo = new THREE.SphereGeometry(0.15, 6, 6);
        function emitExhaustParticle(obs) {
            const mat = new THREE.MeshBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.5 });
            const p = new THREE.Mesh(exhaustGeo, mat);
            p.position.set(
                obs.mesh.position.x + (Math.random() - 0.5) * 0.3,
                0.4,
                obs.mesh.position.z + obs.length / 2 + 0.3
            );
            scene.add(p);
            exhaustParticles.push({ mesh: p, life: 25, mat });
        }

        let targetX = lanes[currentLane];
        let isJumping = false;
        let jumpVelocity = 0;
        let playerY = 0;
        let gravity = -0.016;
        let baseJumpStrength = 0.34;
        let isRolling = false;
        let rollTimer = 0;
        let groundHeight = 0;

        const obstacles = [];
        const coinsList = [];

        function spawnObstaclePattern() {
            const lane = Math.floor(Math.random() * 3);
            const r = Math.random();

            if (r < 0.35) {
                const mesh = createCarMesh();
                mesh.position.set(lanes[lane], 0, -140);
                scene.add(mesh);
                obstacles.push({ mesh, type: 'car', lane, height: 1.4, length: 3.8, canJumpOver: true });
            } 
            else if (r < 0.6) {
                const mesh = createBusMesh();
                mesh.position.set(lanes[lane], 0, -140);
                scene.add(mesh);
                obstacles.push({ mesh, type: 'bus', lane, height: 2.8, length: 8.5, canJumpOver: false });
                spawnCoinLine(lane, -140, 4, 3.2);
            } 
            else if (r < 0.8) {
                const mesh = createVanMesh();
                mesh.position.set(lanes[lane], 0, -140);
                scene.add(mesh);
                obstacles.push({ mesh, type: 'van', lane, height: 2.2, length: 4.6, canJumpOver: false });
            } 
            else {
                const mesh = createOverheadBarrierMesh();
                mesh.position.set(lanes[lane], 0, -140);
                scene.add(mesh);
                obstacles.push({ mesh, type: 'overhead', lane, height: 2.3, length: 0.5, mustRoll: true });
            }
        }

        const coinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 16);
        coinGeo.rotateX(Math.PI / 2);
        const coinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.15, emissive: 0xb45309, emissiveIntensity: 0.35 });

        function spawnCoinLine(lane, startZ, count = 5, yPos = 1.0) {
            for (let i = 0; i < count; i++) {
                const coin = new THREE.Mesh(coinGeo, coinMat);
                coin.position.set(lanes[lane], yPos, startZ + (i * 2.2));
                coin.castShadow = true;
                scene.add(coin);
                coinsList.push({ mesh: coin, lane });
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
                const jumpBoost = 1 + (gameData.upgrades.jump - 1) * 0.12;
                jumpVelocity = baseJumpStrength * jumpBoost;
            }
        }

        function roll() {
            if (!isRolling && gameState === 'PLAYING') {
                if (isJumping) {
                    jumpVelocity = -0.45;
                }
                isRolling = true;
                rollTimer = 28;
                playerGroup.scale.y = 0.45;
            }
        }

        window.addEventListener('keydown', (e) => {
            if (gameState !== 'PLAYING') return;
            if (['ArrowLeft', 'a', 'A'].includes(e.key)) moveLeft();
            if (['ArrowRight', 'd', 'D'].includes(e.key)) moveRight();
            if (['ArrowUp', 'w', 'W', ' '].includes(e.key)) jump();
            if (['ArrowDown', 's', 'S'].includes(e.key)) roll();
        });

        let touchStartX = 0, touchStartY = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, {passive: false});

        document.addEventListener('touchend', (e) => {
            if (gameState !== 'PLAYING') return;
            let dx = e.changedTouches[0].screenX - touchStartX;
            let dy = e.changedTouches[0].screenY - touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > 30) (dx > 0) ? moveRight() : moveLeft();
            } else {
                if (Math.abs(dy) > 30) (dy < 0) ? jump() : roll();
            }
        }, {passive: false});

        function checkCollisions() {
            const pBox = new THREE.Box3().setFromObject(playerGroup);
            pBox.expandByScalar(-0.25);

            groundHeight = 0;

            for (let i = 0; i < obstacles.length; i++) {
                const obs = obstacles[i];
                const oBox = new THREE.Box3().setFromObject(obs.mesh);

                if (pBox.intersectsBox(oBox)) {
                    if (obs.type === 'bus' && playerY + 0.2 >= obs.height && playerGroup.position.z <= obs.mesh.position.z + obs.length / 2) {
                        groundHeight = obs.height;
                    } 
                    else if (obs.mustRoll && isRolling) {
                        continue;
                    } 
                    else {
                        gameOver();
                        return;
                    }
                }
            }

            const magnetLvl = gameData.upgrades.magnet;
            const magnetRadius = magnetLvl * 4.0;

            for (let i = coinsList.length - 1; i >= 0; i--) {
                const coinMesh = coinsList[i].mesh;

                if (magnetLvl > 0) {
                    const dist = playerGroup.position.distanceTo(coinMesh.position);
                    if (dist < magnetRadius) {
                        coinMesh.position.lerp(playerGroup.position, 0.18);
                    }
                }

                const cBox = new THREE.Box3().setFromObject(coinMesh);
                if (pBox.intersectsBox(cBox)) {
                    scene.remove(coinMesh);
                    coinsList.splice(i, 1);

                    const multiplier = gameData.upgrades.multiplier;
                    const earned = 1 * multiplier;
                    sessionCoins += earned;
                    gameData.coins += earned;
                    gameData.totalCoinsEarned += earned;

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
            
            camera.position.set(0, 4.2, 8.5);
            camera.lookAt(0, 1.5, 0);
            redSirenLight.intensity = 0;
            blueSirenLight.intensity = 0;
        }

        function startIntroCutscene() {
            showScreen(null);
            gameState = 'INTRO_CUTSCENE';
            cutsceneTimer = 0;

            kidGroup.position.set(0, 0, -10.2);
            kidGroup.rotation.y = Math.PI;

            playerGroup.position.set(0, 0, 2);
            playerGroup.rotation.y = 0;

            camera.position.set(2.5, 2.2, -6);
            camera.lookAt(0, 2.5, -11);
        }

        function startGame() {
            gameState = 'PLAYING';
            gameData.gamesPlayed++;
            saveGameData();

            const speedBoost = 1 + (gameData.upgrades.speed - 1) * 0.1;
            gameSpeed = 0.65 * speedBoost;
            maxGameSpeed = 1.85 * speedBoost;

            kidGroup.rotation.y = 0;
            showScreen('hud');
            lastTime = performance.now();
        }

        function gameOver() {
            gameState = 'GAMEOVER';
            redSirenLight.intensity = 0;
            blueSirenLight.intensity = 0;
            if (score > gameData.highScore) gameData.highScore = score;
            saveGameData();

            document.getElementById('final-time').innerText = Math.floor(score);
            document.getElementById('final-coins').innerText = sessionCoins;
            document.getElementById('high-score-end').innerText = Math.floor(gameData.highScore);
            showScreen('game-over-screen');
        }

        function victory() {
            gameState = 'VICTORY';
            if (score > gameData.highScore) gameData.highScore = score;
            saveGameData();
            showScreen('victory-screen');
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

            kidGroup.position.z = -45;

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
        let kidTargetX = lanes[1];
        let kidTimer = 0;

        function animate() {
            requestAnimationFrame(animate);

            if (gameState === 'INTRO_CUTSCENE') {
                cutsceneTimer += 0.02;

                emitSprayParticle();

                redSirenLight.intensity = Math.sin(cutsceneTimer * 15) > 0 ? 5 : 0;
                blueSirenLight.intensity = Math.cos(cutsceneTimer * 15) > 0 ? 5 : 0;

                if (cutsceneTimer > 1.2 && cutsceneTimer < 2.5) {
                    kidGroup.rotation.y = 0;
                }

                if (cutsceneTimer >= 2.5) {
                    camera.position.lerp(new THREE.Vector3(playerGroup.position.x * 0.35, 4.2, 8.5), 0.1);
                    camera.lookAt(0, 1.5, -10);

                    if (cutsceneTimer >= 3.2) {
                        redSirenLight.intensity = 0;
                        blueSirenLight.intensity = 0;
                        startGame();
                    }
                }
            }
            else if (gameState === 'PLAYING') {
                const currentTime = performance.now();
                const deltaTime = (currentTime - lastTime) / 1000;
                lastTime = currentTime;

                score += deltaTime;
                let displayScore = Math.floor(score * 10);
                document.getElementById('time-display').innerText = displayScore;

                if (displayScore >= WIN_SCORE) victory();

                gameSpeed = Math.min(maxGameSpeed, gameSpeed + (deltaTime * 0.004));

                playerGroup.position.x += (targetX - playerGroup.position.x) * 0.22;
                
                camera.position.x = playerGroup.position.x * 0.35;
                camera.position.y = 4.2 + (playerY * 0.3);
                camera.position.z = 8.5;
                camera.rotation.z = -(targetX - playerGroup.position.x) * 0.03;

                animStep += gameSpeed * 0.22;
                armL.rotation.x = Math.sin(animStep) * 0.7;
                armR.rotation.x = -Math.sin(animStep) * 0.7;

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

                kidTimer -= 1;
                if (kidTimer <= 0) {
                    kidTargetX = lanes[Math.floor(Math.random() * 3)];
                    kidTimer = 40 + Math.random() * 40;
                }
                kidGroup.position.x += (kidTargetX - kidGroup.position.x) * 0.12;
                kidGroup.position.y = Math.abs(Math.sin(currentTime * 0.012)) * 0.3;

                if (Math.random() < 0.4) emitSprayParticle();

                for (let i = sprayParticles.length - 1; i >= 0; i--) {
                    const sp = sprayParticles[i];
                    sp.mesh.position.z += gameSpeed * 0.8;
                    sp.life--;
                    if (sp.life <= 0) {
                        scene.remove(sp.mesh);
                        sprayParticles.splice(i, 1);
                    }
                }

                spawnTimer += gameSpeed;
                if (spawnTimer > 18) {
                    spawnObstaclePattern();
                    if (Math.random() < 0.5) {
                        const coinLane = Math.floor(Math.random() * 3);
                        spawnCoinLine(coinLane, -140, 5, 1.0);
                    }
                    spawnTimer = 0;
                }

                stationGroup.position.z += gameSpeed;

                lineGroup.position.z += gameSpeed;
                if (lineGroup.position.z > 10) lineGroup.position.z -= 10;

                for (let i = obstacles.length - 1; i >= 0; i--) {
                    obstacles[i].mesh.position.z += gameSpeed;
                    if (obstacles[i].type !== 'overhead' && Math.random() < 0.06) {
                        emitExhaustParticle(obstacles[i]);
                    }
                    if (obstacles[i].mesh.position.z > 15) {
                        scene.remove(obstacles[i].mesh);
                        obstacles.splice(i, 1);
                    }
                }

                for (let i = exhaustParticles.length - 1; i >= 0; i--) {
                    const ep = exhaustParticles[i];
                    ep.mesh.position.z += gameSpeed;
                    ep.mesh.position.y += 0.01;
                    ep.mesh.scale.multiplyScalar(1.03);
                    ep.life--;
                    ep.mat.opacity = Math.max(0, ep.life / 25 * 0.5);
                    if (ep.life <= 0) {
                        scene.remove(ep.mesh);
                        exhaustParticles.splice(i, 1);
                    }
                }

                cloudsGroup.children.forEach(cloud => {
                    cloud.position.z += gameSpeed * 0.15;
                    if (cloud.position.z > 20) cloud.position.z -= 300;
                });

                for (let i = coinsList.length - 1; i >= 0; i--) {
                    coinsList[i].mesh.position.z += gameSpeed;
                    coinsList[i].mesh.rotation.y += 0.08;
                    if (coinsList[i].mesh.position.z > 15) {
                        scene.remove(coinsList[i].mesh);
                        coinsList.splice(i, 1);
                    }
                }

                checkCollisions();

            } else if (gameState === 'VICTORY') {
                playerGroup.position.z -= 0.35;
                camera.position.z = playerGroup.position.z + 7;
            } else if (gameState === 'START') {
                lineGroup.position.z += 0.1;
                if (lineGroup.position.z > 10) lineGroup.position.z -= 10;
                cloudsGroup.children.forEach(cloud => {
                    cloud.position.x += 0.01;
                });
            }

            renderer.render(scene, camera);
        }

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 4));
        });

        window.onload = function() {
            loadGameData();
            initCloudSync();
            animate();
        };
    </script>
</body>
</html>
