/* =======================================================================
   AUTENTICACIÓN — login, sesión, perfil, logout.
   ======================================================================= */

let usuarioActual = null;   // { id, email }
let usuarioNombre = '';

function mostrarLoginError(msg){
  const el = document.getElementById('loginError');
  if (el){ el.textContent = msg; el.style.display = 'block'; }
}
function ocultarAvisosLogin(){
  const err = document.getElementById('loginError');
  if (err) err.style.display = 'none';
}

function mostrarPantallaLogin(){
  const loader = document.getElementById('appLoader');
  if (loader) loader.remove();
  document.getElementById('loginScreen').style.display = 'flex';
}
function ocultarPantallaLogin(){
  document.getElementById('loginScreen').style.display = 'none';
}

async function enviarLogin(){
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password){ mostrarLoginError('Indica tu email y tu contraseña.'); return; }
  ocultarAvisosLogin();
  const btn = document.getElementById('loginSubmitBtn');
  btn.disabled = true;
  try{
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await entrarComoUsuario(data.session);
  }catch(e){
    console.error(e);
    const msg = (e && e.message) ? e.message : String(e);
    mostrarLoginError(/invalid login credentials/i.test(msg) ? 'Email o contraseña incorrectos.' : msg);
  }finally{
    btn.disabled = false;
  }
}

async function entrarComoUsuario(session){
  usuarioActual = { id: session.user.id, email: session.user.email };
  ocultarPantallaLogin();
  mostrarPantallaCargaSiHaceFalta();
  await cargarPerfilUsuario();
  await cargarAppDataDesdeSupabase();
  const loader = document.getElementById('appLoader');
  if (loader) loader.remove();
  init();
  actualizarPieSidebarUsuario();
  if (hayDatosAntiguosSinMigrar()) mostrarAvisoRecuperacion();
}

function mostrarPantallaCargaSiHaceFalta(){
  if (document.getElementById('appLoader')) return;
  document.body.insertAdjacentHTML('afterbegin', `<div id="appLoader" style="position:fixed;inset:0;background:#f6f7f6;z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-family:'Montserrat',system-ui,sans-serif;">
    <i class="fa-solid fa-circle-notch fa-spin" style="font-size:28px;color:#1bb8a6;"></i>
    <div style="color:#33454a;font-size:13.5px;font-weight:600;">Cargando datos desde Supabase…</div>
  </div>`);
}

async function cargarPerfilUsuario(){
  try{
    const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', usuarioActual.id).maybeSingle();
    if (error) throw error;
    if (data && data.nombre){
      usuarioNombre = data.nombre;
    } else {
      usuarioNombre = '';
      document.getElementById('nombreUsuarioInput').value = '';
      document.getElementById('nombreUsuarioModal').classList.add('active');
    }
  }catch(e){
    console.error('Error cargando el perfil:', e);
    usuarioNombre = '';
  }
}

async function guardarNombreUsuario(omitir){
  const nombre = omitir ? '' : document.getElementById('nombreUsuarioInput').value.trim();
  usuarioNombre = nombre || (usuarioActual.email.split('@')[0]);
  document.getElementById('nombreUsuarioModal').classList.remove('active');
  try{
    const { error } = await supabaseClient.from('profiles').upsert({ id: usuarioActual.id, email: usuarioActual.email, nombre: usuarioNombre });
    if (error) throw error;
  }catch(e){
    console.error('No se pudo guardar el nombre:', e);
    showToast('No se pudo guardar el nombre. Se usará solo en esta sesión.');
  }
  renderSaludo();
  actualizarPieSidebarUsuario();
}

function actualizarPieSidebarUsuario(){
  const el = document.getElementById('sidebarFootUsuario');
  if (el && usuarioActual) el.textContent = usuarioNombre ? `${usuarioNombre} · ${usuarioActual.email}` : usuarioActual.email;
}

async function cerrarSesionApp(){
  if (!confirm('¿Cerrar sesión?')) return;
  try{ await supabaseClient.auth.signOut(); }catch(e){ console.error(e); }
  location.reload();
}
