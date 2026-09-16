/* =======================================================================
   APP — navegación, copia de seguridad, búsqueda global, notificaciones
   e inicialización. El "pegamento" de la aplicación.
   NOTA: arrancarApp() se define aquí pero se LLAMA desde index.html, al
   final de todos los scripts (para no depender de qué archivo cargue
   primero mientras la migración a módulos siga en fases).
   ======================================================================= */

/* ---------------------------------------------------------------------
   COPIA DE SEGURIDAD — exportar / restaurar todo el hub
   --------------------------------------------------------------------- */
const LS_BACKUP_ULTIMA = 'cidautHub_backupUltimaFecha';

function exportarBackupCompleto(){
  const datos = {};
  Object.values(LS).forEach(key=>{
    const raw = dbGetRaw(key);
    if (raw !== null){
      try{ datos[key] = JSON.parse(raw); }catch(e){ datos[key] = raw; }
    }
  });
  const paquete = {
    app: 'Hub de Marketing — CIDAUT',
    generado: new Date().toISOString(),
    datos
  };
  const blob = new Blob([JSON.stringify(paquete, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const hoy = hoyLocal();
  a.href = url;
  a.download = `backup_hub_marketing_cidaut_${hoy}.json`;
  a.click();
  URL.revokeObjectURL(url);
  dbSetRaw(LS_BACKUP_ULTIMA, new Date().toISOString());
  actualizarBackupUltimaFecha();
  showToast('Copia de seguridad descargada.');
}

function actualizarBackupUltimaFecha(){
  const el = document.getElementById('backupUltimaFecha');
  if (!el) return;
  const raw = dbGetRaw(LS_BACKUP_ULTIMA);
  if (!raw){ el.textContent = 'Nunca'; return; }
  const d = new Date(raw);
  if (isNaN(d.getTime())){ el.textContent = 'Nunca'; return; }
  const fecha = fmtFecha(isoLocal(d));
  const hora = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  el.textContent = `${fecha} a las ${hora}`;
}

function restaurarBackupCompleto(paqueteOplano){
  // Admite tanto el formato nuevo ({app, generado, datos}) como un JSON plano con las claves directamente.
  const datos = (paqueteOplano && typeof paqueteOplano==='object' && paqueteOplano.datos && typeof paqueteOplano.datos==='object')
    ? paqueteOplano.datos
    : paqueteOplano;

  if (!datos || typeof datos !== 'object' || Array.isArray(datos)){
    showToast('El archivo no tiene un formato de copia de seguridad válido.');
    return false;
  }

  const clavesValidas = Object.values(LS);
  const clavesEncontradas = Object.keys(datos).filter(k=>clavesValidas.includes(k));
  if (!clavesEncontradas.length){
    showToast('El archivo no contiene datos reconocibles del hub.');
    return false;
  }

  const totalRegistros = clavesEncontradas.reduce((acc,k)=>{
    const v = datos[k];
    if (Array.isArray(v)) return acc + v.length;
    if (v && typeof v==='object') return acc + Object.keys(v).length;
    return acc;
  }, 0);

  const confirmado = confirm(
    `Vas a restaurar una copia de seguridad con ${clavesEncontradas.length} secciones de datos (aprox. ${totalRegistros} registros en total).\n\n` +
    `Esto SUSTITUIRÁ todos los datos actuales del hub en este navegador y no se puede deshacer.\n\n` +
    `¿Quieres continuar?`
  );
  if (!confirmado) return false;

  const tareasRestoreAsync = [];
  clavesEncontradas.forEach(key=>{
    dbSetRaw(key, JSON.stringify(datos[key]));
  });

  showToast('Copia de seguridad restaurada. Sincronizando y recargando...');
  setTimeout(()=> location.reload(), 900);
  return true;
}

document.getElementById('backupFileInput').addEventListener('change', function(){
  const inputEl = this;
  const file = inputEl.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e=>{
    let parsed;
    try{ parsed = JSON.parse(e.target.result); }
    catch(err){ showToast('El archivo no es un JSON válido.'); inputEl.value=''; return; }
    restaurarBackupCompleto(parsed);
    inputEl.value = '';
  };
  reader.onerror = ()=>{ showToast('No se ha podido leer el archivo.'); inputEl.value=''; };
  reader.readAsText(file);
});

/* ---------------------------------------------------------------------
   NAVEGACIÓN
   --------------------------------------------------------------------- */
const TOPBAR_TEXT = {
  tareas:   ['Tareas', 'Organiza las tareas del equipo en lista, kanban, calendario o diagrama de Gantt.'],
  inicio:   ['Inicio', 'Resumen general de la actividad de marketing registrada en el hub.'],
  eventos:  ['Eventos y memoria anual', 'Registra la asistencia del personal a congresos y jornadas, y genera el resumen para la memoria anual.'],
  webs:     ['Gestor de webs de proyectos', 'Snippets reutilizables, estructura de apartados de cada web de proyecto y checklist de mantenimiento periódico.'],
  seo:      ['SEO', 'Seguimiento de keywords, fichas SEO de páginas, auditoría técnica y planificación de contenidos para cada web de proyecto.'],
  email:    ['Email marketing y CRM', 'Previsualiza el HTML de tus newsletters, genera enlaces UTM y lleva el seguimiento de los envíos realizados.'],
  redes:    ['Redes sociales', 'Simula cómo se verán tus publicaciones y planifica el calendario editorial del equipo.'],
  propios:  ['Organizador de eventos propios', 'Checklist de logística por fases y control de inscritos para los eventos organizados por CIDAUT.'],
  enlaces:  ['Enlaces', 'Accesos rápidos guardados a webs y a carpetas o archivos del ordenador.'],
  config:   ['Configuración', 'Gestiona los proyectos y los sectores compartidos en todo el hub.']
};

function setActiveNav(view){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.view===view));
  document.querySelectorAll('.module-view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+view).classList.add('active');
  document.getElementById('topbarTitle').textContent = TOPBAR_TEXT[view][0];
  document.getElementById('topbarDesc').textContent = TOPBAR_TEXT[view][1];
  document.getElementById('sidebar').classList.remove('open');
  window.scrollTo(0,0);
  if (view==='inicio') updateDashboardStats();
}

function switchTab(module, tabName){
  const view = document.getElementById('view-'+module);
  view.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===tabName));
  view.querySelectorAll('.tab-pane').forEach(p=>p.classList.toggle('active', p.id === module+'-'+tabName));
  if (module==='redes' && tabName==='analitica'){
    renderAnaliticaRed();
  }
  if (module==='propios'){
    if (tabName==='resumen') renderResumenEvento();
    else if (tabName==='logistica'){ renderPlanificacionEvento(); renderLogistica(); }
    else if (tabName==='inscritos') renderInscritos();
    else if (tabName==='programa') renderPrograma();
    else if (tabName==='calendario') renderCalendarioComunicacion();
    else if (tabName==='recursos') renderRecursos();
    else if (tabName==='acreditaciones') renderAcreditaciones();
  }
}

