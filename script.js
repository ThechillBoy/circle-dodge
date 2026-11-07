const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
const scoreEl=document.getElementById('score');
const levelEl=document.getElementById('level');
const highScoreEl=document.getElementById('highscore');
const livesEl=document.getElementById('lives')||{textContent:''}; // stub = old cached HTML safety
const bannerEl=document.getElementById('banner');
const startOverlay=document.getElementById('start');
const gameOverEl=document.getElementById('gameOver');
const finalScoreEl=document.getElementById('finalScore');
const bestScoreEl=document.getElementById('bestScore');
const newBestEl=document.getElementById('newBest')||{style:{}};
const soundBtn=document.getElementById('soundBtn')||{textContent:''};

let width,height;
let mouse={x:0,y:0};
const playerRadius=22;

let score=0;
let highScore=localStorage.getItem('circleGameHighScore')||0;
let gameActive=false;
let paused=false;

let enemies=[];
let collectibles=[];
let particles=[];
let popups=[];
let trail=[];

let enemyTimer=0,collectibleTimer=0;
let level=1;
let invincible=0; // frames of shield
let slowTimer=0;   // frames of slow-mo
let magnetTimer=0; // frames of magnet
let lives=0;       // extra lives from heart pickups
let shake=0;
let flash=0;
let combo=1,comboTimer=0;
let animationId;
let bannerTimeout=null;

const BG=['#0f172a','#1e1b4b','#134e4a','#312e81','#3b0764','#450a0a'];
const bgFor=()=>BG[Math.min(level-1,BG.length-1)];
// mode landing page par tap karke choose hota hai - game kabhi khud se mode nahi badalta
const MODES={
easy:{label:'EASY',speed:0.75,wave:l=>Math.min(4,1+Math.floor((l-1)/3)),interval:l=>Math.max(30,84-l*4)},
hard:{label:'HARD',speed:1,wave:l=>Math.min(5,1+Math.floor((l-1)/2)),interval:l=>Math.max(14,72-l*5)},
extreme:{label:'EXTREME',speed:1.35,wave:l=>Math.min(5,2+Math.floor((l-1)/2)),interval:l=>Math.max(11,60-l*5)},
insane:{label:'INSANE',speed:1.8,wave:l=>Math.min(6,3+Math.floor((l-1)/2)),interval:l=>Math.max(8,46-l*4)}
};
let mode='hard';
const enemyInterval=()=>MODES[mode].interval(level);
const collectibleInterval=()=>Math.max(40,110-level*5);

// ===== Audio (WebAudio, no files) =====
let audioCtx=null,masterGain=null,soundOn=true;
const MELODY=[220,0,261.6,0,329.6,0,261.6,0, 220,0,196,0,246.9,0,196,0];
const BASS=[110,110,130.8,98];
let mstep=0,nextNote=0;
let hatBuf=null;
function hatAt(t,vol){ // short white-noise hi-hat tick
if(!hatBuf){hatBuf=audioCtx.createBuffer(1,audioCtx.sampleRate*0.05,audioCtx.sampleRate);const d=hatBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
const s=audioCtx.createBufferSource(),g=audioCtx.createGain();
s.buffer=hatBuf;
g.gain.setValueAtTime(vol,t);
g.gain.exponentialRampToValueAtTime(0.001,t+0.03);
s.connect(g);g.connect(masterGain);s.start(t);s.stop(t+0.03);
}

function initAudio(){ // must be called from a user click (browser autoplay rules)
if(audioCtx){if(audioCtx.state==='suspended')audioCtx.resume();return;}
try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;} // old browser = silent game
masterGain=audioCtx.createGain();
masterGain.gain.value=0.6;
masterGain.connect(audioCtx.destination);
nextNote=audioCtx.currentTime+0.1;
setInterval(musicTick,80);
}

