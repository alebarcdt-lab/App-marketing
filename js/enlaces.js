/* =======================================================================
   ENLACES — accesos rápidos a rutas de ordenador y webs.
   ======================================================================= */

/* Detecta si un valor es una ruta de ordenador (C:\..., \\servidor\..., /home/..., etc.)
   en vez de una URL, para decidir si mostrar "Abrir" o "Copiar ruta". */
function esRutaOrdenador(valor){
  const v = (valor||'').trim();
  if (!v) return false;
  if (/^https?:\/\//i.test(v)) return false;
  if (/^[a-zA-Z]:[\\\/]/.test(v)) return true;
  if (/^\\\\/.test(v)) return true;
  if (/^\//.test(v)) return true;
  if (v.includes('\\')) return true;
  return false;
}

/* =======================================================================
   ENLACES — centro de rutas del ordenador y accesos a webs
   ======================================================================= */
function guardarEnlace(){
  const titulo = document.getElementById('enlaceTitulo').value.trim();
  const url = document.getElementById('enlaceUrl').value.trim();
  if (!titulo || !url){ showToast('Indica un título y una URL o ruta.'); return; }
  const tipo = esRutaOrdenador(url) ? 'ordenador' : 'web';
  const enlaces = getLS(LS.enlaces);
  enlaces.unshift({ id: uid(), titulo, tipo, url });
  setLS(LS.enlaces, enlaces);
  document.getElementById('enlaceTitulo').value = '';
  document.getElementById('enlaceUrl').value = '';
  renderEnlaces();
  showToast('Enlace guardado.');
}

function eliminarEnlace(id){
  const e = getLS(LS.enlaces).find(x=>x.id===id);
  if (!e) return;
  if (!confirm(`¿Eliminar el enlace "${e.titulo}"?`)) return;
  setLS(LS.enlaces, getLS(LS.enlaces).filter(x=>x.id!==id));
  renderEnlaces();
  showToast('Enlace eliminado.');
}

function copiarEnlace(id){
  const e = getLS(LS.enlaces).find(x=>x.id===id);
  if (!e) return;
  navigator.clipboard.writeText(e.url).then(()=> showToast('Ruta copiada al portapapeles.'));
}

function renderEnlaces(){
  const q = (document.getElementById('enlaceSearch').value||'').trim().toLowerCase();
  const enlaces = getLS(LS.enlaces).filter(e => !q || e.titulo.toLowerCase().includes(q) || e.url.toLowerCase().includes(q));
  const wrap = document.getElementById('listaEnlaces');
  if (!enlaces.length){
    wrap.innerHTML = '<div class="panel"><p class="muted">Todavía no hay enlaces guardados.</p></div>';
    return;
  }
  wrap.innerHTML = enlaces.map(e=>`
    <div class="panel snippet-card">
      <div class="snippet-head">
        <div>
          <h4>${esc(e.titulo)}</h4>
          <div class="snippet-desc">${esc(e.url)}</div>
        </div>
        <div class="btn-row" style="margin-top:0;">
          ${e.tipo==='web' ? `<a class="btn btn-secondary" href="${esc(e.url)}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> Abrir</a>` : ''}
          <button class="btn btn-secondary" onclick="copiarEnlace('${e.id}')"><i class="fa-solid fa-copy"></i> Copiar</button>
          <span class="btn-ghost" onclick="eliminarEnlace('${e.id}')"><i class="fa-solid fa-trash"></i></span>
        </div>
      </div>
      <span class="tag ${e.tipo==='web'?'tag-teal':'tag-grey'}" style="margin-top:8px;display:inline-block;">${e.tipo==='web'?'Web':'Ordenador'}</span>
    </div>`).join('');
}
