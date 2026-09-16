/* =======================================================================
   SUPABASE — cliente, persistencia (app_data) y recuperación de datos
   antiguos. Único archivo que habla directamente con Supabase para leer
   y escribir los datos de la app (dbGetRaw/dbSetRaw/dbRemoveRaw).
   ======================================================================= */

const LS = {
  eventos: 'cidautHub_eventos',
  mantenimiento: 'cidautHub_mantenimiento',
  utm: 'cidautHub_utm',
  calendario: 'cidautHub_calendario',
  logistica: 'cidautHub_logistica',
  inscritos: 'cidautHub_inscritos',
  eventosPropios: 'cidautHub_eventosPropios',
  snippets: 'cidautHub_snippets',
  proyectos: 'cidautHub_proyectos',
  proyectosWeb: 'cidautHub_proyectosWeb',
  estructuraWebs: 'cidautHub_estructuraWebs',
  emailsEnviados: 'cidautHub_emailsEnviados',
  tareas: 'cidautHub_tareas',
  sectores: 'cidautHub_sectores',
  ideas: 'cidautHub_ideas',
  enlaces: 'cidautHub_enlaces',
  seoKeywords: 'cidautHub_seoKeywords',
  seoPaginas: 'cidautHub_seoPaginas',
  seoAuditoria: 'cidautHub_seoAuditoria',
  seoContenidos: 'cidautHub_seoContenidos',
  publicacionesRedes: 'cidautHub_publicacionesRedes',
  comunicacionEventos: 'cidautHub_comunicacionEventos',
  estadisticasPerfiles: 'cidautHub_estadisticasPerfiles',
  config: 'cidautHub_config'
};

/* ---------------------------------------------------------------------
   SUPABASE — persistencia única para TODA la app.
   Ya no se usa localStorage del navegador como almacén de verdad en
   ningún sitio. getLS/setLS (usadas por todos los módulos) y las pocas
   llamadas directas que quedaban pasan por dbGetRaw/dbSetRaw, que leen y
   escriben contra una única tabla de Supabase (app_data: clave -> valor
   JSON), igual para cualquier ordenador y cualquier usuario con sesión.
   --------------------------------------------------------------------- */
const SUPABASE_URL = 'https://atpcakzseqrvfuiidvht.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0cGNha3pzZXFydmZ1aWlkdmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNTc0MjksImV4cCI6MjEwNDkzMzQyOX0.oI747dO6KW6JHZsCttZxHaeFSHSo32m4uxOjGW2s82o';
/* Captura el localStorage REAL del navegador antes de que más abajo se
   eclipse con el almacén propio de la app. Supabase Auth necesita guardar
   la sesión de inicio de sesión ahí, aparte de nuestros datos. */
const _realLocalStorage = window.localStorage;
let supabaseClient;
try{
  if (!window.supabase) throw new Error('El script de Supabase no se ha cargado (revisa la conexión a internet o si algo está bloqueando cdn.jsdelivr.net).');
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { storage: _realLocalStorage, persistSession: true, autoRefreshToken: true }
  });
}catch(e){
  console.error('No se pudo inicializar Supabase:', e);
  const errorFn = async () => ({ data:null, error: e });
  supabaseClient = { from: () => ({ select: errorFn, upsert: errorFn, delete: () => ({ eq: errorFn }) }) };
}

/* ---------------------------------------------------------------------
   AUTENTICACIÓN — email y contraseña con Supabase Auth. Cada persona
   tiene su propia cuenta y su propio nombre (tabla "profiles"), pero
   todas comparten los mismos datos de la app (app_data). El nombre se
   usa solo para personalizar el saludo de Inicio.
   --------------------------------------------------------------------- */

/* Caché en memoria de TODAS las claves de la app, ya cargada desde
   Supabase antes de que arranque init(). Guarda exactamente strings,
   igual que el localStorage real, para que el comportamiento de
   getItem/setItem sea idéntico al de siempre. */
let _appDataCache = {};
let _appDataListo = false;

/* Aviso persistente (no un toast que desaparece) de que Supabase no está
   disponible, con el motivo exacto para poder diagnosticarlo. */
