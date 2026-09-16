/* =======================================================================
   EVENTOS Y MEMORIA ANUAL — registro de asistencia a eventos externos y
   generador de la memoria anual (Excel/PDF). Distinto del "Organizador
   de eventos propios" (eventos.js), que es donde vive Acreditaciones.
   ======================================================================= */

/* =======================================================================
   MÓDULO 1 — EVENTOS Y MEMORIA ANUAL
   ======================================================================= */
let evFotosData = [];
let eventoEditId = null;

document.getElementById('evDepartamento').addEventListener('change', function(){
  document.getElementById('evDepartamentoOtro').style.display = this.value==='__otro' ? 'block' : 'none';
});

document.getElementById('evFotos').addEventListener('change', function(){
  const files = Array.from(this.files).slice(0,6);
  const preview = document.getElementById('evFotosPreview');
  preview.innerHTML = '';
  evFotosData = [];
  files.forEach(f=>{
    resizeImage(f, 160, 0.6, dataUrl=>{
      evFotosData.push(dataUrl);
      const img = document.createElement('img');
      img.src = dataUrl;
      preview.appendChild(img);
    });
  });
});

function toggleEvVariosDias(){
  const varios = document.getElementById('evVariosDias').checked;
  document.getElementById('evFechaFinField').style.display = varios ? 'block' : 'none';
  document.getElementById('evFechaLabel').textContent = varios ? 'Fecha de inicio' : 'Fecha';
  if (!varios) document.getElementById('evFechaFin').value = '';
}

function fmtRangoFecha(r){
  if (!r.fecha) return '—';
  if (r.fechaFin && r.fechaFin !== r.fecha) return `${fmtFecha(r.fecha)} – ${fmtFecha(r.fechaFin)}`;
  return fmtFecha(r.fecha);
}

function guardarRegistroEvento(){
  const nombre = document.getElementById('evNombre').value.trim();
  let depto = document.getElementById('evDepartamento').value;
  if (depto==='__otro') depto = document.getElementById('evDepartamentoOtro').value.trim() || 'Otro';
  const evento = document.getElementById('evEvento').value.trim();
  const proyecto = document.getElementById('evProyecto').value;
  const variosDias = document.getElementById('evVariosDias').checked;
  const fecha = document.getElementById('evFecha').value;
  const fechaFin = variosDias ? document.getElementById('evFechaFin').value : '';
  const rol = document.getElementById('evRol').value.trim();
  const descripcion = document.getElementById('evDescripcion').value.trim();
  const gastos = document.getElementById('evGastos').value.trim();

  if (!nombre || !depto || !evento || !fecha){
    showToast('Rellena al menos nombre, departamento, evento y fecha.');
    return;
  }
  if (variosDias && fechaFin && fechaFin < fecha){
    showToast('La fecha de fin no puede ser anterior a la fecha de inicio.');
    return;
  }
  const data = { nombre, depto, evento, proyecto, fecha, fechaFin: fechaFin || '', rol, descripcion, gastos, fotos: evFotosData };
  const eraEdicion = !!eventoEditId;
  const registros = getLS(LS.eventos);
  if (eventoEditId){
    const idx = registros.findIndex(x=>x.id===eventoEditId);
    if (idx>-1) registros[idx] = {...registros[idx], ...data};
  } else {
    registros.unshift({ id: uid(), ...data });
  }
  setLS(LS.eventos, registros);
  cancelarEdicionEvento();
  renderRegistrosRecientes();
  populateMemoriaFilters();
  renderMemoria();
  updateDashboardStats();
  showToast(eraEdicion ? 'Registro actualizado.' : 'Registro guardado correctamente.');
}

