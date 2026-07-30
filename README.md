from pathlib import Path

html = r'''<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>POLICE CHASE</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<style>
*{box-sizing:border-box}
html,body{margin:0;width:100%;height:100%;overflow:hidden;font-family:Arial,sans-serif;background:#0f172a}
#game-container{position:fixed;inset:0}
.ui-layer{position:fixed;inset:0;pointer-events:none;z-index:10}
.screen,.hud{pointer-events:auto;display:none}
.screen.active,.hud.active{display:flex}
.screen{position:absolute;inset:0;align-items:center;justify-content:center;flex-direction:column;padding:20px;text-align:center;background:rgba(2,6,23,.45);overflow:auto}
.title{font-size:58px;font-weight:1000;color:white;text-shadow:0 6px 0 #075985;margin:0 0 16px}
.story-card,.stats-box{max-width:720px;width:min(94vw,720px);background:rgba(15,23,42,.94);border:2px solid rgba(56,189,248,.55);border-radius:22px;padding:22px;color:white;box-shadow:0 20px 60px rgba(0,0,0,.35)}
.story-title{font-size:21px;color:#fbbf24;font-weight:900;border-bottom:2px solid rgba(251,191,36,.3);padding-bottom:6px;margin:10px 0}
.story-text{font-size:16px;line-height:1.65;color:#cbd5e1}
.rules-list{list-style:none;padding:0;margin:10px 0;color:#e2e8f0;text-align:right;line-height:1.7}
.nav-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:14px}
.btn{border:0;border-radius:14px;padding:12px 20px;background:#0284c7;color:#fff;font-weight:900;font-size:16px;cursor:pointer;box-shadow:0 5px 0 #075985}
.btn:hover{filter:brightness(1.08)}
.btn-orange{background:#f59e0b;box-shadow:0 5px 0 #b45309}
.btn-purple{background:#8b5cf6;box-shadow:0 5px 0 #6d28d9}
.btn-gray{background:#64748b;box-shadow:0 5px 0 #334155}
.btn-sm{padding:8px 13px;font-size:14px}
.hud{position:absolute;top:15px;left:15px;right:15px;justify-content:space-between;align-items:flex-start}
.hud-card{background:rgba(15,23,42,.88);color:white;border:2px solid rgba(56,189,248,.55);border-radius:15px;padding:9px 14px;font-weight:900;font-size:20px}
.fullscreen-btn{position:fixed;right:14px;bottom:14px;z-index:30;border:0;border-radius:12px;background:rgba(15,23,42,.88);color:#fff;padding:10px 14px;font-weight:900;cursor:pointer}
.direct-name-input{background:#fff;border:2px solid #38bdf8;border-radius:10px;padding:5px 10px;font-size:16px;font-weight:bold;width:160px;text-align:center}
.grid-upgrades{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:min(94vw,720px)}
.upgrade-card{background:rgba(30,41,59,.95);border:1px solid #475569;border-radius:16px;padding:16px;color:white;display:flex;align-items:center;justify-content:space-between;gap:10px}
.upgrade-title{font-weight:900}.upgrade-level{color:#94a3b8;font-size:13px;margin-top:5px}
.records{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:15px}
.record{background:#1e293b;border-radius:14px;padding:15px}.record b{display:block;font-size:24px;color:#fbbf24}
.modal-overlay{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.65);z-index:40}
.modal-overlay.active{display:flex}
#cloud-toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);display:none;opacity:0;background:#16a34a;color:#fff;padding:10px 16px;border-radius:12px;font-weight:bold;z-index:50}
@media(max-width:650px){.title{font-size:40px}.grid-upgrades{grid-template-columns:1fr}.records{grid-template-columns:1fr}.story-card{padding:16px}.hud-card{font-size:16px}}
</style>
</head>
<body>
<div id="game-container"></div>
<button class="fullscreen-btn" onclick="toggleFullScreen()">⛶ מסך מלא</button>
<div id="cloud-toast">☁️ ההתקדמות נשמרה!</div>

<div id="account-modal" class="modal-overlay">
  <div class="stats-box" style="max-width:420px">
    <h2 style="color:#38bdf8">👤 התחברות / החלפת משתמש</h2>
    <p>הכנס שם משתמש לשמירת ההתקדמות.</p>
    <input id="username-input" class="direct-name-input" style="width:100%;margin:10px 0" placeholder="שם משתמש">
    <div class="nav-row">
      <button class="btn" onclick="saveAccountFromModal()">שמור 🚀</button>
      <button class="btn btn-gray" onclick="closeAccountModal()">ביטול ✖️</button>
    </div>
  </div>
</div>

<div class="ui-layer">
  <div id="hud" class="hud">
    <div class="hud-card">🪙 <span id="coin-display">0</span></div>
    <div class="hud-card">⏱️ <span id="time-display">0</span>s</div>
  </div>

  <div id="start-screen" class="screen active">
    <h1 class="title">POLICE CHASE</h1>
    <div class="story-card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
        <div><b style="color:#38bdf8">שם שחקן:</b></div>
        <input id="direct-user-input" class="direct-name-input" value="אורח" onblur="updateNameFromDirectInput()" onkeydown="if(event.key==='Enter')this.blur()">
      </div>
      <div class="story-title">📖 סיפור הרקע</div>
      <div class="story-text">ילד שובב ריסס גרפיטי על קיר תחנת המשטרה. השוטר יוצא למרדף ברחבי העיר!</div>
      <div class="story-title">📜 חוקי המשחק</div>
      <ul class="rules-list">
        <li>🏃 חצים / WASD — מעבר בין מסלולים.</li>
        <li>⬆️ W / חץ למעלה / רווח — קפיצה.</li>
        <li>⬇️ S / חץ למטה — גלגול.</li>
        <li>🚌 אפשר לנחות על גג האוטובוס, לרוץ עליו ולרדת ממנו.</li>
        <li>🪙 מטבעות שנאספו נשמרים בחשבון.</li>
      </ul>
      <div style="background:#451a03;border:1px solid #f59e0b;border-radius:12px;padding:10px;color:#fde68a">
        🏆 שיא: <span id="home-high-score">0</span> | 🪙 מטבעות: <span id="home-coins">0</span>
      </div>
    </div>
    <div class="nav-row">
      <button class="btn" onclick="startIntroCutscene()">צא למרדף! 🚨</button>
      <button class="btn btn-orange" onclick="showScreen('shop-screen')">חנות ושדרוגים 🛒</button>
      <button class="btn btn-purple" onclick="showScreen('records-screen')">שיאים 🏆</button>
      <button class="btn btn-gray" onclick="openAccountModal()">👤 משתמש</button>
    </div>
  </div>

  <div id="shop-screen" class="screen">
    <h1 class="title" style="font-size:48px">חנות שדרוגים 🛒</h1>
    <div style="color:white;font-size:22px;margin-bottom:12px">מטבעות: <span id="shop-coins">0</span> 🪙</div>
    <div class="grid-upgrades">
      <div class="upgrade-card"><div><div class="upgrade-title">⚡ מהירות</div><div id="speed-lvl-text" class="upgrade-level">רמה: 1 / 5</div></div><button id="buy-speed-btn" class="btn btn-sm" onclick="buyUpgrade('speed')">שדרג</button></div>
      <div class="upgrade-card"><div><div class="upgrade-title">🦘 קפיצה</div><div id="jump-lvl-text" class="upgrade-level">רמה: 1 / 5</div></div><button id="buy-jump-btn" class="btn btn-sm" onclick="buyUpgrade('jump')">שדרג</button></div>
      <div class="upgrade-card"><div><div class="upgrade-title">🧲 מגנט</div><div id="magnet-lvl-text" class="upgrade-level">רמה: 0 / 5</div></div><button id="buy-magnet-btn" class="btn btn-sm" onclick="buyUpgrade('magnet')">שדרג</button></div>
      <div class="upgrade-card"><div><div class="upgrade-title">✨ מכפיל מטבעות</div><div id="multiplier-lvl-text" class="upgrade-level">רמה: 1 / 5</div></div><button id="buy-multiplier-btn" class="btn btn-sm" onclick="buyUpgrade('multiplier')">שדרג</button></div>
    </div>
    <div class="nav-row"><button class="btn btn-gray" onclick="showStartScreen()">חזרה 🏠</button></div>
  </div>

  <div id="records-screen" class="screen">
    <h1 class="title" style="font-size:48px">שיאים 🏆</h1>
    <div class="stats-box">
      <div class="records">
        <div class="record">שיא<b id="rec-high-score">0</b></div>
        <div class="record">מטבעות<b id="rec-total-coins">0</b></div>
        <div class="record">משחקים<b id="rec-games-played">0</b></div>
      </div>
    </div>
    <div class="nav-row"><button class="btn btn-gray" onclick="showStartScreen()">חזרה 🏠</button></div>
  </div>

  <div id="game-over-screen" class="screen">
    <h1 class="title" style="color:#f87171;text-shadow:0 6px 0 #991b1b">נתקעת!</h1>
    <div class="stats-box">
      <h2>המשחק נגמר</h2>
      <p>זמן: <span id="final-time">0</span></p>
      <p>מטבעות: <span id="final-coins">0</span> 🪙</p>
      <p>שיא: <span id="high-score-end">0</span></p>
    </div>
    <div class="nav-row">
      <button class="btn" onclick="resetGame()">נסה שוב 🔄</button>
      <button class="btn btn-purple" onclick="showStartScreen()">לתחנה 🏠</button>
    </div>
  </div>

  <div id="victory-screen" class="screen">
    <h1 class="title" style="color:#4ade80;text-shadow:0 6px 0 #166534">תפסת אותו!</h1>
    <div class="stats-box"><h2>ניצחון היסטורי! 🏆</h2><p>הצלחת להגיע למטרה.</p></div>
    <div class="nav-row">
      <button class="btn" onclick="resetGame()">שחק שוב 🔄</button>
      <button class="btn btn-purple" onclick="showStartScreen()">לתחנה 🏠</button>
    </div>
  </div>
</div>

<script>
const appId = 'police-chase-app';
let activeUsername = localStorage.getItem('policeChaseUsername') || 'אורח';

let gameData = {
  coins:0, highScore:0, totalCoinsEarned:0, gamesPlayed:0,
  upgrades:{speed:1,jump:1,magnet:0,multiplier:1}
};

function toggleFullScreen(){
  if(!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
  else document.exitFullscreen?.();
}
function saveGameData(){
  localStorage.setItem('policeChaseSaveData_v3',JSON.stringify(gameData));
  localStorage.setItem('policeChaseUsername',activeUsername);
  updateUI();
}
function loadGameData(){
  try{
    const saved=localStorage.getItem('policeChaseSaveData_v3');
    if(saved) gameData={...gameData,...JSON.parse(saved),upgrades:{...gameData.upgrades,...(JSON.parse(saved).upgrades||{})}};
  }catch(e){}
  updateUI();
}
function updateNameFromDirectInput(){
  const v=document.getElementById('direct-user-input')?.value.trim();
  if(v){activeUsername=v;saveGameData();}
}
function openAccountModal(){
  document.getElementById('username-input').value=activeUsername;
  document.getElementById('account-modal').classList.add('active');
}
function closeAccountModal(){document.getElementById('account-modal').classList.remove('active')}
function saveAccountFromModal(){
  const v=document.getElementById('username-input').value.trim();
  if(v){activeUsername=v;saveGameData();closeAccountModal();}
}
function updateShopItem(type,base){
  const lvl=gameData.upgrades[type], cost=base*lvl;
  const t=document.getElementById(`${type}-lvl-text`), b=document.getElementById(`buy-${type}-btn`);
  if(!t||!b)return;
  t.textContent=lvl>=5?'רמה: מקסימום (5)':`רמה: ${lvl} / 5`;
  b.textContent=lvl>=5?'מקס':`שדרג (${cost} 🪙)`;
  b.disabled=lvl>=5||gameData.coins<cost;
  b.style.opacity=b.disabled?.5:1;
}
function updateUI(){
  const ids={
    'home-coins':gameData.coins,'shop-coins':gameData.coins,
    'home-high-score':Math.floor(gameData.highScore),
    'rec-high-score':Math.floor(gameData.highScore),
    'rec-total-coins':gameData.totalCoinsEarned,'rec-games-played':gameData.gamesPlayed
  };
  Object.entries(ids).forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.textContent=v});
  const n=document.getElementById('direct-user-input'); if(n&&document.activeElement!==n)n.value=activeUsername;
  updateShopItem('speed',100);updateShopItem('jump',150);updateShopItem('magnet',200);updateShopItem('multiplier',250);
}
function buyUpgrade(type){
  const costs={speed:100,jump:150,magnet:200,multiplier:250};
  const lvl=gameData.upgrades[type],cost=costs[type]*lvl;
  if(lvl<5&&gameData.coins>=cost){gameData.coins-=cost;gameData.upgrades[type]++;saveGameData();}
}
function showScreen(id){
  document.querySelectorAll('.screen,.hud').forEach(e=>e.classList.remove('active'));
  const e=document.getElementById(id);if(e)e.classList.add('active');
}
function showStartScreen(){
  resetGameEnvironment();showScreen('start-screen');gameState='START';
  camera.position.set(0,4.2,8.5);camera.lookAt(0,1.5,0);
}
function startIntroCutscene(){showScreen(null);gameState='PLAYING';resetGameEnvironment();startGame();}

let gameState='START',score=0,sessionCoins=0;
const WIN_SCORE=100000;
let gameSpeed=.65,maxGameSpeed=1.85,lastTime=0,spawnTimer=0;
const roadWidth=14,laneWidth=roadWidth/3,lanes=[-laneWidth,0,laneWidth];
let currentLane=1,targetX=lanes[1];
let isJumping=false,jumpVelocity=0,playerY=0,groundHeight=0;
let gravity=-.016,baseJumpStrength=.34,isRolling=false,rollTimer=0;
let currentBus=null;

const container=document.getElementById('game-container');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8fd4f5);
scene.fog=new THREE.FogExp2(0xb9e4f7,.0085);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,350);
camera.position.set(0,4.2,8.5);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xbfe3ff,0x4b4636,.8));
const sun=new THREE.DirectionalLight(0xfff2d9,1.5);
sun.position.set(-25,45,25);sun.castShadow=true;scene.add(sun);

const road=new THREE.Mesh(
  new THREE.PlaneGeometry(roadWidth,350),
  new THREE.MeshStandardMaterial({color:0x2b3a52,roughness:.85})
);
road.rotation.x=-Math.PI/2;road.position.z=-165;road.receiveShadow=true;scene.add(road);

const lineGroup=new THREE.Group();
const lineMat=new THREE.MeshBasicMaterial({color:0xffffff});
for(let x of [-laneWidth/2,laneWidth/2]){
  for(let z=0;z>-350;z-=10){
    const m=new THREE.Mesh(new THREE.BoxGeometry(.08,.02,5),lineMat);
    m.position.set(x,.025,z);lineGroup.add(m);
  }
}
scene.add(lineGroup);

const playerGroup=new THREE.Group();scene.add(playerGroup);
const body=new THREE.Mesh(new THREE.BoxGeometry(1.3,1.6,.9),new THREE.MeshStandardMaterial({color:0x1e3a8a}));
body.position.y=1.1;body.castShadow=true;playerGroup.add(body);
const head=new THREE.Mesh(new THREE.BoxGeometry(.75,.75,.75),new THREE.MeshStandardMaterial({color:0xfbcfe8}));
head.position.y=2.2;head.castShadow=true;playerGroup.add(head);
const hat=new THREE.Mesh(new THREE.CylinderGeometry(.6,.5,.25,16),new THREE.MeshStandardMaterial({color:0x1d4ed8}));
hat.position.y=2.65;hat.castShadow=true;playerGroup.add(hat);

const obstacles=[],coinsList=[],exhaustParticles=[];
function wheel(){
  const w=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.22,12),new THREE.MeshStandardMaterial({color:0x111827}));
  w.rotation.z=Math.PI/2;w.castShadow=true;return w;
}
function createCarMesh(){
  const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0xef4444,roughness:.3});
  const b=new THREE.Mesh(new THREE.BoxGeometry(2.3,1.4,3.8),m);b.position.y=.95;b.castShadow=true;g.add(b);
  [[-1,.35,-1.2],[1,.35,-1.2],[-1,.35,1.2],[1,.35,1.2]].forEach(p=>{const w=wheel();w.position.set(...p);g.add(w)});
  return g;
}
function createVanMesh(){
  const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x0284c7,roughness:.35});
  const b=new THREE.Mesh(new THREE.BoxGeometry(2.3,1.8,4.6),m);b.position.y=1.1;b.castShadow=true;g.add(b);
  [[-1.1,.35,-1.5],[1.1,.35,-1.5],[-1.1,.35,1.5],[1.1,.35,1.5]].forEach(p=>{const w=wheel();w.position.set(...p);g.add(w)});
  return g;
}
function createBusMesh(){
  const bus=new THREE.Group();
  const bodyMat=new THREE.MeshStandardMaterial({color:0x2563eb,roughness:.2});
  const body=new THREE.Mesh(new THREE.BoxGeometry(2.5,2.7,8.5),bodyMat);
  body.position.y=1.55;body.castShadow=true;bus.add(body);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(2.5,.1,8.5),new THREE.MeshStandardMaterial({color:0x1d4ed8}));
  roof.position.y=2.92;roof.castShadow=true;bus.add(roof);
  const glass=new THREE.Mesh(new THREE.BoxGeometry(2.52,.8,7.5),new THREE.MeshStandardMaterial({color:0x93c5fd,roughness:.15,metalness:.6}));
  glass.position.y=1.9;bus.add(glass);
  const sign=new THREE.Mesh(new THREE.BoxGeometry(2,.35,.1),new THREE.MeshBasicMaterial({color:0xfde68a}));
  sign.position.set(0,2.55,-4.26);bus.add(sign);
  [[-1.2,.4,-3],[1.2,.4,-3],[-1.2,.4,0],[1.2,.4,0],[-1.2,.4,3],[1.2,.4,3]].forEach(p=>{const w=wheel();w.position.set(...p);bus.add(w)});
  return bus;
}
function createOverheadBarrierMesh(){
  const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0xef4444});
  for(const x of [-2,2]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,3.5),new THREE.MeshStandardMaterial({color:0x475569}));p.position.set(x,1.75,0);g.add(p)}
  const bar=new THREE.Mesh(new THREE.BoxGeometry(4.2,.6,.3),mat);bar.position.y=2.3;g.add(bar);return g;
}

function spawnCoinLine(lane,startZ,count=5,yPos=1){
  for(let i=0;i<count;i++){
    const coin=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.1,16),new THREE.MeshStandardMaterial({color:0xfbbf24,metalness:.9,roughness:.15,emissive:0xb45309,emissiveIntensity:.35}));
    coin.rotation.x=Math.PI/2;coin.position.set(lanes[lane],yPos,startZ+i*2.2);coin.castShadow=true;scene.add(coin);
    coinsList.push({mesh:coin,lane});
  }
}
function spawnObstaclePattern(){
  const lane=Math.floor(Math.random()*3),r=Math.random();
  if(r<.35){
    const mesh=createCarMesh();mesh.position.set(lanes[lane],0,-140);scene.add(mesh);
    obstacles.push({mesh,type:'car',lane,height:1.4,length:3.8});
  }else if(r<.6){
    const mesh=createBusMesh();mesh.position.set(lanes[lane],0,-140);scene.add(mesh);
    obstacles.push({mesh,type:'bus',lane,height:2.97,length:8.5});
    spawnCoinLine(lane,-140,4,3.5);
  }else if(r<.8){
    const mesh=createVanMesh();mesh.position.set(lanes[lane],0,-140);scene.add(mesh);
    obstacles.push({mesh,type:'van',lane,height:2.2,length:4.6});
  }else{
    const mesh=createOverheadBarrierMesh();mesh.position.set(lanes[lane],0,-140);scene.add(mesh);
    obstacles.push({mesh,type:'overhead',lane,height:2.3,length:.5,mustRoll:true});
  }
}
function moveLeft(){if(currentLane>0&&gameState==='PLAYING'){currentLane--;targetX=lanes[currentLane]}}
function moveRight(){if(currentLane<2&&gameState==='PLAYING'){currentLane++;targetX=lanes[currentLane]}}
function jump(){
  if(!isJumping&&!isRolling&&gameState==='PLAYING'){
    isJumping=true;
    jumpVelocity=baseJumpStrength*(1+(gameData.upgrades.jump-1)*.12);
  }
}
function roll(){
  if(!isRolling&&gameState==='PLAYING'){
    if(isJumping)jumpVelocity=-.45;
    isRolling=true;rollTimer=28;playerGroup.scale.y=.45;
  }
}
addEventListener('keydown',e=>{
  if(['ArrowLeft','a','A'].includes(e.key))moveLeft();
  if(['ArrowRight','d','D'].includes(e.key))moveRight();
  if(['ArrowUp','w','W',' '].includes(e.key)){e.preventDefault();jump()}
  if(['ArrowDown','s','S'].includes(e.key))roll();
});
let touchStartX=0,touchStartY=0;
addEventListener('touchstart',e=>{touchStartX=e.changedTouches[0].screenX;touchStartY=e.changedTouches[0].screenY},{passive:true});
addEventListener('touchend',e=>{
  if(gameState!=='PLAYING')return;
  const dx=e.changedTouches[0].screenX-touchStartX,dy=e.changedTouches[0].screenY-touchStartY;
  if(Math.abs(dx)>Math.abs(dy)){if(Math.abs(dx)>30)dx>0?moveRight():moveLeft()}
  else if(Math.abs(dy)>30){dy<0?jump():roll()}
},{passive:true});

/*
  ==========================================================
  תיקון מרכזי:
  גג האוטובוס הוא משטח שניתן לעמוד ולרוץ עליו.
  כשהאוטובוס יוצא מתחת לשחקן, groundHeight חוזר ל-0
  והשחקן נופל לכביש. איסוף המטבעות אינו מתאפס.
  ==========================================================
*/
function checkCollisions(){
  const pBox=new THREE.Box3().setFromObject(playerGroup);
  pBox.expandByScalar(-.25);
  groundHeight=0;
  currentBus=null;

  for(const obs of obstacles){
    if(!obs.mesh)continue;

    if(obs.type==='bus'){
      const dz=Math.abs(playerGroup.position.z-obs.mesh.position.z);
      const dx=Math.abs(playerGroup.position.x-obs.mesh.position.x);
      const onRoofX=dx<=1.12;
      const onRoofZ=dz<=obs.length/2+.35;
      const roof=obs.height;

      /*
        נחיתה מלמעלה:
        אם השחקן יורד, נמצא בתחום הגג והגובה מתאים,
        הוא נצמד לגג ולא נפסל.
      */
      const landing=
        onRoofX && onRoofZ &&
        isJumping && jumpVelocity<=0 &&
        playerY>=roof-.95 && playerY<=roof+.25;

      const standing=
        onRoofX && onRoofZ &&
        playerY>=roof-.18 && playerY<=roof+.75;

      if(landing||standing){
        groundHeight=roof;
        currentBus=obs;

        if(playerY<=roof+.12){
          playerY=roof;
          isJumping=false;
          jumpVelocity=0;
        }
        continue;
      }

      /*
        אם השחקן כבר מעל האוטובוס אבל עבר את הקצה,
        לא מפעילים game over. הוא פשוט ייפול.
      */
      if(onRoofX && playerY>roof-.2)continue;
    }

    const oBox=new THREE.Box3().setFromObject(obs.mesh);
    if(pBox.intersectsBox(oBox)){
      if(obs.type==='bus'){
        if(playerY>=obs.height-.3){
          groundHeight=obs.height;
          currentBus=obs;
          continue;
        }
        gameOver();
        return;
      }
      if(obs.mustRoll&&isRolling)continue;
      gameOver();
      return;
    }
  }

  const magnetRadius=gameData.upgrades.magnet*4;
  for(let i=coinsList.length-1;i>=0;i--){
    const c=coinsList[i].mesh;
    if(gameData.upgrades.magnet>0&&playerGroup.position.distanceTo(c.position)<magnetRadius)
      c.position.lerp(playerGroup.position,.18);

    if(pBox.intersectsBox(new THREE.Box3().setFromObject(c))){
      scene.remove(c);coinsList.splice(i,1);
      const earned=gameData.upgrades.multiplier;
      sessionCoins+=earned;gameData.coins+=earned;gameData.totalCoinsEarned+=earned;
      document.getElementById('coin-display').textContent=sessionCoins;
      saveGameData();
    }
  }
}

function resetGameEnvironment(){
  obstacles.forEach(o=>scene.remove(o.mesh));obstacles.length=0;
  coinsList.forEach(c=>scene.remove(c.mesh));coinsList.length=0;
  currentBus=null;currentLane=1;targetX=lanes[1];
  playerGroup.position.set(targetX,0,0);
  playerGroup.scale.y=1;isJumping=false;isRolling=false;
  jumpVelocity=0;playerY=0;groundHeight=0;score=0;sessionCoins=0;spawnTimer=0;
  document.getElementById('coin-display').textContent='0';
  document.getElementById('time-display').textContent='0';
}
function startGame(){
  gameState='PLAYING';gameData.gamesPlayed++;saveGameData();
  const speedBoost=1+(gameData.upgrades.speed-1)*.1;
  gameSpeed=.65*speedBoost;maxGameSpeed=1.85*speedBoost;lastTime=performance.now();
  showScreen('hud');
}
function resetGame(){resetGameEnvironment();startGame()}
function gameOver(){
  if(gameState!=='PLAYING')return;
  gameState='GAMEOVER';
  if(score>gameData.highScore)gameData.highScore=score;
  saveGameData();
  document.getElementById('final-time').textContent=Math.floor(score);
  document.getElementById('final-coins').textContent=sessionCoins;
  document.getElementById('high-score-end').textContent=Math.floor(gameData.highScore);
  showScreen('game-over-screen');
}
function victory(){
  gameState='VICTORY';
  if(score>gameData.highScore)gameData.highScore=score;
  saveGameData();showScreen('victory-screen');
}

let animStep=0;
function animate(){
  requestAnimationFrame(animate);

  if(gameState==='PLAYING'){
    const now=performance.now();
    const dt=Math.min(.05,(now-lastTime)/1000||.016);
    lastTime=now;

    score+=dt;
    const displayScore=Math.floor(score*10);
    document.getElementById('time-display').textContent=displayScore;
    if(displayScore>=WIN_SCORE){victory();renderer.render(scene,camera);return}

    gameSpeed=Math.min(maxGameSpeed,gameSpeed+dt*.004);
    playerGroup.position.x+=(targetX-playerGroup.position.x)*.22;
    camera.position.x=playerGroup.position.x*.35;
    camera.position.y=4.2+playerY*.3;
    camera.position.z=8.5;
    camera.rotation.z=-(targetX-playerGroup.position.x)*.03;

    animStep+=gameSpeed*.22;

    if(isJumping||playerY>groundHeight){
      playerY+=jumpVelocity;
      jumpVelocity+=gravity;
      if(playerY<=groundHeight){
        playerY=groundHeight;isJumping=false;jumpVelocity=0;
      }
    }else playerY=groundHeight;
    playerGroup.position.y=playerY;

    if(isRolling){
      rollTimer--;
      if(rollTimer<=0){isRolling=false;playerGroup.scale.y=1}
    }

    spawnTimer+=gameSpeed;
    if(spawnTimer>18){
      spawnObstaclePattern();
      if(Math.random()<.5)spawnCoinLine(Math.floor(Math.random()*3),-140,5,1);
      spawnTimer=0;
    }

    lineGroup.position.z+=gameSpeed;
    if(lineGroup.position.z>10)lineGroup.position.z-=10;

    for(let i=obstacles.length-1;i>=0;i--){
      const o=obstacles[i];
      o.mesh.position.z+=gameSpeed;
      if(o.mesh.position.z>15){scene.remove(o.mesh);obstacles.splice(i,1)}
    }

    for(let i=coinsList.length-1;i>=0;i--){
      coinsList[i].mesh.position.z+=gameSpeed;
      coinsList[i].mesh.rotation.y+=.08;
      if(coinsList[i].mesh.position.z>15){scene.remove(coinsList[i].mesh);coinsList.splice(i,1)}
    }

    checkCollisions();

  }else if(gameState==='START'){
    lineGroup.position.z+=.1;if(lineGroup.position.z>10)lineGroup.position.z-=10;
  }

  renderer.render(scene,camera);
}
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
});
loadGameData();showScreen('start-screen');animate();
</script>
</body>
</html>'''

path = Path("/mnt/data/police_chase_bus_roof_fixed.html")
path.write_text(html, encoding="utf-8")
print(f"נוצר קובץ מלא: {path}")
