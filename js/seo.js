/* =======================================================================
   SEO — keywords, páginas, auditoría y contenidos.
   ======================================================================= */

/* =======================================================================
   MÓDULO SEO — keywords, páginas, auditoría y contenidos
   ======================================================================= */

/* --- Selects de web/proyecto compartidos por las 4 pestañas --- */
function poblarSelectProyectoSEOForm(selectId, valorPrevio){
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const proyectos = getProyectosNombres();
  const prev = valorPrevio !== undefined ? valorPrevio : sel.value;
  sel.innerHTML = '<option value="">Web corporativa CIDAUT</option>' + proyectos.map(p=>`<option>${esc(p)}</option>`).join('');
  sel.value = proyectos.includes(prev) ? prev : '';
}

function poblarSelectProyectoSEOFiltro(selectId){
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const proyectos = getProyectosNombres();
  const prev = sel.value;
  sel.innerHTML = '<option value="">Todas</option><option value="__CIDAUT__">Web corporativa CIDAUT</option>' + proyectos.map(p=>`<option>${esc(p)}</option>`).join('');
  if (prev==='__CIDAUT__' || proyectos.includes(prev)) sel.value = prev;
}

function poblarSelectsProyectoSEO(){
  ['kwProyecto','paginaProyecto','auditProyecto','contProyecto'].forEach(id=>poblarSelectProyectoSEOForm(id));
  ['kwFiltroProyecto','paginaFiltroProyecto','auditFiltroProyecto','contFiltroProyecto'].forEach(id=>poblarSelectProyectoSEOFiltro(id));
}

function coincideProyectoFiltro(valor, filtro){
  if (!filtro) return true;
  if (filtro==='__CIDAUT__') return !valor;
  return valor===filtro;
}

function etiquetaWebProyecto(valor){
  return valor || 'Web corporativa CIDAUT';
}

function actualizarContadorSEO(campoId, contadorId, limite){
  const campo = document.getElementById(campoId);
  const contador = document.getElementById(contadorId);
  if (!campo || !contador) return;
  const len = campo.value.length;
  contador.textContent = `${len} / ${limite}`;
  contador.style.color = len > limite ? '#b1521a' : 'var(--ink-500)';
}

/* --- Keywords --- */
let kwEditId = null;

function getKeywordsSEO(){ return getLS(LS.seoKeywords); }

function guardarKeyword(){
  const proyecto = document.getElementById('kwProyecto').value;
  const keyword = document.getElementById('kwKeyword').value.trim();
  const url = document.getElementById('kwUrl').value.trim();
  const posicion = document.getElementById('kwPosicion').value;
  const objetivo = document.getElementById('kwObjetivo').value.trim();
  if (!keyword){ showToast('Indica la keyword.'); return; }
  const data = { proyecto, keyword, url, posicion: posicion?Number(posicion):null, objetivo };
  const keywords = getKeywordsSEO();
  if (kwEditId){
    const idx = keywords.findIndex(k=>k.id===kwEditId);
    if (idx>-1) keywords[idx] = {...keywords[idx], ...data};
  } else {
    keywords.unshift({ id: uid(), ...data });
  }
  setLS(LS.seoKeywords, keywords);
  cancelarEdicionKeyword();
  renderKeywords();
  showToast('Keyword guardada.');
}

function editarKeyword(id){
  const k = getKeywordsSEO().find(x=>x.id===id);
  if (!k) return;
  kwEditId = id;
  poblarSelectProyectoSEOForm('kwProyecto', k.proyecto);
  document.getElementById('kwKeyword').value = k.keyword;
  document.getElementById('kwUrl').value = k.url||'';
  document.getElementById('kwPosicion').value = k.posicion||'';
  document.getElementById('kwObjetivo').value = k.objetivo||'';
  document.getElementById('kwFormTitulo').textContent = 'Editar keyword';
  document.getElementById('cancelarEdicionKwBtn').style.display = 'inline-flex';
}

function cancelarEdicionKeyword(){
  kwEditId = null;
  ['kwKeyword','kwUrl','kwPosicion','kwObjetivo'].forEach(id=>document.getElementById(id).value='');
  poblarSelectProyectoSEOForm('kwProyecto','');
  document.getElementById('kwFormTitulo').textContent = 'Añadir keyword';
  document.getElementById('cancelarEdicionKwBtn').style.display = 'none';
}