function goTo(view, tab, evento){
  setActiveNav(view);
  if (view==='propios' && evento){
    abrirEventoDetalle(evento);
    if (tab) switchTab('propios', tab);
    return;
  }
  if (tab) switchTab(view, tab);
}

document.querySelectorAll('.nav-item[data-view]').forEach(n=>{
  n.addEventListener('click', ()=> setActiveNav(n.dataset.view));
});
document.getElementById('mobileToggle').addEventListener('click', ()=>{
  document.getElementById('sidebar').classList.toggle('open');
});


/* ---------------------------------------------------------------------
   NOTIFICACIONES GLOBALES
   --------------------------------------------------------------------- */
function getNotificaciones(){
  const notifs = [];
  const hoyStr = hoyLocal();
  const en3dias = new Date(); en3dias.setDate(en3dias.getDate()+3);
  const en3diasStr = isoLocal(en3dias);

  getTareas().forEach(t=>{
    if (t.estado==='hecha' || !t.fechaFin) return;
    if (t.fechaFin < hoyStr){
      notifs.push({ tipo:'urgente', icon:'fa-triangle-exclamation', texto:`Tarea vencida: ${t.titulo}`, meta:`Debía terminar el ${fmtFecha(t.fechaFin)}`, view:'tareas', tab:'lista' });
    } else if (t.fechaFin <= en3diasStr){
      notifs.push({ tipo:'aviso', icon:'fa-clock', texto:`Tarea próxima a vencer: ${t.titulo}`, meta:`Fecha límite ${fmtFecha(t.fechaFin)}`, view:'tareas', tab:'lista' });
    }
  });

  const pendientesMant = getLS(LS.mantenimiento).filter(m=>!m.done);
  if (pendientesMant.length){
    notifs.push({ tipo:'info', icon:'fa-screwdriver-wrench', texto:`${pendientesMant.length} tarea(s) de mantenimiento pendientes`, meta:'Checklist de webs de proyecto', view:'webs', tab:'mantenimiento' });
  }

  const pendientesAuditoriaSEO = getLS(LS.seoAuditoria).filter(t=>!t.done);
  if (pendientesAuditoriaSEO.length){
    notifs.push({ tipo:'info', icon:'fa-magnifying-glass-chart', texto:`${pendientesAuditoriaSEO.length} tarea(s) de auditoría SEO pendientes`, meta:'Módulo SEO', view:'seo', tab:'auditoria' });
  }

  getLS(LS.calendario).filter(e=>e.fecha===hoyStr).forEach(e=>{
    notifs.push({ tipo:'aviso', icon:'fa-share-nodes', texto:`Publicación programada hoy: ${e.titulo}`, meta:e.plataforma, view:'redes', tab:'lista' });
  });

  const orden = { urgente:0, aviso:1, info:2 };
  return notifs.sort((a,b)=>orden[a.tipo]-orden[b.tipo]);
}