function toneAt(freq,t,dur,type,vol,slideTo){
const o=audioCtx.createOscillator();
const g=audioCtx.createGain();
o.type=type;
o.frequency.setValueAtTime(freq,t);
if(slideTo)o.frequency.exponentialRampToValueAtTime(slideTo,t+dur);
g.gain.setValueAtTime(vol,t);
g.gain.exponentialRampToValueAtTime(0.001,t+dur);
o.connect(g);g.connect(masterGain);
o.start(t);o.stop(t+dur);
}

function musicTick(){
if(!audioCtx||!soundOn)return;
if(nextNote<audioCtx.currentTime)nextNote=audioCtx.currentTime+0.05;
const stepDur=Math.max(0.14,0.26-(level-1)*0.008); // level up = faster tempo
while(nextNote<audioCtx.currentTime+0.25){
const f=MELODY[mstep%MELODY.length];
if(f)toneAt(f,nextNote,stepDur*0.9,'triangle',0.05);
if(mstep%2===1)hatAt(nextNote,0.04);
if(mstep%4===0)toneAt(BASS[(mstep/4)%BASS.length],nextNote,stepDur*3.5,'sine',0.09);
nextNote+=stepDur;
mstep++;
}
}

function sfx(fn){
if(!audioCtx||!soundOn)return;
fn(audioCtx.currentTime);
}
const sfxCollect=()=>sfx(t=>toneAt(500+Math.min(combo,5)*70,t,0.12,'triangle',0.14));
const sfxGold=()=>sfx(t=>toneAt(880,t,0.15,'square',0.12,1320));
const sfxPower=()=>sfx(t=>toneAt(300,t,0.35,'sawtooth',0.12,900));
const sfxDeath=()=>sfx(t=>toneAt(400,t,0.7,'sawtooth',0.2,50));
const sfxLevel=()=>sfx(t=>[440,554,660,880].forEach((f,i)=>toneAt(f,t+i*0.09,0.12,'square',0.1)));
const sfxStart=()=>sfx(t=>toneAt(660,t,0.15,'triangle',0.12));

function toggleSound(){
soundOn=!soundOn;
soundBtn.textContent=soundOn?'\u{1F50A}':'\u{1F507}';
}

// ===== Game =====
highScoreEl.textContent='Best: '+highScore;

function resize(){
width=canvas.width=window.innerWidth;
height=canvas.height=window.innerHeight;
}
window.addEventListener('resize',resize);
resize();

window.addEventListener('mousemove',function(e){
mouse.x=e.clientX;
mouse.y=e.clientY;
});

window.addEventListener('touchmove',function(e){
e.preventDefault(); // stop page scroll/bounce on mobile
mouse.x=e.touches[0].clientX;
mouse.y=e.touches[0].clientY;
},{passive:false});

window.addEventListener('touchstart',function(e){ // first tap par bhi player jump kare
mouse.x=e.touches[0].clientX;
mouse.y=e.touches[0].clientY;
},{passive:true});

window.addEventListener('keydown',function(e){
if(!gameActive)return;
const k=e.key.toLowerCase();
if(k==='p'||k==='escape'){paused=!paused;showBanner(paused?'PAUSED':'GO!');}
});

class Enemy{
constructor(type){
this.type=type;
const scale=(1+(level-1)*0.12)*MODES[mode].speed; // per-level growth + chosen mode speed
this.x=Math.random()*(width-120)+60;
this.y=-30;
if(type==='fast'){
this.radius=9+Math.random()*5;
this.speed=(4+Math.random()*3)*scale;
this.color='#f97316';
}else if(type==='zig'){
this.radius=11+Math.random()*6;
this.speed=(2.5+Math.random()*2)*scale;
this.color='#ec4899';
this.amp=50+Math.random()*70;
this.x=Math.min(Math.max(this.x,this.amp),width-this.amp);
this.baseX=this.x;
this.phase=Math.random()*Math.PI*2;
}else{
this.radius=14+Math.random()*16;
this.speed=(2+Math.random()*2.5)*scale;
this.color='#ef4444';
}
}
update(){
this.y+=this.speed*(slowTimer>0?0.45:1);
if(this.type==='zig'){this.phase+=0.06*(slowTimer>0?0.45:1);this.x=this.baseX+Math.sin(this.phase)*this.amp;}
}
draw(){
ctx.beginPath();
ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
ctx.fillStyle=this.color;
ctx.fill();
if(this.type==='zig'){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();}
ctx.closePath();
}
}

