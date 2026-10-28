/* =========================================================
   DETALLE DEL REPORTE
   Endpoints (sin cambios en el backend):
   GET  /api/reportes/{id}
   GET  /api/reportes/{id}/evidencias
   GET  /api/reportes/{id}/informe-tecnico
   GET  /api/reportes/{id}/seguimientos
   GET  /api/bitacoras/reporte/{id}
   POST /api/reportes/{id}/asignaciones
   POST /api/reportes/{id}/reabrir
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    const sesion = Panel.iniciar(["ADMIN", "SOPORTE", "TECNICO"]);

    if (!sesion) {
        return;
    }

    const { $, esc, normalizar, titulo, iniciales, gradiente, fecha, hora, toast } = Panel;

    const rol = sesion.rol;

    const id = new URLSearchParams(window.location.search).get("id");

    if (!id) {
        toast("No se especificó el reporte.", true);
        setTimeout(() => { window.location.href = "reportes.html"; }, 1200);
        return;
    }

    let reporteTipoProblema = null;
    let mapa = null;
    let marcador = null;
    let halo = null;

    const svg = (trazo, clase = "dp-ico") =>
        `<svg class="${clase}" viewBox="0 0 24 24">${trazo}</svg>`;


    /* =====================================================
       CATÁLOGOS
       ===================================================== */

    const TIPOS = {
        FUGA_AGUA:    { texto: "Fuga de agua",            color: "k-celeste", trazo: '<path d="M12 2.7s6 6.1 6 10.3a6 6 0 0 1-12 0c0-4.2 6-10.3 6-10.3z"/>' },
        CORTE_AGUA:   { texto: "Corte de agua",           color: "k-rojo",    trazo: '<path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>' },
        BAJA_PRESION: { texto: "Baja presión",            color: "k-naranja", trazo: '<path d="M12 14l4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/>' },
        FACTURACION:  { texto: "Problema de facturación", color: "k-morado",  trazo: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>' },
        OTRO:         { texto: "Otro problema",           color: "k-verde",   trazo: '<circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>' }
    };

    const ESTADOS = {
        PENDIENTE:   { texto: "Pendiente",   color: "k-naranja" },
        EN_PROCESO:  { texto: "En proceso",  color: "k-celeste" },
        ASIGNADO:    { texto: "En proceso",  color: "k-celeste" },
        EN_ATENCION: { texto: "En proceso",  color: "k-celeste" },
        RESUELTO:    { texto: "Resuelto",    color: "k-verde" },
        NO_RESUELTO: { texto: "No resuelto", color: "k-rojo" },
        REABIERTO:   { texto: "Reabierto",   color: "k-morado" }
    };

    const PRIORIDADES = {
        ALTA:  { texto: "Alta",  color: "k-rojo" },
        MEDIA: { texto: "Media", color: "k-amarillo" },
        BAJA:  { texto: "Baja",  color: "k-verde" }
    };

    const PASOS = {
        REPORTADO:         { texto: "Reporte recibido",      color: "k-azul",    trazo: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>' },
        REVISADO:          { texto: "Reporte revisado",      color: "k-celeste", trazo: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>' },
        ASIGNADO:          { texto: "Técnico asignado",      color: "k-azul",    trazo: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M16 11l2 2 4-4"/>' },
        TECNICO_ASIGNADO:  { texto: "Técnico asignado",      color: "k-azul",    trazo: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M16 11l2 2 4-4"/>' },
        EN_ATENCION:       { texto: "Técnico en atención",   color: "k-celeste", trazo: '<path d="M14.7 6.3a4 4 0 0 0-5.6 5.1L4 16.5V20h3.5l5.1-5.1a4 4 0 0 0 5.1-5.6l-2.6 2.6-2-2z"/>' },
        TRABAJO_REALIZADO: { texto: "Trabajo realizado",     color: "k-morado",  trazo: '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>' },
        RESUELTO:          { texto: "Reporte resuelto",      color: "k-verde",   trazo: '<path d="M20 6L9 17l-5-5"/>' },
        NO_RESUELTO:       { texto: "Problema no resuelto",  color: "k-rojo",    trazo: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>' },
        REABIERTO:         { texto: "Caso reabierto",        color: "k-morado",  trazo: '<path d="M3 12a9 9 0 1 1 3 6.7"/><path d="M3 21v-6h6"/>' }
    };

    const PASO_BITACORA = {
        texto: "Actualización del técnico",
        color: "k-gris",
        trazo: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'
    };

    const RESULTADOS = {
        SOLUCIONADO:    { texto: "Solucionado",    color: "p-verde" },
        NO_SOLUCIONADO: { texto: "No solucionado", color: "p-rojo" },
        PENDIENTE:      { texto: "Pendiente",      color: "p-naranja" }
    };

    function tipoInfo(tipo) {
        return TIPOS[normalizar(tipo)] || {
            texto: titulo(String(tipo || "-").replaceAll("_", " ")),
            color: "k-azul",
            trazo: '<circle cx="12" cy="12" r="9"/>'
        };
    }

    function pasoInfo(estado) {
        return PASOS[normalizar(estado)] || {
            texto: titulo(String(estado || "Actualización").replaceAll("_", " ")),
            color: "k-azul",
            trazo: '<circle cx="12" cy="12" r="4"/>'
        };
    }

    function cambiarColor(elemento, clase) {
        elemento.className = elemento.className
            .split(" ")
            .filter(c => !/^k-/.test(c))
            .concat(clase)
            .join(" ");
    }


    /* =====================================================
       CAMPANA DE NOTIFICACIONES
       ===================================================== */

    const campanaBtn = $("campanaBtn");
    const campanaMenu = $("campanaMenu");

    function hace(valor) {
        const min = Math.max(0, Math.round((Date.now() - new Date(valor).getTime()) / 60000));
        if (min < 1) return "ahora";
        if (min < 60) return `hace ${min} min`;
        if (min < 1440) return `hace ${Math.round(min / 60)} h`;
        return fecha(valor);
    }

    async function refrescarCampana() {
        try {
            const { noLeidas } = await apiFetch("/api/notificaciones/cantidad");
            const insignia = $("campanaBadge");
            insignia.hidden = !noLeidas;
            insignia.textContent = noLeidas > 99 ? "99+" : noLeidas;
        } catch (error) { /* sin red: se ignora */ }
    }

    async function cargarNotificaciones() {

        const lista = $("campanaLista");
        lista.innerHTML = '<div class="dp-notif-ok">Cargando...</div>';

        try {
            const datos = await apiFetch("/api/notificaciones");

            lista.innerHTML = (datos && datos.length)
                ? datos.slice(0, 8).map(n => `
                    <a href="${esc(n.enlace || "#")}" class="dp-notif" data-id="${esc(n.id)}">
                        <span class="dp-cab-ico ${n.leida ? "c-celeste" : "c-naranja"}">
                            ${svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>')}
                        </span>
                        <span>
                            <strong>${esc(n.titulo)}</strong>
                            <small>${esc(n.mensaje)} · ${hace(n.fechaCreacion)}</small>
                        </span>
                    </a>`).join("")
                : '<div class="dp-notif-ok">Estás al día. No hay notificaciones.</div>';

        } catch (error) {
            lista.innerHTML = '<div class="dp-notif-ok">No se pudieron cargar.</div>';
        }
    }

    campanaBtn.addEventListener("click", evento => {

        evento.stopPropagation();

        const abrir = !campanaMenu.classList.contains("abierto");

        document.querySelectorAll(".dp-menu.abierto").forEach(m => m.classList.remove("abierto"));
        campanaMenu.classList.toggle("abierto", abrir);
        campanaBtn.setAttribute("aria-expanded", String(abrir));

        if (abrir) {
            cargarNotificaciones();
        }
    });

    campanaMenu.addEventListener("click", async evento => {

        evento.stopPropagation();

        const item = evento.target.closest(".dp-notif[data-id]");

        if (!item) {
            return;
        }

        try {
            await apiFetch(`/api/notificaciones/${item.dataset.id}/leida`, { method: "PATCH" });
        } catch (error) { /* nada */ }

        refrescarCampana();

        if (item.getAttribute("href") === "#") {
            evento.preventDefault();
        }
    });

    refrescarCampana();
    setInterval(refrescarCampana, 45000);


    /* =====================================================
       REPORTE
       ===================================================== */

    async function cargarReporte() {

        try {

            const reporte = await apiFetch(`/api/reportes/${id}`);

            mostrarReporte(reporte);

            try {
                mostrarMapa(reporte);
            } catch (errorMapa) {
                console.error("No se pudo mostrar el mapa:", errorMapa);
            }

        } catch (error) {

            console.error("Error al cargar el reporte:", error);

            toast("No se pudo cargar la información del reporte.", true);

            setTimeout(() => { window.location.href = "reportes.html"; }, 1500);
        }
    }

    function mostrarReporte(reporte) {

        const tipo = tipoInfo(reporte.tipoProblema);
        reporteTipoProblema = reporte.tipoProblema;

        // Hero
        $("reporteId").textContent = `#${reporte.reporteId}`;
        $("tipoProblema").textContent = tipo.texto;
        $("heroIcono").innerHTML = svg(tipo.trazo);

        // Resumen
        $("tipoProblemaDetalle").textContent = tipo.texto;
        $("kpiTipoIcono").innerHTML = svg(tipo.trazo);
        cambiarColor($("kpiTipo"), tipo.color);

        const prioridad = PRIORIDADES[normalizar(reporte.prioridad)] ||
            { texto: reporte.prioridad ? titulo(reporte.prioridad) : "-", color: "k-gris" };

        $("prioridadBadge").textContent = prioridad.texto;
        cambiarColor($("kpiPrioridad"), prioridad.color);

        const estado = ESTADOS[normalizar(reporte.estado)] ||
            { texto: reporte.estado ? titulo(String(reporte.estado).replaceAll("_", " ")) : "-", color: "k-gris" };

        $("estadoBadge").textContent = estado.texto;
        cambiarColor($("kpiEstado"), estado.color);

        $("fechaCreacion").textContent = fecha(reporte.fechaCreacion);
        $("horaCreacion").textContent = hora(reporte.fechaCreacion) || "\u00a0";

        // Descripción
        $("descripcion").textContent = reporte.descripcion || "-";

        // Titular
        const nombre = reporte.nombreTitular || "-";
        $("nombreTitular").textContent = nombre;
        $("titularAvatar").textContent = iniciales(nombre) || "?";
        $("titularAvatar").style.background = gradiente(nombre);
        $("dni").textContent = reporte.dni ?? "-";
        $("codigoSuministro").textContent = reporte.codigoSuministro ?? "-";
        $("direccion").textContent = reporte.direccion ?? "-";

        // Coordenadas
        const lat = Number(reporte.latitud);
        const lng = Number(reporte.longitud);
        const hayCoordenadas = reporte.latitud != null && reporte.longitud != null && !isNaN(lat) && !isNaN(lng);

        $("latitud").textContent = hayCoordenadas ? lat.toFixed(6) : "-";
        $("longitud").textContent = hayCoordenadas ? lng.toFixed(6) : "-";

        const enlaceMapa = $("abrirMaps");
        enlaceMapa.hidden = !hayCoordenadas;

        if (hayCoordenadas) {
            enlaceMapa.href = `https://www.google.com/maps?q=${lat},${lng}`;
        }

        // Botón reabrir
        $("reabrirButton").style.display =
            (rol === "ADMIN" && normalizar(reporte.estado) === "NO_RESUELTO")
                ? "inline-flex"
                : "none";

        // Datos para el modal
        $("modalReporteId").textContent = `Reporte #${reporte.reporteId}`;
        $("modalProblema").textContent = `${tipo.texto} • ${reporte.prioridad ?? "-"}`;
    }


    /* =====================================================
       MAPA
       ===================================================== */

    function mostrarMapa(reporte) {

        const contenedor = $("mapaReporte");

        const lat = parseFloat(reporte.latitud);
        const lng = parseFloat(reporte.longitud);

        if (isNaN(lat) || isNaN(lng)) {

            if (mapa) {
                mapa.remove();
                mapa = null;
            }

            contenedor.innerHTML = `
                <div class="rd-vacio">
                    <span class="rd-vacio-ico">${svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>')}</span>
                    <h4>Ubicación no disponible</h4>
                    <p>Este reporte todavía no tiene coordenadas registradas.</p>
                </div>`;

            return;
        }

        const popup = `
            <strong>Ubicación del reporte</strong><br>
            Reporte #${esc(reporte.reporteId)}<br>
            ${esc(tipoInfo(reporte.tipoProblema).texto)}`;

        // Si el mapa ya existe (por ejemplo al recargar tras asignar), solo se actualiza
        if (mapa) {
            mapa.setView([lat, lng], 16);
            marcador.setLatLng([lat, lng]).setPopupContent(popup);
            halo.setLatLng([lat, lng]);
            return;
        }

        contenedor.innerHTML = "";

        mapa = L.map("mapaReporte", { scrollWheelZoom: false }).setView([lat, lng], 16);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(mapa);

        halo = L.circle([lat, lng], {
            radius: 70,
            color: "#12a8e6",
            weight: 1.5,
            fillColor: "#12a8e6",
            fillOpacity: .12
        }).addTo(mapa);

        marcador = L.marker([lat, lng], {
            icon: L.divIcon({
                className: "",
                html: '<div class="rd-pin"></div>',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                popupAnchor: [0, -18]
            })
        }).addTo(mapa);

        marcador.bindPopup(popup).openPopup();

        // El zoom con la rueda se activa solo al hacer clic en el mapa
        mapa.on("click", () => mapa.scrollWheelZoom.enable());
        mapa.on("mouseout", () => mapa.scrollWheelZoom.disable());

        setTimeout(() => mapa.invalidateSize(), 300);
    }


    /* =====================================================
       EVIDENCIAS
       ===================================================== */

    const visor = $("visor");

    function abrirVisor(url, nombre) {
        $("visorImagen").src = url;
        $("visorNombre").textContent = nombre;
        visor.hidden = false;
    }

    function cerrarVisor() {
        visor.hidden = true;
        $("visorImagen").removeAttribute("src");
    }

    visor.addEventListener("click", evento => {
        if (evento.target.tagName !== "IMG") {
            cerrarVisor();
        }
    });

    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape" && !visor.hidden) {
            cerrarVisor();
        }
    });

    async function crearTarjetaEvidencia(evidencia) {

        const tarjeta = document.createElement("article");
        tarjeta.className = "rd-evi";

        const origen = titulo(evidencia.origen ?? "CIUDADANO");
        const colorOrigen = normalizar(evidencia.origen) === "TECNICO" ? "p-celeste" : "p-azul";
        const nombreArchivo = evidencia.nombreArchivo ?? "archivo";

        const pie = `
            <div class="rd-evi-pie">
                <div class="rd-evi-fila">
                    <span class="dp-pill ${colorOrigen}">${esc(origen)}</span>
                    <time>${esc(fecha(evidencia.fechaCreacion))} · ${esc(hora(evidencia.fechaCreacion))}</time>
                </div>
                <div class="rd-evi-nombre" title="${esc(nombreArchivo)}">
                    ${svg('<path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a1.5 1.5 0 0 1-2.12-2.12l8.49-8.48"/>', "pc-ico")}
                    <span>${esc(nombreArchivo)}</span>
                </div>
            </div>`;

        try {

            const url = `/api/evidencias/archivo/${evidencia.reporteId}/${encodeURIComponent(nombreArchivo)}`;

            const respuesta = await fetch(url, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });

            if (!respuesta.ok) {
                throw new Error(`Error al cargar imagen: ${respuesta.status}`);
            }

            const blob = await respuesta.blob();
            const urlBlob = URL.createObjectURL(blob);

            if (blob.type.startsWith("image/")) {

                tarjeta.innerHTML = `
                    <button type="button" class="rd-evi-img" aria-label="Ampliar evidencia">
                        <img src="${urlBlob}" alt="Evidencia del reporte" loading="lazy">
                        <span class="rd-evi-zoom">${svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/>', "pc-ico")}</span>
                    </button>
                    ${pie}`;

                tarjeta.querySelector(".rd-evi-img")
                    .addEventListener("click", () => abrirVisor(urlBlob, nombreArchivo));

            } else {

                tarjeta.innerHTML = `
                    <a class="rd-evi-archivo" href="${urlBlob}" download="${esc(nombreArchivo)}">
                        ${svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>')}
                        Descargar archivo
                    </a>
                    ${pie}`;
            }

        } catch (error) {

            console.error("Error al cargar la imagen:", error);

            tarjeta.innerHTML = `
                <div class="rd-vacio error" style="border:0;border-radius:0;">
                    <span class="rd-vacio-ico">${svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>')}</span>
                    <p>No se pudo cargar la imagen</p>
                </div>
                ${pie}`;
        }

        return tarjeta;
    }

    async function cargarEvidencias() {

        const contenedor = $("evidenciasContainer");
        const contador = $("evidenciasCount");

        try {

            const evidencias = await apiFetch(`/api/reportes/${id}/evidencias`);

            if (!evidencias || evidencias.length === 0) {

                contador.hidden = true;

                contenedor.innerHTML = `
                    <div class="rd-vacio">
                        <span class="rd-vacio-ico">${svg('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>')}</span>
                        <h4>Sin evidencias</h4>
                        <p>Este reporte no tiene evidencias adjuntas.</p>
                    </div>`;

                return;
            }

            contador.textContent = evidencias.length === 1 ? "1 archivo" : `${evidencias.length} archivos`;
            contador.hidden = false;

            const tarjetas = await Promise.all(evidencias.map(crearTarjetaEvidencia));

            contenedor.innerHTML = "";
            tarjetas.forEach(t => contenedor.appendChild(t));

        } catch (error) {

            console.error("Error al cargar evidencias:", error);

            contenedor.innerHTML = `
                <div class="rd-vacio error">
                    <span class="rd-vacio-ico">${svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>')}</span>
                    <h4>No se pudieron cargar las evidencias</h4>
                    <p>Revisa tu conexión e inténtalo de nuevo.</p>
                </div>`;
        }
    }


    /* =====================================================
       INFORME TÉCNICO
       ===================================================== */

    async function cargarInformeTecnico() {

        const contenedor = $("informeTecnicoContainer");

        try {

            const informe = await apiFetch(`/api/reportes/${id}/informe-tecnico`);

            const resultado = RESULTADOS[normalizar(informe.resultado)] ||
                { texto: informe.resultado ? titulo(String(informe.resultado).replaceAll("_", " ")) : "-", color: "p-gris" };

            contenedor.innerHTML = `
                <div class="rd-informe">

                    <div class="rd-informe-cab">
                        <div>
                            <h4>Informe de atención</h4>
                            <p>Registrado el ${esc(fecha(informe.fechaCreacion))} · ${esc(hora(informe.fechaCreacion))}</p>
                        </div>
                        <span class="dp-pill pri ${resultado.color}">${esc(resultado.texto)}</span>
                    </div>

                    <div class="rd-informe-meta">
                        <div class="rd-meta">
                            <span class="dp-cab-ico c-azul">${svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>')}</span>
                            <div>
                                <small>Técnico responsable</small>
                                <strong>${esc(informe.personalNombre ?? "-")}</strong>
                            </div>
                        </div>
                        <div class="rd-meta">
                            <span class="dp-cab-ico c-morado">${svg('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>')}</span>
                            <div>
                                <small>Fecha del informe</small>
                                <strong>${esc(fecha(informe.fechaCreacion))}</strong>
                            </div>
                        </div>
                    </div>

                    <div class="rd-informe-campos">
                        <div class="rd-campo">
                            <span>Diagnóstico</span>
                            <p>${esc(informe.diagnostico ?? "-")}</p>
                        </div>
                        <div class="rd-campo">
                            <span>Trabajo realizado</span>
                            <p>${esc(informe.trabajoRealizado ?? "-")}</p>
                        </div>
                    </div>

                </div>`;

        } catch (error) {

            // Normalmente significa que todavía no existe un informe (404)
            contenedor.innerHTML = `
                <div class="rd-vacio">
                    <span class="rd-vacio-ico">${svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>')}</span>
                    <h4>Informe técnico pendiente</h4>
                    <p>Este reporte todavía no tiene un informe técnico registrado.</p>
                </div>`;
        }
    }


    /* =====================================================
       SEGUIMIENTO
       ===================================================== */

    async function cargarSeguimientos() {

        const linea = $("seguimientoTimeline");

        try {

            const [seguimientos, bitacoras] = await Promise.all([
                apiFetch(`/api/reportes/${id}/seguimientos`),
                apiFetch(`/api/bitacoras/reporte/${id}`)
            ]);

            const eventos = [

                ...(seguimientos || []).map(s => ({
                    tipo: "SEGUIMIENTO",
                    fechaCreacion: s.fechaCreacion,
                    estado: s.estado,
                    texto: s.comentario,
                    quien: s.nombrePersonal
                })),

                ...(bitacoras || []).map(b => ({
                    tipo: "BITACORA",
                    fechaCreacion: b.fechaCreacion,
                    texto: b.descripcion,
                    quien: b.personalNombre
                }))
            ];

            if (eventos.length === 0) {

                linea.innerHTML = `
                    <div class="rd-vacio">
                        <span class="rd-vacio-ico">${svg('<path d="M3 12a9 9 0 1 1 3 6.7"/><path d="M3 21v-6h6"/>')}</span>
                        <h4>Sin actualizaciones</h4>
                        <p>Este reporte todavía no tiene actualizaciones.</p>
                    </div>`;

                return;
            }

            const ordenados = eventos.sort(
                (a, b) => new Date(a.fechaCreacion) - new Date(b.fechaCreacion)
            );

            linea.innerHTML = `<ol class="rd-timeline">${
                ordenados.map((evento, indice) => {

                    const paso = evento.tipo === "BITACORA" ? PASO_BITACORA : pasoInfo(evento.estado);
                    const actual = indice === ordenados.length - 1;

                    return `
                        <li class="rd-tl-item ${paso.color} ${actual ? "actual" : ""}">
                            <span class="rd-tl-punto">${svg(paso.trazo)}</span>
                            <div class="rd-tl-card">
                                <strong>${esc(paso.texto)}</strong>
                                <time>${esc(fecha(evento.fechaCreacion))} · ${esc(hora(evento.fechaCreacion))}</time>
                                ${evento.texto ? `<p>${esc(evento.texto)}</p>` : ""}
                                ${evento.quien
                                    ? `<span class="rd-tl-quien"><b>${esc(iniciales(evento.quien).charAt(0))}</b>${esc(evento.quien)}</span>`
                                    : ""}
                            </div>
                        </li>`;
                }).join("")
            }</ol>`;

        } catch (error) {

            console.error("Error al cargar seguimientos y bitácoras:", error);

            linea.innerHTML = `
                <div class="rd-vacio error">
                    <span class="rd-vacio-ico">${svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>')}</span>
                    <h4>No se pudo cargar</h4>
                    <p>No se pudieron cargar las actualizaciones.</p>
                </div>`;
        }
    }


    /* =====================================================
       REABRIR CASO
       ===================================================== */

    const reabrirButton = $("reabrirButton");

    const HTML_REABRIR = `${svg('<path d="M3 12a9 9 0 1 1 3 6.7"/><path d="M3 21v-6h6"/>', "pc-ico")}Reabrir caso`;

    reabrirButton.addEventListener("click", async () => {

        const confirmado = await Panel.confirmar(
            "Reabrir caso",
            "¿Deseas reabrir este caso para una nueva intervención?",
            "Reabrir caso"
        );

        if (!confirmado) {
            return;
        }

        try {

            reabrirButton.disabled = true;
            reabrirButton.textContent = "Reabriendo...";

            await apiFetch(`/api/reportes/${id}/reabrir`, { method: "POST" });

            toast("El caso fue reabierto correctamente.");

            await Promise.all([
                cargarReporte(),
                cargarSeguimientos(),
                cargarInformeTecnico()
            ]);

        } catch (error) {

            console.error("Error al reabrir caso:", error);

            toast(error.message || "No se pudo reabrir el caso.", true);

        } finally {

            reabrirButton.disabled = false;
            reabrirButton.innerHTML = HTML_REABRIR;
        }
    });


    /* =====================================================
       ASIGNAR TÉCNICO (modal)
       ===================================================== */

    const asignacionModal = $("asignacionModal");
    const asignarButton = $("asignarButton");
    const tecnicoSelect = $("tecnicoSelect");
    const observacionesAsignacion = $("observacionesAsignacion");
    const confirmarAsignacion = $("confirmarAsignacion");
    const asignacionMensaje = $("asignacionMensaje");

    const tecnicoTrigger = $("tecnicoTrigger");
    const tecnicoTriggerTexto = $("tecnicoTriggerTexto");
    const tecnicoLista = $("tecnicoLista");
    const tecnicoDropdown = $("tecnicoDropdown");
    const tecnicoAyuda = $("tecnicoAyuda");

    const AYUDA_BASE = "Solo se muestran técnicos de la especialidad del reporte.";

    function mostrarMensaje(texto, tipo) {
        asignacionMensaje.textContent = texto;
        asignacionMensaje.className = `asignacion-mensaje ${tipo}`;
    }

    function limpiarMensaje() {
        asignacionMensaje.textContent = "";
        asignacionMensaje.className = "asignacion-mensaje";
    }

    function abrirModal() {
        asignacionModal.classList.add("show");
        limpiarMensaje();
        observacionesAsignacion.value = "";
        tecnicoSelect.innerHTML = `<option value="">Cargando técnicos...</option>`;
    }

    function cerrarAsignacionModal() {
        asignacionModal.classList.remove("show");
    }

    asignarButton.addEventListener("click", async () => {
        abrirModal();
        await cargarTecnicos();
    });

    $("cerrarModal").addEventListener("click", cerrarAsignacionModal);
    $("cancelarModal").addEventListener("click", cerrarAsignacionModal);

    asignacionModal.addEventListener("click", evento => {
        if (evento.target === asignacionModal) {
            cerrarAsignacionModal();
        }
    });

    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape") {
            cerrarAsignacionModal();
        }
    });

    tecnicoTrigger.addEventListener("click", () => {
        tecnicoDropdown.classList.toggle("abierto");
    });

    document.addEventListener("click", evento => {
        if (!tecnicoDropdown.contains(evento.target)) {
            tecnicoDropdown.classList.remove("abierto");
        }
    });

    function seleccionarTecnico(tecnico) {

        tecnicoSelect.value = tecnico.id;
        tecnicoTriggerTexto.innerHTML = "";

        const nombre = document.createElement("span");
        nombre.className = "tecnico-trigger-nombre";
        nombre.textContent = tecnico.nombre;

        const estado = document.createElement("span");
        estado.className = `tecnico-estado ${tecnico.disponible ? "libre" : "ocupado"}`;
        estado.textContent = tecnico.disponible ? "Disponible" : "Ocupado";

        tecnicoTriggerTexto.append(nombre, estado);
        tecnicoTrigger.classList.add("tiene-valor");
        tecnicoDropdown.classList.remove("abierto");

        if (!tecnico.disponible) {
            tecnicoAyuda.textContent =
                "Este técnico tiene una asignación en curso, pero puedes asignarle el reporte igual.";
            tecnicoAyuda.className = "aviso";
        } else {
            tecnicoAyuda.textContent = AYUDA_BASE;
            tecnicoAyuda.className = "";
        }
    }

    async function cargarTecnicos() {

        tecnicoSelect.innerHTML = `<option value="">Selecciona un técnico</option>`;
        tecnicoSelect.value = "";
        tecnicoLista.innerHTML = "";
        tecnicoDropdown.classList.remove("abierto");
        tecnicoTrigger.classList.remove("tiene-valor");
        tecnicoTriggerTexto.textContent = "Cargando técnicos...";
        tecnicoAyuda.textContent = AYUDA_BASE;
        tecnicoAyuda.className = "";

        try {

            const tecnicos = await apiFetch(
                `/api/personal/tecnicos-disponibles?tipoProblema=${encodeURIComponent(reporteTipoProblema ?? "OTRO")}`
            );

            if (!tecnicos || tecnicos.length === 0) {
                tecnicoTriggerTexto.textContent = "No hay técnicos para esta especialidad";
                tecnicoLista.innerHTML =
                    `<div class="tecnico-vacio">No hay técnicos activos de esta especialidad.</div>`;
                return;
            }

            // Disponibles primero, luego por nombre
            tecnicos.sort((a, b) =>
                Number(b.disponible) - Number(a.disponible) ||
                a.nombre.localeCompare(b.nombre)
            );

            tecnicoAyuda.textContent =
                `Mostrando técnicos de ${tecnicos[0].especialidadEtiqueta}.`;
            tecnicoTriggerTexto.textContent = "Selecciona un técnico";

            tecnicos.forEach(tecnico => {

                const option = document.createElement("option");
                option.value = tecnico.id;
                option.textContent = tecnico.nombre;
                tecnicoSelect.appendChild(option);

                const item = document.createElement("button");
                item.type = "button";
                item.className = "tecnico-item";

                const avatar = document.createElement("span");
                avatar.className = "tecnico-avatar";
                avatar.textContent = tecnico.nombre.charAt(0).toUpperCase();

                const info = document.createElement("span");
                info.className = "tecnico-info";

                const nombre = document.createElement("strong");
                nombre.textContent = tecnico.nombre;

                const especialidad = document.createElement("small");
                especialidad.textContent = tecnico.especialidadEtiqueta;

                info.append(nombre, especialidad);

                const estado = document.createElement("span");
                estado.className = `tecnico-estado ${tecnico.disponible ? "libre" : "ocupado"}`;
                estado.textContent = tecnico.disponible ? "Disponible" : "Ocupado";

                item.append(avatar, info, estado);
                item.addEventListener("click", () => seleccionarTecnico(tecnico));

                tecnicoLista.appendChild(item);
            });

        } catch (error) {

            console.error("Error al cargar técnicos:", error);
            tecnicoTriggerTexto.textContent = "No se pudieron cargar los técnicos";
            mostrarMensaje("No se pudo obtener la lista de técnicos.", "error");
        }
    }

    confirmarAsignacion.addEventListener("click", async () => {

        const personalId = tecnicoSelect.value;
        const observaciones = observacionesAsignacion.value.trim();

        if (!personalId) {
            mostrarMensaje("Selecciona un técnico.", "error");
            return;
        }

        confirmarAsignacion.disabled = true;
        confirmarAsignacion.textContent = "Asignando...";

        try {

            const parametros = new URLSearchParams();
            parametros.append("personalId", personalId);

            if (observaciones) {
                parametros.append("observaciones", observaciones);
            }

            await apiFetch(`/api/reportes/${id}/asignaciones`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: parametros
            });

            mostrarMensaje("Técnico asignado correctamente.", "success");

            setTimeout(() => {
                cerrarAsignacionModal();
                toast("Técnico asignado correctamente.");
                cargarReporte();
                cargarSeguimientos();
            }, 900);

        } catch (error) {

            console.error("Error al asignar técnico:", error);
            mostrarMensaje(error.message, "error");

        } finally {

            confirmarAsignacion.disabled = false;
            confirmarAsignacion.textContent = "Asignar técnico";
        }
    });


    /* =====================================================
       CARGA INICIAL
       ===================================================== */

    cargarReporte();
    cargarEvidencias();
    cargarSeguimientos();
    cargarInformeTecnico();

});