function renderNotificaciones(){
  const badge = document.getElementById('notifBadge');
  const panel = document.getElementById('notifPanel');
  if (!badge || !panel) return;
  const notifs = getNotificaciones();

  if (notifs.length){
    badge.style.display = 'flex';
    badge.textContent = notifs.length > 9 ? '9+' : notifs.length;
  } else {
    badge.style.display = 'none';
  }

  if (!notifs.length){
    panel.innerHTML = '<div class="notif-empty">No tienes avisos pendientes.</div>';
    return;
  }
  panel.innerHTML = notifs.map(n=>`
    <div class="notif-item notif-${n.tipo}" onclick="goTo('${n.view}','${n.tab}'); cerrarNotificaciones();">
      <div class="notif-icon"><i class="fa-solid ${n.icon}"></i></div>
      <div>
        <div class="notif-text">${esc(n.texto)}</div>
        <div class="notif-meta">${esc(n.meta)}</div>
      </div>
    </div>`).join('');
}

function toggleNotificaciones(ev){
  if (ev) ev.stopPropagation();
  cerrarBusquedaGlobal();
  document.getElementById('notifPanel').classList.toggle('open');
}

function cerrarNotificaciones(){
  const panel = document.getElementById('notifPanel');
  if (panel) panel.classList.remove('open');
}

/* ---------------------------------------------------------------------
   BÚSQUEDA GLOBAL
   --------------------------------------------------------------------- */