function eliminarKeyword(id){
  const k = getKeywordsSEO().find(x=>x.id===id);
  if (!k) return;
  if (!confirm(`¿Eliminar la keyword "${k.keyword}"?`)) return;
  setLS(LS.seoKeywords, getKeywordsSEO().filter(x=>x.id!==id));
  if (kwEditId===id) cancelarEdicionKeyword();
  renderKeywords();
  showToast('Keyword eliminada.');
}

function renderKeywords(){
  const filtro = document.getElementById('kwFiltroProyecto').value;
  const keywords = getKeywordsSEO().filter(k=>coincideProyectoFiltro(k.proyecto, filtro));
  const tbody = document.querySelector('#tablaKeywords tbody');
  if (!keywords.length){
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No hay keywords que coincidan. Añade la primera con el formulario.</td></tr>';
    return;
  }
  tbody.innerHTML = keywords.map(k=>`
    <tr>
      <td>${esc(k.keyword)}</td>
      <td>${esc(etiquetaWebProyecto(k.proyecto))}</td>
      <td>${k.posicion!=null?esc(String(k.posicion)):'—'}</td>
      <td>${esc(k.objetivo)||'—'}</td>
      <td>
        <span class="btn-ghost" onclick="editarKeyword('${k.id}')">Editar</span>
        <span class="btn-ghost" onclick="eliminarKeyword('${k.id}')">Eliminar</span>
      </td>
    </tr>`).join('');
}

/* --- Páginas --- */
let paginaEditId = null;
const ESTADO_SEO_LABEL = { optima:'Óptima', mejorable:'Mejorable', pendiente:'Pendiente de optimizar' };
const ESTADO_SEO_TAG = { optima:'tag-teal', mejorable:'tag-orange', pendiente:'tag-grey' };

function getPaginasSEO(){ return getLS(LS.seoPaginas); }

function guardarPaginaSEO(){
  const url = document.getElementById('paginaUrl').value.trim();
  if (!url){ showToast('Indica la URL de la página.'); return; }
  const data = {
    proyecto: document.getElementById('paginaProyecto').value,
    url,
    title: document.getElementById('paginaTitle').value.trim(),
    meta: document.getElementById('paginaMeta').value.trim(),
    h1: document.getElementById('paginaH1').value.trim(),
    keyword: document.getElementById('paginaKeyword').value.trim(),
    enlaces: document.getElementById('paginaEnlaces').value.trim(),
    alt: document.getElementById('paginaAlt').value.trim(),
    revision: document.getElementById('paginaRevision').value,
    estado: document.getElementById('paginaEstado').value
  };
  const paginas = getPaginasSEO();
  if (paginaEditId){
    const idx = paginas.findIndex(p=>p.id===paginaEditId);
    if (idx>-1) paginas[idx] = {...paginas[idx], ...data};
  } else {
    paginas.unshift({ id: uid(), ...data });
  }
  setLS(LS.seoPaginas, paginas);
  cancelarEdicionPaginaSEO();
  renderPaginasSEO();
  showToast('Ficha SEO guardada.');
}

function editarPaginaSEO(id){
  const p = getPaginasSEO().find(x=>x.id===id);
  if (!p) return;
  paginaEditId = id;
  poblarSelectProyectoSEOForm('paginaProyecto', p.proyecto);
  document.getElementById('paginaUrl').value = p.url;
  document.getElementById('paginaTitle').value = p.title||'';
  document.getElementById('paginaMeta').value = p.meta||'';
  document.getElementById('paginaH1').value = p.h1||'';
  document.getElementById('paginaKeyword').value = p.keyword||'';
  document.getElementById('paginaEnlaces').value = p.enlaces||'';
  document.getElementById('paginaAlt').value = p.alt||'';
  document.getElementById('paginaRevision').value = p.revision||'';
  document.getElementById('paginaEstado').value = p.estado||'pendiente';
  actualizarContadorSEO('paginaTitle','paginaTitleContador',60);
  actualizarContadorSEO('paginaMeta','paginaMetaContador',155);
  document.getElementById('paginaFormTitulo').textContent = 'Editar ficha SEO';
  document.getElementById('cancelarEdicionPaginaBtn').style.display = 'inline-flex';
}

