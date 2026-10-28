document.addEventListener("DOMContentLoaded", () => {

    "use strict";


    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username") || "Usuario";
    const rol = localStorage.getItem("rol") || "";

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    if (rol === "CIUDADANO") {
        window.location.href = "ciudadano.html";
        return;
    }

    const puedeVerSolicitudes = rol === "ADMIN" || rol === "SOPORTE";

    const $ = id => document.getElementById(id);

    function cerrarSesion() {
        ["token", "username", "rol", "personalId", "clienteId"]
            .forEach(clave => localStorage.removeItem(clave));
        window.location.href = "login.html";
    }

    $("logoutButton")?.addEventListener("click", cerrarSesion);
    $("logoutMenu").addEventListener("click", cerrarSesion);


    function esc(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[c]);
    }

    function normalizar(valor) {
        return String(valor || "").trim().toUpperCase();
    }

    function titulo(texto) {
        return String(texto || "")
            .toLowerCase()
            .replace(/(^|\s)\S/g, letra => letra.toUpperCase());
    }

    function iniciales(nombre) {
        return String(nombre || "?")
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(parte => parte.charAt(0).toUpperCase())
            .join("");
    }

    const DIA = 24 * 60 * 60 * 1000;

    function enUltimosDias(fecha, desde, hasta = 0) {
        const tiempo = new Date(fecha).getTime();
        if (Number.isNaN(tiempo)) return false;
        const edad = Date.now() - tiempo;
        return edad >= hasta * DIA && edad < desde * DIA;
    }

    function dentroDelPeriodo(fecha, periodo) {
        if (periodo === "TODO") return true;
        return enUltimosDias(fecha, Number(periodo));
    }

    const svg = trazo => `<svg class="dp-ico" viewBox="0 0 24 24">${trazo}</svg>`;

    const ICONOS_TIPO = {
        FUGA_AGUA:    { color: "c-azul",    trazo: '<path d="M12 2.7s6 6.1 6 10.3a6 6 0 0 1-12 0c0-4.2 6-10.3 6-10.3z"/>' },
        CORTE_AGUA:   { color: "c-rojo",    trazo: '<path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>' },
        BAJA_PRESION: { color: "c-celeste", trazo: '<path d="M12 14l4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/>' },
        FACTURACION:  { color: "c-morado",  trazo: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>' },
        OTRO:         { color: "c-naranja", trazo: '<circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>' }
    };

    const TIPOS_LEGIBLES = {
        FUGA_AGUA: "Fuga de agua",
        CORTE_AGUA: "Corte de agua",
        BAJA_PRESION: "Baja presión",
        FACTURACION: "Facturación",
        OTRO: "Otro problema"
    };

    const COLORES_DONA = ["#0a74c9", "#12a8e6", "#f59e0b", "#22c55e", "#7c4ddb", "#9aaab8"];

    function tipoLegible(tipo) {
        return TIPOS_LEGIBLES[normalizar(tipo)] || titulo(String(tipo || "Sin tipo").replaceAll("_", " "));
    }

    const ESTADOS_REPORTE = {
        PENDIENTE:   { texto: "Pendiente",  color: "p-naranja" },
        ASIGNADO:    { texto: "Asignado",   color: "p-azul" },
        EN_PROCESO:  { texto: "En proceso", color: "p-celeste" },
        EN_ATENCION: { texto: "En proceso", color: "p-celeste" },
        RESUELTO:    { texto: "Resuelto",   color: "p-verde" },
        REABIERTO:   { texto: "Reabierto",  color: "p-morado" }
    };

    const ESTADOS_SOLICITUD = {
        PENDIENTE:      { texto: "Pendiente",      color: "p-naranja" },
        EN_EVALUACION:  { texto: "En evaluación",  color: "p-azul" },
        OBSERVADA:      { texto: "Observada",      color: "p-amarillo" },
        APROBADA:       { texto: "Aprobada",       color: "p-celeste" },
        EN_INSTALACION: { texto: "En instalación", color: "p-morado" },
        ACTIVADA:       { texto: "Activada",       color: "p-verde" },
        RECHAZADA:      { texto: "Rechazada",      color: "p-rojo" },
        CANCELADA:      { texto: "Cancelada",      color: "p-gris" }
    };

    function pillEstado(catalogo, estado) {
        const info = catalogo[normalizar(estado)] ||
            { texto: titulo(String(estado || "Sin estado").replaceAll("_", " ")), color: "p-gris" };
        return `<span class="dp-pill ${info.color}">${esc(info.texto)}</span>`;
    }

    function pillPrioridad(prioridad) {
        const mapa = {
            ALTA:  ["Alta", "p-rojo"],
            MEDIA: ["Media", "p-amarillo"],
            BAJA:  ["Baja", "p-verde"]
        };
        const [texto, color] = mapa[normalizar(prioridad)] || [titulo(prioridad || "—"), "p-gris"];
        return `<span class="dp-pill pri ${color}">${esc(texto)}</span>`;
    }

    const esEnProceso = r => ["EN_PROCESO", "EN_ATENCION", "ASIGNADO"].includes(normalizar(r.estado));

    const ETIQUETAS_ROL = { ADMIN: "Administrador", SOPORTE: "Soporte", TECNICO: "Técnico" };

    $("usernameDisplay").textContent = username;
    $("roleDisplay").textContent = rol;
    $("bannerTitulo").textContent = `Bienvenido, ${ETIQUETAS_ROL[rol] || titulo(username)}`;

    (function pintarAvatar() {
        const avatar = $("userAvatar");
        avatar.textContent = username.charAt(0).toUpperCase();

        const paleta = [
            ["#0077b6", "#00a6d6"], ["#14b8a6", "#0ea5b7"], ["#7c3aed", "#a78bfa"],
            ["#f59e0b", "#f97316"], ["#059669", "#10b981"], ["#ec4899", "#f472b6"]
        ];

        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }

        const [a, b] = paleta[Math.abs(hash) % paleta.length];
        avatar.style.background = `linear-gradient(135deg, ${a}, ${b})`;
    })();

    function conectarMenu(boton, menu) {
        boton.addEventListener("click", evento => {
            evento.stopPropagation();
            const abrir = !menu.classList.contains("abierto");
            cerrarMenus();
            menu.classList.toggle("abierto", abrir);
            boton.setAttribute("aria-expanded", String(abrir));
        });
    }

    function cerrarMenus() {
        document.querySelectorAll(".dp-menu.abierto").forEach(m => m.classList.remove("abierto"));
        document.querySelectorAll("[aria-expanded='true']").forEach(b => b.setAttribute("aria-expanded", "false"));
    }

    conectarMenu($("usuarioBtn"), $("usuarioMenu"));
    conectarMenu($("campanaBtn"), $("campanaMenu"));
    document.addEventListener("click", cerrarMenus);
    document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarMenus(); });
    $("campanaMenu").addEventListener("click", e => e.stopPropagation());

    let reportes = [];
    let solicitudes = [];

    let mapa = null;
    let capasMapa = [];

    function deltaPorcentual(lista, campoFecha, criterio, subeEsBueno, idElemento) {

        const elemento = $(idElemento);
        const filtrada = lista.filter(criterio);

        const actual = filtrada.filter(i => enUltimosDias(i[campoFecha], 30)).length;
        const previo = filtrada.filter(i => enUltimosDias(i[campoFecha], 60, 30)).length;

        elemento.className = "dp-delta";

        if (previo > 0) {
            const pct = Math.round(((actual - previo) / previo) * 100);

            if (pct === 0) {
                elemento.textContent = "= Sin cambios";
                elemento.classList.add("neutro");
                return;
            }

            const sube = pct > 0;
            elemento.textContent = `${sube ? "↑" : "↓"} ${Math.abs(pct)}%`;
            elemento.classList.add(sube === subeEsBueno ? "ok" : "mal");
            return;
        }

        if (actual > 0) {
            elemento.textContent = `+${actual} este mes`;
            elemento.classList.add("neutro");
            return;
        }

        elemento.textContent = "";
    }

    function renderizarKpis() {

        $("totalReportes").textContent = reportes.length;
        $("reportesPendientes").textContent = reportes.filter(r => normalizar(r.estado) === "PENDIENTE").length;
        $("reportesProceso").textContent = reportes.filter(esEnProceso).length;
        $("reportesResueltos").textContent = reportes.filter(r => normalizar(r.estado) === "RESUELTO").length;

        const nuevos = reportes.filter(r => enUltimosDias(r.fechaCreacion, 30)).length;
        $("subTotal").textContent = `${nuevos} nuevos en 30 días`;

        deltaPorcentual(reportes, "fechaCreacion", () => true, true, "deltaTotal");
        deltaPorcentual(reportes, "fechaCreacion", r => normalizar(r.estado) === "PENDIENTE", false, "deltaPendientes");
        deltaPorcentual(reportes, "fechaCreacion", esEnProceso, true, "deltaProceso");
        deltaPorcentual(reportes, "fechaCreacion", r => normalizar(r.estado) === "RESUELTO", true, "deltaResueltos");

        if (!puedeVerSolicitudes) {
            $("kpiSolicitudes").hidden = true;
            return;
        }

        const pendientes = solicitudes.filter(s => normalizar(s.estado) === "PENDIENTE").length;

        $("totalSolicitudes").textContent = solicitudes.length;
        $("subSolicitudes").textContent = `${pendientes} pendientes de revisión`;
        deltaPorcentual(solicitudes, "fechaSolicitud", () => true, true, "deltaSolicitudes");
    }

    function renderizarCampana() {

        const repPend = reportes.filter(r => normalizar(r.estado) === "PENDIENTE").length;
        const solPend = puedeVerSolicitudes
            ? solicitudes.filter(s => normalizar(s.estado) === "PENDIENTE").length
            : 0;

        const total = repPend + solPend;
        const insignia = $("campanaBadge");

        insignia.hidden = total === 0;
        insignia.textContent = total > 99 ? "99+" : total;

        const filas = [];

        if (repPend) {
            filas.push(`
                <a href="reportes.html" class="dp-notif">
                    <span class="dp-cab-ico c-naranja">${svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')}</span>
                    <span><strong>${repPend} ${repPend === 1 ? "reporte pendiente" : "reportes pendientes"}</strong><small>Requieren atención</small></span>
                </a>`);
        }

        if (solPend) {
            filas.push(`
                <div class="dp-notif">
                    <span class="dp-cab-ico c-morado">${svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>')}</span>
                    <span><strong>${solPend} ${solPend === 1 ? "solicitud por revisar" : "solicitudes por revisar"}</strong><small>Nuevas solicitudes de conexión</small></span>
                </div>`);
        }

        $("campanaLista").innerHTML = filas.length
            ? filas.join("")
            : '<div class="dp-notif-ok">Estás al día. No hay pendientes.</div>';
    }


    const COLOR_PRIORIDAD = { ALTA: "#ef4444", MEDIA: "#f5b301", BAJA: "#22c55e" };

    function iniciarMapa() {
    if (!window.google?.maps) {
        $("mapaIncidencias").innerHTML =
            '<div class="dp-vacio-mini">Google Maps todavía no está disponible. Recarga la página.</div>';
        return;
    }

    mapa = new google.maps.Map($("mapaIncidencias"), {
        center: { lat: -14.0672, lng: -75.7281 },
        zoom: 13,
        mapTypeId: "satellite",
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
    });
}

    function coordenadas(reporte) {
        const lat = Number(reporte.latitud ?? reporte.latitude);
        const lng = Number(reporte.longitud ?? reporte.longitude);
        const valido = reporte.latitud != null && reporte.longitud != null &&
            !Number.isNaN(lat) && !Number.isNaN(lng);
        return valido ? { lat, lng } : null;
    }

    function reportesDelMapa() {
        const periodo = $("filtroPeriodoMapa").value;
        const tipo = $("filtroTipoProblema").value;

        return reportes.filter(r =>
            dentroDelPeriodo(r.fechaCreacion, periodo) &&
            (tipo === "TODOS" || r.tipoProblema === tipo)
        );
    }

    
