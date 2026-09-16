/* =======================================================================
   ORGANIZADOR DE EVENTOS PROPIOS — el módulo más grande de la app.
   Resumen, Planificación, Logística, Inscritos, Programa y ponentes,
   Comunicación, Recursos y Acreditaciones (QR/vCard/PDF/impresión).
   ======================================================================= */

/* =======================================================================
   MÓDULO 5 — GESTOR INTEGRAL DE EVENTOS PROPIOS
   Resumen, planificación, logística, inscritos/aforo, programa y ponentes,
   comunicación y recursos. Almacenamiento en localStorage, compatible con
   los datos de las versiones anteriores del hub.
   ======================================================================= */

const LS_EV_PLAN = 'cidautHub_evPlan';
const LS_EV_PROGRAMA = 'cidautHub_evPrograma';
const LS_EV_PONENTES = 'cidautHub_evPonentes';
const LS_EV_RECURSOS = 'cidautHub_evRecursos';
const LS_EV_ACRED = 'cidautHub_evAcreditaciones';

function getEvObj(key){
  const raw = dbGetRaw(key);
  if (!raw) return {};
  try{ const p = JSON.parse(raw); return (p && typeof p==='object' && !Array.isArray(p)) ? p : {}; }catch(e){ return {}; }
}
function getEvLista(key, evento){ return getEvObj(key)[evento] || []; }
function setEvLista(key, evento, lista){
  const o = getEvObj(key);
  o[evento] = lista;
  dbSetRaw(key, JSON.stringify(o));
}

const TIPOS_EVENTO = {
  generica:'Evento genérico', jornada:'Jornada técnica', congreso:'Congreso',
  webinar:'Webinar', presentacion:'Presentación', institucional:'Evento institucional', interno:'Evento interno'
};
const PLANTILLAS_LOGISTICA = {
  generica: {
    pre: ['Definir objetivos y presupuesto del evento','Reservar espacio y confirmar fecha','Diseñar y publicar la landing de inscripción','Preparar material gráfico (cartelería, roll-ups, presentaciones)','Enviar invitaciones y difundir en redes sociales','Confirmar catering y logística de sala'],
    durante: ['Control de acceso y acreditaciones','Grabación fotográfica y en vídeo','Publicación en redes sociales en directo','Encuesta de satisfacción a los asistentes'],
    post: ['Enviar email de agradecimiento a los inscritos','Recopilar fotos y material para la memoria anual','Publicar resumen del evento en la web y redes','Analizar resultados frente a los objetivos iniciales','Archivar documentación y facturas']
  },
  jornada: {
    pre: ['Definir objetivos y temario de la jornada','Reservar sala y confirmar fecha','Cerrar ponentes y moderadores','Publicar landing de inscripción','Preparar cartelería y presentaciones','Lanzar campaña de difusión (mailing + redes)','Confirmar catering y acreditaciones'],
    durante: ['Montaje y control de acceso','Acreditación de asistentes','Grabación de ponencias','Publicación en directo en redes','Encuesta de satisfacción'],
    post: ['Enviar agradecimiento y materiales a inscritos','Editar y publicar vídeos de las ponencias','Redactar resumen para web y memoria anual','Analizar resultados y asistencia','Archivar documentación']
  },
  congreso: {
    pre: ['Definir objetivos, temario y comité del congreso','Reservar sede y fechas','Cerrar ponentes plenarios y sesiones paralelas','Abrir inscripciones (landing + formulario)','Gestionar patrocinios y colaboradores','Lanzar campaña de difusión','Coordinar catering, acreditaciones y material','Ensayo técnico de sala y equipos'],
    durante: ['Montaje y señalética','Acreditación y control de acceso','Soporte técnico a ponentes','Cobertura fotográfica y en vídeo','Publicación en directo','Gestión de incidencias'],
    post: ['Enviar agradecimiento y certificados','Editar y publicar ponencias grabadas','Publicar resumen y resultados en web','Analizar asistencia e inscritos','Archivar documentación y facturas']
  },
  webinar: {
    pre: ['Definir tema, objetivo y ponentes','Elegir plataforma y probar conexiones','Crear landing de registro','Preparar presentación y guion','Lanzar campaña de registro (mailing + redes)','Enviar recordatorios a inscritos','Ensayo técnico con ponentes'],
    durante: ['Comprobar audio y vídeo 30 min antes','Presentar y moderar el webinar','Responder preguntas del chat','Grabar la sesión'],
    post: ['Enviar agradecimiento y grabación a inscritos','Editar y publicar la grabación','Publicar resumen en web y redes','Analizar registros y asistencia','Archivar material']
  },
  presentacion: {
    pre: ['Definir objetivo y mensajes clave','Reservar espacio y fecha','Preparar presentación y discurso','Preparar material gráfico y dossier de prensa','Enviar invitaciones (medios, partners, clientes)','Confirmar asistencias y catering'],
    durante: ['Montaje y comprobación técnica','Acreditación de asistentes','Presentación','Atención a medios y entrevistas','Publicación en directo'],
    post: ['Enviar agradecimiento y dossier','Publicar nota de prensa y resumen','Compartir fotos y vídeos','Analizar impacto y cobertura','Archivar documentación']
  },
  institucional: {
    pre: ['Definir objetivo y protocolo del acto','Coordinar con instituciones y autoridades','Reservar sede y confirmar agenda','Preparar protocolo de intervenciones','Gestionar invitaciones institucionales','Preparar material gráfico institucional','Coordinar seguridad y acreditaciones'],
    durante: ['Montaje y protocolo de bienvenida','Acreditación de autoridades e invitados','Desarrollo del acto según protocolo','Cobertura fotográfica oficial','Atención a medios'],
    post: ['Agradecimientos institucionales','Publicar resumen y fotos oficiales','Enviar material a participantes','Analizar cobertura mediática','Archivar documentación']
  },
  interno: {
    pre: ['Definir objetivo y programa interno','Reservar espacio y fecha','Preparar presentaciones internas','Enviar convocatoria al personal','Preparar material y catering'],
    durante: ['Acreditación del personal','Desarrollo del programa','Dinámicas y actividades','Cobertura fotográfica interna'],
    post: ['Enviar resumen y material al personal','Recoger feedback interno','Publicar resumen en canales internos','Archivar documentación']
  }
};
const PLANTILLA_LOGISTICA = PLANTILLAS_LOGISTICA.generica;
const FASE_LABEL = { pre:'Pre-evento', durante:'Durante el evento', post:'Post-evento' };
const PRIORIDAD_EV_TAG = { alta:'tag-orange', media:'tag-teal', baja:'tag-grey' };
const PRIORIDAD_EV_LABEL = { alta:'Alta', media:'Media', baja:'Baja' };
const ESTADO_TAREA_EV = { pendiente:{label:'Pendiente',tag:'tag-grey'}, enCurso:{label:'En curso',tag:'tag-teal'}, completada:{label:'Completada',tag:'tag-teal'} };

const COM_CAT_LABEL = { anuncio:'Anuncio', publicacion:'Publicación', mailing:'Mailing', recordatorio:'Recordatorio', ultimas_plazas:'Últimas plazas', informacion:'Información', cobertura:'Cobertura', postevento:'Post-evento' };
const COM_CAT_TAG = { anuncio:'tag-teal', publicacion:'tag-teal', mailing:'tag-orange', recordatorio:'tag-teal', ultimas_plazas:'tag-orange', informacion:'tag-grey', cobertura:'tag-teal', postevento:'tag-grey' };

const ESTADO_EVENTO_LABEL = { planificacion:'En planificación', confirmado:'Confirmado', finalizado:'Finalizado', cancelado:'Cancelado' };
const ESTADO_EVENTO_TAG = { planificacion:'tag-orange', confirmado:'tag-teal', finalizado:'tag-grey', cancelado:'tag-grey' };
const EST_INSC_LABEL = { registrado:'Registrado', confirmado:'Confirmado', cancelado:'Cancelado' };
const EST_ASIS_LABEL = { pendiente:'Pendiente', asistio:'Asistió', noAsistio:'No asistió' };

function getEventosPropios(){ return getLS(LS.eventosPropios); }
function getEventoPropioPorNombre(nombre){ return getEventosPropios().find(e=>e.nombre===nombre); }

function migrarEventosPropiosLegacy(){
  const eventos = getEventosPropios();
  if (!eventos.length || typeof eventos[0] !== 'string') return;
  const migrados = eventos.map(nombre=>({
    id: uid(), nombre, tipo:'generica', url:'', fechaInicio:'', fechaFin:'', lugar:'', estado:'planificacion', proyecto:'', descripcion:''
  }));
  setLS(LS.eventosPropios, migrados);
}

/* Migración de estructuras ampliadas: añade campos por defecto a inscritos,
   comunicaciones y tareas de logística creados con versiones anteriores. */
function migrarDatosEventosPropios(){
  let cambiado = false;
  const ins = getLS(LS.inscritos);
  ins.forEach(i=>{
    if (!i.estInscripcion){ i.estInscripcion = 'registrado'; cambiado = true; }
    if (!i.estAsistencia){ i.estAsistencia = 'pendiente'; cambiado = true; }
  });
  if (cambiado) setLS(LS.inscritos, ins);

  cambiado = false;
  const com = getLS(LS.comunicacionEventos);
  com.forEach(c=>{
    if (!c.cat){ c.cat = c.tipo==='mailing' ? 'mailing' : 'publicacion'; cambiado = true; }
    if (!c.canal){ c.canal = c.tipo==='social' ? (c.plataforma||'LinkedIn') : 'Mailing'; cambiado = true; }
    ['objetivo','publico','responsable','enlace','notas'].forEach(k=>{ if (c[k]===undefined){ c[k]=''; cambiado = true; } });
  });
  if (cambiado) setLS(LS.comunicacionEventos, com);

  cambiado = false;
  const log = getLogisticaObj();
  Object.keys(log).forEach(ev=>{
    ['pre','durante','post'].forEach(f=>{
      (log[ev][f]||[]).forEach(t=>{
        if (t.estado===undefined){ t.estado = t.done ? 'completada' : 'pendiente'; cambiado = true; }
        if (t.prioridad===undefined){ t.prioridad = 'media'; cambiado = true; }
        ['responsable','fechaLimite','notas','dependencia'].forEach(k=>{ if (t[k]===undefined){ t[k]=''; cambiado = true; } });
      });
    });
  });
  if (cambiado) dbSetRaw(LS.logistica, JSON.stringify(log));
}
migrarDatosEventosPropios();

let eventoPropioEditNombre = null;
let eventoDetalleActual = null;

function fmtRangoEventoPropio(ev){
  if (!ev.fechaInicio) return 'Sin fecha';
  if (ev.fechaFin && ev.fechaFin !== ev.fechaInicio) return `${fmtFecha(ev.fechaInicio)} – ${fmtFecha(ev.fechaFin)}`;
  return fmtFecha(ev.fechaInicio);
}

function getPlanificacion(evento){
  const o = getEvObj(LS_EV_PLAN);
  return { objetivo:'', publico:'', cta:'', mensajes:'', kpis:'', observaciones:'', objetivoAsistentes:'', aforo:'', responsables:[], ...(o[evento]||{}) };
}
function savePlanificacion(evento, p){
  const o = getEvObj(LS_EV_PLAN);
  o[evento] = p;
  dbSetRaw(LS_EV_PLAN, JSON.stringify(o));
}

function poblarSelectProyectoEventoPropio(){
  const sel = document.getElementById('epProyecto');
  const prev = sel.value;
  sel.innerHTML = '<option value="">Ninguno</option>' + getProyectosNombres().map(n=>`<option>${esc(n)}</option>`).join('');
  sel.value = prev;
  const selTipo = document.getElementById('epTipo');
  if (selTipo && !selTipo.options.length){
    selTipo.innerHTML = Object.keys(TIPOS_EVENTO).map(k=>`<option value="${k}">${TIPOS_EVENTO[k]}</option>`).join('');
  }
}

function poblarSelectsResponsables(seleccionado){
  const resp = eventoDetalleActual ? getPlanificacion(eventoDetalleActual).responsables : [];
  ['ltResponsable','comResponsable','rcResponsable'].forEach(id=>{
    const sel = document.getElementById(id);
    if (!sel) return;
    const prev = seleccionado ? seleccionado : sel.value;
    sel.innerHTML = '<option value="">Sin asignar</option>' + resp.map(r=>`<option value="${esc(r.nombre)}">${esc(r.nombre)}${r.rol?' · '+esc(r.rol):''}</option>`).join('');
    if (resp.some(r=>r.nombre===prev)) sel.value = prev;
  });
}