class Collectible{
constructor(type){
this.type=type;
this.radius=type==='gold'?10:9;
this.x=Math.random()*(width-this.radius*2)+this.radius;
this.y=-this.radius;
this.speed=2;
this.color=type==='gold'?'#fbbf24':type==='shield'?'#38bdf8':type==='slow'?'#a855f7':type==='magnet'?'#818cf8':type==='life'?'#f43f5e':'#22c55e';
}
update(player){
if(magnetTimer>0&&player){
const dx=player.x-this.x,dy=player.y-this.y,d=Math.sqrt(dx*dx+dy*dy);
if(d>1&&d<280){this.x+=dx/d*4;this.y+=dy/d*4;}
}
this.y+=this.speed*(slowTimer>0?0.45:1);
}
draw(){
ctx.beginPath();
ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
ctx.fillStyle=this.color;
ctx.fill();
if(this.type!=='green'){
ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
if(this.type==='life'){ // little white cross = extra life
ctx.strokeStyle='#fff';ctx.beginPath();
ctx.moveTo(this.x,this.y-4);ctx.lineTo(this.x,this.y+4);
ctx.moveTo(this.x-4,this.y);ctx.lineTo(this.x+4,this.y);ctx.stroke();
}
}
ctx.closePath();
}
}

class Particle{
constructor(x,y,color){
this.x=x;
this.y=y;
this.color=color;
this.size=Math.random()*4+2;
this.speedX=Math.random()*6-3;
this.speedY=Math.random()*6-3;
this.life=1.0;
}
update(){
this.x+=this.speedX;
this.y+=this.speedY;
this.life-=0.02;
this.size*=0.95;
}
draw(){
ctx.globalAlpha=this.life;
ctx.fillStyle=this.color;
ctx.beginPath();
ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
ctx.fill();
ctx.globalAlpha=1;
}
}

class Popup{
constructor(x,y,text,color){
this.x=x;this.y=y;this.text=text;this.color=color;this.life=1;
}
update(){this.y-=1.2;this.life-=0.025;}
draw(){
ctx.globalAlpha=this.life;
ctx.fillStyle=this.color;
ctx.font='bold 18px Arial';
ctx.textAlign='center';
ctx.fillText(this.text,this.x,this.y);
ctx.globalAlpha=1;
}
}

function checkCollision(c1,c2){
const dx=c1.x-c2.x;
const dy=c1.y-c2.y;
const distance=Math.sqrt(dx*dx+dy*dy);
return distance<c1.radius+c2.radius;
}

function createParticles(x,y,color,count){
for(let i=0;i<count;i++){
particles.push(new Particle(x,y,color));
}
}

function stepList(list){
for(let i=list.length-1;i>=0;i--){
const p=list[i];
p.update();
p.draw();
if(p.life<=0||p.size!==undefined&&p.size<0.5)list.splice(i,1);
}
}

function showBanner(text){
bannerEl.textContent=text;
bannerEl.classList.add('show');
clearTimeout(bannerTimeout);
bannerTimeout=setTimeout(()=>bannerEl.classList.remove('show'),1100);
}

function drawProgressBar(){
const w=220,x=(width-w)/2,y=12,pct=(score%5)/5;
ctx.fillStyle='rgba(255,255,255,0.1)';
ctx.fillRect(x,y,w,10);
ctx.fillStyle='#fbbf24';
ctx.fillRect(x,y,w*pct,10);
}