function mostrarAvisoSupabase(mensaje){
  let banner = document.getElementById('supabaseWarningBanner');
  if (!banner){
    banner = document.createElement('div');
    banner.id = 'supabaseWarningBanner';
    banner.style.cssText = 'position:sticky;top:0;z-index:30;background:#fdecc8;color:#7a4f0a;padding:10px 20px;font-size:12.5px;font-weight:600;display:flex;align-items:center;gap:10px;justify-content:space-between;border-bottom:1px solid #e9c97a;';
    document.body.insertBefore(banner, document.body.firstChild);
  }
  banner.innerHTML = `<span><i class="fa-solid fa-triangle-exclamation"></i> ${esc(mensaje)}</span>
    <span style="cursor:pointer;font-weight:800;" onclick="document.getElementById('supabaseWarningBanner').remove()">✕</span>`;
}
function ocultarAvisoSupabase(){
  const banner = document.getElementById('supabaseWarningBanner');
  if (banner) banner.remove();
}

/* Guarda/borra UNA clave en Supabase en segundo plano (no bloquea la UI:
   la caché en memoria ya se ha actualizado antes de llamar a esto). */
async function guardarClaveAppData(key, valorString){
  try{
    const { error } = await supabaseClient.from('app_data').upsert({ key, value: valorString, updated_at: new Date().toISOString() });
    if (error) throw error;
    ocultarAvisoSupabase();
  }catch(e){
    console.error('Error guardando en Supabase ('+key+'):', e);
    mostrarAvisoSupabase('No se ha podido guardar en Supabase. Los cambios recientes podrían perderse al recargar. Motivo: '+(e && e.message ? e.message : e));
  }
}
async function borrarClaveAppData(key){
  try{
    const { error } = await supabaseClient.from('app_data').delete().eq('key', key);
    if (error) throw error;
    ocultarAvisoSupabase();
  }catch(e){
    console.error('Error borrando en Supabase ('+key+'):', e);
    mostrarAvisoSupabase('No se ha podido borrar en Supabase. Motivo: '+(e && e.message ? e.message : e));
  }
}

/* Acceso de bajo nivel a UNA clave de datos (siempre como string, igual
   que se comportaba el antiguo localStorage). Esta es la ÚNICA función
   de este archivo que toca Supabase directamente para leer/escribir
   datos de la app; todo lo demás (getLS/setLS, usados por el resto de
   módulos) pasa siempre por aquí. Nombres explícitos, sin trucos de
   suplantar objetos globales — así funciona igual repartido en varios
   archivos <script>, sin depender del orden de carga por "shadowing". */
function dbGetRaw(key){
  return Object.prototype.hasOwnProperty.call(_appDataCache, key) ? _appDataCache[key] : null;
}
function dbSetRaw(key, value){
  const str = String(value);
  _appDataCache[key] = str;
  guardarClaveAppData(key, str);
}
function dbRemoveRaw(key){
  delete _appDataCache[key];
  borrarClaveAppData(key);
}

async function cargarAppDataDesdeSupabase(){
  try{
    const { data, error } = await supabaseClient.from('app_data').select('*');
    if (error) throw error;
    _appDataCache = {};
    (data||[]).forEach(row=>{
      /* La columna "value" es jsonb: según cómo se haya escrito el dato
         (desde la app siempre llega como string ya escapado; si se ha
         insertado directamente por SQL como array/objeto "de verdad",
         Supabase lo devuelve YA analizado, no como texto) hay que
         normalizar siempre a string aquí, que es el contrato que espera
         el resto del código (igual que el localStorage real). */
      _appDataCache[row.key] = (typeof row.value === 'string') ? row.value : JSON.stringify(row.value);
    });
    ocultarAvisoSupabase();
  }catch(e){
    console.error('Error cargando datos de Supabase:', e);
    _appDataCache = {};
    mostrarAvisoSupabase('No se ha podido conectar con Supabase, así que no se ve ningún dato guardado. Motivo: '+(e && e.message ? e.message : e));
  }
  _appDataListo = true;
}

/* ---------------------------------------------------------------------
   RECUPERACIÓN de datos antiguos: antes de conectar Supabase, este hub
   lo guardaba todo en el localStorage real del navegador. Al pasar a
   Supabase, esos datos se quedaron "atrapados" en el navegador donde se
   escribieron. Esta herramienta escanea el localStorage REAL de este
   navegador (window.localStorage, no el de arriba) y sube a Supabase
   cualquier clave que todavía no se haya migrado, fusionando con
   cuidado en vez de machacar lo que ya hubiera en Supabase.
   --------------------------------------------------------------------- */