function cancelarEdicionPaginaSEO(){
  paginaEditId = null;
  ['paginaUrl','paginaTitle','paginaMeta','paginaH1','paginaKeyword','paginaEnlaces','paginaAlt','paginaRevision'].forEach(id=>document.getElementById(id).value='');
  poblarSelectProyectoSEOForm('paginaProyecto','');
  document.getElementById('paginaEstado').value = 'pendiente';
  actualizarContadorSEO('paginaTitle','paginaTitleContador',60);
  actualizarContadorSEO('paginaMeta','paginaMetaContador',155);
  document.getElementById('paginaFormTitulo').textContent = 'Ficha SEO de página';
  document.getElementById('cancelarEdicionPaginaBtn').style.display = 'none';
}

function eliminarPaginaSEO(id){
  const p = getPaginasSEO().find(x=>x.id===id);
  if (!p) return;
  if (!confirm(`¿Eliminar la ficha SEO de "${p.url}"?`)) return;
  setLS(LS.seoPaginas, getPaginasSEO().filter(x=>x.id!==id));
  if (paginaEditId===id) cancelarEdicionPaginaSEO();
  renderPaginasSEO();
  showToast('Ficha SEO eliminada.');
}

function renderPaginasSEO(){
  const filtroProyecto = document.getElementById('paginaFiltroProyecto').value;
  const filtroEstado = document.getElementById('paginaFiltroEstado').value;
  const paginas = getPaginasSEO().filter(p=>
    coincideProyectoFiltro(p.proyecto, filtroProyecto) && (!filtroEstado || p.estado===filtroEstado)
  );
  const wrap = document.getElementById('listaPaginasSEO');
  if (!paginas.length){
    wrap.innerHTML = '<p class="muted small">No hay páginas que coincidan. Añade la primera con el formulario.</p>';
    return;
  }
  wrap.innerHTML = paginas.map(p=>`
    <div class="panel" style="margin-bottom:12px;">
      <div class="snippet-head">
        <div>
          <h4 style="font-family:var(--mono);font-size:12.5px;">${esc(p.url)}</h4>
          <div style="margin-top:6px;">
            <span class="tag tag-grey">${esc(etiquetaWebProyecto(p.proyecto))}</span>
            <span class="tag ${ESTADO_SEO_TAG[p.estado]||'tag-grey'}" style="margin-left:4px;">${esc(ESTADO_SEO_LABEL[p.estado]||p.estado)}</span>
          </div>
        </div>
        <div class="btn-row" style="margin-top:0;">
          <span class="btn-ghost" onclick="editarPaginaSEO('${p.id}')"><i class="fa-solid fa-pen"></i></span>
          <span class="btn-ghost" onclick="eliminarPaginaSEO('${p.id}')"><i class="fa-solid fa-trash"></i></span>
        </div>
      </div>
      <div style="font-size:12.5px;color:var(--ink-700);margin-top:10px;line-height:1.7;">
        ${p.title?`<div><strong>Title:</strong> ${esc(p.title)}</div>`:''}
        ${p.meta?`<div><strong>Meta description:</strong> ${esc(p.meta)}</div>`:''}
        ${p.h1?`<div><strong>H1:</strong> ${esc(p.h1)}</div>`:''}
        ${p.keyword?`<div><strong>Keyword objetivo:</strong> ${esc(p.keyword)}</div>`:''}
        ${p.enlaces?`<div><strong>Enlaces internos:</strong> ${esc(p.enlaces)}</div>`:''}
        ${p.alt?`<div><strong>Alt imágenes:</strong> ${esc(p.alt)}</div>`:''}
        <div><strong>Última revisión:</strong> ${p.revision?fmtFecha(p.revision):'—'}</div>
      </div>
    </div>`).join('');
}

/* --- Auditoría --- */
const SUGERENCIAS_AUDITORIA_SEO = [
  'Sitemap.xml actualizado y enviado a Search Console',
  'robots.txt correcto',
  'HTTPS activo y certificado SSL en vigor',
  'Velocidad de carga y Core Web Vitals',
  'Enlaces internos y externos rotos',
  'Datos estructurados (schema.org)',
  'Etiquetas Open Graph para redes sociales',
  'URLs canónicas correctas',
  'Compatibilidad y usabilidad móvil'
];

function renderSugerenciasAuditoriaSEO(){
  document.getElementById('sugerenciasAuditoriaSEO').innerHTML = SUGERENCIAS_AUDITORIA_SEO.map((s,i)=>
    `<button class="btn btn-secondary" onclick="añadirTareaAuditoriaRapida(${i})"><i class="fa-solid fa-plus"></i> ${esc(s)}</button>`
  ).join('');
}

