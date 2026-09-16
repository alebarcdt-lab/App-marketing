/* =======================================================================
   EMAIL MARKETING Y CRM — previsualizador, generador de UTMs, historial
   de envíos.
   ======================================================================= */

/* =======================================================================
   MÓDULO 3 — EMAIL MARKETING Y CRM
   ======================================================================= */
function actualizarPreviewEmail(){
  const html = document.getElementById('emailHtmlInput').value;
  document.getElementById('emailPreviewFrame').srcdoc = html || '<p style="font-family:sans-serif;color:#999;padding:20px;">La previsualización aparecerá aquí.</p>';
}

function setEmailDevice(device){
  document.getElementById('btnDesktop').classList.toggle('active', device==='desktop');
  document.getElementById('btnMovil').classList.toggle('active', device==='movil');
  document.getElementById('emailPreviewFrame').style.width = device==='desktop' ? '600px' : '320px';
}

function construirUTMFinal(){
  const url = document.getElementById('utmUrl').value.trim();
  if (!url) return '';
  const source = document.getElementById('utmSource').value.trim();
  const medium = document.getElementById('utmMedium').value.trim();
  const campaign = document.getElementById('utmCampaign').value.trim();
  const term = document.getElementById('utmTerm').value.trim();
  const content = document.getElementById('utmContent').value.trim();
  let full;
  try{ full = new URL(url); }catch(e){ return ''; }
  if (source) full.searchParams.set('utm_source', source);
  if (medium) full.searchParams.set('utm_medium', medium);
  if (campaign) full.searchParams.set('utm_campaign', campaign);
  if (term) full.searchParams.set('utm_term', term);
  if (content) full.searchParams.set('utm_content', content);
  return full.toString();
}

function generarUTM(){
  document.getElementById('utmResult').value = construirUTMFinal();
}

function copiarUTM(){
  const val = document.getElementById('utmResult').value;
  if (!val){ showToast('Genera primero un enlace válido.'); return; }
  navigator.clipboard.writeText(val).then(()=> showToast('Enlace copiado al portapapeles.'));
}

function guardarUTM(){
  const final = construirUTMFinal();
  if (!final){ showToast('Introduce una URL válida antes de guardar.'); return; }
  const historial = getLS(LS.utm);
  historial.unshift({
    id: uid(),
    campaign: document.getElementById('utmCampaign').value.trim() || '(sin campaña)',
    source: document.getElementById('utmSource').value.trim(),
    medium: document.getElementById('utmMedium').value.trim(),
    url: final
  });
  setLS(LS.utm, historial);
  renderUTMHistorial();
  showToast('Enlace guardado en el historial.');
}

function eliminarUTM(id){
  const h = getLS(LS.utm).find(x=>x.id===id);
  if (!h) return;
  if (!confirm(`¿Eliminar el enlace UTM de la campaña "${h.campaign}"?`)) return;
  setLS(LS.utm, getLS(LS.utm).filter(x=>x.id!==id));
  renderUTMHistorial();
  showToast('Enlace UTM eliminado.');
}

function renderUTMHistorial(){
  const historial = getLS(LS.utm);
  const tbody = document.querySelector('#tablaUTM tbody');
  if (!historial.length){
    tbody.innerHTML = '<tr class="empty-row"><td colspan="4">Todavía no se ha guardado ningún enlace.</td></tr>';
    return;
  }
  tbody.innerHTML = historial.map(h=>`
    <tr>
      <td>${esc(h.campaign)}</td>
      <td>${esc(h.source)} / ${esc(h.medium)}</td>
      <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        <a href="${esc(h.url)}" target="_blank" rel="noopener">${esc(h.url)}</a>
      </td>
      <td><span class="btn-ghost" onclick="eliminarUTM('${h.id}')">Eliminar</span></td>
    </tr>`).join('');
}

/* --- Seguimiento de envíos --- */
function añadirEnvioEmail(){
  const nombre = document.getElementById('envioNombre').value.trim();
  const fecha = document.getElementById('envioFecha').value;
  const destinatarios = document.getElementById('envioDestinatarios').value.trim();
  const proyecto = document.getElementById('envioProyecto').value;
  const notas = document.getElementById('envioNotas').value.trim();
  if (!nombre || !fecha){ showToast('Indica al menos el nombre y la fecha del envío.'); return; }
  const envios = getLS(LS.emailsEnviados);
  envios.unshift({ id: uid(), nombre, fecha, destinatarios, proyecto, notas });
  setLS(LS.emailsEnviados, envios);
  ['envioNombre','envioDestinatarios','envioNotas'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('envioProyecto').value='';
  document.getElementById('envioFecha').valueAsDate = new Date();
  renderEnviosEmail();
  showToast('Envío registrado.');
}

function eliminarEnvioEmail(id){
  const e = getLS(LS.emailsEnviados).find(x=>x.id===id);
  if (!e) return;
  if (!confirm(`¿Eliminar el registro de envío "${e.nombre}"?`)) return;
  setLS(LS.emailsEnviados, getLS(LS.emailsEnviados).filter(x=>x.id!==id));
  renderEnviosEmail();
  showToast('Envío eliminado.');
}

function renderEnviosEmail(){
  const envios = getLS(LS.emailsEnviados).slice().sort((a,b)=> (b.fecha||'').localeCompare(a.fecha||''));
  const tbody = document.querySelector('#tablaEnviosEmail tbody');
  if (!envios.length){
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Todavía no se ha registrado ningún envío.</td></tr>';
    updateDashboardStats();
    return;
  }
  tbody.innerHTML = envios.map(e=>`
    <tr>
      <td>${esc(e.nombre)}</td>
      <td>${fmtFecha(e.fecha)}</td>
      <td>${esc(e.proyecto)||'—'}</td>
      <td>${esc(e.destinatarios)||'—'}</td>
      <td>${esc(e.notas)||'—'}</td>
      <td><span class="btn-ghost" onclick="eliminarEnvioEmail('${e.id}')">Eliminar</span></td>
    </tr>`).join('');
  updateDashboardStats();
}