function clavesAntiguasSinMigrar(){
  const claves = [];
  try{
    for (let i=0;i<window.localStorage.length;i++){
      const k = window.localStorage.key(i);
      if (k && k.indexOf('cidautHub_')===0 && k.slice(-8)!=='_migrado') claves.push(k);
    }
  }catch(e){ console.error(e); }
  return claves;
}
function hayDatosAntiguosSinMigrar(){ return clavesAntiguasSinMigrar().length>0; }

/* Fusiona un valor "viejo" (del localStorage real) con el actual (ya
   cargado de Supabase) sin perder ni duplicar nada, adaptándose a la
   forma del dato: listas de objetos con id, objetos sueltos, o valores
   simples. Devuelve null si no hace falta ningún cambio. */
function fusionarValorAntiguo(actual, viejo){
  if (viejo==null) return null;
  if (Array.isArray(viejo)){
    const base = Array.isArray(actual) ? actual.slice() : [];
    const porId = new Map(base.map((x,i)=>[ (x && x.id!=null) ? x.id : Symbol('sinid'+i), x ]));
    let cambios = 0;
    viejo.forEach(item=>{
      const id = (item && item.id!=null) ? item.id : null;
      if (id!=null && porId.has(id)) return; // ya existe, no se toca
      base.push(item);
      cambios++;
    });
    return cambios ? base : null;
  }
  if (typeof viejo==='object'){
    const base = (actual && typeof actual==='object' && !Array.isArray(actual)) ? {...actual} : {};
    let cambios = 0;
    Object.keys(viejo).forEach(k=>{
      if (JSON.stringify(base[k]) !== JSON.stringify(viejo[k])){ base[k] = viejo[k]; cambios++; }
    });
    return cambios ? base : null;
  }
  // valor simple (texto, fecha...): si no había nada, usa el viejo
  return (actual==null || actual==='') ? viejo : null;
}

async function recuperarDatosAntiguosGlobal(){
  const claves = clavesAntiguasSinMigrar();
  if (!claves.length){
    showToast('No se han encontrado datos antiguos en este navegador.');
    ocultarAvisoRecuperacion();
    return;
  }
  let clavesConCambios = 0, clavesRevisadas = claves.length;
  claves.forEach(key=>{
    let viejoRaw;
    try{ viejoRaw = JSON.parse(window.localStorage.getItem(key)); }
    catch(e){ viejoRaw = window.localStorage.getItem(key); }
    const actual = getLS(key);
    const fusionado = fusionarValorAntiguo(actual, viejoRaw);
    if (fusionado!==null){ setLS(key, fusionado); clavesConCambios++; }
  });

  await new Promise(r=>setTimeout(r, 700));

  // Renombra (no borra) las claves antiguas para no volver a ofrecer la
  // recuperación cada vez, conservando el respaldo por si hiciera falta revisarlo.
  try{
    claves.forEach(key=>{
      window.localStorage.setItem(key+'_migrado', window.localStorage.getItem(key));
      window.localStorage.removeItem(key);
    });
  }catch(e){ console.error(e); }

  ocultarAvisoRecuperacion();
  showToast(`Recuperación completa: ${clavesRevisadas} claves revisadas, ${clavesConCambios} con datos nuevos incorporados a Supabase.`);
  location.reload();
}

function mostrarAvisoRecuperacion(){
  if (document.getElementById('recuperacionBanner')) return;
  const n = clavesAntiguasSinMigrar().length;
  const banner = document.createElement('div');
  banner.id = 'recuperacionBanner';
  banner.style.cssText = 'position:sticky;top:0;z-index:30;background:#dbe9f8;color:#0a3d66;padding:10px 20px;font-size:12.5px;font-weight:600;display:flex;align-items:center;gap:14px;justify-content:space-between;flex-wrap:wrap;border-bottom:1px solid #a9c8e8;';
  banner.innerHTML = `
    <span><i class="fa-solid fa-clock-rotate-left"></i> Este navegador tiene datos guardados de antes de conectar Supabase (${n} apartados) que puede que no se estén viendo. ¿Los recuperamos?</span>
    <span style="display:flex;gap:10px;flex-shrink:0;">
      <button class="btn" style="padding:6px 14px;font-size:12px;" onclick="recuperarDatosAntiguosGlobal()">Recuperar ahora</button>
      <span style="cursor:pointer;font-weight:800;align-self:center;" onclick="document.getElementById('recuperacionBanner').remove()">✕</span>
    </span>`;
  document.body.insertBefore(banner, document.body.firstChild);
}
function ocultarAvisoRecuperacion(){
  const banner = document.getElementById('recuperacionBanner');
  if (banner) banner.remove();
}
