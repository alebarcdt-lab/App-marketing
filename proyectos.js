/* =======================================================================
   PROYECTOS Y SECTORES — catálogo compartido por casi todos los módulos
   (Tareas, SEO, Email, Redes, Eventos...). Vive dentro de la pestaña
   "Configuración" pero es, en la práctica, un módulo transversal.
   ======================================================================= */

let proyectoEditId = null;

function getProyectos(){ return getLS(LS.proyectos).slice().sort((a,b)=> (a.nombre||'').localeCompare((b.nombre||''), 'es', {sensitivity:'base'})); }
function getProyectosNombres(){ return getProyectos().map(p=>p.nombre); }

/* Alias de compatibilidad: varios módulos ya usaban getProyectosWeb()
   para obtener la lista de nombres de proyecto. */
function getProyectosWeb(){ return getProyectosNombres(); }

function crearProyectoPorNombre(nombre){
  const proyectos = getProyectos();
  if (proyectos.some(p=>p.nombre===nombre)) return false;
  proyectos.push({ id: uid(), nombre, acronimo:'', programa:'', estado:'Activo', descripcion:'' });
  setLS(LS.proyectos, proyectos);
  return true;
}

function migrarProyectosLegacy(){
  const legacy = getLS(LS.proyectosWeb);
  if (!legacy.length) return;
  const proyectos = getProyectos();
  let cambiado = false;
  legacy.forEach(nombre=>{
    if (!proyectos.some(p=>p.nombre===nombre)){
      proyectos.push({ id: uid(), nombre, acronimo:'', programa:'', estado:'Activo', descripcion:'' });
      cambiado = true;
    }
  });
  if (cambiado) setLS(LS.proyectos, proyectos);
}

function refrescarSelectsProyecto(){
  populateProyectoWebSelect();
  poblarSelectProyectoRegistro();
  poblarSelectProyectoEnvio();
  poblarMemoriaProyectoFilter();
  poblarSelectProyectoIdea();
  poblarSelectsProyectoSEO();
  poblarSelectProyectoPublicacion();
  poblarFiltrosAnalyticsRedes();
}

function guardarProyecto(){
  const nombre = document.getElementById('proyNombre').value.trim();
  if (!nombre){ showToast('Indica el nombre del proyecto.'); return; }
  const proyectos = getProyectos();
  const duplicado = proyectos.some(p=>p.nombre===nombre && p.id!==proyectoEditId);
  if (duplicado){ showToast('Ya existe un proyecto con ese nombre.'); return; }
  const fechaInicio = document.getElementById('proyFechaInicio').value;
  const fechaFin = document.getElementById('proyFechaFin').value;
  if (fechaInicio && fechaFin && fechaFin < fechaInicio){
    showToast('La fecha de fin no puede ser anterior a la fecha de inicio.');
    return;
  }
  const data = {
    nombre,
    acronimo: document.getElementById('proyAcronimo').value.trim(),
    programa: document.getElementById('proyPrograma').value,
    fechaInicio,
    fechaFin,
    web: document.getElementById('proyWeb').value.trim(),
    redesSociales: getProyRedesSeleccionadas(),
    estado: document.getElementById('proyEstado').value,
    descripcion: document.getElementById('proyDescripcion').value.trim()
  };
  if (proyectoEditId){
    const idx = proyectos.findIndex(p=>p.id===proyectoEditId);
    if (idx>-1) proyectos[idx] = {...proyectos[idx], ...data};
  } else {
    proyectos.unshift({ id: uid(), ...data });
  }
  setLS(LS.proyectos, proyectos);
  cancelarEdicionProyecto();
  renderProyectos();
  refrescarSelectsProyecto();
  showToast('Proyecto guardado.');
}

function editarProyecto(id){
  const p = getProyectos().find(x=>x.id===id);
  if (!p) return;
  proyectoEditId = id;
  document.getElementById('proyNombre').value = p.nombre;
  document.getElementById('proyAcronimo').value = p.acronimo||'';
  document.getElementById('proyPrograma').value = p.programa||'';
  document.getElementById('proyFechaInicio').value = p.fechaInicio||'';
  document.getElementById('proyFechaFin').value = p.fechaFin||'';
  document.getElementById('proyWeb').value = p.web||'';
  document.querySelectorAll('#config-proyectos .proyRedCheckbox').forEach(c=>{ c.checked = (p.redesSociales||[]).includes(c.value); });
  document.getElementById('proyEstado').value = p.estado||'Activo';
  document.getElementById('proyDescripcion').value = p.descripcion||'';
  document.getElementById('proyectoFormTitulo').textContent = 'Editar proyecto';
  document.getElementById('cancelarEdicionProyectoBtn').style.display = 'inline-flex';
  goTo('config','proyectos');
}

