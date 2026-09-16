/* =======================================================================
   REDES SOCIALES — previsualizador de posts, calendario editorial, banco
   de ideas, publicaciones programadas + analítica, y estadísticas de
   perfiles (seguidores). Todo vive en la misma pestaña de la app, así
   que va todo junto en un único archivo (comparten REDES_CONFIG,
   COLORES_RED y los helpers de gráficos).
   ======================================================================= */

let currentPlatform = 'linkedin';
let postImageData = null;

document.getElementById('postImagen').addEventListener('change', function(){
  if (!this.files[0]) return;
  resizeImage(this.files[0], 500, 0.75, dataUrl=>{
    postImageData = dataUrl;
    renderPostPreview();
  });
});

function setPlatform(p){
  currentPlatform = p;
  document.querySelectorAll('.platform-tab').forEach(t=> t.classList.toggle('active', t.dataset.platform===p));
  const labels = { linkedin:'Así se verá en LinkedIn.', x:'Así se verá en X.', instagram:'Así se verá en Instagram.', youtube:'Así se verá en YouTube.' };
  document.getElementById('postPreviewLabel').textContent = labels[p];
  renderPostPreview();
}

function initials(name){
  return (name||'C').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
}

function renderPostPreview(){
  const autor = document.getElementById('postAutor').value.trim() || 'CIDAUT';
  const texto = document.getElementById('postTexto').value.trim() || 'El texto de tu publicación aparecerá aquí.';
  const img = postImageData;
  const mock = document.getElementById('postPreviewMock');
  const ini = initials(autor);

  if (currentPlatform==='linkedin'){
    mock.innerHTML = `
      <div class="mock-card">
        <div class="mock-head">
          <div class="mock-avatar">${esc(ini)}</div>
          <div><div class="mock-name">${esc(autor)}</div><div class="mock-meta">Organización · Ahora</div></div>
        </div>
        <div class="mock-body">${esc(texto)}</div>
        ${img?`<img class="mock-img" src="${img}">`:''}
        <div class="mock-actions"><span><i class="fa-regular fa-thumbs-up"></i> Me gusta</span><span><i class="fa-regular fa-comment"></i> Comentar</span><span><i class="fa-solid fa-share"></i> Compartir</span></div>
      </div>`;
  } else if (currentPlatform==='x'){
    mock.innerHTML = `
      <div class="mock-card">
        <div class="mock-head">
          <div class="mock-avatar">${esc(ini)}</div>
          <div><div class="mock-name">${esc(autor)} <span class="mock-meta">@${esc(autor.toLowerCase().replace(/\s+/g,''))} · ahora</span></div></div>
        </div>
        <div class="mock-body">${esc(texto)}</div>
        ${img?`<img class="mock-img" src="${img}">`:''}
        <div class="mock-actions"><span><i class="fa-regular fa-comment"></i></span><span><i class="fa-solid fa-retweet"></i></span><span><i class="fa-regular fa-heart"></i></span><span><i class="fa-regular fa-chart-bar"></i></span></div>
      </div>`;
  } else if (currentPlatform==='instagram'){
    mock.innerHTML = `
      <div class="mock-card">
        <div class="mock-head">
          <div class="mock-avatar">${esc(ini)}</div>
          <div class="mock-name">${esc(autor)}</div>
        </div>
        ${img?`<img class="mock-img" src="${img}">`:`<div class="mock-img" style="height:220px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px;">Sin imagen adjunta</div>`}
        <div class="mock-actions"><span><i class="fa-regular fa-heart"></i></span><span><i class="fa-regular fa-comment"></i></span><span><i class="fa-regular fa-paper-plane"></i></span><span style="margin-left:auto;"><i class="fa-regular fa-bookmark"></i></span></div>
        <div class="mock-body" style="padding-bottom:14px;"><strong>${esc(autor)}</strong> ${esc(texto)}</div>
      </div>`;
  } else {
    mock.innerHTML = `
      <div class="mock-card">
        <div class="mock-yt-thumb">
          ${img?`<img src="${img}">`:`<div style="height:200px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px;">Sin miniatura adjunta</div>`}
        </div>
        <div class="mock-yt-title">${esc(texto.split('\n')[0])}</div>
        <div class="mock-head" style="padding-top:4px;">
          <div class="mock-avatar" style="width:28px;height:28px;font-size:11px;">${esc(ini)}</div>
          <div class="mock-meta">${esc(autor)} · vídeo nuevo</div>
        </div>
      </div>`;
  }
}

/* --- Calendario editorial --- */
let calDate = new Date();
let calEditId = null;

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

/* Color por plataforma en el calendario editorial: lo que importa de un
   vistazo es DÓNDE se publica, no el proyecto. */
const PLATAFORMA_CAL_COLOR = {
  'LinkedIn':  { bg:'#dbe9f8', fg:'#0a66c2' },
  'X':         { bg:'#e4e4e4', fg:'#111111' },
  'Instagram': { bg:'#fbe0ef', fg:'#c1338d' },
  'YouTube':   { bg:'#fddbdb', fg:'#c4131a' },
  'Email':     { bg:'#fdecc8', fg:'#a9720b' },
  'Mailing':   { bg:'#fdecc8', fg:'#a9720b' },
  'Web':       { bg:'#e3f6f3', fg:'#175058' },
  'Otro':      { bg:'#eef0f0', fg:'#5b6b6e' }
};
function colorPlataformaCal(plataforma){
  return PLATAFORMA_CAL_COLOR[plataforma] || { bg:'var(--teal-100)', fg:'var(--teal-700)' };
}
const DOWS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

function cambiarMes(delta){
  calDate.setMonth(calDate.getMonth()+delta);
  renderCalendar();
}

function renderCalendar(){
  const year = calDate.getFullYear(), month = calDate.getMonth();
  document.getElementById('calMesLabel').textContent = `${MESES[month].charAt(0).toUpperCase()+MESES[month].slice(1)} ${year}`;

  const firstDay = new Date(year, month, 1);
  let startOffset = firstDay.getDay()-1; if (startOffset<0) startOffset=6;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const entries = getLS(LS.calendario);
  const todayStr = hoyLocal();

  let cells = DOWS.map(d=>`<div class="cal-dow">${d}</div>`).join('');

  for (let i=startOffset; i>0; i--){
    cells += `<div class="cal-day other-month"><div class="dnum">${daysInPrevMonth-i+1}</div></div>`;
  }
  for (let day=1; day<=daysInMonth; day++){
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayEntries = entries.filter(e=>e.fecha===dateStr);
    const entryHtml = dayEntries.map(e=>{
      const label = (e.etiqueta==='proyecto' && e.proyecto) ? `${e.proyecto}: ${e.titulo}` : e.titulo;
      const color = colorPlataformaCal(e.plataforma);
      const clase = e.programada ? 'programada' : '';
      return `<div class="entry ${clase}" style="background:${color.bg};color:${color.fg};" onclick="abrirModalCal('${dateStr}','${e.id}')" title="${esc(e.plataforma||'')} · ${esc(label)}${e.programada?' (programada)':''}">${esc(label)}</div>`;
    }).join('');
    cells += `<div class="cal-day" style="${dateStr===todayStr?'box-shadow:inset 0 0 0 2px var(--teal-500);':''}">
      <div class="cal-day-head">
        <div class="dnum">${day}</div>
        <span class="add-btn" onclick="abrirModalCal('${dateStr}')"><i class="fa-solid fa-plus"></i></span>
      </div>
      <div class="cal-day-entries">${entryHtml}</div>
    </div>`;
  }
  const totalCells = startOffset + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i=1; i<=remaining; i++){
    cells += `<div class="cal-day other-month"><div class="dnum">${i}</div></div>`;
  }
  document.getElementById('calGrid').innerHTML = cells;
}

function abrirModalCal(dateStr, entryId){
  calEditId = entryId || null;
  document.getElementById('calFecha').value = dateStr;
  document.getElementById('calProyectoNuevo').value = '';
  if (entryId){
    const e = getLS(LS.calendario).find(x=>x.id===entryId);
    document.getElementById('calTitulo').value = e.titulo;
    document.getElementById('calEtiqueta').value = e.etiqueta;
    document.getElementById('calPlataforma').value = e.plataforma;
    document.getElementById('calProgramada').checked = !!e.programada;
    document.getElementById('calDeleteBtn').style.display = 'inline-flex';
    toggleCalProyectoField();
    if (e.etiqueta === 'proyecto') poblarSelectProyectoCalendario(e.proyecto);
  } else {
    document.getElementById('calTitulo').value = '';
    document.getElementById('calEtiqueta').value = 'cidaut';
    document.getElementById('calPlataforma').value = 'LinkedIn';
    document.getElementById('calProgramada').checked = false;
    document.getElementById('calDeleteBtn').style.display = 'none';
    toggleCalProyectoField();
  }
  document.getElementById('calModal').classList.add('active');
}