function checkLevel(){
const nl=1+Math.floor(score/5);
if(nl>level){
level=nl;
levelEl.textContent='Level: '+level+' · '+MODES[mode].label;
showBanner('LEVEL '+level+'!');
invincible=Math.max(invincible,100); // brief shield so a level up never insta-kills
sfxLevel();
}
}

function resetGame(){
score=0;
level=1;
invincible=0;
slowTimer=0;
magnetTimer=0;
shake=0;
combo=1;
comboTimer=0;
lives=0;
paused=false;
enemies=[];
collectibles=[];
particles=[];
popups=[];
trail=[];
enemyTimer=0;
collectibleTimer=0;
scoreEl.textContent='Score: 0';
levelEl.textContent='Level: 1 · '+MODES[mode].label;
livesEl.textContent='Lives: 0';
showBanner(MODES[mode].label+' MODE!');
newBestEl.style.display='none';
gameActive=true;
gameOverEl.style.display='none';
sfxStart();
cancelAnimationFrame(animationId);
animate();
}

function die(){
shake=25;
flash=8;
gameActive=false;
comboTimer=0;
const isBest=score>highScore;
if(isBest){
highScore=score;
localStorage.setItem('circleGameHighScore',highScore);
highScoreEl.textContent='Best: '+highScore;
}
finalScoreEl.textContent='Score: '+score;
bestScoreEl.textContent='Best: '+highScore;
newBestEl.style.display=isBest&&score>0?'block':'none';
sfxDeath();
gameOverEl.style.display='flex';
}

function hitPlayer(){
if(lives>0){ // extra life saves you from one crash
lives--;
livesEl.textContent='Lives: '+lives;
invincible=150;
createParticles(mouse.x,mouse.y,'#f43f5e',20);
popups.push(new Popup(mouse.x,mouse.y-30,'LIFE USED!','#f43f5e'));
sfxPower();
return;
}
createParticles(mouse.x,mouse.y,'#22d3ee',16);
die();
}

function startGame(m){
if(m)mode=m; // sirf landing ke mode button se set hota hai
initAudio(); // user click = allowed to start sound
startOverlay.style.display='none';
resetGame();
}

function goMenu(){ // menu button: bina refresh ke wapas mode selection
gameActive=false;
paused=false;
cancelAnimationFrame(animationId);
enemies=[];collectibles=[];particles=[];popups=[];trail=[];
shake=0;flash=0;slowTimer=0;magnetTimer=0;combo=1;
gameOverEl.style.display='none';
startOverlay.style.display='flex';
}

