// Lecturas de medidores: ADMIN, SOPORTE y TECNICO registran; ADMIN y SOPORTE anulan
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || "Usuario";
  const rol = localStorage.getItem("rol") || "Usuario";
  if (!token) { window.location.href = "login.html"; return; }
  if (!["ADMIN", "SOPORTE", "TECNICO"].includes(rol)) { window.location.href = "dashboard.html"; return; }
  const PUEDE_ANULAR = ["ADMIN", "SOPORTE"].includes(rol);
  const PUEDE_SIMULAR = rol === "ADMIN";

  const $ = id => document.getElementById(id);
  $("usernameDisplay").textContent = username;
  $("roleDisplay").textContent = rol;
  $("userAvatar").textContent = username.charAt(0).toUpperCase();

  function cerrarSesion() {
    ["token", "username", "rol", "personalId", "clienteId"].forEach(k => localStorage.removeItem(k));
    window.location.href = "login.html";
  }
  $("logoutButton")?.addEventListener("click", cerrarSesion);
  $("logoutMenu")?.addEventListener("click", cerrarSesion);

  function cerrarMenusCabecera() {
    document.querySelectorAll(".dp-menu.abierto").forEach(menu => menu.classList.remove("abierto"));
    document.querySelectorAll(".dp-acciones [aria-expanded='true']").forEach(boton => boton.setAttribute("aria-expanded", "false"));
  }
  [["usuarioBtn", "usuarioMenu"], ["campanaBtn", "campanaMenu"]].forEach(([botonId, menuId]) => {
    const boton = $(botonId), menu = $(menuId);
    if (!boton || !menu) return;
    boton.addEventListener("click", evento => {
      evento.stopPropagation();
      const abrir = !menu.classList.contains("abierto");
      cerrarMenusCabecera();
      menu.classList.toggle("abierto", abrir);
      boton.setAttribute("aria-expanded", String(abrir));
    });
  });
  document.addEventListener("click", cerrarMenusCabecera);
  document.addEventListener("keydown", evento => { if (evento.key === "Escape") cerrarMenusCabecera(); });

  const ORIGEN = { INICIAL: ["Inicial", "e-APROBADA"], MANUAL: ["Manual", "e-ACTIVADA"], SIMULADA: ["SIMULADA", "e-EN_INSTALACION"] };
  const LECTURA = { SIN_INICIAL: "Sin lectura inicial", PENDIENTE: "Pendiente", LEIDO: "Leído", SIMULADO: "Simulado" };
  const esc = v => { const e = document.createElement("span"); e.textContent = v ?? ""; return e.innerHTML; };
  const num = v => v == null ? "—" : Number(v).toLocaleString("es-PE", { maximumFractionDigits: 3 });
  const fecha = v => v ? new Date(String(v).slice(0, 10) + "T00:00:00").toLocaleDateString("es-PE") : "—";
  const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const periodoActual = hoy().slice(0, 7);
  const badgeOrigen = o => { const [t, c] = ORIGEN[o] || [o, ""]; return `<span class="sol-badge ${c}">${esc(t)}</span>`; };

  let medidores = [], actual = null, historial = [], anulandoId = null, timer;
  const estadoDe = m => m.ultimaLecturaActual == null ? "SIN_INICIAL" : m.ultimoOrigen === "SIMULADA" ? "SIMULADO" : (String(m.ultimoPeriodo).slice(0, 7) === periodoActual ? "LEIDO" : "PENDIENTE");

  function toast(mensaje, error = false) {
    const t = $("clientesToast");
    t.textContent = mensaje; t.classList.toggle("error", error); t.classList.add("show");
    clearTimeout(timer); timer = setTimeout(() => t.classList.remove("show"), 3500);
  }

  async function cargar() {
    try {
      const r = await apiFetch("/api/lecturas/medidores");
      medidores = Array.isArray(r) ? r : [];
      stats(); render();
    } catch (e) {
      $("lecTabla").innerHTML = `<tr><td colspan="7" class="clientes-vacio">${esc(e.message)}</td></tr>`;
    }
  }

  function stats() {
    const n = e => medidores.filter(m => estadoDe(m) === e).length;
    $("stActivos").textContent = medidores.length;
    $("stSinInicial").textContent = n("SIN_INICIAL");
    $("stLeidos").textContent = n("LEIDO");
    $("stPendientes").textContent = n("PENDIENTE");
    $("lecBorrarTodas").hidden = !(PUEDE_SIMULAR && medidores.some(m => m.ultimoOrigen === "SIMULADA"));
  }

  function render() {
    const q = $("buscarMedidor").value.trim().toLowerCase(), f = $("filtroLectura").value;
    const lista = medidores.filter(m => (!f || estadoDe(m) === f)
      && (!q || [m.codigoSuministro, m.numeroSerie, m.direccion].some(v => (v || "").toLowerCase().includes(q))));
    $("lecTabla").innerHTML = lista.length ? lista.map(m => {
      const e = estadoDe(m);
      return `<tr>
        <td><strong>${esc(m.codigoSuministro)}</strong></td>
        <td>${esc(m.numeroSerie)}</td>
        <td>${esc(m.direccion)}</td>
        <td>${m.ultimaLecturaActual == null ? "—" : `${num(m.ultimaLecturaActual)} m³<br><small>${fecha(m.ultimaFechaLectura)} ${badgeOrigen(m.ultimoOrigen)}</small>`}</td>
        <td>${m.ultimoConsumoM3 == null ? "—" : num(m.ultimoConsumoM3) + " m³"}</td>
        <td><span class="sol-badge e-${e}">${LECTURA[e]}</span></td>
        <td><button type="button" class="sol-btn secundario mini" data-id="${m.medidorId}">${e === "SIN_INICIAL" ? "Registrar inicial" : "Lecturas"}</button></td>
      </tr>`;
    }).join("") : `<tr><td colspan="7" class="clientes-vacio">No hay medidores con esos filtros.</td></tr>`;
  }

  async function abrir(id) {
    actual = medidores.find(m => m.medidorId === id);
    if (!actual) return;
    anulandoId = null;
    $("lecKicker").textContent = "Suministro " + actual.codigoSuministro;
    $("lecCuerpo").innerHTML = '<p class="lec-nota" style="padding:20px 23px">Cargando lecturas...</p>';
    $("lecModal").classList.add("show");
    try {
      const h = await apiFetch(`/api/lecturas/medidor/${id}`);
      historial = (Array.isArray(h) ? h : []).sort((a, b) => String(b.fechaLectura).localeCompare(String(a.fechaLectura)) || b.id - a.id);
    } catch (e) { historial = []; toast(e.message, true); }
    pintar();
  }

  function pintar() {
    const m = actual, ultima = historial.find(l => l.estado !== "ANULADA"), sinInicial = !ultima;
    const bloq = ultima && ultima.simulada ? "disabled" : "";
    const hayApagar = historial.some(l => l.simulada);
    $("lecCuerpo").innerHTML = `
      <div style="padding:20px 23px 26px">
        <dl class="sol-datos" style="margin-top:0">
          <div><dt>Medidor</dt><dd>${esc(m.numeroSerie)}</dd></div>
          <div><dt>Instalado</dt><dd>${fecha(m.fechaInstalacion)}</dd></div>
          <div class="ancho"><dt>Dirección</dt><dd>${esc(m.direccion)}</dd></div>
        </dl>
        ${hayApagar ? '<p class="lec-aviso"><strong>Hay lecturas SIMULADAS</strong> (datos de prueba, no facturables).</p>' : ""}
        <div class="sol-decision">
          <div class="lec-form">
            <div><label for="lecValor">${sinInicial ? "Lectura inicial" : "Lectura actual"} (m³)</label><input id="lecValor" type="number" min="0" step="0.001" inputmode="decimal" ${bloq}></div>
            <div><label for="lecFecha">Fecha de la lectura</label><input id="lecFecha" type="date" max="${hoy()}" value="${hoy()}" ${bloq}></div>
            <div class="ancho"><label for="lecObs">Observación <small>(opcional)</small></label><input id="lecObs" maxlength="255"></div>
          </div>
          <p class="lec-prev" id="lecPrev">${bloq ? "Hay lecturas simuladas al final del historial: bórralas para registrar lecturas reales." : sinInicial ? "Será la lectura inicial del medidor: sirve de base para el consumo." : `Última lectura: <strong>${num(ultima.lecturaActual)} m³</strong> el ${fecha(ultima.fechaLectura)}.`}</p>
          <div class="sol-acciones"><button type="button" class="sol-btn ok" id="lecRegistrar" ${bloq}>${sinInicial ? "Registrar lectura inicial" : "Registrar lectura"}</button></div>
        </div>
        <p class="sol-error" id="lecError" role="alert"></p>
        ${PUEDE_SIMULAR ? `<div class="lec-sim"><strong>Datos de prueba</strong>
          <p>Genera lecturas mensuales SIMULADAS a continuación de la última. Las fechas avanzan en el tiempo y nunca son facturables.</p>
          <div class="lec-sim-fila">
            <select id="simMeses"><option value="1">1 mes</option><option value="3" selected>3 meses</option><option value="6">6 meses</option><option value="12">12 meses</option></select>
            <button type="button" class="sol-btn primario mini" id="simGenerar" ${sinInicial ? "disabled" : ""}>Generar consumo simulado</button>
            ${hayApagar ? '<button type="button" class="sol-btn peligro mini" id="simBorrar">Borrar simuladas</button>' : ""}
          </div>
          ${sinInicial ? '<p class="lec-nota" style="margin:10px 0 0">Registra primero la lectura inicial.</p>' : ""}
        </div>` : ""}
        ${anulandoId ? `<div class="lec-anular"><label for="anuMotivo">Motivo de la anulación *</label><input id="anuMotivo" maxlength="255" placeholder="Ej. Lectura digitada con un dígito de más"><p class="lec-nota">La lectura no se borra: queda en el historial con tu nombre y este motivo.</p><div class="sol-acciones"><button type="button" class="sol-btn peligro" id="anuConfirmar">Anular lectura</button><button type="button" class="sol-btn secundario" id="anuCancelar">Cancelar</button></div></div>` : ""}
        <h4 class="lec-hist-titulo">Historial de lecturas</h4>
        ${historial.length ? `<table class="lec-hist"><thead><tr><th>Periodo</th><th class="num">Anterior</th><th class="num">Actual</th><th class="num">Consumo</th><th>Origen</th><th>Registró</th><th></th></tr></thead><tbody>
          ${historial.map(l => `<tr class="${l.estado === "ANULADA" ? "anulada" : ""}">
            <td>${esc(l.periodo)}<br><small>${fecha(l.fechaLectura)}</small></td>
            <td class="num">${l.origen === "INICIAL" ? "—" : num(l.lecturaAnterior)}</td>
            <td class="num"><strong>${num(l.lecturaActual)}</strong></td>
            <td class="num">${l.origen === "INICIAL" ? "—" : num(l.consumoM3) + " m³"}</td>
            <td>${badgeOrigen(l.origen)}</td>
            <td>${esc(l.registradoPor || "—")}${l.estado === "ANULADA" ? `<br><small>Anulada por ${esc(l.anuladaPor || "—")} el ${fecha(l.fechaAnulacion)}: ${esc(l.motivoAnulacion || "—")}</small>` : ""}</td>
            <td>${ultima && l.id === ultima.id && l.origen !== "INICIAL" && PUEDE_ANULAR && !anulandoId ? `<button type="button" class="sol-btn peligro mini" data-anular="${l.id}">Anular</button>` : ""}</td>
          </tr>`).join("")}</tbody></table>` : '<p class="lec-nota">Este medidor todavía no tiene lecturas.</p>'}
      </div>`;
    previsualizar();
  }

  function previsualizar() {
    const prev = $("lecPrev"), ultima = historial.find(l => l.estado !== "ANULADA"), v = $("lecValor").value;
    if (!ultima || v === "") return;
    const consumo = Number(v) - Number(ultima.lecturaActual);
    prev.classList.remove("ok", "mal");
    if (consumo < 0) { prev.classList.add("mal"); prev.innerHTML = `La lectura es menor que la anterior (${num(ultima.lecturaActual)} m³). Revisa el valor.`; }
    else { prev.classList.add("ok"); prev.innerHTML = `Consumo del periodo: ${num(Math.round(consumo * 1000) / 1000)} m³`; }
  }

  $("lecCuerpo").addEventListener("input", e => { if (e.target.id === "lecValor") previsualizar(); });

  $("lecCuerpo").addEventListener("click", async e => {
    const err = $("lecError"); if (err) err.textContent = "";

    if (e.target.closest("#lecRegistrar")) {
      const boton = $("lecRegistrar"), valor = $("lecValor").value;
      if (valor === "") { err.textContent = "Ingresa el valor de la lectura."; return; }
      boton.disabled = true;
      try {
        await apiFetch("/api/lecturas", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ medidorId: actual.medidorId, lecturaActual: Number(valor), fechaLectura: $("lecFecha").value, observacion: $("lecObs").value.trim() || null })
        });
        toast("Lectura registrada.");
        const id = actual.medidorId; await cargar(); abrir(id);
      } catch (x) { err.textContent = x.message; boton.disabled = false; }
      return;
    }

    if (e.target.closest("#simGenerar")) {
      const b = $("simGenerar"); b.disabled = true; b.textContent = "Generando...";
      try {
        const r = await apiFetch(`/api/lecturas/medidor/${actual.medidorId}/simular`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meses: Number($("simMeses").value) })
        });
        toast(`${r.length} lectura(s) simulada(s) generada(s).`);
        const id = actual.medidorId; await cargar(); abrir(id);
      } catch (x) { err.textContent = x.message; b.disabled = false; b.textContent = "Generar consumo simulado"; }
      return;
    }

    if (e.target.closest("#simBorrar")) {
      if (!confirm("¿Borrar todas las lecturas SIMULADAS de este medidor? No se puede deshacer.")) return;
      try {
        const r = await apiFetch(`/api/lecturas/medidor/${actual.medidorId}/simuladas`, { method: "DELETE" });
        toast(`${r.eliminadas} lectura(s) simulada(s) eliminada(s).`);
        const id = actual.medidorId; await cargar(); abrir(id);
      } catch (x) { err.textContent = x.message; }
      return;
    }

    if (e.target.closest("#anuCancelar")) { anulandoId = null; pintar(); return; }

    if (e.target.closest("#anuConfirmar")) {
      const motivo = $("anuMotivo").value.trim();
      if (!motivo) { err.textContent = "Escribe el motivo de la anulación."; return; }
      const b = $("anuConfirmar"); b.disabled = true;
      try {
        await apiFetch(`/api/lecturas/${anulandoId}/anular`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ motivo })
        });
        toast("Lectura anulada. Queda registrada en el historial.");
        anulandoId = null;
        const id = actual.medidorId; await cargar(); abrir(id);
      } catch (x) { err.textContent = x.message; b.disabled = false; }
      return;
    }

    const anular = e.target.closest("[data-anular]");
    if (anular) { anulandoId = Number(anular.dataset.anular); pintar(); const campo = $("anuMotivo"); if (campo) campo.focus(); }
  });

  $("lecTabla").addEventListener("click", e => { const b = e.target.closest("[data-id]"); if (b) abrir(Number(b.dataset.id)); });
  const cerrar = () => $("lecModal").classList.remove("show");
  $("lecCerrar").addEventListener("click", cerrar);
  $("lecModal").addEventListener("click", e => { if (e.target === $("lecModal")) cerrar(); });
  $("lecBorrarTodas").addEventListener("click", async () => {
    if (!confirm("¿Borrar TODAS las lecturas SIMULADAS del sistema? No se puede deshacer.")) return;
    try {
      const r = await apiFetch("/api/lecturas/simuladas", { method: "DELETE" });
      toast(`${r.eliminadas} lectura(s) simulada(s) eliminada(s).`);
      cargar();
    } catch (x) { toast(x.message, true); }
  });
  $("buscarMedidor").addEventListener("input", render);
  $("filtroLectura").addEventListener("change", render);
  cargar();
});
