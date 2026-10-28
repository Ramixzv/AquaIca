// Recibos: ADMIN y SOPORTE generan y consultan; solo ADMIN anula
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || "Usuario";
  const rol = localStorage.getItem("rol") || "Usuario";
  if (!token) { window.location.href = "login.html"; return; }
  if (!["ADMIN", "SOPORTE"].includes(rol)) { window.location.href = "dashboard.html"; return; }
  const PUEDE_ANULAR = rol === "ADMIN";

  const $ = id => document.getElementById(id);
  $("usernameDisplay").textContent = username;
  $("roleDisplay").textContent = rol;
  $("userAvatar").textContent = username.charAt(0).toUpperCase();
  const colorAvatarPorRol = {
    ADMIN: "avatar-admin",
    SOPORTE: "avatar-soporte",
    TECNICO: "avatar-tecnico",
    CIUDADANO: "avatar-ciudadano"
  };
  $("userAvatar").classList.add(colorAvatarPorRol[rol] || "avatar-admin");
  $("logoutButton").addEventListener("click", () => {
    ["token", "username", "rol", "personalId", "clienteId"].forEach(k => localStorage.removeItem(k));
    window.location.href = "login.html";
  });


  $("logoutMenu")?.addEventListener("click", () => {
    ["token", "username", "rol", "personalId", "clienteId"].forEach(k => localStorage.removeItem(k));
    window.location.href = "login.html";
  });

  function cerrarMenusRecibos() {
    document.querySelectorAll(".dp-menu.abierto").forEach(menu => menu.classList.remove("abierto"));
    document.querySelectorAll(".dp-acciones [aria-expanded='true']").forEach(button => button.setAttribute("aria-expanded", "false"));
  }
  [["usuarioBtn", "usuarioMenu"], ["campanaBtn", "campanaMenu"]].forEach(([buttonId, menuId]) => {
    const button = $(buttonId), menu = $(menuId);
    if (!button || !menu) return;
    button.addEventListener("click", event => {
      event.stopPropagation();
      const open = !menu.classList.contains("abierto");
      cerrarMenusRecibos();
      menu.classList.toggle("abierto", open);
      button.setAttribute("aria-expanded", String(open));
    });
  });
  document.addEventListener("click", cerrarMenusRecibos);
  document.addEventListener("keydown", event => { if (event.key === "Escape") cerrarMenusRecibos(); });

  const ESTADO = { PENDIENTE: ["Pendiente", "e-PENDIENTE"], VENCIDO: ["Vencido", "e-RECHAZADA"], PAGADO: ["Pagado", "e-ACTIVADA"], ANULADO: ["Anulado", "e-CANCELADA"] };
  const esc = v => { const e = document.createElement("span"); e.textContent = v ?? ""; return e.innerHTML; };
  const soles = v => v == null ? "—" : "S/ " + Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const m3 = v => v == null ? "—" : Number(v).toLocaleString("es-PE", { maximumFractionDigits: 3 }) + " m³";
  const fecha = v => v ? new Date(String(v).slice(0, 10) + "T00:00:00").toLocaleDateString("es-PE") : "—";
  const mes = p => new Date(p + "-01T00:00:00").toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  const badge = r => { const [t, c] = ESTADO[r.estadoVisible] || [r.estadoVisible, ""]; return `<span class="sol-badge ${c}">${t}</span>`; };
  const prueba = '<span class="sol-badge e-EN_INSTALACION">DE PRUEBA</span>';
  const JSON_H = { "Content-Type": "application/json" };

  let recibos = [], actual = null, timer;

  function toast(mensaje, error = false) {
    const t = $("clientesToast");
    t.textContent = mensaje; t.classList.toggle("error", error); t.classList.add("show");
    clearTimeout(timer); timer = setTimeout(() => t.classList.remove("show"), 4000);
  }

  const hoy = new Date();
  $("recPeriodo").value = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  async function cargar() {
    try {
      const r = await apiFetch("/api/recibos");
      recibos = Array.isArray(r) ? r : [];
      stats(); render();
    } catch (e) {
      $("recTabla").innerHTML = `<tr><td colspan="8" class="clientes-vacio">${esc(e.message)}</td></tr>`;
    }
  }

  function stats() {
    const reales = recibos.filter(r => !r.dePrueba);
    const grupo = est => reales.filter(r => r.estadoVisible === est);
    const suma = l => l.reduce((a, r) => a + Number(r.total), 0);
    const [p, v, g] = [grupo("PENDIENTE"), grupo("VENCIDO"), grupo("PAGADO")];
    $("stPend").textContent = p.length;  $("stPendMonto").textContent = soles(suma(p));
    $("stVenc").textContent = v.length;  $("stVencMonto").textContent = soles(suma(v));
    $("stPag").textContent = g.length;   $("stPagMonto").textContent = soles(suma(g));
    const t = recibos.filter(r => r.dePrueba && r.estado !== "ANULADO").length;
    $("stPrueba").textContent = t;       $("stPruebaSub").textContent = "no cuentan como cobro";
  }

  function render() {
    const q = $("buscarRecibo").value.trim().toLowerCase(), e = $("filtroEstadoRecibo").value, t = $("filtroTipoRecibo").value;
    const lista = recibos.filter(r => (!e || r.estadoVisible === e)
      && (!t || (t === "PRUEBA") === r.dePrueba)
      && (!q || [r.codigo, r.codigoSuministro, r.cliente].some(v => (v || "").toLowerCase().includes(q))));
    $("recTabla").innerHTML = lista.length ? lista.map(r => `
      <tr>
        <td><strong>${esc(r.codigo)}</strong>${r.dePrueba ? "<br>" + prueba : ""}</td>
        <td>${esc(r.codigoSuministro)}<br><small>${esc(r.cliente || "—")}</small></td>
        <td>${esc(mes(r.periodo))}</td>
        <td>${m3(r.consumoM3)}</td>
        <td><strong>${soles(r.total)}</strong></td>
        <td>${fecha(r.fechaVencimiento)}</td>
        <td>${badge(r)}</td>
        <td><button type="button" class="sol-btn secundario mini" data-id="${r.id}">Ver</button></td>
      </tr>`).join("") : `<tr><td colspan="8" class="clientes-vacio">No hay recibos con esos filtros.</td></tr>`;
  }

  function abrir(id) {
    const r = actual = recibos.find(x => x.id === id);
    if (!r) return;
    $("recKicker").textContent = r.codigo;
    $("recCuerpo").innerHTML = `
      <div style="padding:20px 23px 26px">
        ${badge(r)} ${r.dePrueba ? prueba : ""}
        ${r.dePrueba ? '<p class="rec-aviso"><strong>Recibo de prueba:</strong> nace de una lectura SIMULADA. No es un cobro real.</p>' : ""}
        <dl class="sol-datos">
          <div><dt>Suministro</dt><dd>${esc(r.codigoSuministro)}</dd></div>
          <div><dt>Cliente</dt><dd>${esc(r.cliente || "—")}</dd></div>
          <div class="ancho"><dt>Dirección</dt><dd>${esc(r.direccion || "—")}</dd></div>
          <div><dt>Periodo</dt><dd>${esc(mes(r.periodo))}</dd></div>
          <div><dt>Categoría</dt><dd>${r.categoria === "COMERCIAL" ? "Comercial" : "Doméstico"}</dd></div>
          <div><dt>Emisión</dt><dd>${fecha(r.fechaEmision)}</dd></div>
          <div><dt>Vencimiento</dt><dd>${fecha(r.fechaVencimiento)}</dd></div>
        </dl>
        <table class="rec-desglose">
          <tr><td>Cargo fijo mensual</td><td>${soles(r.cargoFijo)}</td></tr>
          <tr><td>Consumo<br><small>${m3(r.consumoM3)} × ${soles(r.precioM3)} por m³</small></td><td>${soles(r.importeConsumo)}</td></tr>
          <tr class="total"><td>Total a pagar</td><td>${soles(r.total)}</td></tr>
        </table>
        <p class="lec-nota" style="margin:12px 0 0;color:#718096;font-size:12px">Generado por ${esc(r.generadoPor || "—")}.</p>
        ${r.estado === "PAGADO" ? `<p class="rec-aviso" style="background:#e2f7ec;color:#12794e"><strong>Pagado</strong> el ${esc(new Date(r.fechaPago).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" }))} · Operación ${esc(r.codigoOperacion || "—")} · ${esc(r.medioPago || "—")}</p>` : ""}
        ${r.estado === "ANULADO" ? `<p class="rec-aviso" style="background:#fdeaea;color:#9b2420"><strong>Anulado</strong> por ${esc(r.anuladoPor || "—")} el ${fecha(r.fechaAnulacion)}: ${esc(r.motivoAnulacion || "—")}</p>` : ""}
        ${PUEDE_ANULAR && r.estado === "PENDIENTE" ? `
          <div class="rec-anular">
            <label for="recMotivo">Motivo de la anulación *</label>
            <input id="recMotivo" maxlength="255" placeholder="Ej. Se facturó con una lectura equivocada">
            <p class="rec-nota">El recibo no se borra: queda anulado con tu nombre y este motivo, y la lectura puede volver a facturarse.</p>
            <button type="button" class="sol-btn peligro" id="recAnular">Anular recibo</button>
          </div>` : ""}
        <p class="sol-error" id="recError" role="alert"></p>
      </div>`;
    $("recModal").classList.add("show");
  }

  $("recCuerpo").addEventListener("click", async e => {
    if (!e.target.closest("#recAnular")) return;
    const err = $("recError"); err.textContent = "";
    const motivo = $("recMotivo").value.trim();
    if (!motivo) { err.textContent = "Escribe el motivo de la anulación."; return; }
    if (!confirm("¿Anular este recibo? No se puede deshacer.")) return;
    const b = $("recAnular"); b.disabled = true;
    try {
      await apiFetch(`/api/recibos/${actual.id}/anular`, { method: "PATCH", headers: JSON_H, body: JSON.stringify({ motivo }) });
      toast("Recibo anulado.");
      const id = actual.id; await cargar(); abrir(id);
    } catch (x) { err.textContent = x.message; b.disabled = false; }
  });

  $("recGenerar").addEventListener("click", async () => {
    const periodo = $("recPeriodo").value;
    if (!periodo) { toast("Elige el periodo a facturar.", true); return; }
    const b = $("recGenerar"), caja = $("recResumen");
    b.disabled = true; b.textContent = "Generando...";
    try {
      const r = await apiFetch("/api/recibos/generar", { method: "POST", headers: JSON_H, body: JSON.stringify({ periodo }) });
      caja.hidden = false;
      caja.innerHTML = `<strong>${r.generados} recibo(s) generado(s)</strong>${r.dePrueba ? ` (${r.dePrueba} de prueba)` : ""} · ${r.yaFacturados} ya estaban facturados · ${r.sinTarifa} sin tarifa` +
        (r.avisos && r.avisos.length ? `<ul>${r.avisos.map(a => `<li>${esc(a)}</li>`).join("")}</ul>` : "");
      toast(r.generados ? "Recibos generados." : "No se generaron recibos nuevos.", !r.generados && r.sinTarifa > 0);
      cargar();
    } catch (x) { toast(x.message, true); }
    finally { b.disabled = false; b.textContent = "Generar recibos"; }
  });

  $("recTabla").addEventListener("click", e => { const b = e.target.closest("[data-id]"); if (b) abrir(Number(b.dataset.id)); });
  const cerrar = () => $("recModal").classList.remove("show");
  $("recCerrar").addEventListener("click", cerrar);
  $("recModal").addEventListener("click", e => { if (e.target === $("recModal")) cerrar(); });
  $("buscarRecibo").addEventListener("input", render);
  $("filtroEstadoRecibo").addEventListener("change", render);
  $("filtroTipoRecibo").addEventListener("change", render);
  cargar();
});
