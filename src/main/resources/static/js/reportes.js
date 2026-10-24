/* =========================================================
   REPORTES · listado con filtros
   Usa GET /api/reportes (sin cambios en el backend).
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    const sesion = Panel.iniciar(["ADMIN", "SOPORTE", "TECNICO"]);

    if (!sesion) {
        return;
    }

    const { $, esc, normalizar, titulo, iniciales, gradiente, fecha, hora, pill } = Panel;

    const tabla = $("reportesTable");
    const buscar = $("buscarReporte");
    const filtroEstado = $("filtroEstado");
    const filtroPrioridad = $("filtroPrioridad");
    const filtroProblema = $("filtroProblema");

    let reportes = [];


    /* =====================================================
       CATÁLOGOS
       ===================================================== */

    const svg = trazo => `<svg class="dp-ico" viewBox="0 0 24 24">${trazo}</svg>`;

    const TIPOS = {
        FUGA_AGUA:    { texto: "Fuga de agua",  mini: "c-celeste", trazo: '<path d="M12 2.7s6 6.1 6 10.3a6 6 0 0 1-12 0c0-4.2 6-10.3 6-10.3z"/>' },
        CORTE_AGUA:   { texto: "Corte de agua", mini: "c-rojo",    trazo: '<path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>' },
        BAJA_PRESION: { texto: "Baja presión",  mini: "c-naranja", trazo: '<path d="M12 14l4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/>' },
        FACTURACION:  { texto: "Facturación",   mini: "c-morado",  trazo: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>' },
        OTRO:         { texto: "Otro",          mini: "c-verde",   trazo: '<circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>' }
    };

    const ESTADOS = {
        PENDIENTE:   { texto: "Pendiente",  color: "p-naranja" },
        ASIGNADO:    { texto: "Asignado",   color: "p-azul" },
        EN_PROCESO:  { texto: "En proceso", color: "p-celeste" },
        EN_ATENCION: { texto: "En proceso", color: "p-celeste" },
        RESUELTO:    { texto: "Resuelto",   color: "p-verde" },
        REABIERTO:   { texto: "Reabierto",  color: "p-morado" }
    };

    const PRIORIDADES = {
        ALTA:  { texto: "Alta",  color: "p-rojo" },
        MEDIA: { texto: "Media", color: "p-amarillo" },
        BAJA:  { texto: "Baja",  color: "p-verde" }
    };

    function tipoInfo(tipo) {
        return TIPOS[normalizar(tipo)] || {
            texto: titulo(String(tipo || "Sin tipo").replaceAll("_", " ")),
            mini: "c-azul",
            trazo: '<circle cx="12" cy="12" r="9"/>'
        };
    }

    function pillEstado(estado) {
        const info = ESTADOS[normalizar(estado)] ||
            { texto: titulo(String(estado || "—").replaceAll("_", " ")), color: "p-gris" };
        return pill(info.color, info.texto);
    }

    function pillPrioridad(prioridad) {
        const info = PRIORIDADES[normalizar(prioridad)] ||
            { texto: titulo(prioridad || "—"), color: "p-gris" };
        return pill(info.color, info.texto, true);
    }


    /* =====================================================
       KPIs POR TIPO
       ===================================================== */

    function renderizarKpis() {

        const total = reportes.length;

        $("kpiTotal").textContent = total;
        $("kpiTotalSub").textContent =
            total === 1 ? "1 reporte registrado" : `${total} reportes registrados`;

        Object.keys(TIPOS).forEach(tipo => {

            const cantidad = reportes.filter(r => normalizar(r.tipoProblema) === tipo).length;
            const porcentaje = total ? Math.round((cantidad / total) * 100) : 0;

            document.querySelector(`[data-cuenta="${tipo}"]`).textContent = cantidad;
            document.querySelector(`[data-pct="${tipo}"]`).textContent = `${porcentaje}% del total`;
            document.querySelector(`[data-barra="${tipo}"]`).style.width = `${porcentaje}%`;
        });
    }

    function marcarKpiActivo() {
        document.querySelectorAll(".rp-kpi").forEach(tarjeta =>
            tarjeta.classList.toggle("activo", tarjeta.dataset.tipo === filtroProblema.value)
        );
    }

    document.querySelectorAll(".rp-kpi").forEach(tarjeta => {

        const alternar = () => {
            const tipo = tarjeta.dataset.tipo;
            filtroProblema.value = filtroProblema.value === tipo ? "" : tipo;
            aplicarFiltros();
        };

        tarjeta.addEventListener("click", alternar);
        tarjeta.addEventListener("keydown", evento => {
            if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                alternar();
            }
        });
    });


    /* =====================================================
       TABLA
       ===================================================== */

    function mostrarReportes(lista) {

        $("cantidadReportes").textContent =
            `${reportes.length} ${reportes.length === 1 ? "reporte" : "reportes"}`;

        $("resumenFiltro").textContent =
            lista.length === reportes.length
                ? "Lista de reportes registrados"
                : `Mostrando ${lista.length} de ${reportes.length} reportes`;

        if (!lista.length) {
            tabla.innerHTML = `
                <tr><td colspan="7" class="pc-vacio">
                    <h4>${reportes.length ? "Sin resultados" : "Aún no hay reportes"}</h4>
                    ${reportes.length
                        ? "No existen reportes que coincidan con la búsqueda."
                        : "Cuando un ciudadano registre una incidencia aparecerá aquí."}
                </td></tr>`;
            return;
        }

        const ordenados = [...lista].sort(
            (a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
        );

        tabla.innerHTML = ordenados.map(r => {

            const tipo = tipoInfo(r.tipoProblema);
            const nombre = r.nombreTitular || "—";

            return `
                <tr class="click rp-fila" data-id="${esc(r.reporteId)}">
                    <td class="pc-codigo">#${esc(r.reporteId)}</td>
                    <td>
                        <div class="pc-persona">
                            <span class="pc-avatar" style="background:${gradiente(nombre)}">${esc(iniciales(nombre))}</span>
                            <span>
                                <strong>${esc(nombre)}</strong>
                                <span class="pc-sub">DNI: ${esc(r.dni || "—")}</span>
                            </span>
                        </div>
                    </td>
                    <td>${esc(r.codigoSuministro || "—")}</td>
                    <td>
                        <span class="rp-tipo">
                            <span class="rp-mini ${tipo.mini}">${svg(tipo.trazo)}</span>
                            ${esc(tipo.texto)}
                        </span>
                    </td>
                    <td>${pillPrioridad(r.prioridad)}</td>
                    <td>${pillEstado(r.estado)}</td>
                    <td class="rp-fecha">${esc(fecha(r.fechaCreacion))}<small>${esc(hora(r.fechaCreacion))}</small></td>
                </tr>`;
        }).join("");
    }

    tabla.addEventListener("click", evento => {
        const fila = evento.target.closest("tr[data-id]");
        if (fila) {
            window.location.href = `reporte-detalle.html?id=${encodeURIComponent(fila.dataset.id)}`;
        }
    });


    /* =====================================================
       FILTROS
       ===================================================== */

    function pintarTonos() {
        filtroEstado.dataset.tono = filtroEstado.value;
        filtroPrioridad.dataset.tono = filtroPrioridad.value;
    }

    function aplicarFiltros() {

        pintarTonos();
        marcarKpiActivo();

        const texto = buscar.value.toLowerCase().trim();

        const filtrados = reportes.filter(r => {

            const coincideTexto = !texto ||
                String(r.reporteId).includes(texto) ||
                (r.nombreTitular ?? "").toLowerCase().includes(texto) ||
                (r.codigoSuministro ?? "").toLowerCase().includes(texto) ||
                (r.dni ?? "").includes(texto);

            return coincideTexto &&
                (!filtroEstado.value || r.estado === filtroEstado.value) &&
                (!filtroPrioridad.value || r.prioridad === filtroPrioridad.value) &&
                (!filtroProblema.value || r.tipoProblema === filtroProblema.value);
        });

        mostrarReportes(filtrados);
    }

    buscar.addEventListener("input", aplicarFiltros);
    [filtroEstado, filtroPrioridad, filtroProblema].forEach(
        combo => combo.addEventListener("change", aplicarFiltros)
    );

    $("btnLimpiar").addEventListener("click", () => {
        buscar.value = "";
        filtroEstado.value = "";
        filtroPrioridad.value = "";
        filtroProblema.value = "";
        aplicarFiltros();
    });

    /* Si llegan estados que no están en el combo, se agregan solos */
    function completarEstados() {
        const conocidos = new Set([...filtroEstado.options].map(o => o.value));

        [...new Set(reportes.map(r => r.estado).filter(Boolean))].forEach(estado => {
            if (!conocidos.has(estado)) {
                const opcion = document.createElement("option");
                opcion.value = estado;
                opcion.textContent = pillEstado(estado).replace(/<[^>]+>/g, "");
                filtroEstado.appendChild(opcion);
            }
        });
    }


    /* =====================================================
       CAMPANA (reportes pendientes)
       ===================================================== */

    function renderizarCampana() {

        const pendientes = reportes.filter(r => normalizar(r.estado) === "PENDIENTE").length;
        const insignia = $("campanaBadge");

        insignia.hidden = pendientes === 0;
        insignia.textContent = pendientes > 99 ? "99+" : pendientes;

        $("campanaLista").innerHTML = pendientes
            ? `<a href="#" class="dp-notif" id="verPendientes">
                   <span class="dp-cab-ico c-naranja">${svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')}</span>
                   <span>
                       <strong>${pendientes} ${pendientes === 1 ? "reporte pendiente" : "reportes pendientes"}</strong>
                       <small>Toca para filtrarlos</small>
                   </span>
               </a>`
            : '<div class="dp-notif-ok">Estás al día. No hay pendientes.</div>';

        $("verPendientes")?.addEventListener("click", evento => {
            evento.preventDefault();
            filtroEstado.value = "PENDIENTE";
            aplicarFiltros();
            document.querySelectorAll(".dp-menu.abierto").forEach(m => m.classList.remove("abierto"));
        });
    }

    $("campanaBtn").addEventListener("click", evento => {

        evento.stopPropagation();

        const menu = $("campanaMenu");
        const abrir = !menu.classList.contains("abierto");

        document.querySelectorAll(".dp-menu.abierto").forEach(m => m.classList.remove("abierto"));
        menu.classList.toggle("abierto", abrir);
        $("campanaBtn").setAttribute("aria-expanded", String(abrir));
    });

    $("campanaMenu").addEventListener("click", evento => evento.stopPropagation());


    /* =====================================================
       CARGA
       ===================================================== */

    async function cargarReportes() {

        try {
            const respuesta = await apiFetch("/api/reportes");
            reportes = Array.isArray(respuesta) ? respuesta : [];
        } catch (error) {
            console.error("Error al cargar reportes:", error);
            tabla.innerHTML = `<tr><td colspan="7" class="pc-vacio"><h4>No se pudieron cargar los reportes</h4>Revisa tu conexión e inténtalo de nuevo.</td></tr>`;
            return;
        }

        completarEstados();
        renderizarKpis();
        renderizarCampana();
        aplicarFiltros();
    }

    cargarReportes();
});