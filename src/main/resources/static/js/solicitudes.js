// Pantalla admin: validar solicitudes de servicio y asignar técnico de instalación
document.addEventListener("DOMContentLoaded", () => {
  // Sesión y cabecera (avatar, menú de usuario, cerrar sesión): panel-comun.js
  const sesion = Panel.iniciar(["ADMIN", "SOPORTE"]);
  if (!sesion) return;

  const $ = id => document.getElementById(id);

  const ESTADO = { PENDIENTE: "Pendiente", EN_EVALUACION: "En evaluación", OBSERVADA: "Observada", APROBADA: "Aprobada", EN_INSTALACION: "En instalación", ACTIVADA: "Activada", RECHAZADA: "Rechazada", CANCELADA: "Cancelada" };
  // Transiciones que el backend permite desde el panel (APROBADA en adelante las maneja la orden de instalación)
  const SIGUIENTES = { PENDIENTE: ["EN_EVALUACION"], EN_EVALUACION: ["APROBADA", "OBSERVADA", "RECHAZADA"], OBSERVADA: ["EN_EVALUACION"] };
  const ACCION = { EN_EVALUACION: ["Pasar a evaluación", "primario"], APROBADA: ["Aprobar solicitud", "ok"], OBSERVADA: ["Observar", "aviso"], RECHAZADA: ["Rechazar", "peligro"] };
  const JSON_H = { "Content-Type": "application/json" };

  const esc = v => { const e = document.createElement("span"); e.textContent = v ?? ""; return e.innerHTML; };
  const fecha = v => v ? new Date(v).toLocaleDateString("es-PE") : "—";
  const fechaHora = v => new Date(v).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
  const codigo = s => `SOL-${new Date(s.fechaSolicitud).getFullYear()}-${String(s.id).padStart(6, "0")}`;
  const patch = (url, body) => apiFetch(url, { method: "PATCH", headers: JSON_H, body: JSON.stringify(body) });

  let solicitudes = [], clientes = new Map(), tecnicos = null, actual = null, timer;
  const cliente = s => clientes.get(s.clienteId) || {};

  function toast(mensaje, error = false) {
    const t = $("clientesToast");
    t.textContent = mensaje; t.classList.toggle("error", error); t.classList.add("show");
    clearTimeout(timer); timer = setTimeout(() => t.classList.remove("show"), 3500);
  }

  async function cargar() {
    try {
      const [s, c] = await Promise.all([apiFetch("/api/solicitudes-servicio"), apiFetch("/api/clientes")]);
      solicitudes = Array.isArray(s) ? s : [];
      clientes = new Map((Array.isArray(c) ? c : []).map(x => [x.id, x]));
      stats(); render();
    } catch (e) {
      $("solTabla").innerHTML = `<tr><td colspan="6" class="clientes-vacio">${esc(e.message)}</td></tr>`;
    }
  }

  const PILL = { PENDIENTE: "p-naranja", EN_EVALUACION: "p-azul", OBSERVADA: "p-amarillo", APROBADA: "p-celeste", EN_INSTALACION: "p-morado", ACTIVADA: "p-verde", RECHAZADA: "p-rojo", CANCELADA: "p-gris" };
  let grupo = null; // filtro por tarjeta KPI (puede abarcar varios estados)

  function stats() {
    const n = lista => solicitudes.filter(s => lista.includes(s.estado)).length;
    const total = solicitudes.length;
    const pct = c => total ? Math.round((c / total) * 100) : 0;
    const cifras = { Revisar: n(["PENDIENTE", "EN_EVALUACION"]), Observadas: n(["OBSERVADA"]), Aprobadas: n(["APROBADA"]), Instalacion: n(["EN_INSTALACION"]), Activadas: n(["ACTIVADA"]) };

    $("stTotal").textContent = total;
    Object.entries(cifras).forEach(([clave, cantidad]) => {
      $("st" + clave).textContent = cantidad;
      $("barra" + clave).style.width = pct(cantidad) + "%";
      if (clave !== "Aprobadas") $("pct" + clave).textContent = `${pct(cantidad)}% del total`;
    });
    $("bannerTotal").textContent = `${total} ${total === 1 ? "solicitud" : "solicitudes"}`;
    campana();
  }

  // Campanita: pendientes de la administración
  function campana() {
    const n = estado => solicitudes.filter(s => s.estado === estado).length;
    const filas = [
      [n("PENDIENTE"), "PENDIENTE", "c-naranja", "pendiente", "pendientes", "Esperan su revisión", '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'],
      [n("EN_EVALUACION"), "EN_EVALUACION", "c-azul", "en evaluación", "en evaluación", "Falta aprobarlas, observarlas o rechazarlas", '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'],
      [n("APROBADA"), "APROBADA", "c-celeste", "aprobada sin técnico", "aprobadas sin técnico", "Asigna al técnico de la instalación", '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>']
    ].filter(f => f[0] > 0);
    const total = filas.reduce((suma, f) => suma + f[0], 0);
    const insignia = $("campanaBadge");
    insignia.hidden = total === 0;
    insignia.textContent = total > 99 ? "99+" : total;
    $("campanaLista").innerHTML = filas.length
      ? filas.map(([cant, estado, color, uno, varios, sub, trazo]) => `
        <a href="#" class="dp-notif" data-notif="${estado}">
          <span class="dp-cab-ico ${color}"><svg class="dp-ico" viewBox="0 0 24 24">${trazo}</svg></span>
          <span><strong>${cant} ${cant === 1 ? "solicitud " + uno : "solicitudes " + varios}</strong><small>${sub}</small></span>
        </a>`).join("")
      : '<div class="dp-notif-ok">Estás al día. No hay pendientes.</div>';
  }

  function render() {
    const q = $("buscarSolicitud").value.trim().toLowerCase(), e = $("filtroEstado").value;
    const lista = solicitudes
      .filter(s => (!e || s.estado === e) && (!grupo || grupo.includes(s.estado)) && (!q || [codigo(s), cliente(s).nombreCompleto, cliente(s).dni, s.direccion].some(v => (v || "").toLowerCase().includes(q))))
      .sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
    $("resumenFiltro").textContent = lista.length === solicitudes.length
      ? "Solicitudes de nueva conexión enviadas por los ciudadanos"
      : `Mostrando ${lista.length} de ${solicitudes.length} solicitudes`;
    $("solTabla").innerHTML = lista.length ? lista.map(s => {
      const c = cliente(s), nombre = c.nombreCompleto || "—";
      return `
      <tr class="click" data-id="${s.id}">
        <td class="pc-codigo">${esc(codigo(s))}</td>
        <td><div class="pc-persona"><span class="pc-avatar" style="background:${Panel.gradiente(nombre)}">${esc(Panel.iniciales(nombre))}</span><span><strong>${esc(nombre)}</strong><span class="pc-sub">DNI: ${esc(c.dni || "—")}</span></span></div></td>
        <td class="sp-dir" title="${esc(s.direccion)}">${esc(s.direccion)}</td>
        <td>${fecha(s.fechaSolicitud)}</td>
        <td><span class="dp-pill ${PILL[s.estado] || "p-gris"}">${esc(ESTADO[s.estado] || s.estado)}</span></td>
        <td><button type="button" class="sp-gestionar" data-id="${s.id}">Gestionar</button></td>
      </tr>`;
    }).join("") : `<tr><td colspan="6" class="pc-vacio"><h4>Sin resultados</h4>No hay solicitudes con esos filtros.</td></tr>`;
  }

  function abrir(id) {
    const s = actual = solicitudes.find(x => x.id === id);
    if (!s) return;
    const c = cliente(s), acciones = SIGUIENTES[s.estado] || [];
    const mapa = s.latitud != null && s.longitud != null
      ? `<a href="https://www.openstreetmap.org/?mlat=${s.latitud}&mlon=${s.longitud}#map=18/${s.latitud}/${s.longitud}" target="_blank" rel="noopener">Ver en el mapa</a>`
      : "No indicada";
    $("solKicker").textContent = codigo(s);
    $("solCuerpo").innerHTML = `
      <span class="sol-badge e-${esc(s.estado)}">${esc(ESTADO[s.estado] || s.estado)}</span>
      <dl class="sol-datos">
        <div><dt>Cliente</dt><dd>${esc(c.nombreCompleto || "—")}</dd></div>
        <div><dt>DNI · Teléfono</dt><dd>${esc(c.dni || "—")} · ${esc(c.telefono || "—")}</dd></div>
        <div class="ancho"><dt>Dirección del predio</dt><dd>${esc(s.direccion)}</dd></div>
        <div><dt>Referencia</dt><dd>${esc(s.referencia || "—")}</dd></div>
        <div><dt>Ubicación</dt><dd>${mapa}</dd></div>
        <div class="ancho"><dt>Detalles del cliente</dt><dd>${esc(s.descripcion || "—")}</dd></div>
        ${s.observaciones ? `<div class="ancho"><dt>Observaciones registradas</dt><dd>${esc(s.observaciones)}</dd></div>` : ""}
      </dl>
      ${acciones.length ? `
        <div class="sol-decision">
          <label for="solObs">Observación para el cliente <small>(obligatoria al observar o rechazar)</small></label>
          <textarea id="solObs" maxlength="1000" rows="3" placeholder="Ej. La dirección no coincide con la referencia. Cancela esta solicitud y envía una nueva con la dirección completa y el punto exacto marcado en el mapa."></textarea>
          <p class="sol-ayuda">El cliente la verá como «Indicaciones del personal» en Mis solicitudes.</p>
          <div class="sol-acciones">${acciones.map(a => `<button type="button" class="sol-btn ${ACCION[a][1]}" data-estado="${a}">${ACCION[a][0]}</button>`).join("")}</div>
        </div>` : ""}
      <div id="solOrden"></div>
      <p class="sol-error" id="solError" role="alert"></p>`;
    $("solModal").classList.add("show");
    if (["APROBADA", "EN_INSTALACION", "ACTIVADA"].includes(s.estado)) cargarOrden(s);
  }

  async function obtenerTecnicos() {
    if (!tecnicos) {
      const p = await apiFetch("/api/personal");
      tecnicos = (Array.isArray(p) ? p : []).filter(x => x.rol === "TECNICO" && (x.estado || "").toUpperCase() === "ACTIVO");
    }
    return tecnicos;
  }

  async function cargarOrden(s) {
    const cont = $("solOrden");
    cont.innerHTML = '<p class="sol-nota">Cargando orden de instalación...</p>';
    try {
      const o = await apiFetch(`/api/ordenes-instalacion/solicitud/${s.id}`);
      let html = `<div class="sol-orden"><h4>Orden de instalación <span>${esc(o.codigo)}</span></h4>
        <dl class="sol-datos">
          <div><dt>Estado de la orden</dt><dd>${esc(o.estado.replace(/_/g, " "))}</dd></div>
          <div><dt>Técnico</dt><dd>${esc(o.tecnicoNombre || "Sin asignar")}</dd></div>
          <div><dt>Visita programada</dt><dd>${o.fechaProgramada ? fechaHora(o.fechaProgramada) : "Pendiente de programación"}</dd></div>
          <div><dt>Medidor</dt><dd>${esc(o.numeroSerieMedidor || "Pendiente de instalación")}</dd></div>
          ${o.codigoSuministro ? `<div><dt>Suministro creado</dt><dd>${esc(o.codigoSuministro)}</dd></div>` : ""}
          ${o.lecturaInicial != null ? `<div><dt>Lectura inicial</dt><dd>${esc(o.lecturaInicial)}</dd></div>` : ""}
        </dl>`;
      if (["PENDIENTE_ASIGNACION", "ASIGNADA"].includes(o.estado)) {
        const lista = await obtenerTecnicos();
        html += `
          <label for="solTecnico">${o.tecnicoId ? "Reasignar técnico" : "Asignar técnico"}</label>
          <select id="solTecnico"><option value="">Selecciona un técnico</option>${lista.map(t => `<option value="${t.id}" ${t.id === o.tecnicoId ? "selected" : ""}>${esc(t.nombre)}${t.especialidad ? " · " + esc(t.especialidad) : ""}</option>`).join("")}</select>
          <label for="solFecha">Fecha de la visita <small>(opcional)</small></label>
          <input type="datetime-local" id="solFecha">
          <div class="sol-acciones"><button type="button" class="sol-btn primario" id="solAsignar" data-orden="${o.id}">${o.tecnicoId ? "Guardar cambios" : "Asignar técnico"}</button></div>`;
      }
      cont.innerHTML = html + "</div>";
    } catch (e) {
      cont.innerHTML = `<p class="sol-nota">${esc(e.message)}</p>`;
    }
  }

  $("solCuerpo").addEventListener("click", async e => {
    const err = $("solError"); err.textContent = "";

    const cambio = e.target.closest("[data-estado]");
    if (cambio) {
      const nuevo = cambio.dataset.estado, obs = $("solObs").value.trim();
      if (["OBSERVADA", "RECHAZADA"].includes(nuevo) && !obs) { err.textContent = "Escribe una observación para el cliente."; return; }
      if (nuevo === "RECHAZADA" && !confirm("¿Rechazar esta solicitud? El cliente verá tu observación.")) return;
      cambio.disabled = true;
      try {
        await patch(`/api/solicitudes-servicio/${actual.id}/estado`, { estado: nuevo, observaciones: obs || null });
        toast(nuevo === "APROBADA" ? "Solicitud aprobada. Se generó la orden de instalación." : "Estado actualizado.");
        const id = actual.id; await cargar(); abrir(id);
      } catch (x) { err.textContent = x.message; cambio.disabled = false; }
      return;
    }

    const asignar = e.target.closest("#solAsignar");
    if (asignar) {
      const tecnico = $("solTecnico").value, f = $("solFecha").value;
      if (!tecnico) { err.textContent = "Selecciona un técnico."; return; }
      asignar.disabled = true;
      try {
        await patch(`/api/ordenes-instalacion/${asignar.dataset.orden}/asignar`, { tecnicoId: Number(tecnico), fechaProgramada: f || null });
        toast("Técnico asignado. La solicitud pasó a En instalación.");
        const id = actual.id; await cargar(); abrir(id);
      } catch (x) { err.textContent = x.message; asignar.disabled = false; }
    }
  });

  $("solTabla").addEventListener("click", e => { const b = e.target.closest("[data-id]"); if (b) abrir(Number(b.dataset.id)); });
  const cerrar = () => $("solModal").classList.remove("show");
  $("solCerrar").addEventListener("click", cerrar);
  $("solModal").addEventListener("click", e => { if (e.target === $("solModal")) cerrar(); });
  const tarjetas = document.querySelectorAll(".sp-kpi");
  function marcar() {
    const clave = grupo ? grupo.join(",") : $("filtroEstado").value;
    tarjetas.forEach(t => t.classList.toggle("activo", t.dataset.grupo === clave));
  }
  tarjetas.forEach(t => {
    const accion = () => {
      const g = t.dataset.grupo;
      grupo = t.classList.contains("activo") && g ? null : (g ? g.split(",") : null);
      $("filtroEstado").value = "";
      marcar(); render();
    };
    t.addEventListener("click", accion);
    t.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); accion(); } });
  });
  $("buscarSolicitud").addEventListener("input", render);
  $("filtroEstado").addEventListener("change", () => { grupo = null; marcar(); render(); });
  $("btnLimpiar").addEventListener("click", () => { $("buscarSolicitud").value = ""; $("filtroEstado").value = ""; grupo = null; marcar(); render(); });

  $("campanaBtn").addEventListener("click", e => {
    e.stopPropagation();
    const menu = $("campanaMenu"), abrir = !menu.classList.contains("abierto");
    document.querySelectorAll(".dp-menu.abierto").forEach(m => m.classList.remove("abierto"));
    menu.classList.toggle("abierto", abrir);
    $("campanaBtn").setAttribute("aria-expanded", String(abrir));
  });
  $("campanaMenu").addEventListener("click", e => {
    e.stopPropagation();
    const fila = e.target.closest("[data-notif]");
    if (!fila) return;
    e.preventDefault();
    grupo = [fila.dataset.notif]; $("filtroEstado").value = "";
    marcar(); render();
    $("campanaMenu").classList.remove("abierto");
  });

  cargar();
});