function toggleCalProyectoField(){
  const esProyecto = document.getElementById('calEtiqueta').value === 'proyecto';
  document.getElementById('calProyectoField').style.display = esProyecto ? 'block' : 'none';
  if (esProyecto) poblarSelectProyectoCalendario();
}

function poblarSelectProyectoCalendario(seleccionado){
  const proyectos = getProyectosWeb();
  const sel = document.getElementById('calProyectoNombre');
  let opciones = proyectos.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
  if (seleccionado && !proyectos.includes(seleccionado)){
    opciones += `<option value="${esc(seleccionado)}">${esc(seleccionado)}</option>`;
  }
  sel.innerHTML = opciones || '<option value="">Añade un proyecto abajo</option>';
  if (seleccionado) sel.value = seleccionado;
}

function añadirProyectoDesdeCalendario(){
  const nombre = document.getElementById('calProyectoNuevo').value.trim();
  if (!nombre){ showToast('Escribe el nombre del nuevo proyecto.'); return; }
  if (!getProyectosNombres().includes(nombre)){
    crearProyectoPorNombre(nombre);
    refrescarSelectsProyecto();
    renderProyectos();
  }
  document.getElementById('calProyectoNuevo').value = '';
  poblarSelectProyectoCalendario(nombre);
  showToast('Proyecto añadido y seleccionado.');
}

function cerrarModalCal(){
  document.getElementById('calModal').classList.remove('active');
}

function guardarEntradaCalendario(){
  const fecha = document.getElementById('calFecha').value;
  const titulo = document.getElementById('calTitulo').value.trim();
  if (!fecha || !titulo){ showToast('Indica fecha y contenido de la publicación.'); return; }
  const etiqueta = document.getElementById('calEtiqueta').value;
  let proyecto = '';
  if (etiqueta === 'proyecto'){
    proyecto = document.getElementById('calProyectoNombre').value;
    if (!proyecto){ showToast('Selecciona o añade primero un proyecto.'); return; }
  }
  const entries = getLS(LS.calendario);
  const data = {
    fecha,
    titulo,
    etiqueta,
    proyecto,
    plataforma: document.getElementById('calPlataforma').value,
    programada: document.getElementById('calProgramada').checked
  };
  if (calEditId){
    const idx = entries.findIndex(x=>x.id===calEditId);
    if (idx>-1) entries[idx] = {...entries[idx], ...data};
  } else {
    entries.push({ id: uid(), ...data });
  }
  setLS(LS.calendario, entries);
  cerrarModalCal();
  renderCalendar();
  renderListaPublicaciones();
  updateDashboardStats();
  showToast('Calendario actualizado.');
}

function borrarEntradaCalendario(){
  if (!calEditId) return;
  const e = getLS(LS.calendario).find(x=>x.id===calEditId);
  if (!confirm(`¿Eliminar la entrada "${e?e.titulo:''}" del calendario?`)) return;
  setLS(LS.calendario, getLS(LS.calendario).filter(x=>x.id!==calEditId));
  cerrarModalCal();
  renderCalendar();
  renderListaPublicaciones();
  updateDashboardStats();
  showToast('Entrada eliminada.');
}

function renderListaPublicaciones(){
  const tbody = document.querySelector('#tablaPublicaciones tbody');
  if (!tbody) return;
  const hoy = hoyLocal();
  const entries = getLS(LS.calendario).slice().sort((a,b)=> (a.fecha||'').localeCompare(b.fecha||''));
  if (!entries.length){
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Todavía no hay publicaciones programadas. Añádelas desde el calendario editorial.</td></tr>';
    return;
  }
  tbody.innerHTML = entries.map(e=>{
    const etiquetaTxt = e.etiqueta==='proyecto' ? (e.proyecto || 'Proyecto') : 'CIDAUT';
    const pasada = e.fecha < hoy;
    const color = colorPlataformaCal(e.plataforma);
    return `
    <tr style="${pasada?'opacity:0.55;':''}">
      <td>${fmtFecha(e.fecha)}</td>
      <td>${esc(e.titulo)}</td>
      <td><span class="tag ${e.etiqueta==='proyecto'?'tag-orange':'tag-teal'}">${esc(etiquetaTxt)}</span></td>
      <td><span class="tag" style="background:${color.bg};color:${color.fg};">${esc(e.plataforma)}</span></td>
      <td>${e.programada
        ? '<span class="tag" style="background:#fff;border:1px solid #1e7d34;color:#1e7d34;"><i class="fa-solid fa-check"></i> Programada</span>'
        : '<span class="tag tag-grey">Pendiente</span>'}</td>
      <td><span class="btn-ghost" onclick="abrirModalCal('${e.fecha}','${e.id}')">Editar</span></td>
    </tr>`;
  }).join('');
}

/* --- Banco de ideas --- */
let ideaEditId = null;

function poblarSelectProyectoIdea(){
  const proyectos = getProyectosNombres();
  const sel = document.getElementById('ideaProyecto');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="">Ninguno / General</option>' + proyectos.map(p=>`<option>${esc(p)}</option>`).join('');
  if (proyectos.includes(prev)) sel.value = prev;
}

function guardarIdea(){
  const titulo = document.getElementById('ideaTitulo').value.trim();
  if (!titulo){ showToast('Indica el título de la idea.'); return; }
  const data = {
    titulo,
    descripcion: document.getElementById('ideaDescripcion').value.trim(),
    plataforma: document.getElementById('ideaPlataforma').value,
    proyecto: document.getElementById('ideaProyecto').value
  };
  const ideas = getLS(LS.ideas);
  if (ideaEditId){
    const idx = ideas.findIndex(x=>x.id===ideaEditId);
    if (idx>-1) ideas[idx] = {...ideas[idx], ...data};
  } else {
    ideas.unshift({ id: uid(), estado:'Idea', ...data });
  }
  setLS(LS.ideas, ideas);
  cancelarEdicionIdea();
  renderIdeas();
  showToast('Idea guardada.');
}

function editarIdea(id){
  const idea = getLS(LS.ideas).find(x=>x.id===id);
  if (!idea) return;
  ideaEditId = id;
  document.getElementById('ideaTitulo').value = idea.titulo;
  document.getElementById('ideaDescripcion').value = idea.descripcion||'';
  document.getElementById('ideaPlataforma').value = idea.plataforma||'';
  document.getElementById('ideaProyecto').value = idea.proyecto||'';
  document.getElementById('ideaFormTitulo').textContent = 'Editar idea';
  document.getElementById('cancelarEdicionIdeaBtn').style.display = 'inline-flex';
}