function dibujarMapa() {
    if (!mapa || !window.google?.maps) return;

    // Limpiar las capas anteriores
    capasMapa.forEach(capa => capa.setMap(null));
    capasMapa = [];

    const lista = reportesDelMapa();
    const puntos = [];
    const celdas = {};
    const tamano = 0.003;

    // Agrupar reportes por zonas
    lista.forEach(reporte => {
        const c = coordenadas(reporte);
        if (!c) return;

        const clave =
            `${Math.floor(c.lat / tamano)}_${Math.floor(c.lng / tamano)}`;

        celdas[clave] = celdas[clave] || {
            lat: (Math.floor(c.lat / tamano) + 0.5) * tamano,
            lng: (Math.floor(c.lng / tamano) + 0.5) * tamano,
            reportes: []
        };

        celdas[clave].reportes.push(reporte);
    });

    const ventanaInfo = new google.maps.InfoWindow();

    // Dibujar zonas verdes, amarillas y rojas
    Object.values(celdas).forEach(zona => {
        const cantidad = zona.reportes.length;

        const [color, nivel] =
            cantidad === 1 ? ["#22c55e", "Baja"] :
            cantidad <= 3 ? ["#f5b301", "Media"] :
            ["#ef4444", "Alta"];

        [260, 150].forEach((radio, i) => {
            const circulo = new google.maps.Circle({
                map: mapa,
                center: { lat: zona.lat, lng: zona.lng },
                radius: radio,
                strokeWeight: 0,
                fillColor: color,
                fillOpacity: i === 0 ? 0.20 : 0.26,
                clickable: i === 0
            });

            if (i === 0) {
                circulo.addListener("click", evento => {
                    ventanaInfo.setContent(`
                        <strong>Zona de incidencia</strong><br>
                        Nivel: ${nivel}<br>
                        Incidencias: ${cantidad}<br>
                        Reportes: ${zona.reportes
                            .map(r => "#" + esc(r.reporteId))
                            .join(", ")}
                    `);

                    ventanaInfo.setPosition(evento.latLng);
                    ventanaInfo.open({ map: mapa });
                });
            }

            capasMapa.push(circulo);
        });
    });

    // Dibujar los reportes individuales según su prioridad
    lista.forEach(reporte => {
        const c = coordenadas(reporte);
        if (!c) return;

        puntos.push({ lat: c.lat, lng: c.lng });

        const marcador = new google.maps.Marker({
            map: mapa,
            position: { lat: c.lat, lng: c.lng },
            title: `Reporte #${reporte.reporteId}`,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor:
                    COLOR_PRIORIDAD[normalizar(reporte.prioridad)] || "#0a74c9",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2
            }
        });

        marcador.addListener("click", () => {
            ventanaInfo.setContent(`
                <strong>Reporte #${esc(reporte.reporteId)}</strong><br>
                Problema: ${esc(tipoLegible(reporte.tipoProblema))}<br>
                Prioridad: ${esc(titulo(reporte.prioridad || "—"))}<br>
                Estado: ${esc(titulo(
                    String(reporte.estado || "—").replaceAll("_", " ")
                ))}<br>
                <a href="reporte-detalle.html?id=${encodeURIComponent(
                    reporte.reporteId
                )}">Ver detalle</a>
            `);

            ventanaInfo.open({
                map: mapa,
                anchor: marcador
            });
        });

        capasMapa.push(marcador);
    });

    // Ajustar el mapa a los reportes encontrados
    if (puntos.length) {
        const limites = new google.maps.LatLngBounds();
        puntos.forEach(punto => limites.extend(punto));

        mapa.fitBounds(limites, 40);

        if (puntos.length === 1) {
            mapa.setZoom(15);
        }
    }
}


    function llenarTiposProblema() {

        const select = $("filtroTipoProblema");
        const tipos = [...new Set(reportes.map(r => r.tipoProblema).filter(Boolean))];

        select.innerHTML = '<option value="TODOS">Todos los problemas</option>' +
            tipos.map(t => `<option value="${esc(t)}">${esc(tipoLegible(t))}</option>`).join("");
    }

    $("filtroPeriodoMapa").addEventListener("change", dibujarMapa);
    $("filtroTipoProblema").addEventListener("change", dibujarMapa);


    function renderizarDona() {

        const periodo = $("filtroPeriodoDona").value;
        const lista = reportes.filter(r => dentroDelPeriodo(r.fechaCreacion, periodo));
        const contenedor = $("dona");

        if (!lista.length) {
            contenedor.innerHTML = '<div class="dp-vacio-mini">No hay reportes en este periodo.</div>';
            return;
        }

        const conteo = {};
        lista.forEach(r => {
            const clave = r.tipoProblema || "SIN_TIPO";
            conteo[clave] = (conteo[clave] || 0) + 1;
        });

        const filas = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
        const total = lista.length;

        const radio = 70;
        const circunferencia = 2 * Math.PI * radio;
        let acumulado = 0;

        const segmentos = filas.map(([tipo, cantidad], i) => {
            const largo = (cantidad / total) * circunferencia;
            const segmento = `
                <circle cx="100" cy="100" r="${radio}" fill="none"
                    stroke="${COLORES_DONA[i % COLORES_DONA.length]}" stroke-width="30"
                    stroke-dasharray="${Math.max(largo - 2, 0.5)} ${circunferencia}"
                    stroke-dashoffset="${-acumulado}"
                    transform="rotate(-90 100 100)"></circle>`;
            acumulado += largo;
            return segmento;
        }).join("");

        const leyenda = filas.map(([tipo, cantidad], i) => `
            <div>
                <i style="background:${COLORES_DONA[i % COLORES_DONA.length]}"></i>
                <span>${esc(tipoLegible(tipo))}</span>
                <b>${cantidad} <small>(${Math.round((cantidad / total) * 100)}%)</small></b>
            </div>`).join("");

        contenedor.innerHTML = `
            <svg viewBox="0 0 200 200" role="img" aria-label="Reportes por tipo de problema">
                <circle cx="100" cy="100" r="${radio}" fill="none" stroke="#eef4f8" stroke-width="30"></circle>
                ${segmentos}
                <text x="100" y="104" text-anchor="middle" class="dp-dona-total">${total}</text>
                <text x="100" y="124" text-anchor="middle" class="dp-dona-sub">REPORTES</text>
            </svg>
            <div class="dp-dona-leyenda">${leyenda}</div>`;
    }

    $("filtroPeriodoDona").addEventListener("change", renderizarDona);


    function vincularFilas(contenedor) {
        contenedor.querySelectorAll("[data-href]").forEach(fila => {
            fila.style.cursor = "pointer";
            fila.addEventListener("click", () => { window.location.href = fila.dataset.href; });
        });
    }

    function renderizarReportesRecientes() {

        const contenedor = $("tablaReportes");

        const recientes = [...reportes]
            .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
            .slice(0, 5);

        if (!recientes.length) {
            contenedor.innerHTML = '<div class="dp-vacio-mini">Aún no hay reportes registrados.</div>';
            return;
        }

        contenedor.innerHTML = recientes.map(r => {

            const icono = ICONOS_TIPO[normalizar(r.tipoProblema)] || ICONOS_TIPO.OTRO;

            return `
                <div class="dp-fila-t t-rep" data-href="reporte-detalle.html?id=${encodeURIComponent(r.reporteId)}">
                    <span class="id">#${esc(r.reporteId)}</span>
                    <span class="dp-celda">
                        <span class="dp-mini-ico ${icono.color}">${svg(icono.trazo)}</span>
                        <span>${esc(tipoLegible(r.tipoProblema))}</span>
                    </span>
                    <span class="dp-ubic" title="${esc(r.direccion || "")}">${esc(r.direccion || "—")}</span>
                    ${pillEstado(ESTADOS_REPORTE, r.estado)}
                </div>`;
        }).join("");

        vincularFilas(contenedor);
    }

    async function renderizarAsignacionesActivas() {

        const contenedor = $("tablaAsignaciones");

        const candidatos = reportes
            .filter(r => esEnProceso(r) || normalizar(r.estado) === "REABIERTO")
            .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
            .slice(0, 8);

        if (!candidatos.length) {
            contenedor.innerHTML = '<div class="dp-vacio-mini">No hay asignaciones activas.</div>';
            return;
        }

        const resultados = await Promise.all(candidatos.map(reporte =>
            apiFetch(`/api/reportes/${reporte.reporteId}/asignaciones`)
                .then(lista => (Array.isArray(lista) ? lista : [])
                    .filter(a => ["ACTIVA", "EN_ATENCION"].includes(normalizar(a.estado)))
                    .map(a => ({ asignacion: a, reporte })))
                .catch(() => [])
        ));

        const filas = resultados.flat().slice(0, 5);

        if (!filas.length) {
            contenedor.innerHTML = '<div class="dp-vacio-mini">No hay asignaciones activas.</div>';
            return;
        }

        contenedor.innerHTML = filas.map(({ asignacion, reporte }) => `
            <div class="dp-fila-t t-asi" data-href="reporte-detalle.html?id=${encodeURIComponent(reporte.reporteId)}">
                <span class="dp-celda">
                    <span class="dp-avatar">${esc(iniciales(asignacion.nombrePersonal))}</span>
                    <span>${esc(asignacion.nombrePersonal || "Sin nombre")}</span>
                </span>
                <span class="dp-ubic" title="${esc(tipoLegible(reporte.tipoProblema))} - ${esc(reporte.direccion || "")}">
                    ${esc(tipoLegible(reporte.tipoProblema))}${reporte.direccion ? " - " + esc(reporte.direccion) : ""}
                </span>
                ${pillPrioridad(reporte.prioridad)}
            </div>`).join("");

        vincularFilas(contenedor);
    }

    function renderizarSolicitudesRecientes() {

        const tarjeta = $("cardSolicitudes");

        if (!puedeVerSolicitudes) {
            tarjeta.hidden = true;
            $("filaTablas").style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
            return;
        }

        const contenedor = $("tablaSolicitudes");

        const recientes = [...solicitudes]
            .sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud))
            .slice(0, 5);

        if (!recientes.length) {
            contenedor.innerHTML = '<div class="dp-vacio-mini">Aún no hay solicitudes.</div>';
            return;
        }

        contenedor.innerHTML = recientes.map(s => `
            <div class="dp-fila-t t-sol">
                <span class="id">#S${String(s.id).padStart(3, "0")}</span>
                <span class="dp-celda">
                    <span class="dp-mini-ico c-azul">${svg('<path d="M12 2.7s6 6.1 6 10.3a6 6 0 0 1-12 0c0-4.2 6-10.3 6-10.3z"/>')}</span>
                    <span>Nueva conexión</span>
                </span>
                ${pillEstado(ESTADOS_SOLICITUD, s.estado)}
            </div>`).join("");
    }

    async function iniciar() {

        iniciarMapa();
        if (!mapa) return;

        const [respuestaReportes, respuestaSolicitudes] = await Promise.all([
            apiFetch("/api/reportes").catch(error => {
                console.error("Error al cargar los reportes:", error);
                return null;
            }),
            puedeVerSolicitudes
                ? apiFetch("/api/solicitudes-servicio").catch(error => {
                    console.error("Error al cargar las solicitudes:", error);
                    return [];
                })
                : Promise.resolve([])
        ]);

        if (!Array.isArray(respuestaReportes)) {
            const aviso = '<div class="dp-vacio-mini">No se pudieron cargar los datos.</div>';
            $("tablaReportes").innerHTML = aviso;
            $("tablaAsignaciones").innerHTML = aviso;
            $("dona").innerHTML = aviso;
            renderizarSolicitudesRecientes();
            return;
        }

        reportes = respuestaReportes;
        solicitudes = Array.isArray(respuestaSolicitudes) ? respuestaSolicitudes : [];

        renderizarKpis();
        renderizarCampana();
        llenarTiposProblema();
        dibujarMapa();
        renderizarDona();
        renderizarReportesRecientes();
        renderizarSolicitudesRecientes();
        renderizarAsignacionesActivas();
    }

    iniciar();
});