function abrirModalEventoPropio(nombre){
  eventoPropioEditNombre = nombre || null;
  poblarSelectProyectoEventoPropio();
  const deleteBtn = document.getElementById('eventoPropioDeleteBtn');
  if (nombre){
    const ev = getEventoPropioPorNombre(nombre);
    if (!ev) return;
    document.getElementById('eventoPropioModalTitulo').textContent = 'Editar evento propio';
    document.getElementById('epNombre').value = ev.nombre || '';
    document.getElementById('epUrl').value = ev.url || '';
    document.getElementById('epFechaInicio').value = ev.fechaInicio || '';
    document.getElementById('epFechaFin').value = ev.fechaFin || '';
    document.getElementById('epLugar').value = ev.lugar || '';
    document.getElementById('epEstado').value = ev.estado || 'planificacion';
    document.getElementById('epProyecto').value = ev.proyecto || '';
    document.getElementById('epTipo').value = ev.tipo || 'generica';
    document.getElementById('epDescripcion').value = ev.descripcion || '';
    deleteBtn.style.display = 'inline-flex';
  } else {
    document.getElementById('eventoPropioModalTitulo').textContent = 'Nuevo evento propio';
    ['epNombre','epUrl','epFechaInicio','epFechaFin','epLugar','epDescripcion'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('epEstado').value = 'planificacion';
    document.getElementById('epProyecto').value = '';
    document.getElementById('epTipo').value = 'generica';
    deleteBtn.style.display = 'none';
  }
  document.getElementById('eventoPropioModal').classList.add('active');
}

function cerrarModalEventoPropio(){
  document.getElementById('eventoPropioModal').classList.remove('active');
  eventoPropioEditNombre = null;
}

function guardarEventoPropio(){
  const nombre = document.getElementById('epNombre').value.trim();
  if (!nombre){ showToast('Escribe un nombre para el evento.'); return; }
  const eventos = getEventosPropios();
  const duplicado = eventos.some(e=>e.nombre===nombre && e.nombre!==eventoPropioEditNombre);
  if (duplicado){ showToast('Ya existe un evento con ese nombre.'); return; }

  const datos = {
    nombre,
    tipo: document.getElementById('epTipo').value || 'generica',
    url: document.getElementById('epUrl').value.trim(),
    fechaInicio: document.getElementById('epFechaInicio').value,
    fechaFin: document.getElementById('epFechaFin').value,
    lugar: document.getElementById('epLugar').value.trim(),
    estado: document.getElementById('epEstado').value,
    proyecto: document.getElementById('epProyecto').value,
    descripcion: document.getElementById('epDescripcion').value.trim()
  };

  if (eventoPropioEditNombre){
    const idx = eventos.findIndex(e=>e.nombre===eventoPropioEditNombre);
    if (idx>-1) eventos[idx] = { ...eventos[idx], ...datos };
    setLS(LS.eventosPropios, eventos);
    if (nombre !== eventoPropioEditNombre) renombrarEventoPropioEnDatos(eventoPropioEditNombre, nombre);
    if (eventoDetalleActual === eventoPropioEditNombre) eventoDetalleActual = nombre;
    cerrarModalEventoPropio();
    renderEventosHub();
    if (eventoDetalleActual === nombre) abrirEventoDetalle(nombre);
    showToast('Evento actualizado.');
  } else {
    eventos.push({ id: uid(), ...datos });
    setLS(LS.eventosPropios, eventos);
    cargarPlantillaEnEvento(nombre, datos.tipo);
    cerrarModalEventoPropio();
    renderEventosHub();
    abrirEventoDetalle(nombre);
    showToast('Evento creado con la plantilla de logística.');
  }
}

function cargarPlantillaEnEvento(nombreEvento, tipo){
  const plantilla = PLANTILLAS_LOGISTICA[tipo] || PLANTILLAS_LOGISTICA.generica;
  const logistica = getLogisticaObj();
  logistica[nombreEvento] = { pre:[], durante:[], post:[] };
  Object.keys(FASE_LABEL).forEach(fase=>{
    logistica[nombreEvento][fase] = (plantilla[fase]||[]).map(t=>({
      id: uid(), texto:t, done:false, estado:'pendiente', prioridad:'media',
      responsable:'', fechaLimite:'', notas:'', dependencia:''
    }));
  });
  dbSetRaw(LS.logistica, JSON.stringify(logistica));
}

function renombrarEventoPropioEnDatos(nombreAnterior, nombreNuevo){
  const logistica = getLogisticaObj();
  if (logistica[nombreAnterior]){
    logistica[nombreNuevo] = logistica[nombreAnterior];
    delete logistica[nombreAnterior];
    dbSetRaw(LS.logistica, JSON.stringify(logistica));
  }
  setLS(LS.inscritos, getLS(LS.inscritos).map(i=> i.evento===nombreAnterior ? {...i, evento:nombreNuevo} : i));
  setLS(LS.comunicacionEventos, getLS(LS.comunicacionEventos).map(c=> c.evento===nombreAnterior ? {...c, evento:nombreNuevo} : c));
  [LS_EV_PLAN, LS_EV_PROGRAMA, LS_EV_PONENTES, LS_EV_RECURSOS, LS_EV_ACRED].forEach(key=>{
    const o = getEvObj(key);
    if (o[nombreAnterior] !== undefined){
      o[nombreNuevo] = o[nombreAnterior];
      delete o[nombreAnterior];
      dbSetRaw(key, JSON.stringify(o));
    }
  });
}

function eliminarEventoPropio(nombreParam){
  const nombre = nombreParam || eventoPropioEditNombre;
  if (!nombre) return;
  if (!confirm(`¿Eliminar el evento "${nombre}"? Se eliminará toda su información: logística, inscritos, programa, comunicación y recursos. Esta acción no se puede deshacer.`)) return;

  setLS(LS.eventosPropios, getEventosPropios().filter(e=>e.nombre!==nombre));
  const logistica = getLogisticaObj();
  delete logistica[nombre];
  dbSetRaw(LS.logistica, JSON.stringify(logistica));
  setLS(LS.inscritos, getLS(LS.inscritos).filter(i=>i.evento!==nombre));
  setLS(LS.comunicacionEventos, getLS(LS.comunicacionEventos).filter(c=>c.evento!==nombre));
  [LS_EV_PLAN, LS_EV_PROGRAMA, LS_EV_PONENTES, LS_EV_RECURSOS, LS_EV_ACRED].forEach(key=>{
    const o = getEvObj(key);
    if (o[nombre] !== undefined){ delete o[nombre]; dbSetRaw(key, JSON.stringify(o)); }
  });

  cerrarModalEventoPropio();
  if (eventoDetalleActual === nombre) volverAlHubEventos();
  renderEventosHub();
  updateDashboardStats();
  showToast('Evento eliminado.');
}

function renderEventosHub(){
  const wrap = document.getElementById('eventosHubGrid');
  if (!wrap) return;
  const eventos = getEventosPropios().slice().sort((a,b)=>(b.fechaInicio||'').localeCompare(a.fechaInicio||''));
  if (!eventos.length){
    wrap.innerHTML = '<div class="panel"><p class="muted">Todavía no has creado ningún evento propio. Usa "Nuevo evento" para empezar.</p></div>';
    return;
  }
  const logistica = getLogisticaObj();
  const inscritos = getLS(LS.inscritos);
  wrap.innerHTML = eventos.map(ev=>{
    const tareas = logistica[ev.nombre] ? [...logistica[ev.nombre].pre,...logistica[ev.nombre].durante,...logistica[ev.nombre].post] : [];
    const hechas = tareas.filter(t=>t.done).length;
    const pct = tareas.length ? Math.round(hechas/tareas.length*100) : 0;
    const numInscritos = inscritos.filter(i=>i.evento===ev.nombre && i.estInscripcion!=='cancelado').length;
    return `
    <div class="event-card" onclick="abrirEventoDetalle('${escJs(ev.nombre)}')">
      <div class="event-card-top">
        <div class="event-card-title">${esc(ev.nombre)}</div>
        <span class="tag ${ESTADO_EVENTO_TAG[ev.estado]||'tag-grey'}">${ESTADO_EVENTO_LABEL[ev.estado]||'—'}</span>
      </div>
      <div class="event-card-meta">
        <span><i class="fa-solid fa-calendar-days"></i> ${fmtRangoEventoPropio(ev)}</span>
        ${ev.lugar ? `<span><i class="fa-solid fa-location-dot"></i> ${esc(ev.lugar)}</span>` : ''}
        ${ev.url ? `<span><i class="fa-solid fa-link"></i> <a href="${esc(ev.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation();">Ver web del evento</a></span>` : ''}
      </div>
      <div class="event-card-stats">
        <span><b>${hechas}/${tareas.length}</b> tareas (${pct}%)</span>
        <span><b>${numInscritos}</b> inscrito${numInscritos===1?'':'s'}</span>
      </div>
      <div class="event-card-actions">
        <span class="btn-ghost" onclick="event.stopPropagation();abrirModalEventoPropio('${escJs(ev.nombre)}')"><i class="fa-solid fa-pen"></i></span>
        <span class="btn-ghost" onclick="event.stopPropagation();eliminarEventoPropio('${escJs(ev.nombre)}')"><i class="fa-solid fa-trash"></i></span>
      </div>
    </div>`;
  }).join('');
}

function abrirEventoDetalle(nombre){
  const ev = getEventoPropioPorNombre(nombre);
  if (!ev){ showToast('Ese evento ya no existe.'); volverAlHubEventos(); return; }
  eventoDetalleActual = nombre;
  document.getElementById('propiosHubView').style.display = 'none';
  document.getElementById('propiosDetalleView').style.display = 'block';
  document.getElementById('eventoDetalleHeader').innerHTML = `
    <div class="event-detail-header">
      <div>
        <div class="event-detail-title">${esc(ev.nombre)}</div>
        <div class="event-detail-meta">
          <span><i class="fa-solid fa-calendar-days"></i> ${fmtRangoEventoPropio(ev)}</span>
          ${ev.lugar ? `<span><i class="fa-solid fa-location-dot"></i> ${esc(ev.lugar)}</span>` : ''}
          ${ev.proyecto ? `<span><i class="fa-solid fa-diagram-project"></i> ${esc(ev.proyecto)}</span>` : ''}
          ${TIPOS_EVENTO[ev.tipo] ? `<span><i class="fa-solid fa-tag"></i> ${TIPOS_EVENTO[ev.tipo]}</span>` : ''}
          ${ev.url ? `<span><i class="fa-solid fa-link"></i> <a href="${esc(ev.url)}" target="_blank" rel="noopener">${esc(ev.url)}</a></span>` : ''}
          <span class="tag ${ESTADO_EVENTO_TAG[ev.estado]||'tag-grey'}">${ESTADO_EVENTO_LABEL[ev.estado]||'—'}</span>
        </div>
      </div>
      <div class="event-detail-actions">
        <button class="btn btn-secondary" onclick="abrirModalEventoPropio('${escJs(ev.nombre)}')"><i class="fa-solid fa-pen"></i> Editar datos</button>
      </div>
    </div>`;
  poblarSelectsResponsables();
  switchTab('propios','resumen');
  renderPlanificacionEvento();
  renderLogistica();
  renderInscritos();
  renderPrograma();
  renderCalendarioComunicacion();
  renderRecursos();
}

function volverAlHubEventos(){
  eventoDetalleActual = null;
  document.getElementById('propiosDetalleView').style.display = 'none';
  document.getElementById('propiosHubView').style.display = 'block';
  renderEventosHub();
}
/* =======================================================================
   RESUMEN DEL EVENTO
   ======================================================================= */
function statsLogisticaEvento(evento){
  const l = getLogisticaObj()[evento];
  const todas = l ? [...(l.pre||[]),...(l.durante||[]),...(l.post||[])] : [];
  const done = todas.filter(t=>t.done).length;
  return { todas, done, pct: todas.length ? Math.round(done/todas.length*100) : 0 };
}
function statsInscritosEvento(evento){
  const todos = getLS(LS.inscritos).filter(i=>i.evento===evento);
  return {
    total: todos.length,
    registrados: todos.filter(i=>i.estInscripcion==='registrado').length,
    confirmados: todos.filter(i=>i.estInscripcion==='confirmado').length,
    cancelados: todos.filter(i=>i.estInscripcion==='cancelado').length,
    asistentes: todos.filter(i=>i.estAsistencia==='asistio').length,
    noAsistentes: todos.filter(i=>i.estAsistencia==='noAsistio').length,
    pendientesAsist: todos.filter(i=>i.estAsistencia==='pendiente' && i.estInscripcion!=='cancelado').length,
    activos: todos.filter(i=>i.estInscripcion!=='cancelado').length
  };
}
function statsComunicacionEvento(evento){
  const todas = getComunicacionEvento(evento);
  const hechas = todas.filter(c=>c.hecho).length;
  return { todas, hechas, pct: todas.length ? Math.round(hechas/todas.length*100) : 0 };
}

function renderResumenEvento(){
  const wrap = document.getElementById('evResumenWrap');
  if (!wrap) return;
  const ev = eventoDetalleActual ? getEventoPropioPorNombre(eventoDetalleActual) : null;
  if (!ev){ wrap.innerHTML = '<div class="panel"><p class="muted">Abre un evento propio desde el hub para ver su resumen.</p></div>'; return; }

  const plan = getPlanificacion(ev.nombre);
  const log = statsLogisticaEvento(ev.nombre);
  const ins = statsInscritosEvento(ev.nombre);
  const com = statsComunicacionEvento(ev.nombre);
  const hoyStr = hoyLocal();

  let diasTxt = 'Sin fecha', diasNum = null;
  if (ev.fechaInicio){
    const diff = Math.round((new Date(ev.fechaInicio) - new Date(hoyStr))/86400000);
    diasNum = diff;
    if (diff === 0) diasTxt = 'Hoy';
    else if (diff > 0) diasTxt = diff + (diff===1?' día':' días');
    else diasTxt = 'Hace ' + Math.abs(diff) + (diff===-1?' día':' días');
  }

  const aforo = Number(plan.aforo)||0;
  const ocupacion = aforo ? Math.min(100, Math.round(ins.activos/aforo*100)) : null;
  const plazas = aforo ? aforo - ins.activos : null;
  const aforoCompleto = plazas !== null && plazas <= 0;
  const asistEval = ins.asistentes + ins.noAsistentes;
  const pctAsistencia = asistEval ? Math.round(ins.asistentes/asistEval*100) : null;

  const proxTareas = log.todas.filter(t=>!t.done)
    .sort((a,b)=>(a.fechaLimite||'9999')<(b.fechaLimite||'9999')?-1:1).slice(0,5);
  const proxCom = com.todas.filter(c=>!c.hecho)
    .sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')).slice(0,5);

  wrap.innerHTML = `
    <div class="ev-kpi-grid">
      <div class="panel panel-accent"><div class="stat-block"><div class="stat-num" style="color:${diasNum!==null&&diasNum<0?'var(--ink-300)':'var(--teal-700)'};">${esc(diasTxt)}</div><div class="stat-label">para el evento</div></div></div>
      <div class="panel panel-accent"><div class="stat-block"><div class="stat-num">${ins.activos}${aforo?' / '+aforo:''}</div><div class="stat-label">inscritos${aforo?' (activos / aforo)':''}</div></div></div>
      <div class="panel panel-accent"><div class="stat-block"><div class="stat-num">${ocupacion===null?'—':ocupacion+' %'}</div><div class="stat-label">ocupación del aforo</div></div></div>
      <div class="panel panel-accent"><div class="stat-block"><div class="stat-num">${log.pct} %</div><div class="stat-label">logística (${log.done}/${log.todas.length})</div></div></div>
      <div class="panel panel-accent"><div class="stat-block"><div class="stat-num">${com.pct} %</div><div class="stat-label">comunicación (${com.hechas}/${com.todas.length})</div></div></div>
      <div class="panel panel-accent"><div class="stat-block"><div class="stat-num">${pctAsistencia===null?'—':pctAsistencia+' %'}</div><div class="stat-label">asistencia (${ins.asistentes} de ${asistEval||'—'})</div></div></div>
    </div>

    ${aforo ? `
    <div class="panel" style="${aforoCompleto?'border-color:var(--orange-500);':''}">
      <div class="flex-between" style="margin-bottom:8px;">
        <div class="panel-title" style="margin-bottom:0;">Ocupación</div>
        <div class="aforo-num" style="${aforoCompleto?'color:var(--orange-500);':''}">${ins.activos} / ${aforo} inscritos</div>
      </div>
      <div class="progress-bar" style="height:10px;margin:8px 0;"><div class="progress-bar-fill" style="width:${ocupacion}%;background:${aforoCompleto?'var(--orange-500)':(ocupacion>=70?'var(--teal-500)':'#e6b23c')};"></div></div>
      <div class="small" style="${aforoCompleto?'color:var(--orange-500);font-weight:600;':'color:var(--ink-500);'}">
        ${aforoCompleto ? 'Aforo completo: se ha alcanzado o superado el aforo máximo.' : `${plazas} plaza${plazas===1?'':'s'} disponibles`}${plan.objetivoAsistentes ? ` · objetivo: ${esc(plan.objetivoAsistentes)} asistentes` : ''}
      </div>
    </div>` : ''}

    <div class="grid-2">
      <div class="panel">
        <div class="panel-title">Próximas tareas pendientes</div>
        <div class="panel-subtitle">Las 5 tareas de logística más urgentes por fecha límite.</div>
        ${proxTareas.length ? proxTareas.map(t=>{
          const atrasada = t.fechaLimite && t.fechaLimite < hoyStr;
          return `
          <div class="activity-item">
            <div class="ai-icon" style="${atrasada?'background:var(--orange-100);color:#b1521a;':''}"><i class="fa-solid ${atrasada?'fa-triangle-exclamation':'fa-list-check'}"></i></div>
            <div class="ai-body">
              <div class="ai-title">${esc(t.texto)}</div>
              <div class="ai-meta">
                <span class="tag ${PRIORIDAD_EV_TAG[t.prioridad]||'tag-grey'}">${PRIORIDAD_EV_LABEL[t.prioridad]||t.prioridad}</span>
                ${t.responsable?esc(t.responsable)+' · ':''}${t.fechaLimite ? (atrasada?'Venció el ':'Límite: ')+fmtFecha(t.fechaLimite) : 'Sin fecha límite'}
              </div>
            </div>
            <button class="ai-link" onclick="abrirModalTareaLogistica('${t.id}')">Abrir</button>
          </div>`;
        }).join('') : '<p class="muted small">No hay tareas pendientes: el trabajo logístico está completado.</p>'}
        <div style="margin-top:8px;"><button class="ai-link" onclick="switchTab('propios','logistica')">Ir a logística →</button></div>
      </div>
      <div class="panel">
        <div class="panel-title">Próximas acciones de comunicación</div>
        <div class="panel-subtitle">Lo que queda por comunicar, en orden de fecha.</div>
        ${proxCom.length ? proxCom.map(c=>`
          <div class="activity-item">
            <div class="ai-icon"><i class="fa-solid fa-bullhorn"></i></div>
            <div class="ai-body">
              <div class="ai-title">${esc(c.titulo)}</div>
              <div class="ai-meta">
                <span class="tag ${COM_CAT_TAG[c.cat]||'tag-teal'}">${COM_CAT_LABEL[c.cat]||esc(c.cat||'Acción')}</span>
                ${fmtFecha(c.fecha)}${c.canal?' · '+esc(c.canal):''}${c.responsable?' · '+esc(c.responsable):''}
              </div>
            </div>
            <button class="ai-link" onclick="abrirModalCom('${c.fecha}','${c.id}')">Abrir</button>
          </div>`).join('') : '<p class="muted small">No hay acciones de comunicación pendientes.</p>'}
        <div style="margin-top:8px;"><button class="ai-link" onclick="switchTab('propios','calendario')">Ir a comunicación →</button></div>
      </div>
    </div>

    <div class="panel section-gap">
      <div class="panel-title">Información básica del evento</div>
      <div style="font-size:12.5px;color:var(--ink-700);line-height:1.9;">
        <div><strong>Fechas:</strong> ${fmtRangoEventoPropio(ev)}</div>
        <div><strong>Lugar:</strong> ${ev.lugar ? esc(ev.lugar) : '<span class="muted">—</span>'}</div>
        <div><strong>Proyecto:</strong> ${ev.proyecto ? esc(ev.proyecto) : '<span class="muted">—</span>'}</div>
        <div><strong>Notas:</strong> ${ev.descripcion ? esc(ev.descripcion) : '<span class="muted">—</span>'}</div>
      </div>
      <div class="btn-row" style="margin-top:14px;">
        <button class="btn btn-secondary" onclick="switchTab('propios','inscritos')"><i class="fa-solid fa-users"></i> Ver inscritos</button>
        <button class="btn btn-secondary" onclick="switchTab('propios','programa')"><i class="fa-solid fa-clock"></i> Ver programa</button>
        <button class="btn btn-secondary" onclick="switchTab('propios','recursos')"><i class="fa-solid fa-folder-open"></i> Ver recursos</button>
      </div>
    </div>`;
}

/* =======================================================================
   PLANIFICACIÓN
   ======================================================================= */
function renderPlanificacionEvento(){
  const ev = eventoDetalleActual;
  if (!ev) return;
  renderResponsablesEvento();
}

function abrirModalResponsable(){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento.'); return; }
  ['respNombre'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('responsableModal').classList.add('active');
}
function cerrarModalResponsable(){
  document.getElementById('responsableModal').classList.remove('active');
}

function renderResponsablesEvento(){
  const ev = eventoDetalleActual;
  const wrap = document.getElementById('listaResponsablesEvento');
  if (!wrap || !ev) return;
  const plan = getPlanificacion(ev);
  if (!plan.responsables.length){
    wrap.innerHTML = '<p class="muted small">Todavía no hay responsables. Añade al equipo de organización.</p>';
    return;
  }
  wrap.innerHTML = plan.responsables.map(r=>`
    <div class="check-item">
      <div class="ctext">
        <span class="responsable-tag"><i class="fa-solid fa-user" style="color:var(--teal-500);"></i> <strong>${esc(r.nombre)}</strong></span>
      </div>
      <span class="btn-ghost" onclick="eliminarResponsableEvento('${r.id}')"><i class="fa-solid fa-xmark"></i></span>
    </div>`).join('');
}

function añadirResponsableEvento(){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento.'); return; }
  const nombre = document.getElementById('respNombre').value.trim();
  if (!nombre){ showToast('Indica al menos el nombre del responsable.'); return; }
  const plan = getPlanificacion(ev);
  plan.responsables.push({ id: uid(), nombre });
  savePlanificacion(ev, plan);
  cerrarModalResponsable();
  renderResponsablesEvento();
  poblarSelectsResponsables();
  showToast('Responsable añadido.');
}

function eliminarResponsableEvento(id){
  const ev = eventoDetalleActual;
  if (!ev) return;
  const plan = getPlanificacion(ev);
  const r = plan.responsables.find(x=>x.id===id);
  if (!confirm(`¿Quitar a "${r?r.nombre:''}" de los responsables?`)) return;
  plan.responsables = plan.responsables.filter(x=>x.id!==id);
  savePlanificacion(ev, plan);
  renderResponsablesEvento();
  poblarSelectsResponsables();
  showToast('Responsable eliminado.');
}

/* =======================================================================
   LOGÍSTICA
   ======================================================================= */
function getLogisticaObj(){
  const raw = dbGetRaw(LS.logistica);
  if (!raw) return {};
  try{ const parsed = JSON.parse(raw); return Array.isArray(parsed) ? {} : parsed; }catch(e){ return {}; }
}

let logTaskEditId = null;

function todasTareasEvento(evento){
  const l = getLogisticaObj()[evento];
  return l ? [...(l.pre||[]),...(l.durante||[]),...(l.post||[])] : [];
}

function abrirModalTareaLogistica(id){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento propio desde el hub.'); return; }
  logTaskEditId = id || null;
  poblarSelectsResponsables();
  const t = id ? todasTareasEvento(ev).find(x=>x.id===id) : null;
  document.getElementById('logTaskModalTitulo').textContent = t ? 'Editar tarea' : 'Añadir tarea';
  document.getElementById('ltTexto').value = t ? (t.texto||'') : '';
  document.getElementById('ltFase').value = t ? (t.fase||'pre') : 'pre';
  document.getElementById('ltEstado').value = t ? (t.estado||'pendiente') : 'pendiente';
  document.getElementById('ltPrioridad').value = t ? (t.prioridad||'media') : 'media';
  document.getElementById('ltFechaLimite').value = t ? (t.fechaLimite||'') : '';
  document.getElementById('ltResponsable').value = t ? (t.responsable||'') : '';
  document.getElementById('ltNotas').value = t ? (t.notas||'') : '';
  document.getElementById('ltDeleteBtn').style.display = t ? 'inline-flex' : 'none';
  const dep = document.getElementById('ltDependencia');
  const otras = todasTareasEvento(ev).filter(x=>x.id!==id);
  dep.innerHTML = '<option value="">Ninguna</option>' + otras.map(x=>`<option value="${x.id}" ${t&&t.dependencia===x.id?'selected':''}>${esc(x.texto)}</option>`).join('');
  document.getElementById('logTaskModal').classList.add('active');
}

function cerrarModalTareaLogistica(){
  document.getElementById('logTaskModal').classList.remove('active');
  logTaskEditId = null;
}

function guardarTareaLogisticaModal(){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento.'); return; }
  const texto = document.getElementById('ltTexto').value.trim();
  if (!texto){ showToast('Indica el nombre de la tarea.'); return; }
  const fase = document.getElementById('ltFase').value;
  const estado = document.getElementById('ltEstado').value;
  const data = {
    texto, fase, estado,
    done: estado==='completada',
    prioridad: document.getElementById('ltPrioridad').value,
    fechaLimite: document.getElementById('ltFechaLimite').value,
    responsable: document.getElementById('ltResponsable').value,
    dependencia: document.getElementById('ltDependencia').value,
    notas: document.getElementById('ltNotas').value.trim()
  };
  const logistica = getLogisticaObj();
  if (!logistica[ev]) logistica[ev] = { pre:[], durante:[], post:[] };
  if (!logistica[ev][fase]) logistica[ev][fase] = [];
  if (logTaskEditId){
    let encontrada = false;
    ['pre','durante','post'].forEach(f=>{
      const idx = (logistica[ev][f]||[]).findIndex(x=>x.id===logTaskEditId);
      if (idx>-1){
        const t = logistica[ev][f][idx];
        logistica[ev][f].splice(idx,1);
        logistica[ev][fase].push({ ...t, ...data });
        encontrada = true;
      }
    });
    if (!encontrada) logistica[ev][fase].push({ id: uid(), ...data });
  } else {
    logistica[ev][fase].push({ id: uid(), ...data });
  }
  dbSetRaw(LS.logistica, JSON.stringify(logistica));
  cerrarModalTareaLogistica();
  renderLogistica();
  showToast('Tarea guardada.');
}

function eliminarTareaLogisticaModal(){
  const ev = eventoDetalleActual;
  if (!ev || !logTaskEditId) return;
  if (!confirm('¿Eliminar esta tarea?')) return;
  const logistica = getLogisticaObj();
  ['pre','durante','post'].forEach(f=>{
    if (logistica[ev] && logistica[ev][f]) logistica[ev][f] = logistica[ev][f].filter(x=>x.id!==logTaskEditId);
  });
  dbSetRaw(LS.logistica, JSON.stringify(logistica));
  cerrarModalTareaLogistica();
  renderLogistica();
  showToast('Tarea eliminada.');
}

function renderLogistica(){
  const evento = eventoDetalleActual;
  const wrap = document.getElementById('logisticaFases');
  const progreso = document.getElementById('logisticaProgresoGlobal');
  if (!wrap) return;
  if (!evento){
    wrap.innerHTML = '<div class="panel"><p class="muted">Abre un evento propio desde el hub para ver su logística.</p></div>';
    return;
  }
  const stats = statsLogisticaEvento(evento);
  if (progreso){
    progreso.innerHTML = `
      <div class="panel" style="padding:16px 22px;">
        <div class="flex-between" style="margin-bottom:6px;">
          <div class="panel-title" style="margin-bottom:0;font-size:13px;">Progreso global de logística</div>
          <strong style="font-size:13px;">${stats.pct} %</strong>
        </div>
        <div class="progress-bar" style="margin:6px 0 0 0;"><div class="progress-bar-fill" style="width:${stats.pct}%;"></div></div>
      </div>`;
  }
  const hoyStr = hoyLocal();
  const logistica = getLogisticaObj();
  const datos = logistica[evento] || {pre:[],durante:[],post:[]};

  wrap.innerHTML = Object.keys(FASE_LABEL).map(fase=>{
    const tasks = (datos[fase]||[]).slice().sort((a,b)=>{
      if (a.done!==b.done) return a.done?1:-1;
      return (a.fechaLimite||'9999') < (b.fechaLimite||'9999') ? -1 : 1;
    });
    const done = tasks.filter(t=>t.done).length;
    const pct = tasks.length ? Math.round(done/tasks.length*100) : 0;
    const items = tasks.map(t=>{
      const atrasada = !t.done && t.fechaLimite && t.fechaLimite < hoyStr;
      const est = ESTADO_TAREA_EV[t.estado] || ESTADO_TAREA_EV.pendiente;
      return `
      <div class="task-card ${t.done?'completada':''} ${atrasada?'atrasada':''}">
        <div style="display:flex;align-items:flex-start;gap:9px;">
          <input type="checkbox" ${t.done?'checked':''} onchange="toggleLogisticaTask('${evento}','${fase}','${t.id}')" style="margin-top:2px;width:16px;height:16px;accent-color:var(--teal-500);flex-shrink:0;">
          <div style="flex:1;min-width:0;">
            <div class="tc-title" onclick="abrirModalTareaLogistica('${t.id}')" title="Haz clic para editar">${esc(t.texto)}</div>
            <div class="tc-meta">
              <span class="tag ${PRIORIDAD_EV_TAG[t.prioridad]||'tag-grey'}">${PRIORIDAD_EV_LABEL[t.prioridad]||t.prioridad}</span>
              <span class="tag ${est.tag}">${est.label}</span>
              ${t.responsable?`<span><i class="fa-solid fa-user"></i> ${esc(t.responsable)}</span>`:''}
              ${t.fechaLimite?`<span><i class="fa-regular fa-calendar"></i> ${fmtFecha(t.fechaLimite)}${atrasada?' (atrasada)':''}</span>`:''}
            </div>
            ${t.notas?`<div class="cmeta" style="margin-top:4px;">${esc(t.notas)}</div>`:''}
          </div>
          <span class="btn-ghost" onclick="abrirModalTareaLogistica('${t.id}')" style="flex-shrink:0;"><i class="fa-solid fa-pen"></i></span>
        </div>
      </div>`;
    }).join('') || '<p class="muted small">Sin tareas. Añade una con el botón de arriba.</p>';
    return `
      <div class="panel">
        <div class="panel-title">${FASE_LABEL[fase]}</div>
        <div class="panel-subtitle" style="margin-bottom:6px;">${done} de ${tasks.length} completadas</div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%;"></div></div>
        ${items}
      </div>`;
  }).join('');
}

function toggleLogisticaTask(evento, fase, id){
  const logistica = getLogisticaObj();
  const t = (logistica[evento] && logistica[evento][fase] || []).find(x=>x.id===id);
  if (!t) return;
  t.done = !t.done;
  t.estado = t.done ? 'completada' : 'pendiente';
  dbSetRaw(LS.logistica, JSON.stringify(logistica));
  renderLogistica();
}

/* Compatibilidad con posibles handlers antiguos. */
function eliminarTareaLogistica(evento, fase, id){
  const logistica = getLogisticaObj();
  const t = (logistica[evento][fase]||[]).find(x=>x.id===id);
  if (!confirm(`¿Eliminar la tarea "${t?t.texto:''}" de la checklist?`)) return;
  logistica[evento][fase] = (logistica[evento][fase]||[]).filter(x=>x.id!==id);
  dbSetRaw(LS.logistica, JSON.stringify(logistica));
  renderLogistica();
}
function añadirTareaLogistica(){ abrirModalTareaLogistica(); }

/* =======================================================================
   INSCRITOS, ASISTENCIA Y AFORO
   ======================================================================= */
let chartInscritosRef = null;
let importPendiente = null;

function añadirInscrito(){
  const evento = eventoDetalleActual;
  if (!evento){ showToast('Abre primero un evento propio desde el hub.'); return; }
  const nombre = document.getElementById('insNombre').value.trim();
  const fecha = document.getElementById('insFecha').value;
  if (!nombre || !fecha){ showToast('Indica al menos nombre y fecha de inscripción.'); return; }

  const inscritos = getLS(LS.inscritos);
  inscritos.push({
    id: uid(), evento, nombre,
    email: document.getElementById('insEmail').value.trim(),
    telefono: document.getElementById('insTelefono').value.trim(),
    cargo: document.getElementById('insCargo').value.trim(),
    empresa: document.getElementById('insEmpresa').value.trim(),
    sector: document.getElementById('insSector').value,
    estInscripcion: document.getElementById('insEstado').value || 'registrado',
    estAsistencia: 'pendiente',
    comida: document.getElementById('insComida').checked,
    visita: document.getElementById('insVisita').checked,
    fecha
  });
  setLS(LS.inscritos, inscritos);

  ['insNombre','insEmail','insTelefono','insCargo','insEmpresa','insFecha'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('insSector').value = '';
  document.getElementById('insComida').checked = false;
  document.getElementById('insVisita').checked = false;
  renderInscritos();
  updateDashboardStats();
  showToast('Inscrito añadido.');
}

let editarInscritoId = null;
function abrirModalEditarInscrito(id){
  const i = getLS(LS.inscritos).find(x=>x.id===id);
  if (!i) return;
  editarInscritoId = id;
  poblarSelectSectorInscrito();
  document.getElementById('eiNombre').value = i.nombre||'';
  document.getElementById('eiEmail').value = i.email||'';
  document.getElementById('eiTelefono').value = i.telefono||'';
  document.getElementById('eiCargo').value = i.cargo||'';
  document.getElementById('eiEmpresa').value = i.empresa||'';
  document.getElementById('eiSector').value = i.sector||'';
  document.getElementById('editarInscritoModal').classList.add('active');
}
function guardarEdicionInscrito(){
  if (!editarInscritoId) return;
  const nombre = document.getElementById('eiNombre').value.trim();
  if (!nombre){ showToast('Indica el nombre.'); return; }
  const inscritos = getLS(LS.inscritos);
  const idx = inscritos.findIndex(x=>x.id===editarInscritoId);
  if (idx>-1){
    inscritos[idx] = {
      ...inscritos[idx],
      nombre,
      email: document.getElementById('eiEmail').value.trim(),
      telefono: document.getElementById('eiTelefono').value.trim(),
      cargo: document.getElementById('eiCargo').value.trim(),
      empresa: document.getElementById('eiEmpresa').value.trim(),
      sector: document.getElementById('eiSector').value
    };
    setLS(LS.inscritos, inscritos);
  }
  document.getElementById('editarInscritoModal').classList.remove('active');
  renderInscritos();
  if (document.getElementById('propios-acreditaciones')) renderAcreditaciones();
  showToast('Inscrito actualizado.');
}

function eliminarInscrito(id){
  const i = getLS(LS.inscritos).find(x=>x.id===id);
  if (!i) return;
  if (!confirm(`¿Eliminar a "${i.nombre}" de la lista de inscritos?`)) return;
  setLS(LS.inscritos, getLS(LS.inscritos).filter(x=>x.id!==id));
  renderInscritos();
  updateDashboardStats();
  showToast('Inscrito eliminado.');
}

function actualizarEstadoInscrito(id, campo, valor){
  const inscritos = getLS(LS.inscritos);
  const i = inscritos.find(x=>x.id===id);
  if (!i) return;
  i[campo] = valor;
  setLS(LS.inscritos, inscritos);
  renderInscritos();
}

function renderInscritos(){
  const evento = eventoDetalleActual;
  const todos = evento ? getLS(LS.inscritos).filter(i=>i.evento===evento) : [];
  const kpiWrap = document.getElementById('inscritosKpis');
  const aforoWrap = document.getElementById('aforoWrap');

  if (kpiWrap){
    if (!evento){
      kpiWrap.innerHTML = '';
    } else {
      const s = statsInscritosEvento(evento);
      kpiWrap.innerHTML = `
        <div class="ev-kpi-grid" style="grid-template-columns:repeat(7,1fr);">
          <div class="panel panel-accent"><div class="stat-block"><div class="stat-num">${s.total}</div><div class="stat-label">Total inscritos</div></div></div>
          <div class="panel panel-accent"><div class="stat-block"><div class="stat-num">${s.confirmados}</div><div class="stat-label">Confirmados</div></div></div>
          <div class="panel panel-accent"><div class="stat-block"><div class="stat-num">${s.cancelados}</div><div class="stat-label">Cancelados</div></div></div>
          <div class="panel panel-accent"><div class="stat-block"><div class="stat-num">${s.asistentes}</div><div class="stat-label">Asistentes</div></div></div>
          <div class="panel panel-accent"><div class="stat-block"><div class="stat-num">${s.noAsistentes}</div><div class="stat-label">No asistentes</div></div></div>
          <div class="panel panel-accent"><div class="stat-block"><div class="stat-num">${s.pendientesAsist}</div><div class="stat-label">Pendientes de asistencia</div></div></div>
          <div class="panel panel-accent"><div class="stat-block"><div class="stat-num">${(s.asistentes+s.noAsistentes)?Math.round(s.asistentes/(s.asistentes+s.noAsistentes)*100)+' %':'—'}</div><div class="stat-label">% de asistencia</div></div></div>
        </div>`;
    }
  }

  if (aforoWrap){
    if (!evento){
      aforoWrap.innerHTML = '<p class="muted small">Abre un evento propio desde el hub.</p>';
    } else {
      const plan = getPlanificacion(evento);
      const s = statsInscritosEvento(evento);
      const aforo = Number(plan.aforo)||0;
      if (!aforo){
        aforoWrap.innerHTML = `
          <div class="small muted">Este evento no tiene aforo máximo definido.</div>
          <div class="aforo-num" style="margin-top:8px;">${s.activos} inscritos activos</div>`;
      } else {
        const ocupacion = Math.min(100, Math.round(s.activos/aforo*100));
        const plazas = aforo - s.activos;
        const completo = plazas <= 0;
        aforoWrap.innerHTML = `
          <div class="flex-between" style="margin-bottom:8px;">
            <div class="aforo-num" style="${completo?'color:var(--orange-500);':''}">${s.activos} / ${aforo} <span style="font-size:13px;font-weight:600;color:var(--ink-500);">inscritos activos</span></div>
            <strong style="font-size:15px;color:${completo?'var(--orange-500)':'var(--teal-700)'};">${ocupacion} % de ocupación</strong>
          </div>
          <div class="progress-bar" style="height:10px;margin:8px 0;"><div class="progress-bar-fill" style="width:${ocupacion}%;background:${completo?'var(--orange-500)':(ocupacion>=70?'var(--teal-500)':'#e6b23c')};"></div></div>
          <div class="small" style="${completo?'color:var(--orange-500);font-weight:600;':'color:var(--ink-500);'}">
            ${completo ? 'Aforo completo: se ha alcanzado o superado el aforo máximo.' : `${plazas} plaza${plazas===1?'':'s'} disponibles`}
            ${plan.objetivoAsistentes ? ` · objetivo: ${esc(plan.objetivoAsistentes)} asistentes` : ''}
          </div>`;
      }
    }
  }

  const tbody = document.querySelector('#tablaInscritos tbody');
  if (tbody){
    if (!evento){
      tbody.innerHTML = '<tr class="empty-row"><td colspan="10">Abre un evento propio desde el hub.</td></tr>';
    } else if (!todos.length){
      tbody.innerHTML = '<tr class="empty-row"><td colspan="10">Todavía no hay inscritos para este evento.</td></tr>';
    } else {
      tbody.innerHTML = todos.slice().sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(i=>`
        <tr style="${i.estInscripcion==='cancelado'?'opacity:0.5;':''}">
          <td>${esc(i.nombre)}</td>
          <td>${esc(i.email)||'—'}</td>
          <td>${esc(i.telefono)||'—'}</td>
          <td>${esc(i.empresa)||'—'}</td>
          <td>
            <select onchange="actualizarEstadoInscrito('${i.id}','estInscripcion',this.value)" style="padding:4px 6px;font-size:11.5px;">
              ${Object.keys(EST_INSC_LABEL).map(k=>`<option value="${k}" ${i.estInscripcion===k?'selected':''}>${EST_INSC_LABEL[k]}</option>`).join('')}
            </select>
          </td>
          <td>
            <select onchange="actualizarEstadoInscrito('${i.id}','estAsistencia',this.value)" style="padding:4px 6px;font-size:11.5px;">
              ${Object.keys(EST_ASIS_LABEL).map(k=>`<option value="${k}" ${i.estAsistencia===k?'selected':''}>${EST_ASIS_LABEL[k]}</option>`).join('')}
            </select>
          </td>
          <td style="text-align:center;"><input type="checkbox" style="width:auto;accent-color:var(--teal-500);" ${i.comida?'checked':''} onchange="actualizarEstadoInscrito('${i.id}','comida',this.checked)"></td>
          <td style="text-align:center;"><input type="checkbox" style="width:auto;accent-color:var(--teal-500);" ${i.visita?'checked':''} onchange="actualizarEstadoInscrito('${i.id}','visita',this.checked)"></td>
          <td>${fmtFecha(i.fecha)}</td>
          <td style="white-space:nowrap;">
            <span class="btn-ghost" onclick="abrirModalEditarInscrito('${i.id}')" title="Editar"><i class="fa-solid fa-pen"></i></span>
            <span class="btn-ghost" onclick="eliminarInscrito('${i.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></span>
          </td>
        </tr>`).join('');
    }
  }

  const porFecha = {};
  todos.forEach(i=>{ porFecha[i.fecha] = (porFecha[i.fecha]||0)+1; });
  const fechas = Object.keys(porFecha).sort();
  let acumulado = 0;
  const acumulados = fechas.map(f=>{ acumulado += porFecha[f]; return acumulado; });
  const ctx = document.getElementById('chartInscritos');
  if (ctx){
    if (chartInscritosRef) chartInscritosRef.destroy();
    chartInscritosRef = new Chart(ctx, {
      type:'line',
      data:{ labels: fechas.map(fmtFecha), datasets:[{ label:'Inscritos acumulados', data: acumulados, borderColor:'#1bb8a6', backgroundColor:'rgba(27,184,166,0.12)', fill:true, tension:0.25, pointRadius:3 }] },
      options:{ responsive:true, plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true, ticks:{ precision:0 } } } }
    });
  }
}

/* ---------- Importación CSV de inscritos ---------- */
function normalizarHeader(h){
  return String(h||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}

function parseFechaCSV(val){
  const v = String(val||'').trim();
  if (!v) return hoyLocal();
  const m = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m){
    const anio = m[3].length===2 ? '20'+m[3] : m[3];
    return `${anio}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  return hoyLocal();
}

document.getElementById('insImportFile').addEventListener('change', function(){
  const file = this.files[0];
  this.value = '';
  if (!file || !eventoDetalleActual) return;
  const reader = new FileReader();
  reader.onload = e=>{
    try{
      const texto = String(e.target.result||'');
      const lineas = texto.split(/\r?\n/).filter(l=>l.trim());
      if (!lineas.length){ showToast('El archivo CSV está vacío.'); return; }
      const separador = lineas[0].includes(';') ? ';' : ',';
      const headers = lineas[0].split(separador).map(h=>normalizarHeader(h.replace(/^"|"$/g,'')));
      const mapa = {
        nombre: headers.findIndex(h=>/nombre|name|apellidos/.test(h)),
        email: headers.findIndex(h=>/email|correo|mail/.test(h)),
        cargo: headers.findIndex(h=>/cargo|puesto/.test(h)),
        empresa: headers.findIndex(h=>/empresa|organizacion|compania|company/.test(h)),
        sector: headers.findIndex(h=>/sector|industria/.test(h)),
        fecha: headers.findIndex(h=>/fecha|inscripcion|date/.test(h))
      };
      if (mapa.nombre < 0){ showToast('No se ha encontrado la columna "nombre" en el CSV.'); return; }
      const existentes = getLS(LS.inscritos).filter(i=>i.evento===eventoDetalleActual);
      const emailsExistentes = new Set(existentes.map(i=>(i.email||'').toLowerCase()));
      const filas = [];
      for (let i=1; i<lineas.length; i++){
        const celdas = lineas[i].split(separador).map(c=>c.replace(/^"|"$/g,'').trim());
        const nombre = mapa.nombre>=0 ? celdas[mapa.nombre] : '';
        if (!nombre) continue;
        const email = mapa.email>=0 ? (celdas[mapa.email]||'') : '';
        filas.push({
          nombre, email,
          cargo: mapa.cargo>=0 ? (celdas[mapa.cargo]||'') : '',
          empresa: mapa.empresa>=0 ? (celdas[mapa.empresa]||'') : '',
          sector: mapa.sector>=0 ? (celdas[mapa.sector]||'') : '',
          fecha: parseFechaCSV(mapa.fecha>=0 ? celdas[mapa.fecha] : '')
        });
      }
      const nuevos = filas.filter(f=>!f.email || !emailsExistentes.has(f.email.toLowerCase()));
      const duplicados = filas.length - nuevos.length;
      if (!filas.length){ showToast('No se han encontrado registros válidos en el CSV.'); return; }
      importPendiente = { filas: nuevos };
      renderImportPreview(filas.length, nuevos.length, duplicados);
    }catch(err){
      showToast('No se ha podido leer el CSV.');
    }
  };
  reader.readAsText(file);
});

function renderImportPreview(total, nuevos, duplicados){
  const wrap = document.getElementById('importPreviewWrap');
  if (!wrap) return;
  wrap.innerHTML = `
    <div class="panel" style="border-color:var(--teal-500);">
      <div class="panel-title">Previsualización de la importación</div>
      <div class="panel-subtitle">Revisa los datos antes de confirmar. Nada se guarda hasta que pulses "Confirmar importación".</div>
      <div class="grid-3" style="margin-bottom:14px;">
        <div class="stat-block"><div class="stat-num" style="font-size:22px;">${total}</div><div class="stat-label">Registros detectados</div></div>
        <div class="stat-block"><div class="stat-num" style="font-size:22px;color:var(--teal-700);">${nuevos}</div><div class="stat-label">Nuevos (se importarán)</div></div>
        <div class="stat-block"><div class="stat-num" style="font-size:22px;color:var(--ink-300);">${duplicados}</div><div class="stat-label">Duplicados (omitidos)</div></div>
      </div>
      <div class="table-wrap" style="max-height:260px;overflow-y:auto;">
        <table>
          <thead><tr><th>Nombre</th><th>Email</th><th>Cargo</th><th>Empresa</th><th>Sector</th><th>Fecha</th></tr></thead>
          <tbody>
            ${importPendiente.filas.slice(0,50).map(f=>`<tr><td>${esc(f.nombre)}</td><td>${esc(f.email)||'—'}</td><td>${esc(f.cargo)||'—'}</td><td>${esc(f.empresa)||'—'}</td><td>${esc(f.sector)||'—'}</td><td>${fmtFecha(f.fecha)}</td></tr>`).join('')}
            ${importPendiente.filas.length>50?`<tr class="empty-row"><td colspan="6">… y ${importPendiente.filas.length-50} registros más.</td></tr>`:''}
          </tbody>
        </table>
      </div>
      <div class="btn-row" style="margin-top:14px;">
        <button class="btn" onclick="confirmarImportacionInscritos()"><i class="fa-solid fa-check"></i> Confirmar importación (${nuevos})</button>
        <button class="btn btn-secondary" onclick="cancelarImportacionInscritos()">Cancelar</button>
      </div>
    </div>`;
  wrap.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function confirmarImportacionInscritos(){
  const evento = eventoDetalleActual;
  if (!evento || !importPendiente) return;
  const inscritos = getLS(LS.inscritos);
  importPendiente.filas.forEach(f=>{
    inscritos.push({ id: uid(), evento, nombre:f.nombre, email:f.email, cargo:f.cargo, empresa:f.empresa, sector:f.sector, estInscripcion:'registrado', estAsistencia:'pendiente', fecha:f.fecha });
  });
  setLS(LS.inscritos, inscritos);
  const n = importPendiente.filas.length;
  cancelarImportacionInscritos();
  renderInscritos();
  updateDashboardStats();
  showToast(`${n} inscrito${n===1?'':'s'} importado${n===1?'':'s'}.`);
}

function cancelarImportacionInscritos(){
  importPendiente = null;
  const wrap = document.getElementById('importPreviewWrap');
  if (wrap) wrap.innerHTML = '';
}
/* =======================================================================
   PROGRAMA Y PONENTES
   ======================================================================= */
let programaEditId = null;
let ponenteEditId = null;
let poFotoData = null;

document.getElementById('poFoto').addEventListener('change', function(){
  if (!this.files[0]) return;
  resizeImage(this.files[0], 120, 0.7, dataUrl=>{
    poFotoData = dataUrl;
    document.getElementById('poFotoPreview').innerHTML = `<img src="${dataUrl}">`;
  });
});

function renderPrograma(){
  const ev = eventoDetalleActual;
  const wrapP = document.getElementById('programaLista');
  const wrapPo = document.getElementById('ponentesLista');
  if (!wrapP || !wrapPo) return;
  if (!ev){
    wrapP.innerHTML = '<p class="muted small">Abre un evento propio desde el hub.</p>';
    wrapPo.innerHTML = '';
    return;
  }
  const ponentes = getEvLista(LS_EV_PONENTES, ev);
  const bloques = getEvLista(LS_EV_PROGRAMA, ev).slice().sort((a,b)=>(a.orden||0)-(b.orden||0) || String(a.horaInicio||'').localeCompare(String(b.horaInicio||'')));
  if (!bloques.length){
    wrapP.innerHTML = '<p class="muted small">Todavía no hay bloques en la agenda. Añade el primero.</p>';
  } else {
    wrapP.innerHTML = bloques.map(b=>{
      const idsPonentes = Array.isArray(b.ponenteIds) ? b.ponenteIds : (b.ponenteId ? [b.ponenteId] : []);
      const datosPonentes = idsPonentes.map(id=>ponentes.find(x=>x.id===id)).filter(Boolean)
        .sort((a,c)=> (b.moderadorId===c.id?1:0) - (b.moderadorId===a.id?1:0));
      return `
      <div class="agenda-item">
        <div class="agenda-body">
          <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;">
            <span class="agenda-hora-inline">${esc(b.horaInicio||'—')}${b.horaFin?'–'+esc(b.horaFin):''}</span>
            <span style="font-size:12.5px;font-weight:600;color:var(--ink-900);">${esc(b.titulo)}</span>
            <span class="tag tag-teal">${esc(b.tipo||'Otro')}</span>
          </div>
          ${datosPonentes.length?`<div style="margin-top:4px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;font-size:11.5px;color:var(--ink-500);">${datosPonentes.map(p=>{
            const cargoEmpresa = [p.cargo, p.empresa].filter(Boolean).join(', ');
            const esModerador = b.moderadorId && p.id===b.moderadorId;
            return `<span><i class="fa-solid fa-user"></i> <strong style="color:var(--ink-700);">${esc(p.nombre)}</strong>${cargoEmpresa?' — '+esc(cargoEmpresa):''}${esModerador?' <span class="tag tag-orange" style="margin-left:2px;">Moderador/a</span>':''}</span>`;
          }).join('')}</div>`:''}
          ${b.notas?`<div class="cmeta" style="margin-top:3px;">${esc(b.notas)}</div>`:''}
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0;">
          <span class="btn-ghost" onclick="abrirModalPrograma('${b.id}')" title="Editar"><i class="fa-solid fa-pen"></i></span>
        </div>
      </div>`;
    }).join('');
  }

  if (!ponentes.length){
    wrapPo.innerHTML = '<p class="muted small">Todavía no hay ponentes registrados.</p>';
  } else {
    wrapPo.innerHTML = ponentes.map(p=>`
      <div class="ponente-card">
        ${p.foto ? `<img class="ponente-foto" src="${p.foto}">` : `<div class="ponente-foto" style="display:flex;align-items:center;justify-content:center;background:var(--teal-100);color:var(--teal-700);font-weight:700;font-size:12px;">${esc(initials(p.nombre))}</div>`}
        <div style="flex:1;min-width:0;">
          <div style="font-size:12.5px;font-weight:600;color:var(--ink-900);">${esc(p.nombre)} <span class="tag ${p.estado==='confirmado'?'tag-teal':'tag-orange'}" style="margin-left:4px;">${p.estado==='confirmado'?'Confirmado':'Pendiente'}</span></div>
          <div class="cmeta" style="margin-top:2px;">${[p.cargo,p.empresa].filter(Boolean).map(esc).join(' · ')||'—'}</div>
          ${(p.email||p.telefono)?`<div class="cmeta" style="margin-top:2px;">${[p.email,p.telefono].filter(Boolean).map(esc).join(' · ')}</div>`:''}
        </div>
        <div style="display:flex;gap:2px;flex-shrink:0;">
          <span class="btn-ghost" onclick="abrirModalPonente('${p.id}')" title="Editar"><i class="fa-solid fa-pen"></i></span>
          <span class="btn-ghost" onclick="eliminarPonente('${p.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></span>
        </div>
      </div>`).join('');
  }
}

function switchProgramaSub(sub){
  const cont = document.getElementById('propios-programa');
  if (!cont) return;
  cont.querySelectorAll('.subtab-btn').forEach(b=>b.classList.toggle('active', b.dataset.subtab===sub));
  cont.querySelectorAll('.subtab-pane').forEach(p=>p.classList.toggle('active', p.id === 'programa-sub-'+sub));
}

function actualizarVisibilidadModerador(){
  const esMesaRedonda = document.getElementById('pgTipo').value === 'Mesa redonda';
  const wrap = document.getElementById('pgModeradorWrap');
  const sel = document.getElementById('pgModerador');
  const prev = sel.value;
  wrap.style.display = esMesaRedonda ? '' : 'none';
  if (!esMesaRedonda) return;
  const ev = eventoDetalleActual;
  const ponentes = ev ? getEvLista(LS_EV_PONENTES, ev) : [];
  const idsSeleccionados = [...document.querySelectorAll('#pgPonentes input[type="checkbox"]:checked')].map(el=>el.value);
  const seleccionados = idsSeleccionados.map(id=>ponentes.find(p=>p.id===id)).filter(Boolean);
  sel.innerHTML = '<option value="">Sin moderador</option>' + seleccionados.map(p=>`<option value="${p.id}">${esc(p.nombre)}</option>`).join('');
  sel.value = seleccionados.some(p=>p.id===prev) ? prev : '';
}

function abrirModalPrograma(id){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento propio desde el hub.'); return; }
  programaEditId = id || null;
  const b = id ? getEvLista(LS_EV_PROGRAMA, ev).find(x=>x.id===id) : null;
  const ponentes = getEvLista(LS_EV_PONENTES, ev);
  document.getElementById('programaModalTitulo').textContent = b ? 'Editar bloque' : 'Añadir bloque';
  document.getElementById('pgHoraInicio').value = b ? (b.horaInicio||'') : '';
  document.getElementById('pgHoraFin').value = b ? (b.horaFin||'') : '';
  document.getElementById('pgTitulo').value = b ? (b.titulo||'') : '';
  document.getElementById('pgTipo').value = b ? (b.tipo||'Ponencia') : 'Registro';
  const idsSeleccionados = b ? (Array.isArray(b.ponenteIds) ? b.ponenteIds : (b.ponenteId ? [b.ponenteId] : [])) : [];
  document.getElementById('pgPonentes').innerHTML = ponentes.length
    ? ponentes.map(p=>`<label><input type="checkbox" value="${p.id}" ${idsSeleccionados.includes(p.id)?'checked':''}> ${esc(p.nombre)}</label>`).join('')
    : '<div class="muted small">Todavía no hay ponentes registrados. Añade alguno primero.</div>';
  document.getElementById('pgSala').value = b ? (b.sala||'') : '';
  document.getElementById('pgOrden').value = b ? (b.orden||'') : (getEvLista(LS_EV_PROGRAMA, ev).length + 1);
  document.getElementById('pgNotas').value = b ? (b.notas||'') : '';
  document.getElementById('pgDeleteBtn').style.display = b ? 'inline-flex' : 'none';
  actualizarVisibilidadModerador();
  if (b && b.moderadorId) document.getElementById('pgModerador').value = b.moderadorId;
  document.getElementById('programaModal').classList.add('active');
}

function cerrarModalPrograma(){
  document.getElementById('programaModal').classList.remove('active');
  programaEditId = null;
}

function guardarPrograma(){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento.'); return; }
  const titulo = document.getElementById('pgTitulo').value.trim();
  if (!titulo){ showToast('Indica el título del bloque.'); return; }
  const lista = getEvLista(LS_EV_PROGRAMA, ev);
  const tipo = document.getElementById('pgTipo').value;
  const data = {
    horaInicio: document.getElementById('pgHoraInicio').value,
    horaFin: document.getElementById('pgHoraFin').value,
    titulo,
    tipo,
    ponenteIds: [...document.querySelectorAll('#pgPonentes input[type="checkbox"]:checked')].map(el=>el.value),
    moderadorId: tipo==='Mesa redonda' ? document.getElementById('pgModerador').value : '',
    sala: document.getElementById('pgSala').value.trim(),
    orden: Number(document.getElementById('pgOrden').value)||lista.length+1,
    notas: document.getElementById('pgNotas').value.trim()
  };
  if (programaEditId){
    const idx = lista.findIndex(x=>x.id===programaEditId);
    if (idx>-1) lista[idx] = { ...lista[idx], ...data };
  } else {
    lista.push({ id: uid(), ...data });
  }
  setEvLista(LS_EV_PROGRAMA, ev, lista);
  cerrarModalPrograma();
  renderPrograma();
  showToast('Bloque de programa guardado.');
}

function eliminarPrograma(){
  const ev = eventoDetalleActual;
  if (!ev || !programaEditId) return;
  if (!confirm('¿Eliminar este bloque de la agenda?')) return;
  setEvLista(LS_EV_PROGRAMA, ev, getEvLista(LS_EV_PROGRAMA, ev).filter(x=>x.id!==programaEditId));
  cerrarModalPrograma();
  renderPrograma();
  showToast('Bloque eliminado.');
}

function abrirModalPonente(id){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento propio desde el hub.'); return; }
  ponenteEditId = id || null;
  const p = id ? getEvLista(LS_EV_PONENTES, ev).find(x=>x.id===id) : null;
  document.getElementById('ponenteModalTitulo').textContent = p ? 'Editar ponente' : 'Añadir ponente';
  document.getElementById('poNombre').value = p ? (p.nombre||'') : '';
  document.getElementById('poEmpresa').value = p ? (p.empresa||'') : '';
  document.getElementById('poCargo').value = p ? (p.cargo||'') : '';
  document.getElementById('poEmail').value = p ? (p.email||'') : '';
  document.getElementById('poTelefono').value = p ? (p.telefono||'') : '';
  document.getElementById('poBio').value = p ? (p.bio||'') : '';
  document.getElementById('poEstado').value = p ? (p.estado||'pendiente') : 'pendiente';
  poFotoData = p ? (p.foto||null) : null;
  document.getElementById('poFotoPreview').innerHTML = poFotoData ? `<img src="${poFotoData}">` : '';
  document.getElementById('poDeleteBtn').style.display = p ? 'inline-flex' : 'none';
  document.getElementById('ponenteModal').classList.add('active');
}

function cerrarModalPonente(){
  document.getElementById('ponenteModal').classList.remove('active');
  ponenteEditId = null;
}

function guardarPonente(){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento.'); return; }
  const nombre = document.getElementById('poNombre').value.trim();
  if (!nombre){ showToast('Indica el nombre del ponente.'); return; }
  const lista = getEvLista(LS_EV_PONENTES, ev);
  const data = {
    nombre,
    empresa: document.getElementById('poEmpresa').value.trim(),
    cargo: document.getElementById('poCargo').value.trim(),
    email: document.getElementById('poEmail').value.trim(),
    telefono: document.getElementById('poTelefono').value.trim(),
    bio: document.getElementById('poBio').value.trim(),
    estado: document.getElementById('poEstado').value,
    foto: poFotoData
  };
  if (ponenteEditId){
    const idx = lista.findIndex(x=>x.id===ponenteEditId);
    if (idx>-1) lista[idx] = { ...lista[idx], ...data };
  } else {
    lista.push({ id: uid(), ...data });
  }
  setEvLista(LS_EV_PONENTES, ev, lista);
  cerrarModalPonente();
  renderPrograma();
  showToast('Ponente guardado.');
}

function eliminarPonente(id){
  const ev = eventoDetalleActual;
  if (!ev) return;
  const p = getEvLista(LS_EV_PONENTES, ev).find(x=>x.id===id);
  if (!confirm(`¿Eliminar a "${p?p.nombre:''}" de los ponentes?`)) return;
  setEvLista(LS_EV_PONENTES, ev, getEvLista(LS_EV_PONENTES, ev).filter(x=>x.id!==id));
  renderPrograma();
  showToast('Ponente eliminado.');
}

/* =======================================================================
   COMUNICACIÓN DEL EVENTO
   ======================================================================= */
let calComDate = new Date();
let calComEditId = null;
let planGenPendiente = null;

function cambiarMesComunicacion(delta){
  calComDate.setMonth(calComDate.getMonth()+delta);
  renderCalendarioComunicacion();
}

function getComunicacionEvento(evento){
  return getLS(LS.comunicacionEventos).filter(c=>c.evento===evento);
}

function renderCalendarioComunicacion(){
  const grid = document.getElementById('calComGrid');
  const tbody = document.querySelector('#tablaComunicacionEvento tbody');
  if (!grid || !tbody) return;
  const evento = eventoDetalleActual;
  const mesLabel = document.getElementById('calComMesLabel');
  if (mesLabel) mesLabel.textContent = `${MESES_CAP[calComDate.getMonth()]} ${calComDate.getFullYear()}`;

  if (!evento){
    grid.innerHTML = '';
    tbody.innerHTML = '<tr class="empty-row"><td colspan="8">Abre un evento propio desde el hub para planificar su comunicación.</td></tr>';
    return;
  }

  const year = calComDate.getFullYear(), month = calComDate.getMonth();
  const firstDay = new Date(year, month, 1);
  let startOffset = firstDay.getDay()-1; if (startOffset<0) startOffset=6;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const entradas = getComunicacionEvento(evento);
  const todayStr = hoyLocal();

  let cells = DOWS.map(d=>`<div class="cal-dow">${d}</div>`).join('');
  for (let i=startOffset; i>0; i--){
    cells += `<div class="cal-day other-month"><div class="dnum">${daysInPrevMonth-i+1}</div></div>`;
  }
  for (let day=1; day<=daysInMonth; day++){
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayEntries = entradas.filter(e=>e.fecha===dateStr);
    const entryHtml = dayEntries.map(e=>{
      const label = `${COM_CAT_LABEL[e.cat]||e.canal||'Acción'}: ${e.titulo}`;
      const color = colorPlataformaCal(e.canal);
      const clase = e.hecho ? 'programada' : '';
      return `<div class="entry ${clase}" style="background:${color.bg};color:${color.fg};" onclick="abrirModalCom('${dateStr}','${e.id}')" title="${esc(e.canal||'')} · ${esc(label)}${e.hecho?' (ya realizada)':''}">${esc(label)}</div>`;
    }).join('');
    cells += `<div class="cal-day" style="${dateStr===todayStr?'box-shadow:inset 0 0 0 2px var(--teal-500);':''}">
      <div class="cal-day-head">
        <div class="dnum">${day}</div>
        <span class="add-btn" onclick="abrirModalCom('${dateStr}')"><i class="fa-solid fa-plus"></i></span>
      </div>
      <div class="cal-day-entries">${entryHtml}</div>
    </div>`;
  }
  const totalCells = startOffset + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i=1; i<=remaining; i++){
    cells += `<div class="cal-day other-month"><div class="dnum">${i}</div></div>`;
  }
  grid.innerHTML = cells;

  if (!entradas.length){
    tbody.innerHTML = '<tr class="empty-row"><td colspan="8">Todavía no hay comunicación planificada. Usa "Generar plan de comunicación" para crear un plan inicial a partir de la fecha del evento.</td></tr>';
    return;
  }
  const ordenadas = entradas.slice().sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  tbody.innerHTML = ordenadas.map(e=>`
    <tr>
      <td>${fmtFecha(e.fecha)}</td>
      <td><span class="tag ${COM_CAT_TAG[e.cat]||'tag-teal'}">${COM_CAT_LABEL[e.cat]||esc(e.cat||'—')}</span></td>
      <td>${esc(e.titulo)}</td>
      <td>${e.canal?`<span class="tag" style="background:${colorPlataformaCal(e.canal).bg};color:${colorPlataformaCal(e.canal).fg};">${esc(e.canal)}</span>`:'—'}</td>
      <td>${esc(e.objetivo)||'—'}</td>
      <td>${esc(e.responsable)||'—'}</td>
      <td>${e.hecho?'<span class="tag tag-teal">Realizada</span>':'<span class="tag tag-orange">Pendiente</span>'}</td>
      <td><span class="btn-ghost" onclick="abrirModalCom('${e.fecha}','${e.id}')"><i class="fa-solid fa-pen"></i></span></td>
    </tr>`).join('');
}

function abrirModalCom(dateStr, entryId){
  if (!eventoDetalleActual){ showToast('Abre primero un evento propio desde el hub.'); return; }
  calComEditId = entryId || null;
  poblarSelectsResponsables();
  document.getElementById('comFecha').value = dateStr;
  const e = entryId ? getLS(LS.comunicacionEventos).find(x=>x.id===entryId) : null;
  document.getElementById('comCat').value = e ? (e.cat||'publicacion') : 'publicacion';
  document.getElementById('comTitulo').value = e ? (e.titulo||'') : '';
  document.getElementById('comCanal').value = e ? (e.canal||'LinkedIn') : 'LinkedIn';
  document.getElementById('comObjetivo').value = e ? (e.objetivo||'') : '';
  document.getElementById('comPublico').value = e ? (e.publico||'') : '';
  document.getElementById('comResponsable').value = e ? (e.responsable||'') : '';
  document.getElementById('comEnlace').value = e ? (e.enlace||'') : '';
  document.getElementById('comNotas').value = e ? (e.notas||'') : '';
  document.getElementById('comHecho').checked = e ? !!e.hecho : false;
  document.getElementById('comDeleteBtn').style.display = e ? 'inline-flex' : 'none';
  document.getElementById('comModal').classList.add('active');
}

function cerrarModalCom(){
  document.getElementById('comModal').classList.remove('active');
}

function guardarComunicacionEvento(){
  const evento = eventoDetalleActual;
  if (!evento){ showToast('Abre primero un evento propio desde el hub.'); return; }
  const fecha = document.getElementById('comFecha').value;
  const titulo = document.getElementById('comTitulo').value.trim();
  if (!fecha || !titulo){ showToast('Indica fecha y contenido.'); return; }
  const cat = document.getElementById('comCat').value;
  const data = {
    evento, fecha, titulo, cat,
    canal: document.getElementById('comCanal').value,
    objetivo: document.getElementById('comObjetivo').value,
    publico: document.getElementById('comPublico').value.trim(),
    responsable: document.getElementById('comResponsable').value,
    enlace: document.getElementById('comEnlace').value.trim(),
    notas: document.getElementById('comNotas').value.trim(),
    hecho: document.getElementById('comHecho').checked
  };
  const entries = getLS(LS.comunicacionEventos);
  if (calComEditId){
    const idx = entries.findIndex(x=>x.id===calComEditId);
    if (idx>-1) entries[idx] = {...entries[idx], ...data};
  } else {
    entries.push({ id: uid(), ...data });
  }
  setLS(LS.comunicacionEventos, entries);
  cerrarModalCom();
  renderCalendarioComunicacion();
  showToast('Planificación guardada.');
}

function borrarComunicacionEvento(){
  if (!calComEditId) return;
  const e = getLS(LS.comunicacionEventos).find(x=>x.id===calComEditId);
  if (!confirm(`¿Eliminar la entrada "${e?e.titulo:''}" de la planificación?`)) return;
  setLS(LS.comunicacionEventos, getLS(LS.comunicacionEventos).filter(x=>x.id!==calComEditId));
  cerrarModalCom();
  renderCalendarioComunicacion();
  showToast('Entrada eliminada.');
}

/* ---------- Generador automático del plan de comunicación ---------- */
const PLAN_COM_OFFSETS = [
  { d:-60, cat:'anuncio',      titulo:'Anuncio inicial del evento' },
  { d:-45, cat:'publicacion',  titulo:'Primera publicación de difusión' },
  { d:-30, cat:'mailing',      titulo:'Mailing de difusión' },
  { d:-21, cat:'publicacion',  titulo:'Presentación de ponentes' },
  { d:-14, cat:'recordatorio', titulo:'Recordatorio de inscripción' },
  { d:-7,  cat:'ultimas_plazas', titulo:'Últimas plazas' },
  { d:-1,  cat:'recordatorio', titulo:'Recordatorio final' },
  { d:0,   cat:'cobertura',    titulo:'Cobertura en directo del evento' },
  { d:1,   cat:'postevento',   titulo:'Email de agradecimiento' },
  { d:3,   cat:'postevento',   titulo:'Resumen del evento' },
  { d:7,   cat:'postevento',   titulo:'Resultados y seguimiento' }
];

function fechaConOffset(fechaISO, dias){
  const d = new Date(fechaISO+'T12:00:00');
  d.setDate(d.getDate()+dias);
  return isoLocal(d);
}

function generarPlanComunicacion(){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento propio desde el hub.'); return; }
  const evento = getEventoPropioPorNombre(ev);
  if (!evento || !evento.fechaInicio){
    showToast('El evento necesita una fecha de inicio para generar el plan. Edita los datos del evento.');
    return;
  }
  const existentes = getComunicacionEvento(ev);
  const yaGenerado = existentes.some(c=>PLAN_COM_OFFSETS.some(p=>p.titulo===c.titulo));
  if (yaGenerado && !confirm('Ya parece existir un plan generado para este evento. ¿Generar de nuevo? (las acciones nuevas se añadirán y no se duplicarán las existentes)')) return;
  const sugeridas = PLAN_COM_OFFSETS.map(p=>({ fecha: fechaConOffset(evento.fechaInicio, p.d), cat: p.cat, titulo: p.titulo }));
  const filtradas = sugeridas.filter(s=>!existentes.some(c=>c.titulo===s.titulo && c.fecha===s.fecha));
  if (!filtradas.length){ showToast('Todas las acciones sugeridas ya están en el plan.'); return; }
  planGenPendiente = filtradas;
  renderPlanGenPreview();
}

function renderPlanGenPreview(){
  const wrap = document.getElementById('planGenWrap');
  if (!wrap) return;
  if (!planGenPendiente){ wrap.innerHTML = ''; return; }
  wrap.innerHTML = `
    <div class="panel" style="border-color:var(--teal-500);">
      <div class="panel-title">Plan de comunicación sugerido</div>
      <div class="panel-subtitle">Calculado a partir de la fecha del evento. Edita fechas y títulos antes de guardar.</div>
      ${planGenPendiente.map((p, i)=>`
        <div class="plan-gen-row">
          <input type="date" value="${p.fecha}" onchange="planGenPendiente[${i}].fecha=this.value" style="width:150px;">
          <select onchange="planGenPendiente[${i}].cat=this.value" style="width:150px;">
            ${Object.keys(COM_CAT_LABEL).map(k=>`<option value="${k}" ${p.cat===k?'selected':''}>${COM_CAT_LABEL[k]}</option>`).join('')}
          </select>
          <input type="text" value="${esc(p.titulo)}" onchange="planGenPendiente[${i}].titulo=this.value" style="flex:1;min-width:200px;">
          <span class="btn-ghost" onclick="planGenPendiente.splice(${i},1);renderPlanGenPreview();"><i class="fa-solid fa-xmark"></i></span>
        </div>`).join('')}
      <div class="btn-row" style="margin-top:10px;">
        <button class="btn" onclick="guardarPlanGenerado()"><i class="fa-solid fa-check"></i> Guardar plan (${planGenPendiente.length} acciones)</button>
        <button class="btn btn-secondary" onclick="planGenPendiente=null;renderPlanGenPreview();">Descartar</button>
      </div>
    </div>`;
}

function guardarPlanGenerado(){
  const ev = eventoDetalleActual;
  if (!ev || !planGenPendiente) return;
  const entries = getLS(LS.comunicacionEventos);
  let añadidas = 0;
  planGenPendiente.forEach(p=>{
    if (!p.titulo.trim()) return;
    if (entries.some(c=>c.evento===ev && c.titulo===p.titulo && c.fecha===p.fecha)) return;
    entries.push({
      id: uid(), evento: ev, fecha: p.fecha, titulo: p.titulo.trim(), cat: p.cat,
      canal: p.cat==='mailing' ? 'Mailing' : 'LinkedIn',
      objetivo:'', publico:'', responsable:'', enlace:'', notas:'', hecho:false
    });
    añadidas++;
  });
  setLS(LS.comunicacionEventos, entries);
  planGenPendiente = null;
  renderPlanGenPreview();
  renderCalendarioComunicacion();
  showToast(`${añadidas} acción${añadidas===1?'':'es'} añadida${añadidas===1?'':'s'} al plan.`);
}

/* =======================================================================
   RECURSOS / DOCUMENTACIÓN
   ======================================================================= */
let recursoEditId = null;

function renderRecursos(){
  const ev = eventoDetalleActual;
  const wrap = document.getElementById('recursosLista');
  if (!wrap) return;
  if (!ev){
    wrap.innerHTML = '<div class="panel"><p class="muted">Abre un evento propio desde el hub.</p></div>';
    return;
  }
  const recursos = getEvLista(LS_EV_RECURSOS, ev).slice().sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
  if (!recursos.length){
    wrap.innerHTML = '<div class="panel"><p class="muted">Todavía no hay recursos. Añade enlaces a cartelería, presentaciones, carpetas compartidas, contratos, etc.</p></div>';
    return;
  }
  wrap.innerHTML = recursos.map(r=>`
    <div class="panel" style="margin-bottom:10px;padding:14px 16px;">
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
        <div style="flex:1;min-width:220px;">
          <strong style="font-size:13px;color:var(--ink-900);">${esc(r.nombre)}</strong>
          <span class="tag tag-grey" style="margin-left:6px;">${esc(r.tipo)}</span>
          <span class="tag ${r.estado==='disponible'?'tag-teal':'tag-orange'}" style="margin-left:4px;">${r.estado==='disponible'?'Disponible':'Pendiente'}</span>
        </div>
        <div class="cmeta" style="white-space:nowrap;flex-shrink:0;">${r.fecha?fmtFecha(r.fecha):''}${r.responsable?' · '+esc(r.responsable):''}</div>
        <div class="btn-row" style="margin-top:0;flex-shrink:0;">
          ${r.url ? (esRutaOrdenador(r.url)
            ? `<span class="btn btn-secondary" onclick="copiarRecurso('${r.id}')" title="Copiar ruta"><i class="fa-solid fa-copy"></i></span>`
            : `<a class="btn btn-secondary" href="${esc(r.url.match(/^https?:\/\//i)?r.url:'https://'+r.url)}" target="_blank" rel="noopener" title="Abrir"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
          ) : ''}
          <span class="btn-ghost" onclick="abrirModalRecurso('${r.id}')"><i class="fa-solid fa-pen"></i></span>
          <span class="btn-ghost" onclick="eliminarRecurso('${r.id}')"><i class="fa-solid fa-trash"></i></span>
        </div>
      </div>
      ${r.descripcion?`<p style="font-size:12px;color:var(--ink-500);margin-top:6px;">${esc(r.descripcion)}</p>`:''}
      ${r.notas?`<div class="cmeta" style="margin-top:4px;">${esc(r.notas)}</div>`:''}
    </div>`).join('');
}

function abrirModalRecurso(id){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento propio desde el hub.'); return; }
  recursoEditId = id || null;
  poblarSelectsResponsables();
  const r = id ? getEvLista(LS_EV_RECURSOS, ev).find(x=>x.id===id) : null;
  document.getElementById('recursoModalTitulo').textContent = r ? 'Editar recurso' : 'Añadir recurso';
  document.getElementById('rcNombre').value = r ? (r.nombre||'') : '';
  document.getElementById('rcTipo').value = r ? (r.tipo||'Documentación interna') : 'Documentación interna';
  document.getElementById('rcEstado').value = r ? (r.estado||'pendiente') : 'pendiente';
  document.getElementById('rcDescripcion').value = r ? (r.descripcion||'') : '';
  document.getElementById('rcUrl').value = r ? (r.url||'') : '';
  document.getElementById('rcFecha').value = r ? (r.fecha||'') : '';
  document.getElementById('rcResponsable').value = r ? (r.responsable||'') : '';
  document.getElementById('rcNotas').value = r ? (r.notas||'') : '';
  document.getElementById('rcDeleteBtn').style.display = r ? 'inline-flex' : 'none';
  document.getElementById('recursoModal').classList.add('active');
}

function cerrarModalRecurso(){
  document.getElementById('recursoModal').classList.remove('active');
  recursoEditId = null;
}

function guardarRecurso(){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento.'); return; }
  const nombre = document.getElementById('rcNombre').value.trim();
  if (!nombre){ showToast('Indica el nombre del recurso.'); return; }
  const lista = getEvLista(LS_EV_RECURSOS, ev);
  const data = {
    nombre,
    tipo: document.getElementById('rcTipo').value,
    estado: document.getElementById('rcEstado').value,
    descripcion: document.getElementById('rcDescripcion').value.trim(),
    url: document.getElementById('rcUrl').value.trim(),
    fecha: document.getElementById('rcFecha').value,
    responsable: document.getElementById('rcResponsable').value,
    notas: document.getElementById('rcNotas').value.trim()
  };
  if (recursoEditId){
    const idx = lista.findIndex(x=>x.id===recursoEditId);
    if (idx>-1) lista[idx] = { ...lista[idx], ...data };
  } else {
    lista.push({ id: uid(), ...data });
  }
  setEvLista(LS_EV_RECURSOS, ev, lista);
  cerrarModalRecurso();
  renderRecursos();
  showToast('Recurso guardado.');
}

function copiarRecurso(id){
  const ev = eventoDetalleActual;
  if (!ev) return;
  const r = getEvLista(LS_EV_RECURSOS, ev).find(x=>x.id===id);
  if (!r || !r.url) return;
  navigator.clipboard.writeText(r.url).then(()=> showToast('Ruta copiada al portapapeles.'));
}

function eliminarRecurso(id){
  const ev = eventoDetalleActual;
  if (!ev) return;
  const r = getEvLista(LS_EV_RECURSOS, ev).find(x=>x.id===id);
  if (!confirm(`¿Eliminar el recurso "${r?r.nombre:''}"?`)) return;
  setEvLista(LS_EV_RECURSOS, ev, getEvLista(LS_EV_RECURSOS, ev).filter(x=>x.id!==id));
  renderRecursos();
  showToast('Recurso eliminado.');
}

/* =======================================================================
   ACREDITACIONES — plantilla + QR (vCard) + nombre/empresa, generados
   automáticamente a partir de los inscritos ya existentes del evento.
   Todo se trabaja internamente en milímetros para que la posición sea
   consistente en pantalla, al descargar y al imprimir/exportar a PDF.
   ======================================================================= */

/* "20" / "29.8" tal como se especificaron son valores de referencia estilo
   diseño (px a 96dpi), no milímetros. Se convierten a mm con este factor
   antes de escalarlos al lienzo, igual que las medidas que sí van en mm. */
const ACRED_PX_REF_A_MM = 1/3.7795275591;

function configAcredPorDefecto(){
  return {
    plantilla: null,           // dataURL de la imagen de plantilla
    plantillaNombre: '',
    fuenteDataUrl: null,       // dataURL del archivo de fuente subido (opcional)
    fuenteNombre: '',
    anchoMM: 95,
    altoMM: 220,
    version: 1,                // se incrementa al guardar; sirve para detectar acreditaciones desactualizadas
    qr:      { x:72.68,  y:114.67, w:64.64, h:64.64, radius:20, borde:3 },
    nombre:  { x:13.38,  y:188.14, alto:12.54, tam:29.8, color:'#FFFFFF' },
    empresa: { x:13.38,  y:202.68, alto:12.54, tam:29.8, color:'#00B2B7' }
  };
}
function getConfigAcred(evento){
  const guardado = getEvObj(LS_EV_ACRED)[evento];
  const base = configAcredPorDefecto();
  if (!guardado) return base;
  return {
    ...base, ...guardado,
    qr: { ...base.qr, ...(guardado.qr||{}) },
    nombre: { ...base.nombre, ...(guardado.nombre||{}) },
    empresa: { ...base.empresa, ...(guardado.empresa||{}) }
  };
}
function saveConfigAcred(evento, cfg){
  const o = getEvObj(LS_EV_ACRED);
  o[evento] = cfg;
  dbSetRaw(LS_EV_ACRED, JSON.stringify(o));
}

/* --- vCard --- */
function escaparVCard(v){
  return String(v==null?'':v).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
}
/* Recorta un campo a una longitud razonable: evita QR con demasiada
   densidad de datos (difíciles de escanear, o directamente rechazados
   por la librería si el texto es muy largo). */
function recortarCampoVCard(v, maxLen){
  const s = String(v||'').trim();
  return s.length > maxLen ? s.slice(0, maxLen-1)+'…' : s;
}
function construirVCardInscrito(i){
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escaparVCard(recortarCampoVCard(i.nombre, 60))}`,
    i.empresa ? `ORG:${escaparVCard(recortarCampoVCard(i.empresa, 60))}` : null,
    i.cargo ? `TITLE:${escaparVCard(recortarCampoVCard(i.cargo, 60))}` : null,
    i.telefono ? `TEL:${escaparVCard(recortarCampoVCard(i.telefono, 25))}` : null,
    i.email ? `EMAIL:${escaparVCard(recortarCampoVCard(i.email, 60))}` : null,
    i.sector ? `NOTE:${escaparVCard(recortarCampoVCard(i.sector, 40))}` : null,
    'END:VCARD'
  ].filter(Boolean).join('\r\n');
}
/* Versión mínima de emergencia, por si incluso el vCard recortado sigue
   siendo demasiado largo para la librería de QR (nunca debería fallar
   la generación solo por el tamaño del texto). */
function construirVCardMinimo(i){
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escaparVCard(recortarCampoVCard(i.nombre, 40))}`,
    i.telefono ? `TEL:${escaparVCard(recortarCampoVCard(i.telefono, 25))}` : null,
    i.email ? `EMAIL:${escaparVCard(recortarCampoVCard(i.email, 40))}` : null,
    'END:VCARD'
  ].filter(Boolean).join('\r\n');
}

/* --- Detección de datos/config desactualizados (secciones 13 y 14) --- */
function hashDatosAcredInscrito(i){
  return JSON.stringify([i.nombre,i.email,i.telefono,i.cargo,i.empresa,i.sector]);
}
function estadoAcredInscrito(i, cfg){
  if (i.acredError) return 'error';
  if (!i.acredImagen) return 'pendiente';
  if (i.acredHash !== hashDatosAcredInscrito(i)) return 'desactualizada';
  if (i.acredConfigVersion !== cfg.version) return 'desactualizada';
  return 'generada';
}

/* --- Utilidades de imagen / lienzo --- */
/* qrcodejs (davidshimjs) dibuja el QR dentro de un contenedor del DOM
   (usa <canvas> si el navegador lo soporta), en vez de devolver
   directamente una imagen. Esta función lo envuelve en una Promise que
   sí devuelve un dataURL, para poder usarlo igual que cualquier otra
   fuente de imagen al componer la acreditación. */
function generarQRDataURL(texto, tamanoPx){
  return new Promise((resolve, reject)=>{
    try{
      const contenedor = document.createElement('div');
      contenedor.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
      document.body.appendChild(contenedor);
      new QRCode(contenedor, {
        text: texto,
        width: tamanoPx,
        height: tamanoPx,
        correctLevel: QRCode.CorrectLevel.L
      });
      setTimeout(()=>{
        const canvas = contenedor.querySelector('canvas');
        const img = contenedor.querySelector('img');
        const dataUrl = canvas ? canvas.toDataURL('image/png') : (img ? img.src : null);
        document.body.removeChild(contenedor);
        if (dataUrl) resolve(dataUrl); else reject(new Error('No se pudo generar el código QR.'));
      }, 60);
    }catch(e){ reject(e); }
  });
}

function cargarImagen(src){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    img.onload = ()=>resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
function leerArchivoComoDataURL(file){
  return new Promise((resolve, reject)=>{
    const r = new FileReader();
    r.onload = ()=>resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function dibujarRectRedondeado(ctx, x, y, w, h, r){
  const radio = Math.max(0, Math.min(r, w/2, h/2));
  ctx.beginPath();
  ctx.moveTo(x+radio, y);
  ctx.arcTo(x+w, y, x+w, y+h, radio);
  ctx.arcTo(x+w, y+h, x, y+h, radio);
  ctx.arcTo(x, y+h, x, y, radio);
  ctx.arcTo(x, y, x+w, y, radio);
  ctx.closePath();
}
function nombreFuenteAcred(cfg){ return cfg.fuenteDataUrl ? 'HK Modular' : 'Arial, Helvetica, sans-serif'; }
let _fuenteAcredCargada = null;
async function asegurarFuenteAcredCargada(cfg){
  if (!cfg.fuenteDataUrl){ return; }
  if (_fuenteAcredCargada === cfg.fuenteDataUrl) return;
  try{
    const fuente = new FontFace('HK Modular', `url(${cfg.fuenteDataUrl})`);
    await fuente.load();
    document.fonts.add(fuente);
    _fuenteAcredCargada = cfg.fuenteDataUrl;
  }catch(e){
    console.error('No se pudo cargar la tipografía HK Modular, se usará una de reemplazo.', e);
  }
}

/* Dibuja un texto centrado horizontalmente dentro de la caja definida por
   campoCfg, reduciendo el tamaño de letra automáticamente si no cabe, sin
   tocar nunca su posición Y ni su tamaño de caja. */
function dibujarTextoCentradoAcred(ctx, texto, campoCfg, anchoTotalMM, pxPerMM, fuenteFamily){
  const margenMM = campoCfg.x;
  const cajaAnchoPx = Math.max(1, (anchoTotalMM - margenMM*2) * pxPerMM);
  const cajaCentroXpx = margenMM*pxPerMM + cajaAnchoPx/2;
  const cajaCentroYpx = (campoCfg.y + campoCfg.alto/2) * pxPerMM;

  let tamPx = (campoCfg.tam * ACRED_PX_REF_A_MM) * pxPerMM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = campoCfg.color || '#000000';
  ctx.font = `700 ${tamPx}px "${fuenteFamily}"`;
  let ancho = ctx.measureText(texto).width;
  while (ancho > cajaAnchoPx && tamPx > 5){
    tamPx -= 0.5;
    ctx.font = `700 ${tamPx}px "${fuenteFamily}"`;
    ancho = ctx.measureText(texto).width;
  }
  ctx.fillText(texto, cajaCentroXpx, cajaCentroYpx, cajaAnchoPx);
}

/* Genera la acreditación completa de un inscrito y devuelve un dataURL PNG. */
async function generarImagenAcreditacion(inscrito, cfg, plantillaImg){
  await asegurarFuenteAcredCargada(cfg);
  const fuenteFamily = nombreFuenteAcred(cfg);

  // Limita la resolución de trabajo a un tamaño de calidad de impresión
  // (~300dpi para el ancho configurado) sin depender de que la imagen
  // subida sea enorme, para no disparar el tamaño de los datos guardados.
  const pxPerMMobjetivo = Math.min(
    plantillaImg.naturalWidth / cfg.anchoMM,
    300/25.4
  );
  const canvasW = Math.round(cfg.anchoMM * pxPerMMobjetivo);
  const canvasH = Math.round(cfg.altoMM * pxPerMMobjetivo);
  const pxPerMM = canvasW / cfg.anchoMM;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(plantillaImg, 0, 0, canvasW, canvasH);

  const vcard = construirVCardInscrito(inscrito);
  const qrWpx = Math.max(32, Math.round(cfg.qr.w * pxPerMM));
  let qrDataUrl;
  try{
    qrDataUrl = await generarQRDataURL(vcard, qrWpx);
  }catch(e){
    console.error('El QR con todos los datos no cupo, se reintenta con una vCard más corta:', e);
    qrDataUrl = await generarQRDataURL(construirVCardMinimo(inscrito), qrWpx);
  }
  const qrImg = await cargarImagen(qrDataUrl);
  const qx = cfg.qr.x*pxPerMM, qy = cfg.qr.y*pxPerMM, qw = cfg.qr.w*pxPerMM, qh = cfg.qr.h*pxPerMM;
  const radioPx = (cfg.qr.radius * ACRED_PX_REF_A_MM) * pxPerMM;
  const bordePx = (cfg.qr.borde||0) * pxPerMM;

  if (bordePx > 0){
    // Marco blanco redondeado, algo más grande que el QR, dibujado ANTES
    // para que quede como borde alrededor; el QR va encima, sin recortar
    // sus propias esquinas (así no se pierde ni un módulo del código).
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    dibujarRectRedondeado(ctx, qx-bordePx, qy-bordePx, qw+bordePx*2, qh+bordePx*2, radioPx+bordePx);
    ctx.fill();
    ctx.restore();
    ctx.drawImage(qrImg, qx, qy, qw, qh);
  } else {
    ctx.save();
    dibujarRectRedondeado(ctx, qx, qy, qw, qh, radioPx);
    ctx.clip();
    ctx.drawImage(qrImg, qx, qy, qw, qh);
    ctx.restore();
  }

  dibujarTextoCentradoAcred(ctx, (inscrito.nombre||'').toUpperCase(), cfg.nombre, cfg.anchoMM, pxPerMM, fuenteFamily);
  dibujarTextoCentradoAcred(ctx, (inscrito.empresa||'').toUpperCase(), cfg.empresa, cfg.anchoMM, pxPerMM, fuenteFamily);

  return canvas.toDataURL('image/png');
}

/* --- Generación individual / masiva --- */
async function generarAcreditacionInscritoUI(id){
  const ev = eventoDetalleActual;
  if (!ev) return;
  const inscritos = getLS(LS.inscritos);
  const idx = inscritos.findIndex(x=>x.id===id);
  if (idx<0) return;
  const cfg = getConfigAcred(ev);
  if (!cfg.plantilla){ showToast('Sube antes una plantilla en "Configurar plantilla y posiciones".'); return; }
  if (typeof QRCode === 'undefined'){
    showToast('No se pudo cargar la librería de generación de QR (revisa tu conexión a internet).');
    return;
  }
  try{
    const plantillaImg = await cargarImagen(cfg.plantilla);
    const dataUrl = await generarImagenAcreditacion(inscritos[idx], cfg, plantillaImg);
    inscritos[idx] = {
      ...inscritos[idx],
      acredImagen: dataUrl,
      acredHash: hashDatosAcredInscrito(inscritos[idx]),
      acredConfigVersion: cfg.version,
      acredFecha: new Date().toISOString(),
      acredError: null
    };
    setLS(LS.inscritos, inscritos);
  }catch(e){
    console.error('Error generando acreditación para', inscritos[idx] && inscritos[idx].nombre, ':', e);
    const msg = (e && e.message) ? e.message : String(e);
    inscritos[idx] = { ...inscritos[idx], acredError: msg };
    setLS(LS.inscritos, inscritos);
    showToast(`Error al generar la acreditación de ${inscritos[idx].nombre}: ${msg}`);
  }
  renderAcreditaciones();
}

async function generarTodasPendientesAcred(){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento.'); return; }
  const cfg = getConfigAcred(ev);
  if (!cfg.plantilla){ showToast('Sube antes una plantilla en "Configurar plantilla y posiciones".'); return; }
  const inscritos = getLS(LS.inscritos).filter(i=>i.evento===ev);
  const pendientes = inscritos.filter(i=> estadoAcredInscrito(i, cfg)==='pendiente' || estadoAcredInscrito(i, cfg)==='error');
  if (!pendientes.length){ showToast('No hay acreditaciones pendientes de generar.'); return; }
  showToast(`Generando ${pendientes.length} acreditación${pendientes.length===1?'':'es'}…`);
  for (const i of pendientes){ await generarAcreditacionInscritoUI(i.id); }
  showToast('Generación completada.');
}

async function regenerarTodasAcred(){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento.'); return; }
  const cfg = getConfigAcred(ev);
  if (!cfg.plantilla){ showToast('Sube antes una plantilla en "Configurar plantilla y posiciones".'); return; }
  const inscritos = getLS(LS.inscritos).filter(i=>i.evento===ev);
  if (!inscritos.length){ showToast('No hay inscritos en este evento.'); return; }
  if (!confirm(`¿Regenerar las ${inscritos.length} acreditaciones de este evento? Se sustituirán todas las ya generadas.`)) return;
  showToast('Regenerando todas las acreditaciones…');
  for (const i of inscritos){ await generarAcreditacionInscritoUI(i.id); }
  showToast('Regeneración completada.');
}

/* --- Previsualización --- */
async function previsualizarAcreditacion(id){
  const ev = eventoDetalleActual;
  if (!ev) return;
  const inscrito = getLS(LS.inscritos).find(x=>x.id===id);
  if (!inscrito) return;
  const cfg = getConfigAcred(ev);
  if (!cfg.plantilla){ showToast('Sube antes una plantilla.'); return; }
  document.getElementById('acredPreviewModalTitulo').textContent = `Acreditación — ${inscrito.nombre}`;
  document.getElementById('acredPreviewModalBody').innerHTML = '<p class="muted small">Generando previsualización…</p>';
  document.getElementById('acredPreviewModal').classList.add('active');
  try{
    const plantillaImg = await cargarImagen(cfg.plantilla);
    const dataUrl = inscrito.acredImagen && estadoAcredInscrito(inscrito,cfg)==='generada'
      ? inscrito.acredImagen
      : await generarImagenAcreditacion(inscrito, cfg, plantillaImg);
    document.getElementById('acredPreviewModalBody').innerHTML = `<img src="${dataUrl}" style="max-width:100%;max-height:70vh;border:1px solid var(--line-strong);border-radius:6px;">`;
  }catch(e){
    console.error(e);
    document.getElementById('acredPreviewModalBody').innerHTML = '<p class="muted small">No se pudo generar la previsualización.</p>';
  }
}

/* --- Descarga individual --- */
function nombreArchivoAcred(inscrito){
  const limpio = (inscrito.nombre||'acreditacion')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  return `Acreditacion_${limpio||'inscrito'}.png`;
}
function descargarAcreditacionInscrito(id){
  const inscrito = getLS(LS.inscritos).find(x=>x.id===id);
  if (!inscrito || !inscrito.acredImagen){ showToast('Genera primero la acreditación.'); return; }
  const a = document.createElement('a');
  a.href = inscrito.acredImagen;
  a.download = nombreArchivoAcred(inscrito);
  document.body.appendChild(a); a.click(); a.remove();
}

/* --- Exportación a PDF / impresión (sección 10) --- */
async function construirPdfAcreditaciones(ev, cfg){
  const inscritos = getLS(LS.inscritos).filter(i=>i.evento===ev && i.acredImagen);
  if (!inscritos.length) return null;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const pageW = 210, pageH = 297;
  const margen = 10, gap = 6;
  const cols = Math.max(1, Math.floor((pageW - margen*2 + gap) / (cfg.anchoMM + gap)));
  const rows = Math.max(1, Math.floor((pageH - margen*2 + gap) / (cfg.altoMM + gap)));
  const porPagina = cols*rows;

  for (let idx=0; idx<inscritos.length; idx++){
    const enPagina = idx % porPagina;
    if (idx>0 && enPagina===0) doc.addPage();
    const col = enPagina % cols;
    const row = Math.floor(enPagina / cols);
    const x = margen + col*(cfg.anchoMM+gap);
    const y = margen + row*(cfg.altoMM+gap);
    doc.addImage(inscritos[idx].acredImagen, 'PNG', x, y, cfg.anchoMM, cfg.altoMM, undefined, 'FAST');
  }
  return doc;
}
async function exportarPdfAcreditaciones(){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento.'); return; }
  const cfg = getConfigAcred(ev);
  const generadas = getLS(LS.inscritos).filter(i=>i.evento===ev && i.acredImagen).length;
  if (!generadas){ showToast('Todavía no hay acreditaciones generadas.'); return; }
  const doc = await construirPdfAcreditaciones(ev, cfg);
  if (!doc){ showToast('No hay acreditaciones generadas.'); return; }
  doc.save(`Acreditaciones_${(ev||'evento').replace(/[^a-zA-Z0-9]+/g,'_')}.pdf`);
}
async function imprimirAcreditaciones(){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento.'); return; }
  const cfg = getConfigAcred(ev);
  const doc = await construirPdfAcreditaciones(ev, cfg);
  if (!doc){ showToast('Todavía no hay acreditaciones generadas.'); return; }
  const url = doc.output('bloburl');
  window.open(url, '_blank');
  showToast('Se abre el PDF en una pestaña nueva. Desde ahí puedes imprimirlo (Ctrl+P).');
}

/* --- Configuración de plantilla / posiciones --- */
async function subirPlantillaAcred(file){
  const ev = eventoDetalleActual;
  if (!ev || !file) return;
  try{
    const dataUrl = await leerArchivoComoDataURL(file);
    const cfg = getConfigAcred(ev);
    cfg.plantilla = dataUrl;
    cfg.plantillaNombre = file.name;
    saveConfigAcred(ev, cfg);
    renderConfigAcredUI(cfg);
    actualizarPreviewAcredEnVivo();
    showToast('Plantilla actualizada.');
  }catch(e){
    console.error(e);
    showToast('No se pudo leer la imagen.');
  }
}
async function subirFuenteAcred(file){
  const ev = eventoDetalleActual;
  if (!ev || !file) return;
  try{
    const dataUrl = await leerArchivoComoDataURL(file);
    const cfg = getConfigAcred(ev);
    cfg.fuenteDataUrl = dataUrl;
    cfg.fuenteNombre = file.name;
    saveConfigAcred(ev, cfg);
    _fuenteAcredCargada = null;
    document.getElementById('acredFuenteEstado').textContent = `Tipografía cargada: ${file.name}`;
    actualizarPreviewAcredEnVivo();
    showToast('Tipografía guardada.');
  }catch(e){
    console.error(e);
    showToast('No se pudo leer el archivo de fuente.');
  }
}

function leerCamposConfigAcredDesdeUI(){
  const cfg = getConfigAcred(eventoDetalleActual);
  cfg.anchoMM = Number(document.getElementById('acredAnchoMM').value)||cfg.anchoMM;
  cfg.altoMM = Number(document.getElementById('acredAltoMM').value)||cfg.altoMM;
  cfg.qr = {
    x: Number(document.getElementById('acredQrX').value)||0,
    y: Number(document.getElementById('acredQrY').value)||0,
    w: Number(document.getElementById('acredQrW').value)||1,
    h: Number(document.getElementById('acredQrH').value)||1,
    radius: Number(document.getElementById('acredQrRadio').value)||0,
    borde: Number(document.getElementById('acredQrBorde').value)||0
  };
  cfg.nombre = {
    x: Number(document.getElementById('acredNombreX').value)||0,
    y: Number(document.getElementById('acredNombreY').value)||0,
    alto: Number(document.getElementById('acredNombreAlto').value)||1,
    tam: Number(document.getElementById('acredNombreTam').value)||1,
    color: document.getElementById('acredNombreColor').value.trim()||'#FFFFFF'
  };
  cfg.empresa = {
    x: Number(document.getElementById('acredEmpresaX').value)||0,
    y: Number(document.getElementById('acredEmpresaY').value)||0,
    alto: Number(document.getElementById('acredEmpresaAlto').value)||1,
    tam: Number(document.getElementById('acredEmpresaTam').value)||1,
    color: document.getElementById('acredEmpresaColor').value.trim()||'#00B2B7'
  };
  return cfg;
}

function guardarConfigAcreditacion(){
  const ev = eventoDetalleActual;
  if (!ev){ showToast('Abre primero un evento.'); return; }
  const cfg = leerCamposConfigAcredDesdeUI();
  cfg.version = (getConfigAcred(ev).version||1) + 1;
  saveConfigAcred(ev, cfg);
  showToast('Configuración guardada. Las acreditaciones ya generadas quedarán marcadas para regenerar.');
  renderAcreditaciones();
}

let _acredPreviewTimeout = null;
function actualizarPreviewAcredEnVivo(){
  clearTimeout(_acredPreviewTimeout);
  _acredPreviewTimeout = setTimeout(async ()=>{
    const ev = eventoDetalleActual;
    const wrap = document.getElementById('acredPreviewLive');
    if (!ev || !wrap) return;
    const cfg = leerCamposConfigAcredDesdeUI();
    if (!cfg.plantilla){ wrap.innerHTML = '<span class="muted small">Sube una plantilla para ver la vista previa.</span>'; return; }
    try{
      const plantillaImg = await cargarImagen(cfg.plantilla);
      const dataUrl = await generarImagenAcreditacion(
        { nombre:'Nombre Apellido', empresa:'Empresa de ejemplo', email:'ejemplo@cidaut.es', telefono:'600000000', cargo:'Cargo', sector:'Sector' },
        cfg, plantillaImg
      );
      wrap.innerHTML = `<img src="${dataUrl}" style="max-width:100%;max-height:340px;">`;
    }catch(e){
      console.error(e);
      wrap.innerHTML = '<span class="muted small">No se pudo generar la vista previa.</span>';
    }
  }, 250);
}

function renderConfigAcredUI(cfg){
  document.getElementById('acredAnchoMM').value = cfg.anchoMM;
  document.getElementById('acredAltoMM').value = cfg.altoMM;
  document.getElementById('acredQrX').value = cfg.qr.x;
  document.getElementById('acredQrY').value = cfg.qr.y;
  document.getElementById('acredQrW').value = cfg.qr.w;
  document.getElementById('acredQrH').value = cfg.qr.h;
  document.getElementById('acredQrRadio').value = cfg.qr.radius;
  document.getElementById('acredQrBorde').value = cfg.qr.borde!=null ? cfg.qr.borde : 3;
  document.getElementById('acredNombreX').value = cfg.nombre.x;
  document.getElementById('acredNombreY').value = cfg.nombre.y;
  document.getElementById('acredNombreAlto').value = cfg.nombre.alto;
  document.getElementById('acredNombreTam').value = cfg.nombre.tam;
  document.getElementById('acredNombreColor').value = cfg.nombre.color;
  document.getElementById('acredEmpresaX').value = cfg.empresa.x;
  document.getElementById('acredEmpresaY').value = cfg.empresa.y;
  document.getElementById('acredEmpresaAlto').value = cfg.empresa.alto;
  document.getElementById('acredEmpresaTam').value = cfg.empresa.tam;
  document.getElementById('acredEmpresaColor').value = cfg.empresa.color;

  const prevWrap = document.getElementById('acredPlantillaPreviewWrap');
  prevWrap.innerHTML = cfg.plantilla
    ? `<img src="${cfg.plantilla}" style="max-width:100%;max-height:160px;border:1px solid var(--line-strong);border-radius:6px;"><div class="cmeta" style="margin-top:4px;">${esc(cfg.plantillaNombre||'')}</div>`
    : '<p class="muted small">Todavía no has subido ninguna plantilla.</p>';

  document.getElementById('acredFuenteEstado').textContent = cfg.fuenteDataUrl
    ? `Tipografía cargada: ${cfg.fuenteNombre||'archivo subido'}`
    : 'Sin tipografía propia subida — se usará una de reemplazo (Arial).';
}

const ACRED_ESTADO_INFO = {
  pendiente:    { icon:'○', texto:'Pendiente',   clase:'tag-grey'   },
  generada:     { icon:'✓', texto:'Generada',    clase:'tag-teal'   },
  desactualizada:{ icon:'⚠', texto:'Actualizar', clase:'tag-orange' },
  error:        { icon:'⚠', texto:'Error',       clase:'tag-orange' }
};

function renderAcreditaciones(){
  const ev = eventoDetalleActual;
  const resumenWrap = document.getElementById('acredResumen');
  const tbody = document.querySelector('#tablaAcreditaciones tbody');
  if (!resumenWrap || !tbody) return;
  if (!ev){
    resumenWrap.innerHTML = '';
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Abre un evento propio desde el hub.</td></tr>';
    return;
  }

  const cfg = getConfigAcred(ev);
  renderConfigAcredUI(cfg);
  actualizarPreviewAcredEnVivo();

  const inscritos = getLS(LS.inscritos).filter(i=>i.evento===ev);
  const estados = inscritos.map(i=>estadoAcredInscrito(i, cfg));
  const generadas = estados.filter(e=>e==='generada').length;
  const pendientes = estados.filter(e=>e==='pendiente').length;
  const actualizar = estados.filter(e=>e==='desactualizada').length;
  const errores = estados.filter(e=>e==='error').length;

  resumenWrap.innerHTML = `
    <div class="panel panel-accent"><div class="stat-block accent"><div class="stat-num">${inscritos.length}</div><div class="stat-label">Inscritos</div></div></div>
    <div class="panel panel-accent"><div class="stat-block accent"><div class="stat-num">${generadas}</div><div class="stat-label">Generadas</div></div></div>
    <div class="panel panel-accent"><div class="stat-block accent"><div class="stat-num">${pendientes}</div><div class="stat-label">Pendientes</div></div></div>
    ${actualizar ? `<div class="panel panel-accent"><div class="stat-block accent"><div class="stat-num">${actualizar}</div><div class="stat-label">Para actualizar</div></div></div>` : ''}
    ${errores ? `<div class="panel panel-accent"><div class="stat-block accent"><div class="stat-num">${errores}</div><div class="stat-label">Errores</div></div></div>` : ''}
  `;

  if (!inscritos.length){
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Todavía no hay inscritos en este evento. Añádelos desde la pestaña "Inscritos".</td></tr>';
    return;
  }

  tbody.innerHTML = inscritos.map(i=>{
    const estado = estadoAcredInscrito(i, cfg);
    const info = ACRED_ESTADO_INFO[estado];
    let acciones;
    if (estado==='pendiente'){
      acciones = `<button class="btn btn-secondary" style="padding:5px 10px;font-size:11.5px;" onclick="generarAcreditacionInscritoUI('${i.id}')"><i class="fa-solid fa-wand-magic-sparkles"></i> Generar</button>`;
    } else if (estado==='error'){
      acciones = `<button class="btn btn-secondary" style="padding:5px 10px;font-size:11.5px;" onclick="generarAcreditacionInscritoUI('${i.id}')" title="${esc(i.acredError||'')}"><i class="fa-solid fa-rotate-right"></i> Reintentar</button>`;
    } else {
      acciones = `
        <span class="btn-ghost" onclick="previsualizarAcreditacion('${i.id}')" title="Ver"><i class="fa-solid fa-eye"></i></span>
        <span class="btn-ghost" onclick="descargarAcreditacionInscrito('${i.id}')" title="Descargar"><i class="fa-solid fa-download"></i></span>
        <span class="btn-ghost" onclick="generarAcreditacionInscritoUI('${i.id}')" title="Regenerar"><i class="fa-solid fa-rotate-right"></i></span>`;
    }
    return `<tr>
      <td>${esc(i.nombre)}</td>
      <td>${esc(i.empresa)||'—'}</td>
      <td>${esc(i.cargo)||'—'}</td>
      <td>${esc(i.email)||'—'}</td>
      <td>
        <span class="tag ${info.clase}">${info.icon} ${info.texto}</span>
        ${estado==='error' && i.acredError ? `<div class="cmeta" style="color:var(--danger);margin-top:3px;max-width:220px;">${esc(i.acredError)}</div>` : ''}
      </td>
      <td style="white-space:nowrap;">${acciones}</td>
    </tr>`;
  }).join('');
}

document.getElementById('acredPlantillaFile').addEventListener('change', function(){
  if (this.files[0]) subirPlantillaAcred(this.files[0]);
});
document.getElementById('acredFuenteFile').addEventListener('change', function(){
  if (this.files[0]) subirFuenteAcred(this.files[0]);
});
