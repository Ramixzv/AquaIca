// Indicadores: ADMIN y SOPORTE
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
  $("logoutButton")?.addEventListener("click", () => {
    ["token", "username", "rol", "personalId", "clienteId"].forEach(k => localStorage.removeItem(k));
    window.location.href = "login.html";
  });
  $("logoutMenu")?.addEventListener("click", () => {
    ["token", "username", "rol", "personalId", "clienteId"].forEach(k => localStorage.removeItem(k));
    window.location.href = "login.html";
  });

  function cerrarMenus() {
    document.querySelectorAll(".dp-menu.abierto").forEach(menu => menu.classList.remove("abierto"));
    document.querySelectorAll(".dp-acciones [aria-expanded='true']").forEach(boton => boton.setAttribute("aria-expanded", "false"));
  }
  [["usuarioBtn", "usuarioMenu"], ["campanaBtn", "campanaMenu"]].forEach(([botonId, menuId]) => {
    const boton = document.getElementById(botonId);
    const menu = document.getElementById(menuId);
    if (!boton || !menu) return;
    boton.addEventListener("click", evento => {
      evento.stopPropagation();
      const abrir = !menu.classList.contains("abierto");
      cerrarMenus();
      menu.classList.toggle("abierto", abrir);
      boton.setAttribute("aria-expanded", String(abrir));
    });
  });
  document.addEventListener("click", cerrarMenus);
  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") cerrarMenus();
  });

  const TIPOS = { FUGA_AGUA: "Fuga de agua", CORTE_AGUA: "Corte de agua", BAJA_PRESION: "Baja presión", FACTURACION: "Facturación", OTRO: "Otro" };
  const ESTADOS_REPORTE = { PENDIENTE: "Pendiente", EN_PROCESO: "En proceso", EN_ATENCION: "En atención", TRABAJO_REALIZADO: "Trabajo realizado", RESUELTO: "Resuelto", NO_RESUELTO: "No resuelto" };
  const ESTADOS_SOLICITUD = { PENDIENTE: "Pendiente", EN_EVALUACION: "En evaluación", OBSERVADA: "Observada", APROBADA: "Aprobada", EN_INSTALACION: "En instalación", ACTIVADA: "Activada", RECHAZADA: "Rechazada", CANCELADA: "Cancelada" };

  const esc = v => { const e = document.createElement("span"); e.textContent = v ?? ""; return e.innerHTML; };
  const soles = v => "S/ " + Number(v ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (v, d = 1) => Number(v ?? 0).toLocaleString("es-PE", { maximumFractionDigits: d });
  const mes = p => new Date(p + "-01T00:00:00").toLocaleDateString("es-PE", { month: "short", year: "2-digit" });
  const mesLargo = p => new Date(p + "-01T00:00:00").toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  const vacio = t => `<p class="ind-vacio">${t}</p>`;

  function columnas(puntos, colores, formato, mostrarValor) {
    const max = Math.max(1, ...puntos.flatMap(p => p.valores));
    if (puntos.every(p => p.valores.every(v => v === 0))) return vacio("Sin datos en este periodo.");
    return `<div class="ind-cols">${puntos.map(p => `
      <div class="ind-col">
        <span class="ind-val">${mostrarValor && p.valores[0] > 0 ? esc(formato(p.valores[0])) : ""}</span>
        <div class="ind-zona">${p.valores.map((v, i) => `<div class="ind-barra" title="${esc(formato(v))}" style="height:${v > 0 ? Math.max(3, v / max * 100) : 0}%;background:${colores[i]}"></div>`).join("")}</div>
        <small>${esc(p.etiqueta)}</small>
      </div>`).join("")}</div>`;
  }

  function horizontales(mapa, etiquetas, color) {
    const filas = Object.entries(mapa || {}).sort((a, b) => b[1] - a[1]);
    if (!filas.length) return vacio("Sin datos todavía.");
    const max = Math.max(...filas.map(f => f[1]), 1);
    return filas.map(([k, v]) => `<div class="ind-h"><span>${esc(etiquetas[k] || k)}</span><div class="ind-hbar"><i style="width:${v / max * 100}%;background:${color}"></i></div><strong>${v}</strong></div>`).join("");
  }

  const set = (id, valor, sub) => { $(id).textContent = valor; if (sub !== undefined) $(id + "Sub").textContent = sub; };

  function pintar(d) {
    const g = d.generales, i = d.incidencias, f = d.facturacion, c = d.consumo;
    const sol = g.solicitudesPorEstado || {};

    set("kClientes", g.clientes, `${g.suministros} suministro(s)`);
    set("kMedidores", g.medidoresActivos, `${g.lecturasPendientesMes} sin lectura este mes` + (g.sinLecturaInicial ? ` · ${g.sinLecturaInicial} sin inicial` : ""));
    set("kAbiertas", i.abiertas, `de ${i.total} reportes en total`);
    set("kSolicitudes", (sol.PENDIENTE || 0) + (sol.EN_EVALUACION || 0), `${sol.EN_INSTALACION || 0} en instalación`);

    set("kFacturado", soles(f.facturado), `${f.recibos} recibo(s)`);
    set("kCobrado", soles(f.cobrado), `${f.recibosPagados} pagado(s)`);
    set("kPorCobrar", soles(f.porCobrar), "dentro del plazo");
    set("kVencido", soles(f.vencido), `Morosidad: ${num(f.morosidadPct)} %`);

    $("gFacturacion").innerHTML = f.recibos ? columnas(f.porMes.map(p => ({ etiqueta: mes(p.periodo), valores: [Number(p.facturado), Number(p.cobrado)] })), ["#0a74c9", "#14b8a6"], soles, false)
      : vacio("Todavía no hay recibos en este periodo.");

    $("gConsumoNota").textContent = c.promedioMensualPorSuministro > 0 ? `Promedio por suministro y mes: ${num(c.promedioMensualPorSuministro, 2)} m³ · Total: ${num(c.totalM3, 2)} m³` : "";
    $("gConsumo").innerHTML = columnas(c.porMes.map(p => ({ etiqueta: mes(p.periodo), valores: [Number(p.m3)] })), [d.incluirPrueba ? "#7c5cd6" : "#0a74c9"], v => num(v, 2) + " m³", true);

    $("gIncMes").innerHTML = columnas(i.porMes.map(p => ({ etiqueta: mes(p.periodo), valores: [p.valor] })), ["#e08a00"], v => v + " reporte(s)", true);
    $("gIncTipo").innerHTML = horizontales(i.porTipo, TIPOS, "#0a74c9");
    $("gIncEstado").innerHTML = horizontales(i.porEstado, ESTADOS_REPORTE, "#14b8a6");
    $("gResolucion").textContent = i.horasPromedioResolucion != null ? `Tiempo promedio hasta resolver: ${num(i.horasPromedioResolucion)} h` : "Aún no hay reportes resueltos para medir el tiempo.";
    $("gSolicitudes").innerHTML = horizontales(sol, ESTADOS_SOLICITUD, "#7c5cd6");

    $("topPeriodo").textContent = c.periodoTop ? "· " + mesLargo(c.periodoTop) : "";
    $("gTop").innerHTML = c.top.length ? `<table class="ind-tabla"><thead><tr><th>Suministro</th><th>Cliente</th><th>Dirección</th><th class="num">Consumo</th></tr></thead><tbody>${c.top.map(t => `<tr><td><strong>${esc(t.codigoSuministro)}</strong></td><td>${esc(t.cliente || "—")}</td><td>${esc(t.direccion)}</td><td class="num">${num(t.m3, 2)} m³</td></tr>`).join("")}</tbody></table>` : vacio("Aún no hay lecturas de consumo en este periodo.");

    const aviso = $("indAviso");
    if (!d.incluirPrueba && f.recibos === 0 && c.totalM3 == 0) {
      aviso.hidden = false;
      aviso.textContent = "No hay datos reales de consumo ni recibos todavía. Activa «Incluir datos de prueba» para ver la demostración.";
    } else if (d.incluirPrueba) {
      aviso.hidden = false;
      aviso.textContent = "Estás viendo datos de prueba mezclados: las lecturas simuladas y los recibos de prueba no son cobros reales.";
    } else aviso.hidden = true;
  }

  async function cargar() {
    try {
      pintar(await apiFetch(`/api/indicadores?meses=${$("indMeses").value}&incluirPrueba=${$("indPrueba").checked}`));
    } catch (e) {
      $("indAviso").hidden = false;
      $("indAviso").textContent = e.message || "No se pudieron cargar los indicadores.";
    }
  }

  $("indMeses").addEventListener("change", cargar);
  $("indPrueba").addEventListener("change", cargar);
  cargar();
});