function añadirTareaAuditoriaRapida(i){
  const tarea = SUGERENCIAS_AUDITORIA_SEO[i];
  const proyecto = document.getElementById('auditProyecto').value;
  const periodo = document.getElementById('auditPeriodo').value;
  const items = getLS(LS.seoAuditoria);
  items.unshift({ id: uid(), proyecto, tarea, periodo, done:false, ultima:null });
  setLS(LS.seoAuditoria, items);
  renderAuditoriaSEO();
  showToast('Tarea añadida a la auditoría.');
}

function añadirTareaAuditoria(){
  const proyecto = document.getElementById('auditProyecto').value;
  const tarea = document.getElementById('auditTarea').value.trim();
  const periodo = document.getElementById('auditPeriodo').value;
  if (!tarea){ showToast('Describe la tarea de auditoría.'); return; }
  const items = getLS(LS.seoAuditoria);
  items.unshift({ id: uid(), proyecto, tarea, periodo, done:false, ultima:null });
  setLS(LS.seoAuditoria, items);
  document.getElementById('auditTarea').value = '';
  renderAuditoriaSEO();
  showToast('Tarea añadida a la auditoría.');
}

function toggleAuditoriaSEO(id){
  const items = getLS(LS.seoAuditoria);
  const t = items.find(x=>x.id===id);
  if (!t) return;
  t.done = !t.done;
  t.ultima = t.done ? hoyLocal() : t.ultima;
  setLS(LS.seoAuditoria, items);
  renderAuditoriaSEO();
  updateDashboardStats();
}

function eliminarAuditoriaSEO(id){
  const t = getLS(LS.seoAuditoria).find(x=>x.id===id);
  if (!t) return;
  if (!confirm(`¿Eliminar la tarea de auditoría "${t.tarea}"?`)) return;
  setLS(LS.seoAuditoria, getLS(LS.seoAuditoria).filter(x=>x.id!==id));
  renderAuditoriaSEO();
  updateDashboardStats();
  showToast('Tarea de auditoría eliminada.');
}

function renderAuditoriaSEO(){
  const filtro = document.getElementById('auditFiltroProyecto').value;
  const items = getLS(LS.seoAuditoria).filter(t=>coincideProyectoFiltro(t.proyecto, filtro));
  const wrap = document.getElementById('listaAuditoriaSEO');
  if (!items.length){
    wrap.innerHTML = '<p class="muted small">No hay tareas todavía. Añade una desde el formulario o desde las sugerencias.</p>';
    return;
  }
  wrap.innerHTML = items.map(t=>`
    <div class="check-item ${t.done?'done':''}">
      <input type="checkbox" ${t.done?'checked':''} onchange="toggleAuditoriaSEO('${t.id}')">
      <div class="ctext">
        ${esc(t.tarea)}
        <div class="cmeta">${esc(etiquetaWebProyecto(t.proyecto))} · ${esc(t.periodo)}${t.ultima? ' · última revisión: '+fmtFecha(t.ultima) : ''}</div>
      </div>
      <span class="btn-ghost" onclick="eliminarAuditoriaSEO('${t.id}')">Eliminar</span>
    </div>`).join('');
}

/* --- Contenidos --- */
let contenidoEditId = null;
const ESTADO_CONTENIDO_LABEL = { idea:'Idea', redaccion:'En redacción', publicado:'Publicado' };
const ESTADO_CONTENIDO_TAG = { idea:'tag-grey', redaccion:'tag-orange', publicado:'tag-teal' };

function getContenidosSEO(){ return getLS(LS.seoContenidos); }

function guardarContenidoSEO(){
  const titulo = document.getElementById('contTitulo').value.trim();
  if (!titulo){ showToast('Indica el título del contenido.'); return; }
  const data = {
    proyecto: document.getElementById('contProyecto').value,
    titulo,
    tipo: document.getElementById('contTipo').value,
    keyword: document.getElementById('contKeyword').value.trim(),
    estado: document.getElementById('contEstado').value,
    fecha: document.getElementById('contFecha').value,
    url: document.getElementById('contUrl').value.trim()
  };
  const contenidos = getContenidosSEO();
  if (contenidoEditId){
    const idx = contenidos.findIndex(c=>c.id===contenidoEditId);
    if (idx>-1) contenidos[idx] = {...contenidos[idx], ...data};
  } else {
    contenidos.unshift({ id: uid(), ...data });
  }
  setLS(LS.seoContenidos, contenidos);
  cancelarEdicionContenidoSEO();
  renderContenidosSEO();
  showToast('Contenido guardado.');
}