function editarRegistroEvento(id){
  const r = getLS(LS.eventos).find(x=>x.id===id);
  if (!r) return;
  eventoEditId = id;

  document.getElementById('evNombre').value = r.nombre || '';
  const deptosPredefinidos = ['Energía','Materiales','Movilidad','OTRI','TIC'];
  if (deptosPredefinidos.includes(r.depto)){
    document.getElementById('evDepartamento').value = r.depto;
    document.getElementById('evDepartamentoOtro').style.display = 'none';
    document.getElementById('evDepartamentoOtro').value = '';
  } else {
    document.getElementById('evDepartamento').value = '__otro';
    document.getElementById('evDepartamentoOtro').style.display = 'block';
    document.getElementById('evDepartamentoOtro').value = r.depto || '';
  }
  document.getElementById('evEvento').value = r.evento || '';
  document.getElementById('evProyecto').value = r.proyecto || '';

  const variosDias = !!(r.fechaFin && r.fechaFin !== r.fecha);
  document.getElementById('evVariosDias').checked = variosDias;
  document.getElementById('evFechaFinField').style.display = variosDias ? 'block' : 'none';
  document.getElementById('evFechaLabel').textContent = variosDias ? 'Fecha de inicio' : 'Fecha';
  document.getElementById('evFecha').value = r.fecha || '';
  document.getElementById('evFechaFin').value = variosDias ? (r.fechaFin || '') : '';

  document.getElementById('evRol').value = r.rol || '';
  document.getElementById('evDescripcion').value = r.descripcion || '';
  document.getElementById('evGastos').value = r.gastos || '';

  evFotosData = (r.fotos || []).slice();
  document.getElementById('evFotos').value = '';
  const preview = document.getElementById('evFotosPreview');
  preview.innerHTML = '';
  evFotosData.forEach(dataUrl=>{
    const img = document.createElement('img');
    img.src = dataUrl;
    preview.appendChild(img);
  });

  document.getElementById('evFormTitulo').textContent = 'Editar registro de evento';
  document.getElementById('cancelarEdicionEventoBtn').style.display = 'inline-flex';
  window.scrollTo(0,0);
}

function cancelarEdicionEvento(){
  eventoEditId = null;
  limpiarFormularioEvento();
  document.getElementById('evFormTitulo').textContent = 'Registrar asistencia a un evento';
  document.getElementById('cancelarEdicionEventoBtn').style.display = 'none';
}

function limpiarFormularioEvento(){
  ['evNombre','evEvento','evFecha','evFechaFin','evRol','evDescripcion','evGastos'].forEach(id=> document.getElementById(id).value='');
  document.getElementById('evDepartamento').value='';
  document.getElementById('evDepartamentoOtro').style.display='none';
  document.getElementById('evDepartamentoOtro').value='';
  document.getElementById('evProyecto').value='';
  document.getElementById('evVariosDias').checked=false;
  document.getElementById('evFechaFinField').style.display='none';
  document.getElementById('evFechaLabel').textContent='Fecha';
  document.getElementById('evFotos').value='';
  document.getElementById('evFotosPreview').innerHTML='';
  evFotosData = [];
}

function eliminarRegistroEvento(id){
  const r = getLS(LS.eventos).find(x=>x.id===id);
  if (!r) return;
  if (!confirm(`¿Eliminar el registro de "${r.nombre} — ${r.evento}"? Esta acción no se puede deshacer.`)) return;
  setLS(LS.eventos, getLS(LS.eventos).filter(x=>x.id!==id));
  if (eventoEditId===id) cancelarEdicionEvento();
  renderRegistrosRecientes();
  populateMemoriaFilters();
  renderMemoria();
  updateDashboardStats();
  showToast('Registro eliminado.');
}

function renderRegistrosRecientes(){
  const registros = getLS(LS.eventos).slice(0,6);
  const tbody = document.querySelector('#tablaRegistrosRecientes tbody');
  if (!registros.length){
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Todavía no hay registros. Añade el primero con el formulario.</td></tr>';
    return;
  }
  tbody.innerHTML = registros.map(r=>`
    <tr>
      <td>${esc(r.nombre)}</td>
      <td>${esc(r.depto)}</td>
      <td>${esc(r.evento)}</td>
      <td>${esc(r.proyecto)||'—'}</td>
      <td>${fmtRangoFecha(r)}</td>
      <td>
        <span class="btn-ghost" onclick="editarRegistroEvento('${r.id}')"><i class="fa-solid fa-pen"></i></span>
        <span class="btn-ghost" onclick="eliminarRegistroEvento('${r.id}')"><i class="fa-solid fa-trash"></i></span>
      </td>
    </tr>`).join('');
}

function populateMemoriaFilters(){
  const registros = getLS(LS.eventos);
  const anios = [...new Set(registros.map(r=> r.fecha ? r.fecha.slice(0,4) : null).filter(Boolean))].sort().reverse();
  const anioActual = String(new Date().getFullYear());
  if (!anios.includes(anioActual)) anios.unshift(anioActual);
  const selAnio = document.getElementById('memAnio');
  const prevAnio = selAnio.value;
  selAnio.innerHTML = anios.map(a=>`<option value="${a}">${a}</option>`).join('');
  if (anios.includes(prevAnio)) selAnio.value = prevAnio;

  const deptos = [...new Set(registros.map(r=>r.depto).filter(Boolean))].sort();
  const selDepto = document.getElementById('memDepto');
  const prevDepto = selDepto.value;
  selDepto.innerHTML = '<option value="">Todos</option>' + deptos.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('');
  selDepto.value = deptos.includes(prevDepto) ? prevDepto : '';

  poblarMemoriaProyectoFilter();
}

