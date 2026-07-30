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

        .booster-active {
            animation: pulseGlow 1s infinite alternate;
        }

        @keyframes pulseGlow {
            from { box-shadow: 0 0 10px rgba(245, 158, 11, 0.5); }
            to { box-shadow: 0 0 22px rgba(245, 158, 11, 0.95); }
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
            <div id="booster-card" class="hud-card booster-active" style="display: none; background: rgba(245, 158, 11, 0.9); border-color: #fef08a;">
                <span id="booster-icon">🦘</span> <span id="booster-text">קנגורו: 20s</span>
            </div>
            <div class="hud-card">🎯 <span id="time-display">0</span></div>
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
                    <li>🦘 <b>תחפושת קנגורו:</b> אוסף עיגול קנגורו לקבלת תחפושת ל-20 שניות וקפיצה סופר-גבוהה!</li>
                    <li>🚌 <b>אוטובוסים:</b> קפוץ על הגג של האוטובוס ותוכל לרוץ ולדרוך עליו בחופשיות!</li>
                    <li>👶 <b>הילד השובב:</b> מופיע על הכביש החל מ-2000 נקודות!</li>
                    <li>🚗 <b>מכוניות:</b> מעט מכוניות בהתחלה, כמות הרכבים והמהירות עולות הדרגתית.</li>
                    <li>🪙 <b>מטבעות ושדרוגים:</b> אוסף מטבעות בשבילים כדי לשדרג מהירות, קפיצה ומגנט בחנות!</li>
                </ul>

                <div class="bg-amber-500/20 border border-amber-400/50 rounded-xl p-3 text-center mt-3">
                    <div class="text-amber-300 font-extrabold text-lg">🏆 שיא השיאים שלך: <span id="home-high-score">0</span></div>
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
                <p>🥇 שיא ניקוד: <span id="rec-high-score">0</span></p>
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
                <p>ניקוד שהושג: <span id="final-time">0</span></p>
                <p>מטבעות שנאספו: <span id="final-coins">0</span> 🪙</p>
                <p>שיא אישי: <span id="high-score-end">0</span></p>
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
                <p>הצלחת להגיע ל-100,000 נקודות!</p>
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
            localStorage.setItem('policeChaseSaveData_v4', JSON.stringify(gameData));
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
            const saved = localStorage.getItem('policeChaseSaveData_v4');
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
        let gameSpeed = 0.5;
        let maxGameSpeed = 1.8;
        let lastTime = 0;
        let spawnTimer = 0;
        let cutsceneTimer = 0;

        const container = document.getElementById('game-container');
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x38bdf8);
        scene.fog = new THREE.FogExp2(0x38bdf8, 0.008);

        // 🎥 מצלמה מוגבהת במיוחד מלמעלה (Subway Surfers Overhead Angle)
        const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 350);
        camera.position.set(0, 9.5, 9.5);

        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 4));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
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
        dirLight.shadow.bias = -0.0001;
        scene.add(dirLight);

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

        const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
        const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
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
        for(let i = 0; i < 30; i++) {
            const h = 12 + Math.random() * 22;
            const bGeo = new THREE.BoxGeometry(7, h, 8);
            const bMat = new THREE.MeshStandardMaterial({ color: bColors[i % bColors.length], roughness: 0.4 });
            
            const bL = new THREE.Mesh(bGeo, bMat);
            bL.position.set(-roadWidth/2 - 8.5, h/2, -i * 11 - Math.random()*2);
            bL.castShadow = true;
            envGroup.add(bL);

            const bR = new THREE.Mesh(bGeo, bMat);
            bR.position.set(roadWidth/2 + 8.5, h/2, -i * 11 - Math.random()*2);
            bR.castShadow = true;
            envGroup.add(bR);
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

        function createCarMesh() {
            const car = new THREE.Group();
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.1 });
            const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 3.8), bodyMat);
            body.position.y = 0.6;
            body.castShadow = true;
            car.add(body);

            const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.9 });
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

        function createBusMesh() {
            const bus = new THREE.Group();
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.2 });
            const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.7, 8.5), bodyMat);
            body.position.y = 1.55;
            body.castShadow = true;
            bus.add(body);

            const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
            const roof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 8.5), roofMat);
            roof.position.y = 2.92;
            roof.castShadow = true;
            roof.receiveShadow = true;
            bus.add(roof);

            const windowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
            const sideWindowGeo = new THREE.BoxGeometry(2.62, 0.8, 7.5);
            const sideWindows = new THREE.Mesh(sideWindowGeo, windowMat);
            sideWindows.position.y = 1.9;
            bus.add(sideWindows);

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

        function createPoliceJetMesh() {
            const jet = new THREE.Group();
            const bodyGeo = new THREE.ConeGeometry(0.9, 3.8, 8);
            bodyGeo.rotateX(-Math.PI / 2);
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.2 });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.z = -0.5;
            body.castShadow = true;
            jet.add(body);

            const wingGeo = new THREE.BoxGeometry(4.2, 0.1, 1.2);
            const wingMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6 });
            const wings = new THREE.Mesh(wingGeo, wingMat);
            wings.position.set(0, 0, 0.2);
            jet.add(wings);

            const canopyGeo = new THREE.SphereGeometry(0.45, 12, 12);
            canopyGeo.scale(0.8, 0.6, 1.5);
            const canopyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85, metalness: 0.9 });
            const canopy = new THREE.Mesh(canopyGeo, canopyMat);
            canopy.position.set(0, 0.4, -0.3);
            jet.add(canopy);

            const engineGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.6, 12);
            engineGeo.rotateX(Math.PI / 2);
            const engineMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
            const engine = new THREE.Mesh(engineGeo, engineMat);
            engine.position.set(0, 0, 1.3);
            jet.add(engine);

            return jet;
        }

        const policeJetMesh = createPoliceJetMesh();
        policeJetMesh.visible = false;
        scene.add(policeJetMesh);

        function createKangarooPowerupMesh() {
            const group = new THREE.Group();
            
            const coinGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.15, 24);
            coinGeo.rotateX(Math.PI / 2);
            const coinMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.4, roughness: 0.3 });
            const coinMesh = new THREE.Mesh(coinGeo, coinMat);
            group.add(coinMesh);

            const rimGeo = new THREE.TorusGeometry(0.65, 0.06, 12, 24);
            const rimMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.1 });
            const rimMesh = new THREE.Mesh(rimGeo, rimMat);
            group.add(rimMesh);

            const kangarooGeo = new THREE.BoxGeometry(0.45, 0.45, 0.18);
            const kangarooMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8 });
            const kangarooMesh = new THREE.Mesh(kangarooGeo, kangarooMat);
            group.add(kangarooMesh);

            const aura = new THREE.Mesh(
                new THREE.SphereGeometry(0.9, 12, 12),
                new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.35, wireframe: true })
            );
            group.add(aura);

            return group;
        }

        function createPowerupPickupMesh(type) {
            if (type === 'kangaroo') {
                return createKangarooPowerupMesh();
            } else if (type === 'plane') {
                const group = new THREE.Group();
                const planeMesh = createPoliceJetMesh();
                planeMesh.scale.set(0.45, 0.45, 0.45);
                group.add(planeMesh);
                return group;
            } else if (type === 'superMagnet') {
                const group = new THREE.Group();
                const geo = new THREE.TorusGeometry(0.5, 0.18, 12, 24);
                const mat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8 });
                group.add(new THREE.Mesh(geo, mat));
                return group;
            }
        }

        const skyClouds = new THREE.Group();
        const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, roughness: 0.9 });
        for (let i = 0; i < 20; i++) {
            const cloud = new THREE.Group();
            for (let j = 0; j < 4; j++) {
                const part = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random() * 2.5, 8, 8), cloudMat);
                part.position.set((j - 1.5) * 2, Math.random() * 1.5, Math.random() * 1.5);
                cloud.add(part);
            }
            cloud.position.set((Math.random() - 0.5) * 60, 18 + Math.random() * 8, -i * 20);
            skyClouds.add(cloud);
        }
        scene.add(skyClouds);

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

            return barrier;
        }

        // 👮‍♂️ דמות השחקן (שוטר אורגני מעוגל)
        const playerGroup = new THREE.Group();
        scene.add(playerGroup);

        const policeAvatarGroup = new THREE.Group();

        // חומרים איכותיים
        const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35 }); 
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 }); 
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.65 }); 
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 }); 
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.1 }); 

        // 1. בטן עגולה ושמנמנה (מבוסס כדור מוחלק ולא קוביה)
        const bellyGeo = new THREE.SphereGeometry(0.78, 24, 24);
        bellyGeo.scale(1.18, 1.1, 1.05);
        const belly = new THREE.Mesh(bellyGeo, shirtMat);
        belly.position.y = 1.15;
        belly.castShadow = true;
        policeAvatarGroup.add(belly);

        // חגורה שחורה מעוגלת
        const beltGeo = new THREE.CylinderGeometry(0.82, 0.82, 0.18, 24);
        const belt = new THREE.Mesh(beltGeo, blackMat);
        belt.position.y = 0.72;
        policeAvatarGroup.add(belt);

        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.1), goldMat);
        buckle.position.set(0, 0.72, 0.81);
        policeAvatarGroup.add(buckle);

        // כפתורי זהב בחזית
        for (let b = 0; b < 3; b++) {
            const button = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 12), goldMat);
            button.rotation.x = Math.PI / 2;
            button.position.set(0, 0.98 + (b * 0.22), 0.79);
            policeAvatarGroup.add(button);
        }

        // תג זהב מעוגל
        const pBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.05, 12), goldMat);
        pBadge.rotation.x = Math.PI / 2;
        pBadge.position.set(-0.35, 1.35, 0.72);
        policeAvatarGroup.add(pBadge);

        // 2. ראש עגול ורך (Sphere)
        const headGeo = new THREE.SphereGeometry(0.5, 24, 24);
        headGeo.scale(1.02, 1.08, 1.0);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 2.18;
        head.castShadow = true;
        policeAvatarGroup.add(head);

        // לחיים עגולות
        const cheekGeo = new THREE.SphereGeometry(0.19, 12, 12);
        const cheekL = new THREE.Mesh(cheekGeo, skinMat);
        cheekL.position.set(-0.28, 2.05, 0.32);
        const cheekR = cheekL.clone();
        cheekR.position.x = 0.28;
        policeAvatarGroup.add(cheekL, cheekR);

        // אף עגול
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), skinMat);
        nose.position.set(0, 2.15, 0.48);
        policeAvatarGroup.add(nose);

        // 3. כובע שוטר מעוגל עם מצחייה קמורה ותג
        const hatTopGeo = new THREE.SphereGeometry(0.52, 24, 16);
        hatTopGeo.scale(1.05, 0.45, 1.05);
        const hatTop = new THREE.Mesh(hatTopGeo, shirtMat);
        hatTop.position.y = 2.62;
        policeAvatarGroup.add(hatTop);

        const hatVisorGeo = new THREE.CylinderGeometry(0.56, 0.58, 0.05, 24, 1, false, 0, Math.PI);
        const hatVisor = new THREE.Mesh(hatVisorGeo, blackMat);
        hatVisor.position.set(0, 2.52, 0.15);
        hatVisor.rotation.x = 0.25;
        policeAvatarGroup.add(hatVisor);

        const hatBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 12), goldMat);
        hatBadge.rotation.x = Math.PI / 2;
        hatBadge.position.set(0, 2.68, 0.49);
        policeAvatarGroup.add(hatBadge);

        // 4. זרועות עגולות ורכות
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

        // 5. רגליים ומגפיים עגולות
        const legGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.55, 16);
        const bootGeo = new THREE.SphereGeometry(0.28, 16, 16);
        bootGeo.scale(0.9, 0.7, 1.3);

        const legL = new THREE.Mesh(legGeo, pantsMat);
        legL.position.set(-0.32, 0.38, 0);
        const bootL = new THREE.Mesh(bootGeo, blackMat);
        bootL.position.set(-0.32, 0.16, 0.1);
        bootL.castShadow = true;

        const legR = new THREE.Mesh(legGeo, pantsMat);
        legR.position.set(0.32, 0.38, 0);
        const bootR = new THREE.Mesh(bootGeo, blackMat);
        bootR.position.set(0.32, 0.16, 0.1);
        bootR.castShadow = true;

        policeAvatarGroup.add(legL, bootL, legR, bootR);

        playerGroup.add(policeAvatarGroup);

        // תחפושת קנגורו
        const kangarooAvatarGroup = new THREE.Group();
        const kMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
        const kBody = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 20), kMat);
        kBody.position.y = 1.1;
        kangarooAvatarGroup.add(kBody);

        const kPouch = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfef08a }));
        kPouch.position.set(0, 0.9, 0.55);
        kangarooAvatarGroup.add(kPouch);

        const kHead = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), kMat);
        kHead.position.set(0, 2.2, 0.2);
        kangarooAvatarGroup.add(kHead);

        const kEarL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 0.65, 12), kMat);
        kEarL.position.set(-0.25, 2.8, 0.1);
        const kEarR = kEarL.clone();
        kEarR.position.x = 0.25;
        kangarooAvatarGroup.add(kEarL, kEarR);

        const kTail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.28, 1.4), kMat);
        kTail.rotation.x = Math.PI / 3;
        kTail.position.set(0, 0.6, -0.8);
        kangarooAvatarGroup.add(kTail);

        kangarooAvatarGroup.visible = false;
        playerGroup.add(kangarooAvatarGroup);

        // דמות הילד השובב
        const kidGroup = new THREE.Group();
        kidGroup.visible = false;
        scene.add(kidGroup);

        const kidBody = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xef4444 })
        );
        kidBody.position.y = 0.7;
        kidBody.castShadow = true;
        kidGroup.add(kidBody);

        const kidHead = head.clone();
        kidHead.position.y = 1.5;
        kidHead.scale.set(0.75, 0.75, 0.75);
        kidGroup.add(kidHead);

        const can = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8),
            new THREE.MeshStandardMaterial({ color: 0x22c55e })
        );
        can.position.set(0.5, 0.8, 0.3);
        kidGroup.add(can);

        kidGroup.position.z = -35;

        const sprayParticles = [];
        const sprayGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const sprayColors = [0xef4444, 0x22c55e, 0x38bdf8, 0xfacc15, 0xa855f7];
        
        function emitSprayParticle() {
            if (!kidGroup.visible) return;
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
        const powerupsList = [];

        let activeBooster = null;
        let boosterTimeRemaining = 0;
        let isFlyingInPlane = false;
        const SKY_Y = 16.0;

        function spawnObstaclePattern() {
            if (isFlyingInPlane) return;

            const lane = Math.floor(Math.random() * 3);
            const r = Math.random();

            let carSpawnChance = 0.25 + Math.min(0.45, score / 10000);

            if (r < carSpawnChance) {
                const mesh = createCarMesh();
                mesh.position.set(lanes[lane], 0, -140);
                scene.add(mesh);
                obstacles.push({ mesh, type: 'car', lane, height: 1.4, length: 3.8 });
            } 
            else if (r < carSpawnChance + 0.3) {
                const mesh = createBusMesh();
                mesh.position.set(lanes[lane], 0, -140);
                scene.add(mesh);
                obstacles.push({ mesh, type: 'bus', lane, height: 2.8, length: 8.5 });
                spawnCoinLine(lane, -140, 4, 3.2);
            } 
            else {
                const mesh = createOverheadBarrierMesh();
                mesh.position.set(lanes[lane], 0, -140);
                scene.add(mesh);
                obstacles.push({ mesh, type: 'overhead', lane, height: 2.3, length: 0.5, mustRoll: true });
            }

            if (Math.random() < 0.11 && !isFlyingInPlane) {
                const pLane = (lane + 1) % 3;
                const randType = Math.random();
                let pType = 'kangaroo';
                if (randType < 0.5) pType = 'kangaroo';
                else if (randType < 0.8) pType = 'superMagnet';
                else pType = 'plane';

                spawnPowerup(pLane, -135, pType);
            }
        }

        function spawnPowerup(lane, zPos, type) {
            const mesh = createPowerupPickupMesh(type);
            mesh.position.set(lanes[lane], 1.5, zPos);
            scene.add(mesh);
            powerupsList.push({ mesh, type, lane });
        }

        const coinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 16);
        coinGeo.rotateX(Math.PI / 2);
        const coinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.2 });

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
            if (!isJumping && !isRolling && !isFlyingInPlane && gameState === 'PLAYING') {
                isJumping = true;
                let jumpBoost = 1 + (gameData.upgrades.jump - 1) * 0.12;
                
                if (activeBooster === 'kangaroo') jumpBoost *= 2.5;

                jumpVelocity = baseJumpStrength * jumpBoost;
            }
        }

        function roll() {
            if (!isFlyingInPlane && gameState === 'PLAYING') {
                if (isJumping) {
                    jumpVelocity = -0.38;
                }
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

        let touchStartX = 0;
        let touchStartY = 0;

        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            if (gameState !== 'PLAYING') return;
            if (e.changedTouches.length > 0) {
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const dx = touchEndX - touchStartX;
                const dy = touchEndY - touchStartY;
                const minSwipe = 25;

                if (Math.abs(dx) > Math.abs(dy)) {
                    if (Math.abs(dx) > minSwipe) {
                        if (dx > 0) moveRight();
                        else moveLeft();
                    }
                } else {
                    if (Math.abs(dy) > minSwipe) {
                        if (dy < 0) jump();
                        else roll();
                    }
                }
            }
        }, { passive: true });

        function triggerBooster(type) {
            activeBooster = type;
            const boosterCard = document.getElementById('booster-card');
            const boosterIcon = document.getElementById('booster-icon');
            const boosterText = document.getElementById('booster-text');

            if (type === 'kangaroo') {
                boosterTimeRemaining = 20.0;
                policeAvatarGroup.visible = false;
                kangarooAvatarGroup.visible = true;
                boosterIcon.innerText = '🦘';
                boosterText.innerText = `קנגורו: 20s`;
            } else if (type === 'plane') {
                boosterTimeRemaining = 25.0;
                isFlyingInPlane = true;
                policeJetMesh.visible = true;
                playerGroup.visible = false;
                boosterIcon.innerText = '✈️';
                boosterText.innerText = `טיסה: 25s`;

                for (let i = 0; i < 10; i++) {
                    const skyLane = Math.floor(Math.random() * 3);
                    spawnCoinLine(skyLane, -40 - (i * 12), 6, SKY_Y);
                }
            } else if (type === 'superMagnet') {
                boosterTimeRemaining = 14.0;
                boosterIcon.innerText = '🧲';
                boosterText.innerText = `סופר מגנט: 14s`;
            }

            if (boosterCard) boosterCard.style.display = 'flex';
        }

        function updateBoosterState(deltaTime) {
            if (!activeBooster) return;

            boosterTimeRemaining -= deltaTime;
            const boosterText = document.getElementById('booster-text');

            if (boosterTimeRemaining <= 0) {
                if (activeBooster === 'plane') {
                    isFlyingInPlane = false;
                    policeJetMesh.visible = false;
                    playerGroup.visible = true;
                } else if (activeBooster === 'kangaroo') {
                    policeAvatarGroup.visible = true;
                    kangarooAvatarGroup.visible = false;
                }
                activeBooster = null;
                const boosterCard = document.getElementById('booster-card');
                if (boosterCard) boosterCard.style.display = 'none';
            } else if (boosterText) {
                const label = activeBooster === 'kangaroo' ? 'קנגורו' : activeBooster === 'plane' ? 'טיסה' : 'סופר מגנט';
                boosterText.innerText = `${label}: ${Math.ceil(boosterTimeRemaining)}s`;
            }
        }

        function checkCollisions() {
            const pBox = new THREE.Box3().setFromObject(isFlyingInPlane ? policeJetMesh : playerGroup);
            pBox.expandByScalar(-0.25);

            let calculatedGroundHeight = isFlyingInPlane ? SKY_Y : 0;

            if (!isFlyingInPlane) {
                for (let i = 0; i < obstacles.length; i++) {
                    const obs = obstacles[i];
                    const oBox = new THREE.Box3().setFromObject(obs.mesh);

                    if (pBox.intersectsBox(oBox)) {
                        if (obs.type === 'bus' && (playerY >= obs.height - 0.4 || playerGroup.position.y >= obs.height - 0.4)) {
                            calculatedGroundHeight = obs.height;
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
            }

            groundHeight = calculatedGroundHeight;

            for (let i = powerupsList.length - 1; i >= 0; i--) {
                const pwMesh = powerupsList[i].mesh;
                const pwBox = new THREE.Box3().setFromObject(pwMesh);

                if (pBox.intersectsBox(pwBox)) {
                    triggerBooster(powerupsList[i].type);
                    scene.remove(pwMesh);
                    powerupsList.splice(i, 1);
                }
            }

            const magnetLvl = gameData.upgrades.magnet;
            let magnetRadius = magnetLvl * 4.0;
            if (activeBooster === 'superMagnet') magnetRadius = 25.0;

            for (let i = coinsList.length - 1; i >= 0; i--) {
                const coinMesh = coinsList[i].mesh;

                if (magnetRadius > 0) {
                    const currentPos = isFlyingInPlane ? policeJetMesh.position : playerGroup.position;
                    const dist = currentPos.distanceTo(coinMesh.position);
                    if (dist < magnetRadius) {
                        coinMesh.position.lerp(currentPos, 0.22);
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
            
            camera.position.set(0, 9.5, 9.5);
            camera.lookAt(0, 1.0, -12);
            redSirenLight.intensity = 0;
            blueSirenLight.intensity = 0;
        }

        function startIntroCutscene() {
            showScreen(null);
            gameState = 'INTRO_CUTSCENE';
            cutsceneTimer = 0;

            playerGroup.position.set(0, 0, 0);
            playerGroup.rotation.y = 0;

            camera.position.set(1.5, 2.5, -4);
            camera.lookAt(0, 1.5, -10);
        }

        function startGame() {
            gameState = 'PLAYING';
            gameData.gamesPlayed++;
            saveGameData();

            const speedBoost = 1 + (gameData.upgrades.speed - 1) * 0.08;
            gameSpeed = 0.5 * speedBoost;
            maxGameSpeed = 1.8 * speedBoost;

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

            powerupsList.forEach(p => scene.remove(p.mesh));
            powerupsList.length = 0;

            activeBooster = null;
            isFlyingInPlane = false;
            policeJetMesh.visible = false;
            playerGroup.visible = true;
            policeAvatarGroup.visible = true;
            kangarooAvatarGroup.visible = false;

            const boosterCard = document.getElementById('booster-card');
            if (boosterCard) boosterCard.style.display = 'none';

            currentLane = 1;
            targetX = lanes[currentLane];
            playerGroup.position.set(targetX, 0, 0);
            isJumping = false;
            jumpVelocity = 0;
            playerY = 0;
            groundHeight = 0;
            isRolling = false;
            playerGroup.scale.y = 1;

            kidGroup.visible = false;
            kidGroup.position.z = -35;

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

                redSirenLight.intensity = Math.sin(cutsceneTimer * 15) > 0 ? 5 : 0;
                blueSirenLight.intensity = Math.cos(cutsceneTimer * 15) > 0 ? 5 : 0;

                if (cutsceneTimer >= 1.8) {
                    camera.position.lerp(new THREE.Vector3(playerGroup.position.x * 0.45, 9.5, 9.5), 0.1);
                    camera.lookAt(0, 1.2, -12);

                    if (cutsceneTimer >= 2.6) {
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

                score += deltaTime * 100;
                let displayScore = Math.floor(score);
                document.getElementById('time-display').innerText = displayScore;

                if (displayScore >= 2000) {
                    kidGroup.visible = true;
                }

                if (displayScore >= WIN_SCORE) victory();

                updateBoosterState(deltaTime);

                gameSpeed = Math.min(maxGameSpeed, gameSpeed + (deltaTime * 0.003));

                if (isFlyingInPlane) {
                    policeJetMesh.position.x += (targetX - policeJetMesh.position.x) * 0.22;
                    policeJetMesh.position.y = THREE.MathUtils.lerp(policeJetMesh.position.y, SKY_Y, 0.1);
                    policeJetMesh.position.z = 0;

                    if (kidGroup.visible) {
                        kidGroup.position.x = policeJetMesh.position.x;
                        kidGroup.position.y = SKY_Y;
                        kidGroup.position.z = -35;
                    }

                    camera.position.x = policeJetMesh.position.x * 0.45;
                    camera.position.y = SKY_Y + 6.0;
                    camera.position.z = 10.5;
                    camera.lookAt(policeJetMesh.position.x * 0.25, SKY_Y + 1.0, -12);
                } else {
                    playerGroup.position.x += (targetX - playerGroup.position.x) * 0.22;
                    
                    // 🎥 מצלמה גבוהה מזווית עליונה (Top-down / Overhead view)
                    camera.position.x = playerGroup.position.x * 0.45;
                    camera.position.y = 9.5 + (playerY * 0.5);
                    camera.position.z = 9.5;
                    camera.lookAt(playerGroup.position.x * 0.25, 1.2 + (playerY * 0.35), -12);

                    animStep += gameSpeed * 0.22;
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
                }

                skyClouds.position.z += gameSpeed * 0.6;
                if (skyClouds.position.z > 100) skyClouds.position.z = 0;

                if (kidGroup.visible) {
                    kidTimer -= 1;
                    if (kidTimer <= 0) {
                        kidTargetX = lanes[Math.floor(Math.random() * 3)];
                        kidTimer = 40 + Math.random() * 40;
                    }
                    kidGroup.position.x += (kidTargetX - kidGroup.position.x) * 0.12;
                    kidGroup.position.y = (isFlyingInPlane ? SKY_Y : 0) + Math.abs(Math.sin(currentTime * 0.012)) * 0.3;

                    if (Math.random() < 0.4) emitSprayParticle();
                }

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
                if (spawnTimer > 20) {
                    spawnObstaclePattern();
                    if (Math.random() < 0.5 && !isFlyingInPlane) {
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

                for (let i = powerupsList.length - 1; i >= 0; i--) {
                    powerupsList[i].mesh.position.z += gameSpeed;
                    powerupsList[i].mesh.rotation.y += 0.05;
                    if (powerupsList[i].mesh.position.z > 15) {
                        scene.remove(powerupsList[i].mesh);
                        powerupsList.splice(i, 1);
                    }
                }

                checkCollisions();

            } else if (gameState === 'VICTORY') {
                playerGroup.position.z -= 0.35;
                camera.position.z = playerGroup.position.z + 9.5;
            } else if (gameState === 'START') {
                lineGroup.position.z += 0.1;
                if (lineGroup.position.z > 10) lineGroup.position.z -= 10;
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