function buscarGlobal(query){
  const q = query.trim().toLowerCase();
  const resultsWrap = document.getElementById('globalSearchResults');
  if (!resultsWrap) return;
  if (!q){ resultsWrap.classList.remove('open'); resultsWrap.innerHTML = ''; return; }

  const resultados = [];

  getLS(LS.eventos).forEach(e=>{
    if ((`${e.nombre} ${e.evento} ${e.depto||''}`).toLowerCase().includes(q)){
      resultados.push({ tipo:'Evento', icon:'fa-calendar-check', titulo:`${e.nombre} — ${e.evento}`, meta:fmtFecha(e.fecha), view:'eventos', tab:'registro' });
    }
  });
  getTareas().forEach(t=>{
    if ((`${t.titulo} ${t.descripcion||''} ${t.responsable||''}`).toLowerCase().includes(q)){
      resultados.push({ tipo:'Tarea', icon:'fa-list-check', titulo:t.titulo, meta:ESTADO_LABEL[t.estado]||t.estado, view:'tareas', tab:'lista' });
    }
  });
  getProyectos().forEach(p=>{
    if ((`${p.nombre} ${p.acronimo||''}`).toLowerCase().includes(q)){
      resultados.push({ tipo:'Proyecto', icon:'fa-diagram-project', titulo:p.nombre, meta:p.programa||'', view:'config', tab:'proyectos' });
    }
  });
  getLS(LS.snippets).forEach(s=>{
    if ((`${s.title} ${s.desc||''}`).toLowerCase().includes(q)){
      resultados.push({ tipo:'Snippet', icon:'fa-code', titulo:s.title, meta:'Biblioteca de snippets', view:'webs', tab:'snippets' });
    }
  });
  getLS(LS.emailsEnviados).forEach(em=>{
    if (em.nombre.toLowerCase().includes(q)){
      resultados.push({ tipo:'Envío de email', icon:'fa-envelope-open-text', titulo:em.nombre, meta:fmtFecha(em.fecha), view:'email', tab:'seguimiento' });
    }
  });
  getLS(LS.calendario).forEach(c=>{
    if (c.titulo.toLowerCase().includes(q)){
      resultados.push({ tipo:'Publicación', icon:'fa-share-nodes', titulo:c.titulo, meta:fmtFecha(c.fecha), view:'redes', tab:'lista' });
    }
  });
  getLS(LS.inscritos).forEach(i=>{
    if ((`${i.nombre} ${i.empresa||''}`).toLowerCase().includes(q)){
      resultados.push({ tipo:'Inscrito', icon:'fa-user-plus', titulo:i.empresa?`${i.nombre} — ${i.empresa}`:i.nombre, meta:fmtFecha(i.fecha), view:'propios', tab:'inscritos', evento:i.evento });
    }
  });
  getSectores().forEach(s=>{
    if (s.nombre.toLowerCase().includes(q)){
      resultados.push({ tipo:'Sector', icon:'fa-industry', titulo:s.nombre, meta:'Configuración', view:'config', tab:'sectores' });
    }
  });
  getLS(LS.mantenimiento).forEach(m=>{
    if ((`${m.tarea} ${m.sitio||''}`).toLowerCase().includes(q)){
      resultados.push({ tipo:'Mantenimiento', icon:'fa-screwdriver-wrench', titulo:m.tarea, meta:m.sitio||'', view:'webs', tab:'mantenimiento' });
    }
  });
  getKeywordsSEO().forEach(k=>{
    if ((`${k.keyword} ${k.url||''}`).toLowerCase().includes(q)){
      resultados.push({ tipo:'Keyword SEO', icon:'fa-magnifying-glass-chart', titulo:k.keyword, meta:etiquetaWebProyecto(k.proyecto), view:'seo', tab:'keywords' });
    }
  });
  getPaginasSEO().forEach(p=>{
    if ((`${p.url} ${p.title||''} ${p.keyword||''}`).toLowerCase().includes(q)){
      resultados.push({ tipo:'Página SEO', icon:'fa-file-lines', titulo:p.url, meta:etiquetaWebProyecto(p.proyecto), view:'seo', tab:'paginas' });
    }
  });
  getContenidosSEO().forEach(c=>{
    if ((`${c.titulo} ${c.keyword||''}`).toLowerCase().includes(q)){
      resultados.push({ tipo:'Contenido SEO', icon:'fa-pen-nib', titulo:c.titulo, meta:etiquetaWebProyecto(c.proyecto), view:'seo', tab:'contenidos' });
    }
  });

  if (!resultados.length){
    resultsWrap.innerHTML = `<div class="gs-empty">Sin resultados para "${esc(query.trim())}".</div>`;
    resultsWrap.classList.add('open');
    return;
  }
  resultsWrap.innerHTML = resultados.slice(0,20).map(r=>`
    <div class="gs-item" onclick="irDesdeGlobalSearch('${r.view}','${r.tab}','${escJs(r.evento||'')}')">
      <div class="gs-icon"><i class="fa-solid ${r.icon}"></i></div>
      <div>
        <div class="gs-title">${esc(r.titulo)}</div>
        <div class="gs-meta">${esc(r.tipo)}${r.meta?' · '+esc(r.meta):''}</div>
      </div>
    </div>`).join('');
  resultsWrap.classList.add('open');
}

