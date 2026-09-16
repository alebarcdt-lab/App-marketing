/* =======================================================================
   TAREAS — lista, kanban, calendario y diagrama de Gantt.
   ======================================================================= */

let tareaEditId = null;
let calTareasDate = new Date();

const PRIORIDAD_LABEL = { alta:'Alta', media:'Media', baja:'Baja' };
const PRIORIDAD_TAG = { alta:'tag-orange', media:'tag-teal', baja:'tag-grey' };
const ESTADO_LABEL = { pendiente:'Pendiente', progreso:'En progreso', hecha:'Hecha' };

function getTareas(){ return getLS(LS.tareas); }

function poblarSelectProyectoTarea(){
  const proyectos = getProyectosWeb();
  const sel = document.getElementById('tareaProyecto');
  const prev = sel.value;
  sel.innerHTML = '<option value="">Ninguno</option>' + proyectos.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
  if (proyectos.includes(prev)) sel.value = prev;
}

function abrirModalTarea(id, estadoInicial){
  tareaEditId = id || null;
  poblarSelectProyectoTarea();
  if (id){
    const t = getTareas().find(x=>x.id===id);
    if (!t) return;
    document.getElementById('tareaModalTitulo').textContent = 'Editar tarea';
    document.getElementById('tareaTitulo').value = t.titulo;
    document.getElementById('tareaDescripcion').value = t.descripcion || '';
    document.getElementById('tareaResponsable').value = t.responsable || '';
    document.getElementById('tareaProyecto').value = t.proyecto || '';
    document.getElementById('tareaPrioridad').value = t.prioridad || 'media';
    document.getElementById('tareaEstado').value = t.estado || 'pendiente';
    document.getElementById('tareaFechaInicio').value = t.fechaInicio || '';
    document.getElementById('tareaFechaFin').value = t.fechaFin || '';
    document.getElementById('tareaDeleteBtn').style.display = 'inline-flex';
  } else {
    document.getElementById('tareaModalTitulo').textContent = 'Añadir tarea';
    document.getElementById('tareaTitulo').value = '';
    document.getElementById('tareaDescripcion').value = '';
    document.getElementById('tareaResponsable').value = '';
    document.getElementById('tareaProyecto').value = '';
    document.getElementById('tareaPrioridad').value = 'media';
    document.getElementById('tareaEstado').value = estadoInicial || 'pendiente';
    document.getElementById('tareaFechaInicio').value = '';
    document.getElementById('tareaFechaFin').value = '';
    document.getElementById('tareaDeleteBtn').style.display = 'none';
  }
  document.getElementById('tareaModal').classList.add('active');
}

function abrirModalTareaEnFecha(dateStr){
  abrirModalTarea(null);
  document.getElementById('tareaFechaInicio').value = dateStr;
}

function cerrarModalTarea(){
  document.getElementById('tareaModal').classList.remove('active');
}

function guardarTarea(){
  const titulo = document.getElementById('tareaTitulo').value.trim();
  if (!titulo){ showToast('Indica al menos el título de la tarea.'); return; }
  const fechaInicio = document.getElementById('tareaFechaInicio').value;
  const fechaFin = document.getElementById('tareaFechaFin').value;
  if (fechaInicio && fechaFin && fechaFin < fechaInicio){
    showToast('La fecha de fin no puede ser anterior a la fecha de inicio.');
    return;
  }
  const data = {
    titulo,
    descripcion: document.getElementById('tareaDescripcion').value.trim(),
    responsable: document.getElementById('tareaResponsable').value.trim(),
    proyecto: document.getElementById('tareaProyecto').value,
    prioridad: document.getElementById('tareaPrioridad').value,
    estado: document.getElementById('tareaEstado').value,
    fechaInicio,
    fechaFin
  };
  const tareas = getTareas();
  if (tareaEditId){
    const idx = tareas.findIndex(x=>x.id===tareaEditId);
    if (idx>-1) tareas[idx] = {...tareas[idx], ...data};
  } else {
    tareas.unshift({ id: uid(), ...data });
  }
  setLS(LS.tareas, tareas);
  cerrarModalTarea();
  renderTareas();
  showToast('Tarea guardada.');
}