function animate(){
if(!gameActive){
// death scene: screen shake + keep particles burning until they fade out
if(particles.length>0){
ctx.save();
if(shake>0){ctx.translate((Math.random()-0.5)*shake,(Math.random()-0.5)*shake);shake--;}
ctx.fillStyle=bgFor();
ctx.fillRect(0,0,width,height);
stepList(particles);
ctx.restore();
if(flash>0){ctx.fillStyle='rgba(239,68,68,'+(flash/12)+')';ctx.fillRect(0,0,width,height);flash--;} // red death flash
animationId=requestAnimationFrame(animate);
}
return;
}

if(paused){
ctx.fillStyle=bgFor();
ctx.fillRect(0,0,width,height);
ctx.fillStyle='#fbbf24';
ctx.font='bold 40px Arial';
ctx.textAlign='center';
ctx.fillText('PAUSED - press P to resume',width/2,height/2);
animationId=requestAnimationFrame(animate);
return;
}

ctx.fillStyle=bgFor();
ctx.fillRect(0,0,width,height);

if(invincible>0)invincible--;
if(slowTimer>0){
slowTimer--;
ctx.fillStyle='rgba(168,85,247,0.08)';
ctx.fillRect(0,0,width,height); // purple slow-mo tint
}
if(magnetTimer>0)magnetTimer--;
if(comboTimer>0){comboTimer--;}else{combo=1;}

enemyTimer++;
if(enemyTimer>=enemyInterval()){
enemyTimer=0;
const count=MODES[mode].wave(level); // ball pressure = chosen mode ka rule
for(let i=0;i<count;i++){
let type='normal';
if(level>=2&&Math.random()<0.25+level*0.02)type='fast';
else if(level>=3&&Math.random()<0.2+level*0.025)type='zig'; // higher level = more fast/zig
enemies.push(new Enemy(type));
}
}

collectibleTimer++;
if(collectibleTimer>=collectibleInterval()){
collectibleTimer=0;
let type='green';
const r=Math.random(),s=Math.random();
if(level>=4&&r<0.12)type='gold';
else if(level>=2){
if(s<0.05)type='shield';
else if(s<0.10)type='slow';
else if(s<0.14)type='magnet';
else if(s<0.16)type='life'; // rare extra life
}
collectibles.push(new Collectible(type));
}

const player={x:mouse.x,y:mouse.y,radius:playerRadius};

// player glow trail
trail.push({x:mouse.x,y:mouse.y});
if(trail.length>12)trail.shift();
for(let i=0;i<trail.length;i++){
ctx.globalAlpha=(i/trail.length)*0.2;
ctx.fillStyle='#22d3ee';
ctx.beginPath();
ctx.arc(trail[i].x,trail[i].y,playerRadius*(0.4+i/trail.length*0.6),0,Math.PI*2);
ctx.fill();
}
ctx.globalAlpha=1;

// player blinks while shielded
if(invincible%10<5)ctx.globalAlpha=0.35;
ctx.beginPath();
ctx.arc(mouse.x,mouse.y,playerRadius,0,Math.PI*2);
ctx.fillStyle='#22d3ee';
ctx.fill();
ctx.strokeStyle='#fff';
ctx.lineWidth=3;
ctx.stroke();
ctx.closePath();
ctx.globalAlpha=1;

for(let i=enemies.length-1;i>=0;i--){
const e=enemies[i];
e.update();
e.draw();

if(invincible<=0&&checkCollision(player,e)){
if(lives>0){
hitPlayer();
}else{
createParticles(mouse.x,mouse.y,'#22d3ee',16);
die();
return;
}
}

if(e.y-e.radius>height)enemies.splice(i,1);
}

for(let i=collectibles.length-1;i>=0;i--){
const c=collectibles[i];
c.update(player);
c.draw();

if(checkCollision(player,c)){
comboTimer=100;
if(c.type==='shield'){
invincible=300;
showBanner('SHIELD!');
sfxPower();
createParticles(c.x,c.y,c.color,8);
}else if(c.type==='slow'){
slowTimer=300;
showBanner('SLOW-MO!');
sfxPower();
createParticles(c.x,c.y,c.color,8);
}else if(c.type==='magnet'){
magnetTimer=300;
showBanner('MAGNET!');
sfxPower();
createParticles(c.x,c.y,c.color,8);
}else if(c.type==='life'){
lives++;
livesEl.textContent='Lives: '+lives;
popups.push(new Popup(c.x,c.y,'+1 LIFE',c.color));
sfxGold();
createParticles(c.x,c.y,c.color,10);
}else{
const base=c.type==='gold'?5:1;
const mult=Math.min(combo,5);
const pts=base*mult;
score+=pts;
scoreEl.textContent='Score: '+score;
popups.push(new Popup(c.x,c.y,mult>1?'+'+pts+' x'+mult:'+'+pts,c.color));
createParticles(c.x,c.y,c.color,pts>=10?12:6);
if(c.type==='gold')sfxGold();else sfxCollect();
combo++;
checkLevel();
}
collectibles.splice(i,1);
}else if(c.y-c.radius>height){
collectibles.splice(i,1);
}
}

stepList(particles);
stepList(popups);
drawProgressBar();

animationId=requestAnimationFrame(animate);
}