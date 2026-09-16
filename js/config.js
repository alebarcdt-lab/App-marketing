/* =======================================================================
   CONFIGURACIÓN — pestaña "General" (nombre de usuario). Las pestañas
   "Proyectos" y "Sectores" de esta misma vista están en proyectos.js
   (es un módulo compartido); "Copia de seguridad" está en app.js (es
   una utilidad de toda la app).
   ======================================================================= */

/* Configuración > General: nombre del usuario (por cuenta, no compartido) para el saludo del inicio. */
async function guardarConfigGeneral(){
  const nombre = document.getElementById('cfgUsuarioNombre').value.trim();
  if (!usuarioActual){ showToast('Inicia sesión primero.'); return; }
  usuarioNombre = nombre || usuarioActual.email.split('@')[0];
  try{
    const { error } = await supabaseClient.from('profiles').upsert({ id: usuarioActual.id, email: usuarioActual.email, nombre: usuarioNombre });
    if (error) throw error;
  }catch(e){
    console.error(e);
    showToast('No se pudo guardar en Supabase; se usará solo en esta sesión.');
  }
  renderSaludo();
  actualizarPieSidebarUsuario();
  showToast('Configuración guardada.');
}
function renderConfigGeneral(){
  const el = document.getElementById('cfgUsuarioNombre');
  if (el) el.value = getUsuarioNombre();
  const emailEl = document.getElementById('cfgUsuarioEmail');
  if (emailEl) emailEl.textContent = usuarioActual ? usuarioActual.email : '—';
}