function cancelarEdicionIdea(){
  ideaEditId = null;
  ['ideaTitulo','ideaDescripcion'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('ideaPlataforma').value = '';
  document.getElementById('ideaProyecto').value = '';
  document.getElementById('ideaFormTitulo').textContent = 'Añadir idea';
  document.getElementById('cancelarEdicionIdeaBtn').style.display = 'none';
}

function eliminarIdea(id){
  const i = getLS(LS.ideas).find(x=>x.id===id);
  if (!i) return;
  if (!confirm(`¿Eliminar la idea "${i.titulo}"?`)) return;
  setLS(LS.ideas, getLS(LS.ideas).filter(x=>x.id!==id));
  renderIdeas();
  showToast('Idea eliminada.');
}

function cambiarEstadoIdea(id, estado){
  const ideas = getLS(LS.ideas);
  const idea = ideas.find(x=>x.id===id);
  if (!idea) return;
  idea.estado = estado;
  setLS(LS.ideas, ideas);
  renderIdeas();
}

function renderIdeas(){
  const filtro = document.getElementById('ideaFiltroEstado').value;
  const ideas = getLS(LS.ideas).filter(i => !filtro || i.estado===filtro);
  const wrap = document.getElementById('listaIdeas');
  if (!ideas.length){
    wrap.innerHTML = '<p class="muted small">Todavía no hay ideas guardadas.</p>';
    return;
  }
  wrap.innerHTML = ideas.map(i=>`
    <div class="panel" style="margin-bottom:12px;">
      <div class="snippet-head">
        <div>
          <h4>${esc(i.titulo)}</h4>
          <div style="margin-top:6px;">
            ${i.plataforma?`<span class="tag tag-teal">${esc(i.plataforma)}</span>`:''}
            ${i.proyecto?`<span class="tag tag-orange" style="margin-left:4px;">${esc(i.proyecto)}</span>`:''}
          </div>
        </div>
        <div class="btn-row" style="margin-top:0;">
          <span class="btn-ghost" onclick="editarIdea('${i.id}')"><i class="fa-solid fa-pen"></i></span>
          <span class="btn-ghost" onclick="eliminarIdea('${i.id}')"><i class="fa-solid fa-trash"></i></span>
        </div>
      </div>
      ${i.descripcion?`<p style="font-size:12.5px;color:var(--ink-700);white-space:pre-wrap;margin-top:10px;">${esc(i.descripcion)}</p>`:''}
      <div class="field" style="margin-top:10px;margin-bottom:0;max-width:200px;">
        <select onchange="cambiarEstadoIdea('${i.id}', this.value)">
          <option ${i.estado==='Idea'?'selected':''}>Idea</option>
          <option ${i.estado==='En preparación'?'selected':''}>En preparación</option>
          <option ${i.estado==='Usada'?'selected':''}>Usada</option>
        </select>
      </div>
    </div>`).join('');
}

/* =======================================================================
   ANALÍTICA DE REDES SOCIALES
   ======================================================================= */
const REDES_CONFIG = {
  linkedin: {
    label: 'LinkedIn',
    campos: [
      { key:'impresiones', label:'Impresiones' },
      { key:'interacciones', label:'Interacciones' },
      { key:'clics', label:'Clics' },
      { key:'reacciones', label:'Reacciones' },
      { key:'comentarios', label:'Comentarios' },
      { key:'compartidos', label:'Compartidos' }
    ],
    calculadas: [
      { key:'tasaInteraccion', label:'Tasa de interacción', calc:m => m.impresiones ? (m.interacciones/m.impresiones*100) : null },
      { key:'tasaClics', label:'Tasa de clics', calc:m => m.impresiones ? (m.clics/m.impresiones*100) : null }
    ],
    tablaCols: ['impresiones','interacciones','tasaInteraccion','clics','tasaClics','reacciones','comentarios','compartidos']
  },
  x: {
    label: 'X',
    campos: [
      { key:'meGusta', label:'Me gusta' },
      { key:'retweets', label:'Retweets / republicaciones' },
      { key:'comentarios', label:'Comentarios' },
      { key:'impresiones', label:'Impresiones' },
      { key:'interacciones', label:'Interacciones' },
      { key:'visitasPerfil', label:'Visitas al perfil' },
      { key:'clicsEnlace', label:'Clics en el enlace' }
    ],
    calculadas: [],
    tablaCols: ['impresiones','interacciones','meGusta','retweets','comentarios','visitasPerfil','clicsEnlace']
  },
  instagram: {
    label: 'Instagram',
    campos: [
      { key:'meGusta', label:'Me gusta' },
      { key:'comentarios', label:'Comentarios' },
      { key:'visualizaciones', label:'Visualizaciones' },
      { key:'pctSeguidores', label:'% visualizaciones de seguidores', step:'0.1' },
      { key:'pctNoSeguidores', label:'% visualizaciones de no seguidores', step:'0.1' },
      { key:'cuentasAlcanzadas', label:'Cuentas alcanzadas' },
      { key:'interacciones', label:'Interacciones' },
      { key:'visitasPerfil', label:'Visitas al perfil' }
    ],
    calculadas: [],
    tablaCols: ['visualizaciones','interacciones','cuentasAlcanzadas','meGusta','comentarios','visitasPerfil']
  },
  youtube: {
    label: 'YouTube',
    /* Estructura abierta: añade aquí nuevas métricas de YouTube en el futuro
       sin tener que tocar el resto del módulo. */
    campos: [
      { key:'meGusta', label:'Me gusta' },
      { key:'tiempoVisualizacionHoras', label:'Tiempo de visualización (horas)', step:'0.1' }
    ],
    calculadas: [],
    tablaCols: ['meGusta','tiempoVisualizacionHoras']
  }
};
const COLORES_RED = { linkedin:'#0a66c2', x:'#111111', instagram:'#c1338d', youtube:'#ff0000' };
const DIAS_SEMANA = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DIAS_SEMANA_ORDEN = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const MESES_CAP = MESES.map(m => m.charAt(0).toUpperCase()+m.slice(1));

let pubRedActual = 'linkedin';
let publicacionEditId = null;
let pubSortDir = 'desc';
let chartAnaImpresionesRef=null, chartAnaInteraccionesRef=null, chartAnaPublicacionesMesRef=null, chartAnaDiaSemanaRef=null, chartAnaHoraRef=null;

function sum(arr){ return arr.filter(v=>v!=null && !isNaN(v)).reduce((a,b)=>a+b,0); }
function numOrNull(v){ return (v===undefined || v===null || v==='') ? null : Number(v); }
function fmtNum(n){ return Math.round(n||0).toLocaleString('es-ES'); }
function setText(id, val){ const el = document.getElementById(id); if (el) el.textContent = val; }

function calcularCamposFecha(fechaISO){
  if (!fechaISO) return { diaSemana:'', diaMes:'', mes:'', anio:'' };
  const [y,m,d] = fechaISO.split('-').map(Number);
  const fechaObj = new Date(y, m-1, d);
  return { diaSemana: DIAS_SEMANA[fechaObj.getDay()], diaMes: d, mes: MESES[m-1], anio: y };
}

/* Normaliza las métricas de cada red a un pequeño conjunto común
   (impresiones, interacciones, alcance, clics) para poder agregarlas
   en el dashboard y los gráficos comparativos entre redes. */
function metricasNormalizadas(pub){
  const m = pub.metricas || {};
  let impresiones=null, interacciones=null, alcance=null, clics=null;
  if (pub.red==='linkedin'){ impresiones=m.impresiones; interacciones=m.interacciones; clics=m.clics; }
  else if (pub.red==='x'){ impresiones=m.impresiones; interacciones=m.interacciones; clics=m.clicsEnlace; }
  else if (pub.red==='instagram'){ impresiones=m.visualizaciones; interacciones=m.interacciones; alcance=m.cuentasAlcanzadas; }
  else if (pub.red==='youtube'){ interacciones=m.meGusta; }
  return { impresiones: numOrNull(impresiones), interacciones: numOrNull(interacciones), alcance: numOrNull(alcance), clics: numOrNull(clics) };
}

function getProyRedesSeleccionadas(){
  return Array.from(document.querySelectorAll('#config-proyectos .proyRedCheckbox:checked')).map(c=>c.value);
}

/* --- Formulario de registro de publicaciones --- */
function poblarSelectProyectoPublicacion(){
  const sel = document.getElementById('pubProyecto');
  if (!sel) return;
  const proyectos = getProyectosNombres();
  const prev = sel.value;
  sel.innerHTML = '<option value="">Ninguno / General</option>' + proyectos.map(p=>`<option>${esc(p)}</option>`).join('');
  if (proyectos.includes(prev)) sel.value = prev;
  onCambioProyectoPublicacion();
}

function onCambioProyectoPublicacion(){
  const sel = document.getElementById('pubProyecto');
  const tabs = document.getElementById('pubPlatformTabs');
  if (!sel || !tabs) return;
  const proyecto = getProyectos().find(p=>p.nombre===sel.value);
  const activas = (proyecto && proyecto.redesSociales && proyecto.redesSociales.length) ? proyecto.redesSociales : Object.keys(REDES_CONFIG);
  let redActualVisible = false;
  tabs.querySelectorAll('.platform-tab').forEach(t=>{
    const disponible = activas.includes(t.dataset.platform);
    t.style.display = disponible ? '' : 'none';
    if (disponible && t.dataset.platform===pubRedActual) redActualVisible = true;
  });
  if (!redActualVisible) setPubRed(activas[0] || 'linkedin');
}

function abrirModalPublicacion(){
  cancelarEdicionPublicacionRed();
  document.getElementById('pubModal').classList.add('active');
}

function cerrarModalPublicacion(){
  cancelarEdicionPublicacionRed();
}

function setPubRed(red, valores){
  pubRedActual = red;
  document.querySelectorAll('#pubPlatformTabs .platform-tab').forEach(t=>t.classList.toggle('active', t.dataset.platform===red));
  renderCamposMetricasPublicacion(red, valores || {});
}

function renderCamposMetricasPublicacion(red, valores){
  const cfg = REDES_CONFIG[red];
  const cont = document.getElementById('pubCamposMetricas');
  if (!cfg || !cont) return;
  let filas = '';
  for (let i=0; i<cfg.campos.length; i+=2){
    const par = cfg.campos.slice(i, i+2);
    filas += `<div class="field-row">${par.map(c=>`
      <div class="field">
        <label for="pubM_${c.key}">${c.label}</label>
        <input type="number" id="pubM_${c.key}" min="0" ${c.step?`step="${c.step}"`:''} value="${valores[c.key]!=null?valores[c.key]:''}" oninput="actualizarCalculadasPublicacion()">
      </div>`).join('')}</div>`;
  }
  cont.innerHTML = filas + '<div class="muted small" id="pubCalculadasPreview" style="margin:-6px 0 16px 0;"></div>';
  actualizarCalculadasPublicacion();
}

function actualizarCalculadasPublicacion(){
  const cfg = REDES_CONFIG[pubRedActual];
  if (!cfg) return;
  const vals = {};
  cfg.campos.forEach(c=>{ const el = document.getElementById('pubM_'+c.key); vals[c.key] = el ? (parseFloat(el.value)||0) : 0; });
  const partes = [];
  cfg.calculadas.forEach(c=>{
    const v = c.calc(vals);
    if (v!=null && isFinite(v)) partes.push(`${c.label}: ${v.toFixed(1)} %`);
  });
  if (pubRedActual==='instagram' && (vals.pctSeguidores || vals.pctNoSeguidores)){
    const sumaPct = (vals.pctSeguidores||0) + (vals.pctNoSeguidores||0);
    partes.push(`Suma seguidores/no seguidores: ${sumaPct.toFixed(1)} %${Math.abs(sumaPct-100)>3?' (revisa que sume ~100%)':''}`);
  }
  const el = document.getElementById('pubCalculadasPreview');
  if (el) el.textContent = partes.join('   ·   ');
}

function onCambioFechaPublicacion(){
  const f = calcularCamposFecha(document.getElementById('pubFecha').value);
  const el = document.getElementById('pubFechaCalculada');
  if (el) el.textContent = f.diaSemana ? `${f.diaSemana}, día ${f.diaMes} de ${MESES_CAP[MESES.indexOf(f.mes)]} de ${f.anio}` : '';
}

function guardarPublicacionRed(){
  const titulo = document.getElementById('pubTitulo').value.trim();
  const fecha = document.getElementById('pubFecha').value;
  if (!titulo){ showToast('Indica el título de la publicación.'); return; }
  if (!fecha){ showToast('Indica la fecha de publicación.'); return; }
  const cfg = REDES_CONFIG[pubRedActual];
  const metricas = {};
  cfg.campos.forEach(c=>{
    const raw = document.getElementById('pubM_'+c.key).value;
    metricas[c.key] = raw==='' ? null : Number(raw);
  });
  cfg.calculadas.forEach(c=>{
    const v = c.calc(metricas);
    metricas[c.key] = (v!=null && isFinite(v)) ? Number(v.toFixed(2)) : null;
  });
  const fc = calcularCamposFecha(fecha);
  const data = {
    titulo,
    enlace: document.getElementById('pubEnlace').value.trim(),
    proyecto: document.getElementById('pubProyecto').value,
    red: pubRedActual,
    fecha,
    hora: document.getElementById('pubHora').value,
    diaSemana: fc.diaSemana,
    diaMes: fc.diaMes,
    mes: fc.mes,
    anio: fc.anio,
    metricas
  };
  const publicaciones = getLS(LS.publicacionesRedes);
  if (publicacionEditId){
    const idx = publicaciones.findIndex(x=>x.id===publicacionEditId);
    if (idx>-1) publicaciones[idx] = {...publicaciones[idx], ...data};
  } else {
    publicaciones.unshift({ id: uid(), ...data });
  }
  setLS(LS.publicacionesRedes, publicaciones);
  cancelarEdicionPublicacionRed();
  poblarFiltrosAnalyticsRedes();
  renderAnalyticsRedes();
  showToast('Publicación guardada.');
}

function editarPublicacionRed(id){
  const pub = getLS(LS.publicacionesRedes).find(x=>x.id===id);
  if (!pub) return;
  publicacionEditId = id;
  document.getElementById('pubProyecto').value = pub.proyecto || '';
  onCambioProyectoPublicacion();
  setPubRed(pub.red, pub.metricas);
  document.getElementById('pubTitulo').value = pub.titulo;
  document.getElementById('pubEnlace').value = pub.enlace || '';
  document.getElementById('pubFecha').value = pub.fecha;
  document.getElementById('pubHora').value = pub.hora || '';
  onCambioFechaPublicacion();
  document.getElementById('pubFormTitulo').textContent = 'Editar publicación';
  document.getElementById('cancelarEdicionPubBtn').style.display = 'inline-flex';
  goTo('redes','analitica');
  document.getElementById('pubModal').classList.add('active');
}

function cancelarEdicionPublicacionRed(){
  publicacionEditId = null;
  ['pubTitulo','pubEnlace','pubFecha','pubHora'].forEach(id=>{ const el=document.getElementById(id); if (el) el.value=''; });
  document.getElementById('pubProyecto').value = '';
  const fc = document.getElementById('pubFechaCalculada'); if (fc) fc.textContent = '';
  onCambioProyectoPublicacion();
  setPubRed(analiticaRedActual);
  document.getElementById('pubFormTitulo').textContent = 'Registrar publicación';
  document.getElementById('cancelarEdicionPubBtn').style.display = 'none';
  const modalPub = document.getElementById('pubModal'); if (modalPub) modalPub.classList.remove('active');
}

function eliminarPublicacionRed(id){
  const p = getLS(LS.publicacionesRedes).find(x=>x.id===id);
  if (!p) return;
  if (!confirm(`¿Eliminar la publicación "${p.titulo}"? Esto también borrará sus métricas registradas.`)) return;
  setLS(LS.publicacionesRedes, getLS(LS.publicacionesRedes).filter(x=>x.id!==id));
  if (publicacionEditId===id) cancelarEdicionPublicacionRed();
  poblarFiltrosAnalyticsRedes();
  renderAnalyticsRedes();
  showToast('Publicación eliminada.');
}

/* --- Filtros y dashboard de analítica --- */
function poblarFiltrosAnalyticsRedes(){
  const selProy = document.getElementById('anaFiltroProyecto');
  if (!selProy) return;
  const prevProy = selProy.value;
  const proyectos = getProyectosNombres();
  selProy.innerHTML = '<option value="">Todos los proyectos</option>' + proyectos.map(p=>`<option>${esc(p)}</option>`).join('');
  if (proyectos.includes(prevProy)) selProy.value = prevProy;

  const publicaciones = getLS(LS.publicacionesRedes);
  const anios = [...new Set(publicaciones.map(p=>p.anio).filter(Boolean))].sort((a,b)=>b-a);
  const selAnio = document.getElementById('anaFiltroAnio');
  const prevAnio = selAnio.value;
  selAnio.innerHTML = '<option value="">Todos los años</option>' + anios.map(a=>`<option>${a}</option>`).join('');
  if (anios.map(String).includes(prevAnio)) selAnio.value = prevAnio;
}

function limpiarFiltrosAnalyticsRedes(){
  ['anaFiltroProyecto','anaFiltroAnio','anaFiltroMes','anaFiltroDiaSemana'].forEach(id=>{ const el=document.getElementById(id); if (el) el.value=''; });
  renderAnalyticsRedes();
}

function publicacionesFiltradasAnalytics(){
  const proyecto = document.getElementById('anaFiltroProyecto').value;
  const red = document.getElementById('anaFiltroRed').value;
  const anio = document.getElementById('anaFiltroAnio').value;
  const mes = document.getElementById('anaFiltroMes').value;
  const diaSemana = document.getElementById('anaFiltroDiaSemana').value;
  return getLS(LS.publicacionesRedes).filter(p=>{
    if (proyecto && p.proyecto!==proyecto) return false;
    if (red && p.red!==red) return false;
    if (anio && String(p.anio)!==String(anio)) return false;
    if (mes && p.mes!==mes) return false;
    if (diaSemana && p.diaSemana!==diaSemana) return false;
    return true;
  });
}

function renderAnalyticsRedes(){
  if (!document.getElementById('anaFiltroProyecto')) return;
  const pubs = publicacionesFiltradasAnalytics();
  renderKpisAnalyticsRedes(pubs);
  renderResumenProyectoAnalytics(pubs);
  renderGraficosAnalyticsRedes(pubs);
  renderTablaPublicacionesRed();
}

function renderKpisAnalyticsRedes(pubs){
  const norm = pubs.map(p=>({ p, n: metricasNormalizadas(p) }));
  const totalImpresiones = sum(norm.map(x=>x.n.impresiones));
  const totalInteracciones = sum(norm.map(x=>x.n.interacciones));
  const totalAlcance = sum(norm.map(x=>x.n.alcance));
  const totalClics = sum(norm.map(x=>x.n.clics));
  const conImpresiones = norm.filter(x=>x.n.impresiones!=null);
  const conInteracciones = norm.filter(x=>x.n.interacciones!=null);
  const mediaImpresiones = conImpresiones.length ? sum(conImpresiones.map(x=>x.n.impresiones))/conImpresiones.length : 0;
  const mediaInteracciones = conInteracciones.length ? sum(conInteracciones.map(x=>x.n.interacciones))/conInteracciones.length : 0;
  const tasas = norm.filter(x=>x.n.impresiones && x.n.interacciones!=null).map(x=>x.n.interacciones/x.n.impresiones*100);
  const tasaMedia = tasas.length ? sum(tasas)/tasas.length : 0;

  let mejorPub = null, mejorScore = -1;
  norm.forEach(x=>{ const score = x.n.interacciones || 0; if (score>mejorScore){ mejorScore=score; mejorPub=x.p; } });

  setText('anaStatTotalPubs', pubs.length);
  setText('anaStatImpresiones', fmtNum(totalImpresiones));
  setText('anaStatInteracciones', fmtNum(totalInteracciones));
  setText('anaStatAlcance', fmtNum(totalAlcance));
  setText('anaStatClics', fmtNum(totalClics));
  setText('anaStatTasaMedia', tasaMedia.toFixed(1)+' %');
  setText('anaStatMediaImpresiones', mediaImpresiones.toFixed(1));
  setText('anaStatMediaInteracciones', mediaInteracciones.toFixed(1));
  setText('anaStatMejorPub', mejorPub ? mejorPub.titulo : '—');
}

function renderResumenProyectoAnalytics(pubs){
  const proyecto = document.getElementById('anaFiltroProyecto').value;
  const panel = document.getElementById('anaResumenProyecto');
  if (!proyecto){ panel.style.display = 'none'; return; }
  panel.style.display = 'block';

  const redesUsadas = [...new Set(pubs.map(p=>p.red))];
  const porRedCount = {};
  pubs.forEach(p=>{ porRedCount[p.red] = (porRedCount[p.red]||0)+1; });
  let redMasActiva = null, maxCount = -1;
  Object.keys(porRedCount).forEach(r=>{ if (porRedCount[r]>maxCount){ maxCount=porRedCount[r]; redMasActiva=r; } });

  const porMes = {};
  pubs.forEach(p=>{ const clave = `${p.anio}-${String(MESES.indexOf(p.mes)+1).padStart(2,'0')}`; porMes[clave]=(porMes[clave]||0)+1; });
  let mejorMesClave = null, mejorMesCount = -1;
  Object.keys(porMes).forEach(k=>{ if (porMes[k]>mejorMesCount){ mejorMesCount=porMes[k]; mejorMesClave=k; } });
  let mejorMesTexto = '';
  if (mejorMesClave){
    const [y,m] = mejorMesClave.split('-');
    mejorMesTexto = `${MESES_CAP[Number(m)-1]} ${y}`;
  }

  const norm = pubs.map(p=>metricasNormalizadas(p));
  const totalImpresiones = sum(norm.map(n=>n.impresiones));
  const totalInteracciones = sum(norm.map(n=>n.interacciones));

  let mejorPub = null, mejorScore = -1;
  pubs.forEach(p=>{ const n = metricasNormalizadas(p); const score = n.interacciones||0; if (score>mejorScore){ mejorScore=score; mejorPub=p; } });

  document.getElementById('anaResumenProyectoBody').innerHTML = `
    <div class="grid-3">
      <div><div class="stat-num" style="font-size:22px;">${pubs.length}</div><div class="stat-label">Publicaciones</div></div>
      <div><div class="stat-num" style="font-size:22px;">${fmtNum(totalImpresiones)}</div><div class="stat-label">Impresiones acumuladas</div></div>
      <div><div class="stat-num" style="font-size:22px;">${fmtNum(totalInteracciones)}</div><div class="stat-label">Interacciones acumuladas</div></div>
    </div>
    <div style="margin-top:16px;">
      ${redesUsadas.length ? redesUsadas.map(r=>`<span class="tag tag-teal" style="margin-right:4px;">${REDES_CONFIG[r].label}</span>`).join('') : '<span class="muted small">Todavía no hay publicaciones registradas para este proyecto.</span>'}
    </div>
    ${(redMasActiva||mejorPub||mejorMesTexto) ? `<div class="small muted" style="margin-top:12px;">
      ${redMasActiva?`Red con mayor actividad: <strong>${REDES_CONFIG[redMasActiva].label}</strong>. `:''}
      ${mejorPub?`Mejor publicación: <strong>${esc(mejorPub.titulo)}</strong>. `:''}
      ${mejorMesTexto?`Mejor mes: <strong>${mejorMesTexto}</strong> (${mejorMesCount} publicación${mejorMesCount===1?'':'es'}).`:''}
    </div>` : ''}`;
}

function dibujarLineChart(canvasId, ref, labels, data, label){
  const ctx = document.getElementById(canvasId);
  if (!ctx) return ref;
  if (ref) ref.destroy();
  return new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[{ label, data, borderColor:'#1bb8a6', backgroundColor:'rgba(27,184,166,0.12)', fill:true, tension:0.25, pointRadius:3 }] },
    options:{ responsive:true, plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true, ticks:{precision:0} } } }
  });
}