function cancelarEdicionProyecto(){
  proyectoEditId = null;
  ['proyNombre','proyAcronimo','proyFechaInicio','proyFechaFin','proyWeb','proyDescripcion'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('proyPrograma').value = '';
  document.querySelectorAll('#config-proyectos .proyRedCheckbox').forEach(c=>c.checked=false);
  document.getElementById('proyEstado').value = 'Activo';
  document.getElementById('proyectoFormTitulo').textContent = 'Registrar proyecto';
  document.getElementById('cancelarEdicionProyectoBtn').style.display = 'none';
}

function eliminarProyecto(id){
  const p = getProyectos().find(x=>x.id===id);
  if (!p) return;
  if (!confirm(`¿Eliminar el proyecto "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
  setLS(LS.proyectos, getProyectos().filter(p=>p.id!==id));
  if (proyectoEditId===id) cancelarEdicionProyecto();
  renderProyectos();
  refrescarSelectsProyecto();
  showToast('Proyecto eliminado.');
}

function renderProyectos(){
  const proyectos = getProyectos();
  const wrap = document.getElementById('listaProyectos');
  if (!proyectos.length){
    wrap.innerHTML = '<p class="muted small">Todavía no hay proyectos registrados. Añade el primero con el formulario.</p>';
    updateDashboardStats();
    return;
  }
  wrap.innerHTML = proyectos.map(p=>{
    const rango = (p.fechaInicio || p.fechaFin) ? fmtRangoFecha({fecha:p.fechaInicio, fechaFin:p.fechaFin}) : '';
    return `
    <div class="panel" style="margin-bottom:12px;">
      <div class="snippet-head">
        <div>
          <h4>${esc(p.nombre)}${p.acronimo?` <span class="muted small">(${esc(p.acronimo)})</span>`:''}</h4>
          <div style="margin-top:6px;">
            ${p.programa?`<span class="tag tag-teal">${esc(p.programa)}</span>`:''}
            <span class="tag ${p.estado==='Finalizado'?'tag-grey':'tag-orange'}" style="margin-left:4px;">${esc(p.estado||'Activo')}</span>
            ${(p.redesSociales&&p.redesSociales.length) ? p.redesSociales.map(r=>`<span class="tag tag-grey" style="margin-left:4px;">${REDES_CONFIG[r]?REDES_CONFIG[r].label:esc(r)}</span>`).join(''):''}
          </div>
        </div>
        <div class="btn-row" style="margin-top:0;">
          <span class="btn-ghost" onclick="editarProyecto('${p.id}')"><i class="fa-solid fa-pen"></i></span>
          <span class="btn-ghost" onclick="eliminarProyecto('${p.id}')"><i class="fa-solid fa-trash"></i></span>
        </div>
      </div>
      <div class="small muted" style="margin-top:8px;">
        ${rango?`<span><i class="fa-regular fa-calendar"></i> ${rango}</span>`:''}
        ${p.web?`<span style="margin-left:${rango?'14px':'0'};"><i class="fa-solid fa-globe"></i> <a href="${esc(p.web)}" target="_blank" rel="noopener">${esc(p.web)}</a></span>`:''}
      </div>
      ${p.descripcion?`<p style="font-size:12.5px;color:var(--ink-700);white-space:pre-wrap;margin-top:10px;">${esc(p.descripcion)}</p>`:''}
    </div>`;
  }).join('');
  updateDashboardStats();
}

function poblarSelectProyectoRegistro(){
  const proyectos = getProyectosNombres();
  const sel = document.getElementById('evProyecto');
  const prev = sel.value;
  sel.innerHTML = '<option value="">Ninguno / General</option>' + proyectos.map(p=>`<option>${esc(p)}</option>`).join('');
  if (proyectos.includes(prev)) sel.value = prev;
}

function poblarSelectProyectoEnvio(){
  const proyectos = getProyectosNombres();
  const sel = document.getElementById('envioProyecto');
  const prev = sel.value;
  sel.innerHTML = '<option value="">Ninguno / General</option>' + proyectos.map(p=>`<option>${esc(p)}</option>`).join('');
  if (proyectos.includes(prev)) sel.value = prev;
}

function poblarMemoriaProyectoFilter(){
  const proyectos = getProyectosNombres();
  const sel = document.getElementById('memProyecto');
  const prev = sel.value;
  sel.innerHTML = '<option value="">Todos</option>' + proyectos.map(p=>`<option>${esc(p)}</option>`).join('');
  if (proyectos.includes(prev)) sel.value = prev;
}

/* ---------------------------------------------------------------------
   CONFIGURACIÓN — sectores
   --------------------------------------------------------------------- */
function getSectores(){ return getLS(LS.sectores); }

function guardarSector(){
  const nombre = document.getElementById('sectorNombre').value.trim();
  if (!nombre){ showToast('Indica el nombre del sector.'); return; }
  const sectores = getSectores();
  if (sectores.some(s=>s.nombre.toLowerCase()===nombre.toLowerCase())){ showToast('Ya existe ese sector.'); return; }
  sectores.push({ id: uid(), nombre });
  setLS(LS.sectores, sectores);
  document.getElementById('sectorNombre').value = '';
  renderSectores();
  poblarSelectSectorInscrito();
  showToast('Sector guardado.');
}

function eliminarSector(id){
  const s = getSectores().find(x=>x.id===id);
  if (!s) return;
  if (!confirm(`¿Eliminar el sector "${s.nombre}"?`)) return;
  setLS(LS.sectores, getSectores().filter(x=>x.id!==id));
  renderSectores();
  poblarSelectSectorInscrito();
  showToast('Sector eliminado.');
}

function renderSectores(){
  const sectores = getSectores();
  const wrap = document.getElementById('listaSectores');
  if (!sectores.length){
    wrap.innerHTML = '<p class="muted small">Todavía no hay sectores registrados. Añade el primero con el formulario.</p>';
    return;
  }
  wrap.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + sectores.map(s=>`
    <span class="tag tag-grey" style="display:inline-flex;align-items:center;gap:7px;">
      ${esc(s.nombre)}
      <i class="fa-solid fa-xmark" style="cursor:pointer;" onclick="eliminarSector('${s.id}')"></i>
    </span>`).join('') + '</div>';
}

function poblarSelectSectorInscrito(){
  const sectores = getSectores();
  ['insSector','eiSector'].forEach(id=>{
    const sel = document.getElementById(id);
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = '<option value="">Sin especificar</option>' + sectores.map(s=>`<option>${esc(s.nombre)}</option>`).join('');
    if (sectores.some(s=>s.nombre===prev)) sel.value = prev;
  });
}
