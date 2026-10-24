// Pantalla admin: validar solicitudes de servicio y asignar técnico de instalación
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || "Usuario";
  const rol = localStorage.getItem("rol") || "Usuario";
  if (!token) { window.location.href = "login.html"; return; }
  if (!["ADMIN", "SOPORTE"].includes(rol)) { window.location.href = "dashboard.html"; return; }

  const $ = id => document.getElementById(id);
  $("usernameDisplay").textContent = username;
  $("roleDisplay").textContent = rol;
  $("userAvatar").textContent = username.charAt(0).toUpperCase();
  $("logoutButton").addEventListener("click", () => {
    ["token", "username", "rol", "personalId", "clienteId"].forEach(k => localStorage.removeItem(k));
    window.location.href = "login.html";
  });

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

  function stats() {
    const n = lista => solicitudes.filter(s => lista.includes(s.estado)).length;
    $("stRevisar").textContent = n(["PENDIENTE", "EN_EVALUACION"]);
    $("stObservadas").textContent = n(["OBSERVADA"]);
    $("stInstalacion").textContent = n(["APROBADA", "EN_INSTALACION"]);
    $("stActivadas").textContent = n(["ACTIVADA"]);
  }

  function render() {
    const q = $("buscarSolicitud").value.trim().toLowerCase(), e = $("filtroEstado").value;
    const lista = solicitudes
      .filter(s => (!e || s.estado === e) && (!q || [codigo(s), cliente(s).nombreCompleto, cliente(s).dni, s.direccion].some(v => (v || "").toLowerCase().includes(q))))
      .sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
    $("solTabla").innerHTML = lista.length ? lista.map(s => `
      <tr>
        <td><strong>${esc(codigo(s))}</strong></td>
        <td>${esc(cliente(s).nombreCompleto || "—")}<br><small>DNI: ${esc(cliente(s).dni || "—")}</small></td>
        <td>${esc(s.direccion)}</td>
        <td>${fecha(s.fechaSolicitud)}</td>
        <td><span class="sol-badge e-${esc(s.estado)}">${esc(ESTADO[s.estado] || s.estado)}</span></td>
        <td><button type="button" class="sol-btn secundario" data-id="${s.id}">Gestionar</button></td>
      </tr>`).join("") : `<tr><td colspan="6" class="clientes-vacio">No hay solicitudes con esos filtros.</td></tr>`;
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
  $("buscarSolicitud").addEventListener("input", render);
  $("filtroEstado").addEventListener("change", render);
  cargar();
});