function dibujarBarChart(canvasId, ref, labels, data, label, colores){
  const ctx = document.getElementById(canvasId);
  if (!ctx) return ref;
  if (ref) ref.destroy();
  return new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[{ label, data, backgroundColor: colores || '#1bb8a6' }] },
    options:{ responsive:true, plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true, ticks:{precision:0} } } }
  });
}

function renderGraficosAnalyticsRedes(pubs){
  if (!document.getElementById('chartAnaImpresiones')) return;
  const claveMes = p => `${p.anio}-${String(MESES.indexOf(p.mes)+1).padStart(2,'0')}`;
  const claves = [...new Set(pubs.map(claveMes))].sort();
  const labelsMes = claves.map(c=>{ const [y,m]=c.split('-'); return `${MESES_CAP[Number(m)-1].slice(0,3)} ${y}`; });
  const impresionesPorMes = claves.map(c=> sum(pubs.filter(p=>claveMes(p)===c).map(p=>metricasNormalizadas(p).impresiones)));
  const interaccionesPorMes = claves.map(c=> sum(pubs.filter(p=>claveMes(p)===c).map(p=>metricasNormalizadas(p).interacciones)));
  const cantidadPorMes = claves.map(c=> pubs.filter(p=>claveMes(p)===c).length);

  chartAnaImpresionesRef = dibujarLineChart('chartAnaImpresiones', chartAnaImpresionesRef, labelsMes, impresionesPorMes, 'Impresiones');
  chartAnaInteraccionesRef = dibujarLineChart('chartAnaInteracciones', chartAnaInteraccionesRef, labelsMes, interaccionesPorMes, 'Interacciones');
  chartAnaPublicacionesMesRef = dibujarBarChart('chartAnaPublicacionesMes', chartAnaPublicacionesMesRef, labelsMes, cantidadPorMes, 'Publicaciones');

  const cantidadPorDia = DIAS_SEMANA_ORDEN.map(d=> pubs.filter(p=>p.diaSemana===d).length);
  chartAnaDiaSemanaRef = dibujarBarChart('chartAnaDiaSemana', chartAnaDiaSemanaRef, DIAS_SEMANA_ORDEN, cantidadPorDia, 'Publicaciones');

  const horas = Array.from({length:24}, (_,i)=>i);
  const cantidadPorHora = horas.map(h=> pubs.filter(p=> p.hora && Number(p.hora.split(':')[0])===h).length);
  chartAnaHoraRef = dibujarBarChart('chartAnaHora', chartAnaHoraRef, horas.map(h=>`${h}h`), cantidadPorHora, 'Publicaciones');
}

