// Pantalla del técnico: sus órdenes de instalación y registro del medidor
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || "Usuario";
  const rol = localStorage.getItem("rol") || "Usuario";
  if (!token) { window.location.href = "login.html"; return; }
  if (rol !== "TECNICO") { window.location.href = "dashboard.html"; return; }

  const $ = id => document.getElementById(id);
  $("usernameDisplay").textContent = username;
  $("roleDisplay").textContent = rol;
  $("userAvatar").textContent = username.charAt(0).toUpperCase();
  $("logoutButton").addEventListener("click", () => {
    ["token", "username", "rol", "personalId", "clienteId"].forEach(k => localStorage.removeItem(k));
    window.location.href = "login.html";
  });

  const ORDEN = {
    PENDIENTE_ASIGNACION: ["Pendiente", "PENDIENTE"], ASIGNADA: ["Por instalar", "APROBADA"],
    COMPLETADA: ["Instalada", "ACTIVADA"], CANCELADA: ["Cancelada", "CANCELADA"]
  };
  const esc = v => { const e = document.createElement("span"); e.textContent = v ?? ""; return e.innerHTML; };
  const fechaHora = v => new Date(v).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
  let ordenes = [], timer;

  function toast(mensaje, error = false) {
    const t = $("clientesToast");
    t.textContent = mensaje; t.classList.toggle("error", error); t.classList.add("show");
    clearTimeout(timer); timer = setTimeout(() => t.classList.remove("show"), 3500);
  }

  async function cargar() {
    try {
      const r = await apiFetch("/api/ordenes-instalacion/mis-ordenes");
      ordenes = Array.isArray(r) ? r : [];
      render();
    } catch (e) {
      $("instLista").innerHTML = `<p class="sol-nota">${esc(e.message)}</p>`;
    }
  }

  function tarjeta(o) {
    const [texto, clase] = ORDEN[o.estado] || [o.estado, "PENDIENTE"];
    const mapa = o.latitud != null && o.longitud != null
      ? `<a href="https://www.openstreetmap.org/?mlat=${o.latitud}&mlon=${o.longitud}#map=18/${o.latitud}/${o.longitud}" target="_blank" rel="noopener">Ver en el mapa</a>` : "No indicada";
    const form = o.estado === "ASIGNADA" ? `
      <form class="inst-form" data-orden="${o.id}" autocomplete="off">
        <label>Número de serie del medidor *</label><input name="serie" maxlength="50" required>
        <label>Lectura inicial del medidor (m³) *</label><input name="lectura" type="number" min="0" step="0.01" required>
        <label>Resultado de la instalación <small>(opcional)</small></label><textarea name="resultado" rows="2" maxlength="1000"></textarea>
        <p class="sol-error" role="alert"></p>
        <button type="submit" class="sol-btn ok">Registrar medidor y completar</button>
      </form>` : "";
    return `
      <article class="inst-card">
        <header><div><small>${esc(o.codigo)}</small><h3>${esc(o.direccion)}</h3></div><span class="sol-badge e-${clase}">${texto}</span></header>
        <dl class="sol-datos">
          <div><dt>Cliente</dt><dd>${esc(o.clienteNombre)}</dd></div>
          <div><dt>Teléfono</dt><dd>${esc(o.clienteTelefono || "—")}</dd></div>
          <div><dt>Referencia</dt><dd>${esc(o.referencia || "—")}</dd></div>
          <div><dt>Ubicación</dt><dd>${mapa}</dd></div>
          <div class="ancho"><dt>Visita programada</dt><dd>${o.fechaProgramada ? fechaHora(o.fechaProgramada) : "Sin fecha confirmada"}</dd></div>
          ${o.numeroSerieMedidor ? `<div><dt>Medidor</dt><dd>${esc(o.numeroSerieMedidor)}</dd></div><div><dt>Suministro creado</dt><dd>${esc(o.codigoSuministro || "—")}</dd></div><div><dt>Lectura inicial</dt><dd>${o.lecturaInicial != null ? esc(o.lecturaInicial) + " m³" : "—"}</dd></div>` : ""}
        </dl>${form}
      </article>`;
  }

  function render() {
    $("instLista").innerHTML = ordenes.length
      ? ordenes.map(tarjeta).join("")
      : '<p class="sol-nota">Todavía no tienes instalaciones asignadas.</p>';
  }

  $("instLista").addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.target, err = form.querySelector(".sol-error"), boton = form.querySelector("button");
    err.textContent = "";
    if (!confirm("Se creará el suministro del cliente y la solicitud quedará ACTIVADA. ¿Confirmas los datos del medidor?")) return;
    boton.disabled = true; boton.textContent = "Registrando...";
    try {
      await apiFetch(`/api/ordenes-instalacion/${form.dataset.orden}/completar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroSerie: form.serie.value.trim(), lecturaInicial: Number(form.lectura.value), resultado: form.resultado.value.trim() || null })
      });
      toast("Instalación registrada. El servicio quedó activado y la lectura inicial guardada.");
      await cargar();
    } catch (x) {
      err.textContent = x.message;
      boton.disabled = false; boton.textContent = "Registrar medidor y completar";
    }
  });

  cargar();
});
