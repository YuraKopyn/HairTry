const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d',{willReadFrequently:true});
const photoInput = document.getElementById('photo');
const thumbs = document.getElementById('thumbs');
const scaleEl = document.getElementById('scale');
const rotEl = document.getElementById('rotation');
const opEl = document.getElementById('opacity');
const flipBtn = document.getElementById('flip');
const resetBtn = document.getElementById('reset');
const saveBtn = document.getElementById('save');
const toggleLayerBtn = document.getElementById('toggleLayer');
const eraserBtn = document.getElementById('eraser');
const undoBtn = document.getElementById('undo');

let photo=null, hair=null, hairName=null, flipX=false, putUnder=false;
let eraser=false;
let undoStack = [];

const state = { scale:1, rotation:0, opacity:0.96, ox:0, oy:0 };
const hairCanvas = document.createElement('canvas');
const hairCtx = hairCanvas.getContext('2d');

function fitCanvas() {
  if (!photo) { canvas.width = Math.min(1000, window.innerWidth-40); canvas.height = Math.round(canvas.width*1.2); return; }
  const maxW = Math.min(1000, window.innerWidth-40);
  const ratio = photo.width/photo.height;
  canvas.width = maxW;
  canvas.height = Math.round(maxW/ratio);
}

function pushUndo(){
  try { undoStack.push(canvas.toDataURL('image/png')); if(undoStack.length>10) undoStack.shift(); } catch(e){}
}

function restoreFrom(dataURL){
  const img = new Image();
  img.onload = ()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); };
  img.src = dataURL;
}

photoInput.addEventListener('change', (e)=>{
  const f = e.target.files?.[0]; if(!f) return;
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = ()=>{ photo = img; fitCanvas(); resetTransforms(); draw(); };
  img.src = url;
});

thumbs.addEventListener('click', (e)=>{
  const t = e.target.closest('img'); if(!t) return;
  [...thumbs.querySelectorAll('img')].forEach(i=>i.classList.remove('active'));
  t.classList.add('active');
  loadHair(t.dataset.file);
});

function loadHair(name){
  hairName = name;
  const img = new Image();
  img.onload = ()=>{ hair = img; draw(); };
  img.src = 'hairstyles/'+name;
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // draw base photo
  if (photo){
    const scale = Math.min(canvas.width/photo.width, canvas.height/photo.height);
    const dw = photo.width*scale, dh = photo.height*scale;
    const x = (canvas.width - dw)/2, y=(canvas.height-dh)/2;
    ctx.drawImage(photo, x,y,dw,dh);

    // head reference
    var headX = canvas.width/2, headY = y + dh*0.18;
  } else {
    ctx.fillStyle = '#fafafa'; ctx.fillRect(0,0,canvas.width,canvas.height);
    var headX = canvas.width/2, headY = canvas.height*0.22;
  }

  // draw hair to offscreen (for eraser)
  hairCanvas.width = canvas.width;
  hairCanvas.height = canvas.height;
  hairCtx.clearRect(0,0,hairCanvas.width,hairCanvas.height);

  if (hair){
    hairCtx.save();
    hairCtx.globalAlpha = state.opacity;
    hairCtx.translate(headX + state.ox, headY + state.oy);
    hairCtx.rotate(state.rotation*Math.PI/180);
    hairCtx.scale(flipX ? -state.scale : state.scale, state.scale);
    const targetW = canvas.width * 0.75;
    const ratio = hair.width/hair.height;
    const targetH = targetW/ratio;
    hairCtx.drawImage(hair, -targetW/2, -targetH*0.2, targetW, targetH);
    hairCtx.restore();
  }

  // composite layers
  if (putUnder){
    // hair under face (simple): draw hair first, then photo again with partial transparency at hairline—
    // here просто малюємо волосся під фото, це виглядає природніше для більшості фото
    ctx.globalAlpha = 1;
    ctx.drawImage(hairCanvas,0,0);
    if (photo){
      const scale = Math.min(canvas.width/photo.width, canvas.height/photo.height);
      const dw = photo.width*scale, dh = photo.height*scale;
      const x = (canvas.width - dw)/2, y=(canvas.height-dh)/2;
      ctx.drawImage(photo, x,y,dw,dh); // зверху
    }
  } else {
    // hair over face
    ctx.drawImage(hairCanvas,0,0);
  }
}

function resetTransforms(){
  state.scale=1; state.rotation=0; state.opacity=0.96; state.ox=0; state.oy=0;
  scaleEl.value=state.scale; rotEl.value=state.rotation; opEl.value=state.opacity;
}

flipBtn.addEventListener('click', ()=>{ flipX=!flipX; draw(); });
toggleLayerBtn.addEventListener('click', ()=>{
  putUnder = !putUnder;
  toggleLayerBtn.textContent = putUnder? 'Над обличчям' : 'Під обличчя';
  draw();
});

// Eraser: erase on hairCanvas alpha via destination-out
let erasing=false;
canvas.addEventListener('pointerdown',(e)=>{
  if(!eraser) return;
  erasing=true; pushUndo(); eraseAt(e); canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',(e)=>{ if(!eraser || !erasing) return; eraseAt(e); });
canvas.addEventListener('pointerup',(e)=>{ erasing=false; });

function eraseAt(e){
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX-rect.left, y = e.clientY-rect.top;
  hairCtx.save();
  hairCtx.globalCompositeOperation = 'destination-out';
  hairCtx.beginPath();
  hairCtx.arc(x, y, 18, 0, Math.PI*2);
  hairCtx.fill();
  hairCtx.restore();
  // redraw final composite:
  draw();
}

eraserBtn.addEventListener('click', ()=>{
  eraser = !eraser;
  eraserBtn.classList.toggle('ghost', !eraser);
  eraserBtn.textContent = eraser ? 'Ластик УВІМК.' : 'Режим ластика';
});

undoBtn.addEventListener('click', ()=>{
  if (!undoStack.length) return;
  restoreFrom(undoStack.pop());
});

[scaleEl, rotEl, opEl].forEach(el=> el.addEventListener('input', ()=>{
  state.scale = parseFloat(scaleEl.value);
  state.rotation = parseFloat(rotEl.value);
  state.opacity = parseFloat(opEl.value);
  draw();
}));

resetBtn.addEventListener('click', ()=>{ resetTransforms(); flipX=false; draw(); });

saveBtn.addEventListener('click', ()=>{
  const a = document.createElement('a');
  a.download = 'hairtry.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
});

// init
(function init(){
  canvas.width = Math.min(1000, window.innerWidth-40);
  canvas.height = Math.round(canvas.width*1.2);
  thumbs.querySelector('img').classList.add('active');
  loadHair('fade.png');
  draw();
})();