/* --- Vista unificada por red social (estilo Metricool): cabecera +
   seguidores + publicaciones, todo scopeado a la red seleccionada --- */
let analiticaRedActual = 'linkedin';

function setAnaliticaRed(red){
  analiticaRedActual = red;
  document.querySelectorAll('#analiticaPlatformTabs .platform-tab').forEach(t=>t.classList.toggle('active', t.dataset.platform===red));
  const selA = document.getElementById('anaFiltroRed'); if (selA) selA.value = red;
  const selP = document.getElementById('perfFiltroRed'); if (selP) selP.value = red;
  renderAnaliticaRed();
}

function renderAnaliticaRed(){
  if (!document.getElementById('analiticaPlatformTabs')) return;
  renderCabeceraAnaliticaRed();
  renderPerfiles();
  renderAnalyticsRedes();
}

function renderCabeceraAnaliticaRed(){
  const cont = document.getElementById('anaRedCabecera');
  if (!cont) return;
  const red = analiticaRedActual;
  const cfg = REDES_CONFIG[red];
  if (!cfg) return;
  const color = COLORES_RED[red];
  const icono = REDES_ICONOS[red];
  cont.style.borderLeftColor = color;
  const anioSel = perfAnioSeleccionado();
  const resumen = calcularResumenRedPerfil(red, anioSel);
  let statsHtml;
  if (resumen){
    const { ultimo, variacionMensual, variacionMensualPct, crecAbs, crecPct } = resumen;
    statsHtml = `
      <div class="stat-num">${fmtNum(ultimo.seguidores)}</div>
      <div class="stat-label">seguidores · ${MESES_CAP[MESES.indexOf(ultimo.mes)]} ${ultimo.anio}</div>
      <div class="perf-card-row">
        <span>${fmtSignoPerfil(variacionMensual)} este mes</span>
        <span>${fmtSignoPctPerfil(variacionMensualPct)}</span>
      </div>
      <div class="muted small perf-card-annual">${fmtSignoPerfil(crecAbs)} (${fmtSignoPctPerfil(crecPct)}) en el año</div>`;
  } else {
    statsHtml = `<div class="stat-num">N/D</div><div class="stat-label">Todavía no hay seguidores registrados${anioSel?` para ${anioSel}`:''}.</div>`;
  }
  cont.innerHTML = `
    <div class="perf-card-head" style="margin-bottom:8px;">
      <i class="${icono}" style="color:${color};font-size:22px;"></i>
      <div class="panel-title" style="font-size:17px;margin-bottom:0;">${esc(cfg.label)}</div>
    </div>
    ${statsHtml}`;
}

