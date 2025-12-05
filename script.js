// ----- Game config -----
const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');
const levelElem = document.getElementById('level');
const timerElem = document.getElementById('timer');
const infoElem = document.getElementById('info');
const restartBtn = document.getElementById('restart');

// --- Arena ukuran & parameter
const BOX_COUNT = 20; // grid sisi (20x20), jadi tiap kotak 20px
const TILE_SIZE = 20;
const CANVAS_SIZE = TILE_SIZE * BOX_COUNT;

let player, enemies, gameTimer, level, interval, alive, timeLeft, maxLevel=10, transforming=false;

function resetGame(ln=1){
  level = ln;
  alive = true;
  timeLeft = Math.max(6, 10-level); // timer makin singkat di level atas
  transforming = false;

  // --- posisi pemain di tengah
  player = {x: Math.floor(BOX_COUNT/2), y: Math.floor(BOX_COUNT/2)};

  // --- spawn musuh berdasarkan level
  enemies = [];
  let nDeer = Math.min(4+level, 12); // tambah rusa setiap level, max 12
  for(let i=0; i<nDeer; i++){
    enemies.push({
      x: Math.floor(Math.random()*BOX_COUNT),
      y: Math.floor(Math.random()*BOX_COUNT),
      human: false,      // Normal: rusa
      speed: 0.40+level*0.06+Math.random()*0.10, // semakin tinggi, makin cepat sedikit
      dx: Math.random()<0.5?-1:1,
      dy: Math.random()<0.5?-1:1
    });
  }
  infoElem.textContent = '';
  levelElem.textContent = level;
  timerElem.textContent = timeLeft;
  clearInterval(interval);
  interval = setInterval(gameLoop, 1000/55); // fps 55 (smooth)
  gameTimer = setInterval(()=>{           // Countdown per detik
    if(alive) timerTick();
  },1000);

  draw();
}

// --- Timer handler
function timerTick(){
  if(!alive) return;
  timeLeft-=1;
  timerElem.textContent = timeLeft;
  // Perubahan musuh (level>=5): "rusa berubah manusia"
  if(level >= 5){
    if(!transforming && timeLeft === Math.ceil(Math.max(2,5-level)/2)){
      transforming = true;
      enemies.forEach(e => { if(Math.random()<0.65) e.human=true; });
      infoElem.textContent = "Rusa berubah jadi manusia! ❗";
    }
  }
  if(timeLeft<=0){
    nextLevel();
  }
}

// ----- Selesai/next
function nextLevel(){
  if(level<maxLevel){
    alive=false;
    clearInterval(interval);
    clearInterval(gameTimer);
    infoElem.textContent = "Berhasil! Klik Restart atau lanjut ke level " + (level+1);
    setTimeout(()=>{resetGame(level+1)},1350);
  }else{
    gameEnd(true);
  }
}

function gameEnd(win){
  alive=false;
  clearInterval(interval); clearInterval(gameTimer);
  infoElem.textContent = win?
    "Selamat! Kamu bertahan sampai level maksimal! 🏆":
    "Tertangkap! Game Over!";
}

// Keyboard pemain
document.addEventListener('keydown', function(ev){
  if(!alive) return;
  let k = ev.key.toLowerCase();
  let nx = player.x, ny = player.y;
  // WASD & Arrow
  if(k === 'a' || k === 'arrowleft')  nx--;
  if(k === 'd' || k === 'arrowright') nx++;
  if(k === 'w' || k === 'arrowup')    ny--;
  if(k === 's' || k === 'arrowdown')  ny++;
  // tetapkan kalau di arena
  if(nx<0||nx>=BOX_COUNT||ny<0||ny>=BOX_COUNT) return;
  player.x=nx; player.y=ny;
  draw();
});

// Tombol restart
restartBtn.onclick = ()=>resetGame(1);

// ------ Musuh bergerak ------
function moveEnemies(){
  enemies.forEach(e=>{
    let px = player.x*TILE_SIZE, py = player.y*TILE_SIZE;
    // HUMAN lebih agresif; rusa agak random
    
    let targetX = e.human ? px : px+(Math.random()-0.5)*18;
    let targetY = e.human ? py : py+(Math.random()-0.5)*18;

    let dx = targetX-(e.x*TILE_SIZE);
    let dy = targetY-(e.y*TILE_SIZE);

    // Update posisi (arah normal/tak bisa menempat benar grid, karena speednya)
    let adx = dx>0?1:-1;
    let ady = dy>0?1:-1;
    // Sudah dekat secara grid, tetap random salad slow down
    if(Math.abs(dx)<12) adx=0; if(Math.abs(dy)<12) ady=0;
    if(e.human && Math.random()<0.28) adx=adx*-1; // kadang zigzag kalau manusia
    if(Math.random()<0.19&&!e.human){ // rusa agak ngaco gerak sesekali
      adx=(Math.random()<0.5)?1:-1; ady=(Math.random()<0.5)?1:-1; 
    }     
    e.x += adx*e.speed;
    e.y += ady*e.speed;
    // Clamp arena
    if(e.x<0) e.x=0; if(e.x>BOX_COUNT-1) e.x=BOX_COUNT-1;
    if(e.y<0) e.y=0; if(e.y>BOX_COUNT-1) e.y=BOX_COUNT-1;
  });
}

// Cek tabrakan
function checkCollision(){
  for(let e of enemies){
    let dist = Math.abs(player.x-e.x)+Math.abs(player.y-e.y);
    // Lebih dekat dari 0.6 tile
    if(dist<0.65){
      gameEnd(false);
    }
  }
}

// ------- Gambar -----
function draw(){
  ctx.clearRect(0,0,CANVAS_SIZE,CANVAS_SIZE);
  // grid tips
  ctx.strokeStyle = "#eee2";
  for(let i=0; i<BOX_COUNT; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i*TILE_SIZE); ctx.lineTo(CANVAS_SIZE,i*TILE_SIZE);
    ctx.moveTo(i*TILE_SIZE,0);  ctx.lineTo(i*TILE_SIZE,CANVAS_SIZE);
    ctx.stroke();
  }
  // Pemain
  ctx.beginPath();
  ctx.arc(player.x*TILE_SIZE+TILE_SIZE/2, player.y*TILE_SIZE+TILE_SIZE/2, 7, 0, 2*Math.PI);
  ctx.fillStyle="#3880ee";
  ctx.shadowColor="#124bae";
  ctx.shadowBlur=7;
  ctx.fill(); ctx.shadowBlur=0;

  // Rusa / Human
  enemies.forEach(e=>{
    ctx.beginPath();
    let cx = e.x*TILE_SIZE+TILE_SIZE/2, cy = e.y*TILE_SIZE+TILE_SIZE/2;
    let r = e.human ? 11 : 8;  // MANUSIA lebih besar sedikit
    ctx.arc(cx,cy,r,0,2*Math.PI);
    ctx.fillStyle = e.human? "#ca2f2f" : "#c5944d"; // manusia merah, rusa coklat
    ctx.shadowColor = e.human ? "#9c1616":"#816200";
    ctx.shadowBlur=8; ctx.fill(); ctx.shadowBlur=0;

    // kalau rusa, beri “tanduk” 
    if(!e.human){
      ctx.strokeStyle="#603808";ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(cx-5,cy-4);ctx.lineTo(cx-11,cy-11);ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+5,cy-4);ctx.lineTo(cx+11,cy-11);ctx.stroke();
      ctx.lineWidth=1;
    }
  });
}

function gameLoop(){
  if(!alive) return;
  moveEnemies();
  draw();
  checkCollision();
}

// --- mulai permainan
resetGame(1);
