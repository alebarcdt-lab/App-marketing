/* =======================================================================
   DASHBOARD (INICIO) — saludo, KPIs, actividad reciente. Lee datos ya
   existentes de otros módulos y los agrupa; no crea almacenamiento
   nuevo ni duplica datos.
   ======================================================================= */

function saludoPorHora(){
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return 'Buenos días';
  if (h >= 14 && h < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatearFechaHoy(){
  const f = new Intl.DateTimeFormat('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).format(new Date());
  return f.charAt(0).toUpperCase() + f.slice(1);
}

function getConfig(){ try{ return JSON.parse(dbGetRaw(LS.config)) || {}; }catch(e){ return {}; } }
function getUsuarioNombre(){ return usuarioNombre || ''; }

function renderSaludo(){
  const saludoEl = document.getElementById('heroSaludo');
  const fechaEl = document.getElementById('heroFecha');
  const nombre = getUsuarioNombre();
  if (saludoEl) saludoEl.textContent = nombre ? `${saludoPorHora()}, ${nombre}` : saludoPorHora();
  if (fechaEl) fechaEl.textContent = formatearFechaHoy();
}

/* ---------------------------------------------------------------------
   INICIO / DASHBOARD
   Lee datos ya existentes de otros módulos (tareas, calendario editorial,
   mantenimiento, SEO, eventos propios, estadísticas de perfiles, email...)
   y los agrupa. No crea almacenamiento nuevo ni duplica datos.
   --------------------------------------------------------------------- */

/* Fecha ISO a N días de hoy (helper local para las ventanas del dashboard). */
function fechaEnDias(n){
  const d = new Date();
  d.setDate(d.getDate()+n);
  return isoLocal(d);
}

/* Último registro cronológico de una red en Estadísticas de perfiles,
   sin restringir por año (a diferencia del filtro de esa pestaña). */
function ultimoRegistroRed(red){
  const regs = ordenarCronologicoPerfil(getEstadisticasPerfiles().filter(r=>r.red===red));
  return regs.length ? regs[regs.length-1] : null;
}

function renderContextoHero(){
  const el = document.getElementById('heroResumen');
  if (!el) return;
  const items = gatherPendientesAtencion();
  const publicacionesProximas = items.filter(i=>i.categoria==='publicaciones').length;

  let texto;
  if (items.length >= 6){
    texto = 'Tienes varias tareas que requieren atención.';
  } else if (!items.length){
    texto = 'Todo bajo control. Estas son las próximas acciones.';
  } else if (publicacionesProximas){
    texto = 'Estas son las próximas acciones de Marketing.';
  } else {
    texto = 'Todo bajo control. Estas son las próximas acciones.';
  }
  el.textContent = texto;
}

/* Recopila, desde los datos ya existentes de cada módulo, todo lo que
   requiere atención: tareas pendientes, publicaciones que se acercan,
   mantenimiento de webs pendiente, SEO pendiente y eventos propios
   próximos. Cada elemento marca "urgente" cuando corresponde (vencido,
   a punto de publicarse, o checklist muy incompleta) para destacarlo
   visualmente y para la ordenación por prioridad. */
function gatherPendientesAtencion(){
  const hoyStr = hoyLocal();
  const en7Str = fechaEnDias(7);
  const items = [];

  getTareas().filter(t=>t.estado!=='hecha').forEach(t=>{
    const fecha = t.fechaFin || t.fechaInicio || null;
    const urgente = !!(t.fechaFin && t.fechaFin < hoyStr);
    items.push({
      categoria:'tareas', tipo:'Tarea', icon:'fa-list-check',
      titulo:t.titulo, fecha, prioridad:t.prioridad, urgente,
      etiquetaTexto: PRIORIDAD_LABEL[t.prioridad]||'', etiquetaTag: PRIORIDAD_TAG[t.prioridad]||'tag-grey',
      fechaTexto: fecha ? (urgente ? 'Venció el '+fmtFecha(fecha) : fmtFecha(fecha)) : 'Sin fecha límite',
      onclick:`abrirModalTarea('${t.id}')`
    });
  });

  getLS(LS.calendario).filter(e=>e.fecha>=hoyStr && e.fecha<=en7Str).forEach(e=>{
    const etiquetaTxt = e.etiqueta==='proyecto' ? (e.proyecto||'Proyecto') : 'CIDAUT';
    items.push({
      categoria:'publicaciones', tipo:'Publicación', icon:'fa-share-nodes',
      titulo:e.titulo, fecha:e.fecha, prioridad:null, urgente: e.fecha<=fechaEnDias(1),
      etiquetaTexto:e.plataforma, etiquetaTag:'tag-teal',
      fechaTexto: `${fmtFecha(e.fecha)} · ${etiquetaTxt}`,
      onclick:`abrirModalCal('${e.fecha}','${e.id}')`
    });
  });

  getLS(LS.mantenimiento).filter(t=>!t.done).forEach(t=>{
    items.push({
      categoria:'webs', tipo:'Web', icon:'fa-screwdriver-wrench',
      titulo:t.tarea, fecha:null, prioridad:null, urgente:false,
      etiquetaTexto: etiquetaWebProyecto(t.sitio), etiquetaTag:'tag-grey',
      fechaTexto: t.periodo || 'Mantenimiento pendiente',
      onclick:"goTo('webs','mantenimiento')"
    });
  });

  getPaginasSEO().filter(p=>p.estado==='pendiente').forEach(p=>{
    items.push({
      categoria:'seo', tipo:'SEO', icon:'fa-magnifying-glass-chart',
      titulo: p.url || p.title || 'Página sin URL', fecha:null, prioridad:null, urgente:false,
      etiquetaTexto:'Pendiente de optimizar', etiquetaTag:'tag-grey',
      fechaTexto: etiquetaWebProyecto(p.proyecto),
      onclick:"goTo('seo','paginas')"
    });
  });

  getLS(LS.seoAuditoria).filter(a=>!a.done).forEach(a=>{
    items.push({
      categoria:'seo', tipo:'SEO', icon:'fa-clipboard-check',
      titulo:a.tarea, fecha:null, prioridad:null, urgente:false,
      etiquetaTexto:'Auditoría pendiente', etiquetaTag:'tag-grey',
      fechaTexto: etiquetaWebProyecto(a.proyecto),
      onclick:"goTo('seo','auditoria')"
    });
  });

  getContenidosSEO().filter(c=>c.estado!=='publicado').forEach(c=>{
    const urgente = !!(c.fecha && c.fecha<hoyStr);
    items.push({
      categoria:'seo', tipo:'SEO', icon:'fa-pen-nib',
      titulo:c.titulo, fecha:c.fecha||null, prioridad:null, urgente,
      etiquetaTexto: ESTADO_CONTENIDO_LABEL[c.estado]||c.estado, etiquetaTag: ESTADO_CONTENIDO_TAG[c.estado]||'tag-grey',
      fechaTexto: c.fecha ? (urgente ? 'Debía publicarse el '+fmtFecha(c.fecha) : fmtFecha(c.fecha)) : 'Sin fecha prevista',
      onclick:"goTo('seo','contenidos')"
    });
  });

  const en30Str = fechaEnDias(30);
  getEventosPropios().filter(ev=> ev.fechaInicio && ev.fechaInicio>=hoyStr && ev.fechaInicio<=en30Str && ev.estado!=='cancelado' && ev.estado!=='finalizado').forEach(ev=>{
    const logistica = getLogisticaObj()[ev.nombre] || {pre:[],durante:[],post:[]};
    const todas = [...(logistica.pre||[]),...(logistica.durante||[]),...(logistica.post||[])];
    const done = todas.filter(t=>t.done).length;
    const pct = todas.length ? Math.round(done/todas.length*100) : null;
    const urgente = pct!=null && pct<50 && ev.fechaInicio<=en7Str;
    items.push({
      categoria:'eventos', tipo:'Evento', icon:'fa-calendar-days',
      titulo:ev.nombre, fecha:ev.fechaInicio, prioridad:null, urgente,
      etiquetaTexto: pct!=null ? `Checklist ${pct}%` : 'Sin checklist',
      etiquetaTag: (pct!=null && pct<50) ? 'tag-orange' : 'tag-teal',
      fechaTexto: fmtFecha(ev.fechaInicio),
      onclick:`goTo('propios','logistica','${escJs(ev.nombre)}')`
    });
  });

  return items;
}

/* Prioridad sencilla, en niveles que no se mezclan entre sí:
   1) urgente/vencido, 2) prioridad alta, 3) fecha más cercana,
   4) prioridad media, 5) prioridad baja. Dentro de cada nivel,
   se ordena por la fecha más cercana. */
function pesoPendiente(it, hoyStr){
  const diasFecha = it.fecha ? Math.round((new Date(it.fecha)-new Date(hoyStr))/86400000) : 500;
  if (it.urgente) return -200000 + diasFecha;
  if (it.prioridad==='alta') return -100000 + diasFecha;
  if (it.prioridad==='media') return 1000 + diasFecha;
  if (it.prioridad==='baja') return 2000 + diasFecha;
  return diasFecha;
}

function ordenarPendientes(items){
  const hoyStr = hoyLocal();
  return items.slice().sort((a,b)=> pesoPendiente(a,hoyStr)-pesoPendiente(b,hoyStr));
}

let inicioPendientesExpandido = false;
function toggleInicioPendientesExpandido(){
  inicioPendientesExpandido = !inicioPendientesExpandido;
  renderPendienteAtencion();
}

function renderItemPendiente(it){
  const iconStyle = it.urgente ? 'background:var(--orange-100);color:#b1521a;' : '';
  const icon = it.urgente ? 'fa-triangle-exclamation' : it.icon;
  return `
    <div class="activity-item">
      <div class="ai-icon" style="${iconStyle}"><i class="fa-solid ${icon}"></i></div>
      <div class="ai-body">
        <div class="ai-type">${esc(it.tipo)}</div>
        <div class="ai-title">${esc(it.titulo || 'Sin título')}</div>
        <div class="ai-meta">
          ${it.etiquetaTexto ? `<span class="tag ${it.etiquetaTag||'tag-grey'}">${esc(it.etiquetaTexto)}</span>` : ''}
          ${it.fechaTexto ? esc(it.fechaTexto) : ''}
        </div>
      </div>
      <button class="ai-link" onclick="${it.onclick}">Abrir</button>
    </div>`;
}

function renderPendienteAtencion(){
  const wrap = document.getElementById('listaPendientesAtencion');
  if (!wrap) return;
  const contador = document.getElementById('pendientesContador');
  const contadorLabel = document.getElementById('pendientesContadorLabel');
  const distribucion = document.getElementById('pendientesDistribucion');
  const verMasWrap = document.getElementById('pendientesVerMasWrap');

  const items = ordenarPendientes(gatherPendientesAtencion());
  const total = items.length;

  if (contador) contador.textContent = total;
  if (contadorLabel) contadorLabel.textContent = total===1 ? 'pendiente' : 'pendientes';

  if (distribucion){
    const counts = { tareas:0, publicaciones:0, seo:0, webs:0, eventos:0 };
    items.forEach(it=>{ if (counts[it.categoria]!=null) counts[it.categoria]++; });
    const labelPlural = { tareas:'tareas', publicaciones:'publicaciones', seo:'SEO', webs:'webs', eventos:'eventos' };
    const partes = ['tareas','publicaciones','seo','webs','eventos'].filter(c=>counts[c]>0).map(c=>`${counts[c]} ${labelPlural[c]}`);
    distribucion.textContent = partes.join(' · ');
  }

  if (!total){
    wrap.innerHTML = `
      <div class="activity-item" style="border-bottom:none;">
        <div class="ai-icon" style="background:var(--teal-100);color:var(--teal-700);"><i class="fa-solid fa-circle-check"></i></div>
        <div class="ai-body">
          <div class="ai-title">Todo bajo control</div>
          <div class="ai-meta">No tienes tareas ni acciones urgentes pendientes.</div>
        </div>
      </div>`;
    if (verMasWrap) verMasWrap.innerHTML = '';
    return;
  }

  const LIMITE = 6;
  const mostrar = inicioPendientesExpandido ? items : items.slice(0,LIMITE);
  wrap.innerHTML = mostrar.map(renderItemPendiente).join('');

  if (verMasWrap){
    verMasWrap.innerHTML = total>LIMITE
      ? `<button class="ai-link" onclick="toggleInicioPendientesExpandido()">${inicioPendientesExpandido?'Ver menos':`Ver todos (${total}) →`}</button>`
      : '';
  }
}

/* --- Próximamente: lo que se acerca en tareas, publicaciones, eventos
   propios y contenidos SEO con fecha prevista. Se muestran en orden
   cronológico, sin límite fijo de días, para no dejar fuera el próximo
   evento propio aunque quede algo más lejos que 14 días. --- */
function gatherProximamente(){
  const hoyStr = hoyLocal();
  const items = [];

  getTareas().filter(t=>t.estado!=='hecha').forEach(t=>{
    const fecha = t.fechaFin || t.fechaInicio;
    if (fecha && fecha>=hoyStr){
      items.push({ fecha, tipo:'Tarea', titulo:t.titulo, meta:PRIORIDAD_LABEL[t.prioridad]||'', icon:'fa-list-check', onclick:`abrirModalTarea('${t.id}')` });
    }
  });

  getLS(LS.calendario).filter(e=>e.fecha>=hoyStr).forEach(e=>{
    const etiquetaTxt = e.etiqueta==='proyecto' ? (e.proyecto||'Proyecto') : 'CIDAUT';
    items.push({ fecha:e.fecha, tipo: e.plataforma ? `Publicación · ${e.plataforma}` : 'Publicación', titulo:e.titulo, meta:etiquetaTxt, icon:'fa-share-nodes', onclick:`abrirModalCal('${e.fecha}','${e.id}')` });
  });

  getEventosPropios().filter(ev=>ev.fechaInicio && ev.fechaInicio>=hoyStr && ev.estado!=='cancelado').forEach(ev=>{
    items.push({ fecha:ev.fechaInicio, tipo:'Evento', titulo:ev.nombre, meta:ev.lugar||'', icon:'fa-calendar-days', onclick:`goTo('propios','logistica','${escJs(ev.nombre)}')` });
  });

  getContenidosSEO().filter(c=>c.estado!=='publicado' && c.fecha && c.fecha>=hoyStr).forEach(c=>{
    items.push({ fecha:c.fecha, tipo:'Contenido SEO', titulo:c.titulo, meta:etiquetaWebProyecto(c.proyecto), icon:'fa-pen-nib', onclick:"goTo('seo','contenidos')" });
  });

  items.sort((a,b)=> (a.fecha||'').localeCompare(b.fecha||''));
  return items;
}

function renderProximamente(){
  const wrap = document.getElementById('listaProximamente');
  if (!wrap) return;
  const items = gatherProximamente().slice(0,8);
  if (!items.length){
    wrap.innerHTML = '<p class="muted small">No hay nada previsto en los próximos días.</p>';
    return;
  }
  wrap.innerHTML = items.map(it=>{
    const [,m,d] = it.fecha.split('-');
    const fechaCorta = `${d} ${MESES_CAP[Number(m)-1].slice(0,3).toUpperCase()}`;
    return `
    <div class="activity-item">
      <div class="ai-icon"><i class="fa-solid ${it.icon}"></i></div>
      <div class="ai-body">
        <div class="ai-type">${fechaCorta} · ${esc(it.tipo)}</div>
        <div class="ai-title">${esc(it.titulo||'Sin título')}</div>
        ${it.meta ? `<div class="ai-meta">${esc(it.meta)}</div>` : ''}
      </div>
      <button class="ai-link" onclick="${it.onclick}">Abrir</button>
    </div>`;
  }).join('');
}

/* --- Resumen de Marketing: un vistazo a redes, SEO, webs y email,
   usando exclusivamente datos ya existentes en cada módulo. --- */
function renderResumenMarketing(){
  const wrap = document.getElementById('listaResumenMarketing');
  if (!wrap) return;
  const hoyStr = hoyLocal();
  const mesActual = hoyStr.slice(0,7);

  const li = ultimoRegistroRed('linkedin');
  let redesMeta;
  if (li){
    const delta = calcularDeltaMensualPerfil(li);
    redesMeta = `${fmtNum(li.seguidores)} LinkedIn · ${fmtSignoPctPerfil(delta.pct)} último mes`;
  } else {
    redesMeta = 'Sin estadísticas de seguidores todavía';
  }
  const pubMes = getLS(LS.calendario).filter(e=>e.fecha && e.fecha.slice(0,7)===mesActual).length;
  redesMeta += ` · ${pubMes} ${pubMes===1?'publicación':'publicaciones'} este mes`;

  const numKeywords = getKeywordsSEO().length;
  const numPaginas = getPaginasSEO().length;
  const contenidosPend = getContenidosSEO().filter(c=>c.estado!=='publicado').length;
  const seoMeta = `${numKeywords} keyword${numKeywords===1?'':'s'} · ${numPaginas} página${numPaginas===1?'':'s'} · ${contenidosPend} contenido${contenidosPend===1?'':'s'} pendiente${contenidosPend===1?'':'s'}`;

  const numProyectos = getProyectos().length;
  const mantPend = getLS(LS.mantenimiento).filter(t=>!t.done).length;
  const websMeta = `${numProyectos} proyecto${numProyectos===1?'':'s'} · ${mantPend} mantenimiento${mantPend===1?'':'s'} pendiente${mantPend===1?'':'s'}`;

  const numCampanas = getLS(LS.emailsEnviados).length;
  const numUTM = getLS(LS.utm).length;
  const emailMeta = `${numCampanas} campaña${numCampanas===1?'':'s'} registrada${numCampanas===1?'':'s'} · ${numUTM} UTM${numUTM===1?'':'s'} creada${numUTM===1?'':'s'}`;

  const filas = [
    { icon:'fa-share-nodes', titulo:'Redes sociales', meta:redesMeta, onclick:"goTo('redes','analitica')" },
    { icon:'fa-magnifying-glass-chart', titulo:'SEO', meta:seoMeta, onclick:"goTo('seo','keywords')" },
    { icon:'fa-globe', titulo:'Webs', meta:websMeta, onclick:"goTo('webs','mantenimiento')" },
    { icon:'fa-envelope-open-text', titulo:'Email', meta:emailMeta, onclick:"goTo('email','seguimiento')" }
  ];

  wrap.innerHTML = filas.map(f=>`
    <div class="activity-item">
      <div class="ai-icon"><i class="fa-solid ${f.icon}"></i></div>
      <div class="ai-body">
        <div class="ai-title">${esc(f.titulo)}</div>
        <div class="ai-meta">${esc(f.meta)}</div>
      </div>
      <button class="ai-link" onclick="${f.onclick}">Ver</button>
    </div>`).join('');
}

/* --- Redes sociales: tabla por red (último dato + variación mensual,
   con la misma lógica que Estadísticas de perfiles) y resumen de
   publicaciones del calendario editorial. --- */
function renderRedesSocialesInicio(){
  const tbody = document.getElementById('tablaRedesInicioBody');
  if (tbody){
    tbody.innerHTML = PERFIL_REDES_ORDEN.map(red=>{
      const label = REDES_CONFIG[red].label;
      const reg = ultimoRegistroRed(red);
      if (!reg){
        return `<tr><td><span class="tag tag-grey">${esc(label)}</span></td><td style="text-align:right;">—</td><td style="text-align:right;">N/D</td></tr>`;
      }
      const delta = calcularDeltaMensualPerfil(reg);
      return `<tr><td><span class="tag tag-teal">${esc(label)}</span></td><td style="text-align:right;">${fmtNum(reg.seguidores)}</td><td style="text-align:right;">${fmtSignoPctPerfil(delta.pct)}</td></tr>`;
    }).join('');
  }

  const wrap = document.getElementById('publicacionesResumenInicio');
  if (!wrap) return;
  const hoyStr = hoyLocal();
  const mesActual = hoyStr.slice(0,7);
  const calendario = getLS(LS.calendario);
  const pubMes = calendario.filter(e=>e.fecha && e.fecha.slice(0,7)===mesActual).length;
  const programadas = calendario.filter(e=>e.fecha>=hoyStr).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  const proxima = programadas[0];

  let html = `<div class="muted small">${pubMes} ${pubMes===1?'publicación':'publicaciones'} este mes · ${programadas.length} programada${programadas.length===1?'':'s'}</div>`;
  if (proxima){
    const etiquetaTxt = proxima.etiqueta==='proyecto' ? (proxima.proyecto||'Proyecto') : 'CIDAUT';
    html += `
    <div class="activity-item" style="border-bottom:none;">
      <div class="ai-icon"><i class="fa-solid fa-share-nodes"></i></div>
      <div class="ai-body">
        <div class="ai-type">Próxima publicación</div>
        <div class="ai-title">${esc(proxima.titulo)}</div>
        <div class="ai-meta">${fmtFecha(proxima.fecha)} · ${esc(proxima.plataforma)} · ${esc(etiquetaTxt)}</div>
      </div>
      <button class="ai-link" onclick="abrirModalCal('${proxima.fecha}','${proxima.id}')">Editar</button>
    </div>`;
  }
  wrap.innerHTML = html;
}

function updateDashboardStats(){
  renderSaludo();
  renderContextoHero();
  renderPendienteAtencion();
  renderProximamente();
  renderResumenMarketing();
  renderRedesSocialesInicio();
  renderNotificaciones();
}