/* --- Publicaciones agrupadas por red social --- */
const POST_REDES_ORDEN = ['linkedin','x','instagram','youtube'];

function alternarOrdenPublicaciones(){
  pubSortDir = pubSortDir==='asc' ? 'desc' : 'asc';
  const btn = document.getElementById('pubOrdenBtn');
  if (btn) btn.innerHTML = pubSortDir==='asc'
    ? '<i class="fa-solid fa-arrow-up-wide-short"></i> Más antiguas primero'
    : '<i class="fa-solid fa-arrow-down-wide-short"></i> Más recientes primero';
  renderTablaPublicacionesRed();
}

function renderTablaPublicacionesRed(){
  const wrap = document.getElementById('tablaPublicacionesRedWrap');
  if (!wrap) return;
  const redFiltro = document.getElementById('anaFiltroRed').value;
  const busqueda = (document.getElementById('pubBuscar').value||'').toLowerCase().trim();
  let pubs = publicacionesFiltradasAnalytics();
  if (busqueda) pubs = pubs.filter(p=> p.titulo.toLowerCase().includes(busqueda));

  if (!pubs.length){
    wrap.innerHTML = '<div class="panel" style="text-align:center;color:var(--ink-300);padding:30px 10px;">Todavía no hay publicaciones registradas con estos filtros.</div>';
    return;
  }

  const redesAMostrar = (redFiltro && REDES_CONFIG[redFiltro]) ? [redFiltro] : POST_REDES_ORDEN.filter(r=>pubs.some(p=>p.red===r));

  wrap.innerHTML = redesAMostrar.map(red=>{
    const cfg = REDES_CONFIG[red];
    if (!cfg) return '';
    const pubsRed = pubs.filter(p=>p.red===red).slice().sort((a,b)=>{
      const va = a.fecha||'', vb = b.fecha||'';
      if (va===vb) return 0;
      const mayor = va>vb;
      return pubSortDir==='asc' ? (mayor?1:-1) : (mayor?-1:1);
    });
    const totales = pubsRed.reduce((acc,p)=>{
      const n = metricasNormalizadas(p);
      acc.impresiones += (n.impresiones||0);
      acc.interacciones += (n.interacciones||0);
      return acc;
    }, { impresiones:0, interacciones:0 });
    const todosCampos = cfg.campos.concat(cfg.calculadas);
    const columnas = cfg.tablaCols.map(k=>{
      const c = todosCampos.find(x=>x.key===k);
      return { key:k, label: c ? c.label : k };
    });

    const filasHtml = pubsRed.map(p=>{
      const cols = columnas.map(c=>{
        const val = p.metricas ? p.metricas[c.key] : null;
        if (val==null || val===''){ return '<td>—</td>'; }
        if (c.key.toLowerCase().startsWith('tasa') || c.key.toLowerCase().startsWith('pct')) return `<td>${Number(val).toFixed(1)} %</td>`;
        return `<td>${fmtNum(Number(val))}</td>`;
      }).join('');
      return `<tr>
        <td style="white-space:nowrap;">${fmtFecha(p.fecha)}${p.hora?` <span class="muted small">${esc(p.hora)}</span>`:''}</td>
        <td>${p.enlace?`<a href="${esc(p.enlace)}" target="_blank" rel="noopener">${esc(p.titulo)}</a>`:esc(p.titulo)}</td>
        <td>${p.proyecto?esc(p.proyecto):'<span class="muted">—</span>'}</td>
        ${cols}
        <td style="white-space:nowrap;">
          <span class="btn-ghost" onclick="editarPublicacionRed('${p.id}')"><i class="fa-solid fa-pen"></i></span>
          <span class="btn-ghost" onclick="eliminarPublicacionRed('${p.id}')"><i class="fa-solid fa-trash"></i></span>
        </td>
      </tr>`;
    }).join('');

    return `
    <div class="red-block">
      <div class="red-block-header" style="background:${COLORES_RED[red]}14;">
        <div class="red-block-icon" style="background:${COLORES_RED[red]};"><i class="${REDES_ICONOS[red]||''}"></i></div>
        <div class="red-block-title">${esc(cfg.label)}</div>
        <span class="tag" style="background:${COLORES_RED[red]}22;color:${COLORES_RED[red]};">${pubsRed.length} publicación${pubsRed.length===1?'':'es'}</span>
        <div class="red-block-meta">
          ${totales.impresiones?`<span><strong>${fmtNum(totales.impresiones)}</strong> impresiones</span>`:''}
          ${totales.interacciones?`<span><strong>${fmtNum(totales.interacciones)}</strong> interacciones</span>`:''}
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Fecha</th>
            <th>Título</th>
            <th>Proyecto</th>
            ${columnas.map(c=>`<th>${c.label}</th>`).join('')}
            <th></th>
          </tr></thead>
          <tbody>${filasHtml || `<tr class="empty-row"><td colspan="${4+columnas.length}">Sin publicaciones de ${esc(cfg.label)} con estos filtros.</td></tr>`}</tbody>
        </table>
      </div>
    </div>`;
  }).join('');
}

/* =======================================================================
   ESTADÍSTICAS DE PERFILES — evolución mensual de seguidores por red
   (segunda capa del módulo Analítica de Redes Sociales, independiente
   de la estructura de datos de publicacionesRedes)
   ======================================================================= */
const PERFIL_REDES_ORDEN = ['linkedin','x','instagram','youtube'];
const REDES_ICONOS = {
  linkedin: 'fa-brands fa-linkedin',
  x: 'fa-brands fa-x-twitter',
  instagram: 'fa-brands fa-instagram',
  youtube: 'fa-brands fa-youtube'
};