function borrarTareaModal(){
  if (!tareaEditId) return;
  const t = getTareas().find(x=>x.id===tareaEditId);
  if (!confirm(`¿Eliminar la tarea "${t?t.titulo:''}"? Esta acción no se puede deshacer.`)) return;
  setLS(LS.tareas, getTareas().filter(x=>x.id!==tareaEditId));
  cerrarModalTarea();
  renderTareas();
  showToast('Tarea eliminada.');
}

function eliminarTarea(id){
  const t = getTareas().find(x=>x.id===id);
  if (!t) return;
  if (!confirm(`¿Eliminar la tarea "${t.titulo}"? Esta acción no se puede deshacer.`)) return;
  setLS(LS.tareas, getTareas().filter(x=>x.id!==id));
  renderTareas();
  showToast('Tarea eliminada.');
}

function toggleTareaHecha(id){
  const tareas = getTareas();
  const t = tareas.find(x=>x.id===id);
  if (!t) return;
  t.estado = t.estado==='hecha' ? 'pendiente' : 'hecha';
  setLS(LS.tareas, tareas);
  renderTareas();
}

function renderTareas(){
  renderTareasLista();
  renderKanban();
  renderCalendarTareas();
  renderGanttTareas();
  updateDashboardStats();
}

function fmtRangoTarea(t){
  if (!t.fechaInicio && !t.fechaFin) return '—';
  if (t.fechaInicio && t.fechaFin && t.fechaInicio !== t.fechaFin) return `${fmtFecha(t.fechaInicio)} – ${fmtFecha(t.fechaFin)}`;
  return fmtFecha(t.fechaInicio || t.fechaFin);
}

/* --- Lista --- */
function renderTareasLista(){
  const filtroEstado = document.getElementById('tareaFiltroEstado').value;
  const filtroPrioridad = document.getElementById('tareaFiltroPrioridad').value;
  const tareas = getTareas().filter(t=>{
    const okEstado = !filtroEstado || t.estado === filtroEstado;
    const okPrioridad = !filtroPrioridad || t.prioridad === filtroPrioridad;
    return okEstado && okPrioridad;
  });
  const tbody = document.querySelector('#tablaTareas tbody');
  if (!tareas.length){
    tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No hay tareas con este filtro.</td></tr>';
    return;
  }
  tbody.innerHTML = tareas.map(t=>`
    <tr>
      <td><input type="checkbox" ${t.estado==='hecha'?'checked':''} onchange="toggleTareaHecha('${t.id}')"></td>
      <td>${esc(t.titulo)}</td>
      <td>${esc(t.proyecto)||'—'}</td>
      <td>${esc(t.responsable)||'—'}</td>
      <td><span class="tag ${PRIORIDAD_TAG[t.prioridad]||'tag-grey'}">${PRIORIDAD_LABEL[t.prioridad]||t.prioridad}</span></td>
      <td>${ESTADO_LABEL[t.estado]||t.estado}</td>
      <td>${fmtRangoTarea(t)}</td>
      <td>
        <span class="btn-ghost" onclick="abrirModalTarea('${t.id}')">Editar</span>
        <span class="btn-ghost" onclick="eliminarTarea('${t.id}')">Eliminar</span>
      </td>
    </tr>`).join('');
}

/* --- Kanban --- */
let dragTareaId = null;

function onDragStartTarea(ev, id){
  dragTareaId = id;
  ev.dataTransfer.effectAllowed = 'move';
}

function onDropTarea(ev, estado){
  ev.preventDefault();
  if (!dragTareaId) return;
  const tareas = getTareas();
  const t = tareas.find(x=>x.id===dragTareaId);
  if (t){ t.estado = estado; setLS(LS.tareas, tareas); }
  dragTareaId = null;
  renderTareas();
}

function kanbanCardHtml(t){
  return `
    <div class="kanban-card" draggable="true" ondragstart="onDragStartTarea(event,'${t.id}')" onclick="abrirModalTarea('${t.id}')">
      <div class="kt-title">${esc(t.titulo)}</div>
      <div class="kt-meta">
        <span class="tag ${PRIORIDAD_TAG[t.prioridad]||'tag-grey'}">${PRIORIDAD_LABEL[t.prioridad]||t.prioridad}</span>
        ${t.proyecto?`<span>${esc(t.proyecto)}</span>`:''}
        ${t.fechaFin?`<span>· ${fmtFecha(t.fechaFin)}</span>`:''}
      </div>
    </div>`;
}