function filtrarRegistrosMemoria(){
  const anio = document.getElementById('memAnio').value;
  const depto = document.getElementById('memDepto').value;
  const proyecto = document.getElementById('memProyecto').value;
  return getLS(LS.eventos).filter(r=>{
    const okAnio = !anio || (r.fecha && r.fecha.slice(0,4)===anio);
    const okDepto = !depto || r.depto===depto;
    const okProyecto = !proyecto || r.proyecto===proyecto;
    return okAnio && okDepto && okProyecto;
  });
}

function renderMemoria(){
  const registros = filtrarRegistrosMemoria().sort((a,b)=> (a.fecha||'').localeCompare(b.fecha||''));

  const tbody = document.querySelector('#tablaMemoria tbody');
  if (!registros.length){
    tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No hay registros para este filtro.</td></tr>';
    return;
  }
  tbody.innerHTML = registros.map(r=>`
    <tr>
      <td>${esc(r.nombre)}</td>
      <td>${esc(r.depto)}</td>
      <td>${esc(r.evento)}</td>
      <td>${esc(r.proyecto)||'—'}</td>
      <td>${fmtRangoFecha(r)}</td>
      <td>${esc(r.rol)}</td>
      <td>${esc(r.gastos)||'—'}</td>
      <td>
        <span class="btn-ghost" onclick="editarRegistroEventoDesdeMemoria('${r.id}')"><i class="fa-solid fa-pen"></i></span>
        <span class="btn-ghost" onclick="eliminarRegistroEvento('${r.id}')"><i class="fa-solid fa-trash"></i></span>
      </td>
    </tr>`).join('');
}

function editarRegistroEventoDesdeMemoria(id){
  switchTab('eventos','registro');
  editarRegistroEvento(id);
}

function exportarExcel(){
  const anio = document.getElementById('memAnio').value;
  const depto = document.getElementById('memDepto').value;
  const registros = filtrarRegistrosMemoria();
  if (!registros.length){ showToast('No hay registros que exportar con este filtro.'); return; }

  const headers = ['Empleado','Departamento','Evento','Proyecto','Fecha','Qué presentó','Resumen','Gastos'];
  const rows = registros.map(r=>[r.nombre, r.depto, r.evento, r.proyecto, fmtRangoFecha(r), r.rol, r.descripcion, r.gastos]);
  const csv = [headers, ...rows].map(row=>
    row.map(cell=>{
      const val = (cell==null?'':String(cell)).replace(/"/g,'""');
      return /[;"\n]/.test(val) ? `"${val}"` : val;
    }).join(';')
  ).join('\r\n');

  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `memoria_eventos_${anio||'todos'}${depto?'_'+depto.replace(/\s+/g,'_'):''}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Excel (CSV) exportado.');
}

function exportarPDF(){
  const anio = document.getElementById('memAnio').value;
  const depto = document.getElementById('memDepto').value;
  const registros = filtrarRegistrosMemoria();
  if (!registros.length){ showToast('No hay registros que exportar con este filtro.'); return; }

  const rows = registros.map(r=>`
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;">${esc(r.nombre)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;">${esc(r.depto)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;">${esc(r.evento)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;">${esc(r.proyecto)||'—'}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;">${fmtRangoFecha(r)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;">${esc(r.rol)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;">${esc(r.gastos)}</td>
    </tr>`).join('');

  document.getElementById('printArea').innerHTML = `
    <div style="font-family:'Montserrat',sans-serif;">
      <h2 style="margin:0 0 4px 0;">Memoria de eventos — CIDAUT</h2>
      <p style="margin:0 0 18px 0;color:#555;">Año: ${anio||'Todos'} · Departamento: ${depto||'Todos'}</p>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr>
          <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #333;">Empleado</th>
          <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #333;">Departamento</th>
          <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #333;">Evento</th>
          <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #333;">Proyecto</th>
          <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #333;">Fecha</th>
          <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #333;">Qué presentó</th>
          <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #333;">Gastos</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  window.print();
}