let perfRedActual = 'linkedin';
let perfilEditId = null;
let chartPerfEvolucionRef = null, chartPerfCrecimientoRef = null, chartPerfLinkedinRef = null;

function getEstadisticasPerfiles(){ return getLS(LS.estadisticasPerfiles); }

function ordenarCronologicoPerfil(regs){
  return regs.slice().sort((a,b)=> Number(a.anio)-Number(b.anio) || MESES.indexOf(a.mes)-MESES.indexOf(b.mes));
}

function mesAnteriorDe(anio, mes){
  const idx = MESES.indexOf(mes);
  if (idx<=0) return { anio: Number(anio)-1, mes: MESES[11] };
  return { anio: Number(anio), mes: MESES[idx-1] };
}

/* Variación mensual estricta: solo compara con el mes calendario
   inmediatamente anterior. Si ese mes no está registrado, N/D
   (no se inventan ni se buscan datos de meses más lejanos). */
function calcularDeltaMensualPerfil(registro){
  const prevInfo = mesAnteriorDe(registro.anio, registro.mes);
  const prev = getEstadisticasPerfiles().find(r=> r.red===registro.red && Number(r.anio)===prevInfo.anio && r.mes===prevInfo.mes);
  if (!prev) return { abs:null, pct:null };
  const abs = registro.seguidores - prev.seguidores;
  const pct = prev.seguidores ? (abs/prev.seguidores*100) : null;
  return { abs, pct };
}

/* Resumen de una red para el año seleccionado: seguidores del último
   mes registrado ese año, su variación respecto al mes anterior, y el
   crecimiento acumulado del año (comparando con el último dato conocido
   antes de que empezara el año; si no hay dato previo, se usa el primer
   dato disponible dentro del propio año). */
function calcularResumenRedPerfil(red, anioSel){
  if (!anioSel) return null;
  const regs = ordenarCronologicoPerfil(getEstadisticasPerfiles().filter(r=>r.red===red));
  const regsAnio = regs.filter(r=>Number(r.anio)===Number(anioSel));
  if (!regsAnio.length) return null;
  const ultimo = regsAnio[regsAnio.length-1];
  const delta = calcularDeltaMensualPerfil(ultimo);
  const previos = regs.filter(r=>Number(r.anio)<Number(anioSel));
  const baseline = previos.length ? previos[previos.length-1] : regsAnio[0];
  let crecAbs = null, crecPct = null;
  if (baseline !== ultimo){
    crecAbs = ultimo.seguidores - baseline.seguidores;
    crecPct = baseline.seguidores ? (crecAbs/baseline.seguidores*100) : null;
  }
  return { ultimo, variacionMensual: delta.abs, variacionMensualPct: delta.pct, crecAbs, crecPct };
}

function fmtSignoPerfil(n){
  if (n==null || isNaN(n) || !isFinite(n)) return 'N/D';
  const r = Math.round(n);
  return (r>0?'+':'') + r.toLocaleString('es-ES');
}
function fmtSignoPctPerfil(n){
  if (n==null || isNaN(n) || !isFinite(n)) return 'N/D';
  const s = Math.abs(n)<0.005 ? (0).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}) : n.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
  return (n>0?'+':'') + s + ' %';
}

function perfAnioSeleccionado(){
  const el = document.getElementById('perfFiltroAnio');
  return (el && el.value) ? Number(el.value) : null;
}
function perfRedFiltro(){
  const el = document.getElementById('perfFiltroRed');
  return el ? el.value : '';
}

function poblarFiltrosPerfiles(){
  const sel = document.getElementById('perfFiltroAnio');
  if (!sel) return;
  const registros = getEstadisticasPerfiles();
  const anioActual = new Date().getFullYear();
  const anios = [...new Set([...registros.map(r=>Number(r.anio)), anioActual])].sort((a,b)=>b-a);
  const prev = sel.value;
  sel.innerHTML = anios.map(a=>`<option value="${a}">${a}</option>`).join('');
  if (prev && anios.map(String).includes(prev)) sel.value = prev;
  else sel.value = String(anios[0]);
}

/* --- Formulario de registro --- */
function abrirModalEstadisticaPerfil(){
  cancelarEdicionEstadisticaPerfil();
  document.getElementById('perfModal').classList.add('active');
}

function cerrarModalEstadisticaPerfil(){
  cancelarEdicionEstadisticaPerfil();
}

function setPerfRed(red, valores){
  perfRedActual = red;
  document.querySelectorAll('#perfPlatformTabs .platform-tab').forEach(t=>t.classList.toggle('active', t.dataset.platform===red));
  const cont = document.getElementById('perfCamposLinkedin');
  if (cont) cont.style.display = (red==='linkedin') ? '' : 'none';
  const visEl = document.getElementById('perfVisualizaciones');
  const visitEl = document.getElementById('perfVisitantes');
  if (visEl) visEl.value = (valores && valores.visualizacionesPagina!=null) ? valores.visualizacionesPagina : '';
  if (visitEl) visitEl.value = (valores && valores.visitantesUnicos!=null) ? valores.visitantesUnicos : '';
}

function guardarEstadisticaPerfil(){
  const anio = parseInt(document.getElementById('perfAnio').value, 10);
  const mes = document.getElementById('perfMes').value;
  const red = perfRedActual;
  const seguidoresRaw = document.getElementById('perfSeguidores').value;

  if (!anio || anio<2000 || anio>2100){ showToast('Indica un año válido.'); return; }
  if (!mes){ showToast('Indica el mes.'); return; }
  if (seguidoresRaw===''){ showToast('Indica el número de seguidores.'); return; }
  const seguidores = Number(seguidoresRaw);
  if (isNaN(seguidores) || seguidores<0){ showToast('El número de seguidores no es válido.'); return; }

  const registros = getEstadisticasPerfiles();
  const idxDuplicado = registros.findIndex(r => r.red===red && Number(r.anio)===anio && r.mes===mes && r.id!==perfilEditId);
  const idxEditando = perfilEditId ? registros.findIndex(r=>r.id===perfilEditId) : -1;
  /* Registro ya existente para ese mismo mes/año/red, si lo hay: se usa como
     referencia para NO borrar visualizaciones/visitantes cuando este guardado
     concreto solo trae el número de seguidores (o viceversa). */
  const base = idxDuplicado>-1 ? registros[idxDuplicado] : (idxEditando>-1 ? registros[idxEditando] : null);

  const data = { anio, mes, red, seguidores };
  if (red==='linkedin'){
    const visRaw = document.getElementById('perfVisualizaciones').value;
    const visitRaw = document.getElementById('perfVisitantes').value;
    data.visualizacionesPagina = visRaw==='' ? (base ? base.visualizacionesPagina : null) : Number(visRaw);
    data.visitantesUnicos = visitRaw==='' ? (base ? base.visitantesUnicos : null) : Number(visitRaw);
  } else {
    data.visualizacionesPagina = null;
    data.visitantesUnicos = null;
  }

  if (perfilEditId){
    const idx = registros.findIndex(r=>r.id===perfilEditId);
    if (idx>-1){
      if (idxDuplicado>-1){
        registros[idxDuplicado] = { ...registros[idxDuplicado], ...data };
        registros.splice(idx,1);
      } else {
        registros[idx] = { ...registros[idx], ...data };
      }
    }
  } else if (idxDuplicado>-1){
    registros[idxDuplicado] = { ...registros[idxDuplicado], ...data };
  } else {
    registros.push({ id: uid(), ...data });
  }

  setLS(LS.estadisticasPerfiles, registros);
  cancelarEdicionEstadisticaPerfil();
  poblarFiltrosPerfiles();
  renderPerfiles();
  showToast('Estadísticas guardadas.');
}

function editarEstadisticaPerfil(id){
  const reg = getEstadisticasPerfiles().find(r=>r.id===id);
  if (!reg) return;
  perfilEditId = id;
  document.getElementById('perfAnio').value = reg.anio;
  document.getElementById('perfMes').value = reg.mes;
  setPerfRed(reg.red, reg);
  document.getElementById('perfSeguidores').value = reg.seguidores;
  document.getElementById('perfFormTitulo').textContent = 'Editar estadísticas';
  document.getElementById('cancelarEdicionPerfilBtn').style.display = 'inline-flex';
  document.getElementById('perfModal').classList.add('active');
}

