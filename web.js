/* =======================================================================
   GESTOR DE WEBS DE PROYECTOS — snippets, estructura de la web,
   sugerencias y checklist de mantenimiento.
   ======================================================================= */

/* =======================================================================
   MÓDULO 2 — GESTOR DE WEBS DE PROYECTOS
   ======================================================================= */
function guardarSnippet(){
  const title = document.getElementById('snippetTitulo').value.trim();
  const desc = document.getElementById('snippetDescripcion').value.trim();
  const code = document.getElementById('snippetCodigo').value;
  if (!title || !code.trim()){ showToast('Indica al menos un título y el código del snippet.'); return; }
  const snippets = getLS(LS.snippets);
  snippets.unshift({ id: uid(), title, desc, code });
  setLS(LS.snippets, snippets);
  ['snippetTitulo','snippetDescripcion','snippetCodigo'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('snippetSearch').value='';
  renderSnippets(snippets);
  showToast('Snippet guardado en la biblioteca.');
}

function renderSnippets(list){
  const wrap = document.getElementById('snippetList');
  if (!list.length){
    wrap.innerHTML = '<div class="panel"><p class="muted">Todavía no has añadido ningún snippet. Guarda el primero con el formulario de arriba.</p></div>';
    return;
  }
  wrap.innerHTML = list.map(s=>`
    <div class="panel snippet-card">
      <div class="snippet-head">
        <div>
          <h4>${esc(s.title)}</h4>
          <div class="snippet-desc">${esc(s.desc)}</div>
        </div>
        <div class="btn-row" style="margin-top:0;">
          <button class="btn btn-secondary" onclick="copiarSnippet('${s.id}')"><i class="fa-solid fa-copy"></i> Copiar código</button>
          <span class="btn-ghost" onclick="eliminarSnippet('${s.id}')"><i class="fa-solid fa-trash"></i></span>
        </div>
      </div>
      <pre class="snippet-code">${esc(s.code)}</pre>
    </div>`).join('');
}

function filtrarSnippets(){
  const q = document.getElementById('snippetSearch').value.trim().toLowerCase();
  const all = getLS(LS.snippets);
  const filtered = all.filter(s => !q || s.title.toLowerCase().includes(q) || (s.desc||'').toLowerCase().includes(q));
  renderSnippets(filtered);
}

function copiarSnippet(id){
  const s = getLS(LS.snippets).find(x=>x.id===id);
  if (!s) return;
  navigator.clipboard.writeText(s.code).then(()=> showToast('Snippet copiado al portapapeles.'));
}

function eliminarSnippet(id){
  const s = getLS(LS.snippets).find(x=>x.id===id);
  if (!s) return;
  if (!confirm(`¿Eliminar el snippet "${s.title}"?`)) return;
  setLS(LS.snippets, getLS(LS.snippets).filter(x=>x.id!==id));
  filtrarSnippets();
  showToast('Snippet eliminado.');
}

/* --- Estructura de páginas de proyecto --- */
function getEstructuraWebObj(){
  const raw = dbGetRaw(LS.estructuraWebs);
  if (!raw) return {};
  try{ const parsed = JSON.parse(raw); return Array.isArray(parsed) ? {} : parsed; }catch(e){ return {}; }
}

function populateProyectoWebSelect(){
  const proyectos = getProyectosWeb();
  const opciones = proyectos.length ? proyectos.map(p=>`<option>${esc(p)}</option>`).join('') : '<option value="">Registra un proyecto en Configuración</option>';
  const sel = document.getElementById('proyectoWebActivo');
  const prev = sel.value;
  sel.innerHTML = opciones;
  if (proyectos.includes(prev)) sel.value = prev;
}

function añadirApartadoWeb(){
  const proyecto = document.getElementById('proyectoWebActivo').value;
  if (!proyecto){ showToast('Registra o selecciona primero un proyecto.'); return; }
  const slug = document.getElementById('apartadoSlug').value.trim();
  const contenido = document.getElementById('apartadoContenido').value.trim();
  if (!slug){ showToast('Indica el slug del apartado.'); return; }
  const estructura = getEstructuraWebObj();
  if (!estructura[proyecto]) estructura[proyecto] = [];
  estructura[proyecto].push({ id: uid(), slug, contenido });
  dbSetRaw(LS.estructuraWebs, JSON.stringify(estructura));
  document.getElementById('apartadoSlug').value='';
  document.getElementById('apartadoContenido').value='';
  renderEstructuraWeb();
  showToast('Apartado añadido.');
}

function eliminarApartadoWeb(id){
  const proyecto = document.getElementById('proyectoWebActivo').value;
  const estructura = getEstructuraWebObj();
  if (!estructura[proyecto]) return;
  const apartado = estructura[proyecto].find(a=>a.id===id);
  if (!confirm(`¿Eliminar el apartado "${apartado?apartado.slug:''}"?`)) return;
  estructura[proyecto] = estructura[proyecto].filter(a=>a.id!==id);
  dbSetRaw(LS.estructuraWebs, JSON.stringify(estructura));
  renderEstructuraWeb();
  showToast('Apartado eliminado.');
}

function renderEstructuraWeb(){
  const proyecto = document.getElementById('proyectoWebActivo').value;
  const wrap = document.getElementById('listaApartadosWeb');
  if (!proyecto){
    wrap.innerHTML = '<p class="muted small">Registra un proyecto en Configuración para empezar a definir su estructura de apartados.</p>';
    return;
  }
  const estructura = getEstructuraWebObj();
  const apartados = estructura[proyecto] || [];
  if (!apartados.length){
    wrap.innerHTML = '<p class="muted small">Todavía no hay apartados para este proyecto.</p>';
    return;
  }
  wrap.innerHTML = apartados.map(a=>`
    <div class="panel" style="margin-bottom:12px;">
      <div class="snippet-head">
        <h4 style="font-family:var(--mono);font-size:12.5px;">/${esc(a.slug)}</h4>
        <span class="btn-ghost" onclick="eliminarApartadoWeb('${a.id}')"><i class="fa-solid fa-xmark"></i></span>
      </div>
      <p style="font-size:12.5px;color:var(--ink-700);white-space:pre-wrap;margin-top:8px;">${a.contenido ? esc(a.contenido) : '<span class="muted">Sin contenido</span>'}</p>
    </div>`).join('');
}

const SUGERENCIAS_MANTENIMIENTO = [
  ['Web principal CIDAUT','Semanal','Comprobar que el formulario de contacto envía correctamente'],
  ['Web principal CIDAUT','Mensual','Revisar enlaces rotos con un verificador de enlaces'],
  ['Web principal CIDAUT','Mensual','Comprobar velocidad de carga y Core Web Vitals'],
  ['Web de proyecto','Mensual','Verificar que los banners de financiación europea están visibles'],
  ['Web de proyecto','Trimestral','Actualizar el listado de publicaciones y resultados'],
  ['Web principal CIDAUT','Trimestral','Revisar certificado SSL y renovación de dominio']
];

function renderSugerenciasMantenimiento(){
  document.getElementById('sugerenciasMantenimiento').innerHTML = SUGERENCIAS_MANTENIMIENTO.map((s,i)=>
    `<button class="btn btn-secondary" onclick="añadirTareaRapida(${i})"><i class="fa-solid fa-plus"></i> ${esc(s[2])}</button>`
  ).join('');
}

function añadirTareaRapida(i){
  const [sitio,periodo,tarea] = SUGERENCIAS_MANTENIMIENTO[i];
  const tareas = getLS(LS.mantenimiento);
  tareas.unshift({ id: uid(), sitio, tarea, periodo, done:false, ultima:null });
  setLS(LS.mantenimiento, tareas);
  renderMantenimiento();
  updateDashboardStats();
  showToast('Tarea añadida al checklist.');
}

function añadirTareaMantenimiento(){
  const sitio = document.getElementById('mSitio').value;
  const tarea = document.getElementById('mTarea').value.trim();
  const periodo = document.getElementById('mPeriodo').value;
  if (!tarea){ showToast('Describe la tarea de mantenimiento.'); return; }
  const tareas = getLS(LS.mantenimiento);
  tareas.unshift({ id: uid(), sitio, tarea, periodo, done:false, ultima:null });
  setLS(LS.mantenimiento, tareas);
  document.getElementById('mTarea').value='';
  renderMantenimiento();
  updateDashboardStats();
  showToast('Tarea añadida al checklist.');
}

function toggleMantenimiento(id){
  const tareas = getLS(LS.mantenimiento);
  const t = tareas.find(x=>x.id===id);
  if (!t) return;
  t.done = !t.done;
  t.ultima = t.done ? hoyLocal() : t.ultima;
  setLS(LS.mantenimiento, tareas);
  renderMantenimiento();
  updateDashboardStats();
}

function eliminarMantenimiento(id){
  const t = getLS(LS.mantenimiento).find(x=>x.id===id);
  if (!t) return;
  if (!confirm(`¿Eliminar la tarea de mantenimiento "${t.tarea}"?`)) return;
  setLS(LS.mantenimiento, getLS(LS.mantenimiento).filter(x=>x.id!==id));
  renderMantenimiento();
  updateDashboardStats();
  showToast('Tarea de mantenimiento eliminada.');
}

function renderMantenimiento(){
  const tareas = getLS(LS.mantenimiento);
  const wrap = document.getElementById('listaMantenimiento');
  if (!tareas.length){
    wrap.innerHTML = '<p class="muted small">No hay tareas todavía. Añade una desde el formulario o desde las sugerencias.</p>';
    return;
  }
  wrap.innerHTML = tareas.map(t=>`
    <div class="check-item ${t.done?'done':''}">
      <input type="checkbox" ${t.done?'checked':''} onchange="toggleMantenimiento('${t.id}')">
      <div class="ctext">
        ${esc(t.tarea)}
        <div class="cmeta">${esc(t.sitio)} · ${esc(t.periodo)}${t.ultima? ' · última verificación: '+fmtFecha(t.ultima) : ''}</div>
      </div>
      <span class="btn-ghost" onclick="eliminarMantenimiento('${t.id}')">Eliminar</span>
    </div>`).join('');
}

