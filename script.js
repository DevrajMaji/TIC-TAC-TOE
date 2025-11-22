/* === Short JS version === */
const WIN = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

let board = Array(9).fill(null),
    turn = 'X',
    running = true,
    mode = 'hvh',
    scores = {X:0,O:0,D:0};

const boardEl = document.getElementById('board'),
      statusEl = document.getElementById('status'),
      sx = document.getElementById('sx'),
      so = document.getElementById('so'),
      sd = document.getElementById('sd'),
      btnHuman = document.getElementById('btnHuman'),
      btnAI = document.getElementById('btnAI'),
      resetBtn = document.getElementById('resetBtn'),
      winline = document.getElementById('winline');

/* Build cells */
for(let i=0;i<9;i++){
  const b=document.createElement('button');
  b.className='cell'; b.dataset.i=i;
  b.onclick=()=>play(i);
  boardEl.appendChild(b);
}

/* Audio (tiny oscillators) */
const ctx=new (window.AudioContext||window.webkitAudioContext)();
function clickSound(){
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.type='sine'; o.frequency.value=800; g.gain.value=0.0001;
  g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.12);
  o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime+0.13);
}
function winSound(){
  const now=ctx.currentTime;
  [420,520,660].forEach((f,i)=>{
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type='triangle';
    o.frequency.setValueAtTime(f, now+i*0.06);
    g.gain.setValueAtTime(0.0001, now+i*0.06);
    g.gain.exponentialRampToValueAtTime(0.12, now+i*0.06+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now+i*0.06+0.18);
    o.connect(g).connect(ctx.destination);
    o.start(now+i*0.06); o.stop(now+i*0.06+0.22);
  });
}

/* Confetti */
function confetti(x,y,count=20){
  for(let i=0;i<count;i++){
    const d=document.createElement('div');
    d.className='confetti';
    d.style.left=(x + (Math.random()-0.5)*80)+'px';
    d.style.top=(y + (Math.random()-0.5)*40)+'px';
    d.style.background = (Math.random()<0.6? 'var(--neon)' : 'rgba(144,255,176,0.8)');
    document.body.appendChild(d);
    setTimeout(()=>d.remove(),1000+Math.random()*300);
  }
}

/* Winner check */
function findWinner(b){
  for(const c of WIN){
    const [a,x,y]=c;
    if(b[a] && b[a]===b[x] && b[a]===b[y]) return c;
  }
  return b.every(Boolean) ? 'draw' : null;
}

/* SVG win-line */
function drawWinLine(combo){
  const cells=document.querySelectorAll('.cell'),
        r1=cells[combo[0]].getBoundingClientRect(),
        r2=cells[combo[2]].getBoundingClientRect(),
        svg=winline.ownerSVGElement.getBoundingClientRect(),
        mapX = px => ((px - svg.left)/svg.width)*300,
        mapY = py => ((py - svg.top)/svg.height)*300;

  winline.setAttribute('x1', mapX(r1.left+r1.width/2));
  winline.setAttribute('y1', mapY(r1.top+r1.height/2));
  winline.setAttribute('x2', mapX(r2.left+r2.width/2));
  winline.setAttribute('y2', mapY(r2.top+r2.height/2));

  winline.style.transition='none';
  winline.style.strokeDashoffset=400;
  winline.style.opacity=1;
  void winline.getBoundingClientRect();
  winline.style.transition='stroke-dashoffset 420ms ease-out, opacity .2s';
  winline.style.strokeDashoffset=0;
  setTimeout(()=> winline.style.opacity=0, 900);
}

/* Play move */
function play(i){
  if(!running || board[i]) return;
  if(ctx.state==='suspended') ctx.resume();
  clickSound();

  board[i]=turn;
  const el=document.querySelector(`.cell[data-i="${i}"]`);
  el.textContent=turn; el.classList.add(turn.toLowerCase()); el.disabled=true;

  const res=findWinner(board);
  if(res){
    running=false;
    if(res==='draw'){
      scores.D++; sd.textContent=scores.D; statusEl.textContent="It's a draw"; return;
    }
    res.forEach(idx=>document.querySelector(`.cell[data-i="${idx}"]`).classList.add('win'));
    drawWinLine(res);
    winSound();
    let mid=document.querySelector(`.cell[data-i="${res[1]}"]`).getBoundingClientRect();
    confetti(mid.left+mid.width/2, mid.top+mid.height/2, 36);
    scores[board[res[0]]]++; sx.textContent=scores.X; so.textContent=scores.O;
    statusEl.textContent=`Player ${board[res[0]]} wins!`;
    return;
  }

  turn = turn==='X' ? 'O' : 'X';
  statusEl.textContent=`Player ${turn}'s turn`;

  if(mode==='hva' && turn==='O') setTimeout(aiMove,260);
}

/* AI (random) */
function aiMove(){
  const empty = board.map((v,i)=> v?null:i).filter(n=>n!==null);
  if(!empty.length) return;
  play(empty[Math.floor(Math.random()*empty.length)]);
}

/* Controls */
btnHuman.onclick=()=>{mode='hvh';btnHuman.classList.add('active');btnAI.classList.remove('active');start();}
btnAI.onclick=()=>{mode='hva';btnAI.classList.add('active');btnHuman.classList.remove('active');start();}
resetBtn.onclick=start;

function start(){
  board=Array(9).fill(null); turn='X'; running=true;
  statusEl.textContent="Player X's turn"; winline.style.opacity=0;
  document.querySelectorAll('.cell').forEach(c=>{
    c.textContent=''; c.className='cell'; c.disabled=false;
  });
}

start();