function cancelarEdicionEstadisticaPerfil(){
  perfilEditId = null;
  ['perfMes','perfSeguidores'].forEach(id=>{ const el=document.getElementById(id); if (el) el.value=''; });
  const perfAnioEl = document.getElementById('perfAnio');
  if (perfAnioEl) perfAnioEl.value = new Date().getFullYear();
  setPerfRed(analiticaRedActual);
  document.getElementById('perfFormTitulo').textContent = 'Registrar estadísticas';
  document.getElementById('cancelarEdicionPerfilBtn').style.display = 'none';
  const modalPerf = document.getElementById('perfModal'); if (modalPerf) modalPerf.classList.remove('active');
}

function eliminarEstadisticaPerfil(id){
  const r = getEstadisticasPerfiles().find(x=>x.id===id);
  if (!r) return;
  if (!confirm(`¿Eliminar el registro de ${REDES_CONFIG[r.red].label} de ${MESES_CAP[MESES.indexOf(r.mes)]} ${r.anio}?`)) return;
  setLS(LS.estadisticasPerfiles, getEstadisticasPerfiles().filter(x=>x.id!==id));
  if (perfilEditId===id) cancelarEdicionEstadisticaPerfil();
  poblarFiltrosPerfiles();
  renderPerfiles();
  showToast('Registro eliminado.');
}

/* --- Gráficos --- */
function dibujarLineChartMulti(canvasId, ref, labels, datasets){
  const ctx = document.getElementById(canvasId);
  if (!ctx) return ref;
  if (ref) ref.destroy();
  return new Chart(ctx, {
    type:'line',
    data:{ labels, datasets: datasets.map(d=>({
      label:d.label, data:d.data, borderColor:d.color, backgroundColor:d.color+'22',
      fill:false, tension:0.25, spanGaps:false, pointRadius:4
    })) },
    options:{ responsive:true, plugins:{ legend:{ display: datasets.length>1 } }, scales:{ y:{ ticks:{precision:0} } } }
  });
}

function dibujarBarChartMulti(canvasId, ref, labels, datasets){
  const ctx = document.getElementById(canvasId);
  if (!ctx) return ref;
  if (ref) ref.destroy();
  return new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets: datasets.map(d=>({ label:d.label, data:d.data, backgroundColor:d.color })) },
    options:{ responsive:true, plugins:{ legend:{ display: datasets.length>1 } }, scales:{ y:{ ticks:{precision:0} } } }
  });
}

function datosMensualesSeguidoresRed(red, anio){
  return MESES.map(m=>{
    const reg = getEstadisticasPerfiles().find(r=>r.red===red && Number(r.anio)===anio && r.mes===m);
    return reg ? reg.seguidores : null;
  });
}

function datosMensualesDeltaRed(red, anio){
  return MESES.map(m=>{
    const reg = getEstadisticasPerfiles().find(r=>r.red===red && Number(r.anio)===anio && r.mes===m);
    if (!reg) return null;
    return calcularDeltaMensualPerfil(reg).abs;
  });
}

function renderGraficosPerfiles(){
  if (!document.getElementById('chartPerfEvolucion')) return;
  const anioSel = perfAnioSeleccionado();
  const redFiltro = perfRedFiltro();
  const labels = MESES_CAP.map(m=>m.slice(0,3));
  const redes = redFiltro ? [redFiltro] : PERFIL_REDES_ORDEN;

  const datasetsEvolucion = anioSel ? redes.map(r=>({ label:REDES_CONFIG[r].label, data:datosMensualesSeguidoresRed(r, anioSel), color:COLORES_RED[r] })) : [];
  chartPerfEvolucionRef = dibujarLineChartMulti('chartPerfEvolucion', chartPerfEvolucionRef, labels, datasetsEvolucion);

  const datasetsCrecimiento = anioSel ? redes.map(r=>({ label:REDES_CONFIG[r].label, data:datosMensualesDeltaRed(r, anioSel), color:COLORES_RED[r] })) : [];
  chartPerfCrecimientoRef = dibujarBarChartMulti('chartPerfCrecimiento', chartPerfCrecimientoRef, labels, datasetsCrecimiento);

  const mostrarLinkedin = !redFiltro || redFiltro==='linkedin';
  const bloque = document.getElementById('perfBlockLinkedin');
  if (bloque) bloque.style.display = mostrarLinkedin ? '' : 'none';
  if (mostrarLinkedin){
    const regsLinkedinPorMes = anioSel ? MESES.map(m=> getEstadisticasPerfiles().find(r=>r.red==='linkedin' && Number(r.anio)===anioSel && r.mes===m) || null) : MESES.map(()=>null);
    const visual = regsLinkedinPorMes.map(r=> (r && r.visualizacionesPagina!=null) ? r.visualizacionesPagina : null);
    const visit = regsLinkedinPorMes.map(r=> (r && r.visitantesUnicos!=null) ? r.visitantesUnicos : null);
    chartPerfLinkedinRef = dibujarLineChartMulti('chartPerfLinkedin', chartPerfLinkedinRef, labels, [
      { label:'Visualizaciones de la página', data:visual, color:'#0a66c2' },
      { label:'Visitantes únicos', data:visit, color:'#1bb8a6' }
    ]);
    const totalVisual = sum(visual), totalVisit = sum(visit);
    setText('perfLinkedinTotales', (totalVisual||totalVisit)
      ? `Acumulado ${anioSel}: ${fmtNum(totalVisual)} visualizaciones de página · ${fmtNum(totalVisit)} visitantes únicos.`
      : 'Evolución mensual de visualizaciones de la página y visitantes únicos.');
  }
}

/* --- Tabla histórica --- */
function registrosOrdenadosPerfil(anioSel, redFiltro){
  let regs = getEstadisticasPerfiles().filter(r=> Number(r.anio)===anioSel && (!redFiltro || r.red===redFiltro));
  regs.sort((a,b)=> MESES.indexOf(a.mes)-MESES.indexOf(b.mes) || PERFIL_REDES_ORDEN.indexOf(a.red)-PERFIL_REDES_ORDEN.indexOf(b.red));
  return regs;
}

function renderTablaPerfiles(){
  const thead = document.getElementById('tablaPerfHistoricoHead');
  const tbody = document.querySelector('#tablaPerfHistorico tbody');
  if (!thead || !tbody) return;
  const anioSel = perfAnioSeleccionado();
  const redFiltro = perfRedFiltro();
  thead.innerHTML = `<tr><th>Mes</th><th>Red social</th><th>Seguidores</th><th>Δ seguidores</th><th>Δ %</th><th>Visualizaciones de página</th><th>Visitantes únicos</th><th></th></tr>`;

  if (!anioSel){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">Selecciona un año para ver el histórico.</td></tr>`;
    return;
  }
  const regs = registrosOrdenadosPerfil(anioSel, redFiltro);
  if (!regs.length){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">Todavía no hay estadísticas registradas con estos filtros.</td></tr>`;
    return;
  }
  tbody.innerHTML = regs.map(r=>{
    const delta = calcularDeltaMensualPerfil(r);
    const esLinkedin = r.red==='linkedin';
    return `<tr>
      <td>${MESES_CAP[MESES.indexOf(r.mes)]}</td>
      <td><span class="tag tag-teal">${REDES_CONFIG[r.red].label}</span></td>
      <td>${fmtNum(r.seguidores)}</td>
      <td>${fmtSignoPerfil(delta.abs)}</td>
      <td>${fmtSignoPctPerfil(delta.pct)}</td>
      <td>${(esLinkedin && r.visualizacionesPagina!=null) ? fmtNum(r.visualizacionesPagina) : 'N/D'}</td>
      <td>${(esLinkedin && r.visitantesUnicos!=null) ? fmtNum(r.visitantesUnicos) : 'N/D'}</td>
      <td>
        <span class="btn-ghost" onclick="editarEstadisticaPerfil('${r.id}')"><i class="fa-solid fa-pen"></i></span>
        <span class="btn-ghost" onclick="eliminarEstadisticaPerfil('${r.id}')"><i class="fa-solid fa-trash"></i></span>
      </td>
    </tr>`;
  }).join('');
}

/* --- Render general de la sub-pestaña --- */
function renderPerfiles(){
  if (!document.getElementById('perfFiltroAnio')) return;
  renderCabeceraAnaliticaRed();
  renderGraficosPerfiles();
  renderTablaPerfiles();
}