function editarContenidoSEO(id){
  const c = getContenidosSEO().find(x=>x.id===id);
  if (!c) return;
  contenidoEditId = id;
  poblarSelectProyectoSEOForm('contProyecto', c.proyecto);
  document.getElementById('contTitulo').value = c.titulo;
  document.getElementById('contTipo').value = c.tipo||'Artículo de blog';
  document.getElementById('contKeyword').value = c.keyword||'';
  document.getElementById('contEstado').value = c.estado||'idea';
  document.getElementById('contFecha').value = c.fecha||'';
  document.getElementById('contUrl').value = c.url||'';
  document.getElementById('contenidoFormTitulo').textContent = 'Editar contenido';
  document.getElementById('cancelarEdicionContenidoBtn').style.display = 'inline-flex';
}

function cancelarEdicionContenidoSEO(){
  contenidoEditId = null;
  ['contTitulo','contKeyword','contFecha','contUrl'].forEach(id=>document.getElementById(id).value='');
  poblarSelectProyectoSEOForm('contProyecto','');
  document.getElementById('contTipo').value = 'Artículo de blog';
  document.getElementById('contEstado').value = 'idea';
  document.getElementById('contenidoFormTitulo').textContent = 'Añadir contenido';
  document.getElementById('cancelarEdicionContenidoBtn').style.display = 'none';
}

function eliminarContenidoSEO(id){
  const c = getContenidosSEO().find(x=>x.id===id);
  if (!c) return;
  if (!confirm(`¿Eliminar el contenido "${c.titulo}"?`)) return;
  setLS(LS.seoContenidos, getContenidosSEO().filter(x=>x.id!==id));
  if (contenidoEditId===id) cancelarEdicionContenidoSEO();
  renderContenidosSEO();
  showToast('Contenido eliminado.');
}

function renderContenidosSEO(){
  const filtroProyecto = document.getElementById('contFiltroProyecto').value;
  const filtroEstado = document.getElementById('contFiltroEstado').value;
  const contenidos = getContenidosSEO().filter(c=>
    coincideProyectoFiltro(c.proyecto, filtroProyecto) && (!filtroEstado || c.estado===filtroEstado)
  );
  const wrap = document.getElementById('listaContenidosSEO');
  if (!contenidos.length){
    wrap.innerHTML = '<p class="muted small">No hay contenidos que coincidan. Añade el primero con el formulario.</p>';
    return;
  }
  wrap.innerHTML = contenidos.map(c=>`
    <div class="panel" style="margin-bottom:12px;">
      <div class="snippet-head">
        <div>
          <h4>${esc(c.titulo)}</h4>
          <div style="margin-top:6px;">
            <span class="tag tag-grey">${esc(etiquetaWebProyecto(c.proyecto))}</span>
            <span class="tag tag-teal" style="margin-left:4px;">${esc(c.tipo)}</span>
            <span class="tag ${ESTADO_CONTENIDO_TAG[c.estado]||'tag-grey'}" style="margin-left:4px;">${esc(ESTADO_CONTENIDO_LABEL[c.estado]||c.estado)}</span>
          </div>
        </div>
        <div class="btn-row" style="margin-top:0;">
          <span class="btn-ghost" onclick="editarContenidoSEO('${c.id}')"><i class="fa-solid fa-pen"></i></span>
          <span class="btn-ghost" onclick="eliminarContenidoSEO('${c.id}')"><i class="fa-solid fa-trash"></i></span>
        </div>
      </div>
      <div style="font-size:12.5px;color:var(--ink-700);margin-top:8px;">
        ${c.keyword?`<strong>Keyword objetivo:</strong> ${esc(c.keyword)}<br>`:''}
        ${c.fecha?`<strong>Publicación:</strong> ${fmtFecha(c.fecha)}<br>`:''}
        ${c.url?`<a href="${esc(c.url.match(/^https?:\/\//i)?c.url:'https://'+c.url)}" target="_blank" rel="noopener" style="color:var(--teal-700);font-weight:600;">Ver contenido publicado</a>`:''}
      </div>
    </div>`).join('');
}