function irDesdeGlobalSearch(view, tab, evento){
  goTo(view, tab, evento);
  cerrarBusquedaGlobal();
  const input = document.getElementById('globalSearchInput');
  if (input) input.value = '';
}

function cerrarBusquedaGlobal(){
  const wrap = document.getElementById('globalSearchResults');
  if (wrap) wrap.classList.remove('open');
}

document.addEventListener('click', (ev)=>{
  const notifWrap = document.getElementById('notifWrap');
  if (notifWrap && !notifWrap.contains(ev.target)) cerrarNotificaciones();
  const searchWrap = document.getElementById('globalSearchWrap');
  if (searchWrap && !searchWrap.contains(ev.target)) cerrarBusquedaGlobal();
});

/* =======================================================================
   INICIALIZACIÓN
   ======================================================================= */
function init(){
  migrarProyectosLegacy();
  migrarEventosPropiosLegacy();

  document.getElementById('evFecha').valueAsDate = new Date();
  document.getElementById('insFecha').valueAsDate = new Date();
  document.getElementById('calFecha').valueAsDate = new Date();
  document.getElementById('envioFecha').valueAsDate = new Date();

  renderProyectos();
  poblarSelectProyectoRegistro();
  poblarSelectProyectoEnvio();

  renderSectores();
  poblarSelectSectorInscrito();

  renderTareas();

  renderRegistrosRecientes();
  populateMemoriaFilters();
  renderMemoria();

  renderSnippets(getLS(LS.snippets));
  populateProyectoWebSelect();
  renderEstructuraWeb();
  renderSugerenciasMantenimiento();
  renderMantenimiento();

  poblarSelectsProyectoSEO();
  renderSugerenciasAuditoriaSEO();
  renderKeywords();
  renderPaginasSEO();
  renderAuditoriaSEO();
  renderContenidosSEO();

  actualizarPreviewEmail();
  renderUTMHistorial();
  renderEnviosEmail();

  renderPostPreview();
  poblarSelectProyectoIdea();
  renderIdeas();
  renderCalendar();
  renderListaPublicaciones();

  poblarSelectProyectoPublicacion();
  poblarFiltrosAnalyticsRedes();
  poblarFiltrosPerfiles();
  setAnaliticaRed(analiticaRedActual);

  renderEnlaces();

  renderEventosHub();

  actualizarBackupUltimaFecha();
  renderConfigGeneral();

  updateDashboardStats();
}

/* Arranque: hasta que no se cargan todos los datos desde Supabase no
   tiene sentido pintar nada (saldría todo vacío un instante). Se
   muestra una pantalla de carga mientras tanto. */
async function arrancarApp(){
  let session = null;
  try{
    const { data } = await supabaseClient.auth.getSession();
    session = data ? data.session : null;
  }catch(e){ console.error('Error comprobando la sesión:', e); }

  if (!session){
    mostrarPantallaLogin();
    return;
  }
  await entrarComoUsuario(session);
}
