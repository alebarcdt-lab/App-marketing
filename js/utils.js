/* =======================================================================
   UTILS — funciones base compartidas por toda la app.
   ======================================================================= */

function getLS(key){ try{ return JSON.parse(dbGetRaw(key)) || []; }catch(e){ return []; } }
function setLS(key,val){ dbSetRaw(key, JSON.stringify(val)); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function esc(str){ const d=document.createElement('div'); d.textContent = str==null?'':String(str); return d.innerHTML; }
function fmtFecha(iso){ if(!iso) return '—'; const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; }

/* Fecha local en formato ISO (YYYY-MM-DD). toISOString() devuelve UTC y,
   cerca de medianoche en España, "hoy" puede ser mañana. */
function isoLocal(d){
  d = d || new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function hoyLocal(){ return isoLocal(new Date()); }

/* Escape para interpolar texto de usuario dentro de cadenas JS en atributos
   onclick (esc() solo escapa HTML, no comillas simples para contexto JS). */
function escJs(str){ return String(str==null?'':str).replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

function showToast(msg){
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.style.display='flex';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=>{ t.style.display='none'; }, 2600);
}

function resizeImage(file, maxDim, quality, cb){
  const reader = new FileReader();
  reader.onload = e=>{
    const img = new Image();
    img.onload = ()=>{
      let w = img.width, h = img.height;
      if (w > h && w > maxDim){ h = h*(maxDim/w); w = maxDim; }
      else if (h > maxDim){ w = w*(maxDim/h); h = maxDim; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      cb(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