function renderKanban(){
  const tareas = getTareas();
  ['pendiente','progreso','hecha'].forEach(estado=>{
    const col = document.getElementById('kanban-'+estado);
    if (!col) return;
    const items = tareas.filter(t=>t.estado===estado);
    col.innerHTML = items.length ? items.map(kanbanCardHtml).join('') : '<p class="muted small">Sin tareas.</p>';
  });
}

/* --- Calendario de tareas --- */
function cambiarMesTareas(delta){
  calTareasDate.setMonth(calTareasDate.getMonth()+delta);
  renderCalendarTareas();
}

function renderCalendarTareas(){
  const grid = document.getElementById('calGridTareas');
  if (!grid) return;
  const year = calTareasDate.getFullYear(), month = calTareasDate.getMonth();
  document.getElementById('calTareasMesLabel').textContent = `${MESES[month].charAt(0).toUpperCase()+MESES[month].slice(1)} ${year}`;

  const firstDay = new Date(year, month, 1);
  let startOffset = firstDay.getDay()-1; if (startOffset<0) startOffset=6;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const tareas = getTareas();
  const todayStr = hoyLocal();

  let cells = DOWS.map(d=>`<div class="cal-dow">${d}</div>`).join('');
  for (let i=startOffset; i>0; i--){
    cells += `<div class="cal-day other-month"><div class="dnum">${daysInPrevMonth-i+1}</div></div>`;
  }
  for (let day=1; day<=daysInMonth; day++){
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayTareas = tareas.filter(t=>{
      if (!t.fechaInicio) return false;
      const fin = t.fechaFin || t.fechaInicio;
      return t.fechaInicio <= dateStr && fin >= dateStr;
    });
    const entryHtml = dayTareas.map(t=>`<div class="entry ${t.estado==='hecha'?'hecha':''}" onclick="abrirModalTarea('${t.id}')" title="${esc(t.titulo)}">${esc(t.titulo)}</div>`).join('');
    cells += `<div class="cal-day" style="${dateStr===todayStr?'box-shadow:inset 0 0 0 2px var(--teal-500);':''}">
      <div class="cal-day-head">
        <div class="dnum">${day}</div>
        <span class="add-btn" onclick="abrirModalTareaEnFecha('${dateStr}')"><i class="fa-solid fa-plus"></i></span>
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
}

/* --- Gantt --- */
function renderGanttTareas(){
  const wrap = document.getElementById('ganttChart');
  if (!wrap) return;
  const tareas = getTareas().filter(t=>t.fechaInicio);
  if (!tareas.length){
    wrap.innerHTML = '<p class="muted small">Añade tareas con fecha de inicio (y de fin, si la tienes) para verlas aquí en el Gantt.</p>';
    return;
  }
  const minDate = tareas.map(t=>t.fechaInicio).reduce((a,b)=> a<b?a:b);
  const maxDate = tareas.map(t=>t.fechaFin || t.fechaInicio).reduce((a,b)=> a>b?a:b);
  const dMin = new Date(minDate);
  const dMax = new Date(maxDate);
  const totalDays = Math.max(1, Math.round((dMax - dMin)/86400000) + 1);

  const rows = tareas.map(t=>{
    const start = new Date(t.fechaInicio);
    const end = new Date(t.fechaFin || t.fechaInicio);
    const offsetDays = Math.round((start - dMin)/86400000);
    const durDays = Math.max(1, Math.round((end - start)/86400000) + 1);
    const leftPct = (offsetDays/totalDays)*100;
    const widthPct = Math.max((durDays/totalDays)*100, 2);
    return `
      <div class="gantt-row">
        <div class="gantt-label" title="${esc(t.titulo)}">${esc(t.titulo)}</div>
        <div class="gantt-track">
          <div class="gantt-bar prioridad-${esc(t.prioridad||'media')}" style="left:${leftPct}%;width:${widthPct}%;" onclick="abrirModalTarea('${t.id}')" title="${esc(t.titulo)} (${fmtRangoTarea(t)})">${esc(t.titulo)}</div>
        </div>
      </div>`;
  }).join('');

  wrap.innerHTML = `
    <div class="gantt-axis"><span>${fmtFecha(minDate)}</span><span>${fmtFecha(maxDate)}</span></div>
    <div class="gantt-wrap">${rows}</div>`;
}
