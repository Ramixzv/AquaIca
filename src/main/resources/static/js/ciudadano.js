(function () {

    "use strict";

    const SESION_CLAVES = ["token", "username", "rol", "personalId", "clienteId"];

    function cerrarSesion() {
        SESION_CLAVES.forEach(clave => localStorage.removeItem(clave));
        window.location.href = "login.html";
    }

    if (!localStorage.getItem("token") || localStorage.getItem("rol") !== "CIUDADANO") {
        cerrarSesion();
        return;
    }


    const $ = (selector, raiz = document) => raiz.querySelector(selector);
    const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

    function esc(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[c]);
    }

    function mayusculaInicial(texto) {
        return String(texto || "")
            .toLowerCase()
            .replace(/(^|\s)\S/g, letra => letra.toUpperCase());
    }

    function fechaCorta(valor) {
        const fecha = new Date(valor);
        if (!valor || Number.isNaN(fecha.getTime())) return "—";
        return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
    }

    function horaCorta(valor) {
        const fecha = new Date(valor);
        if (!valor || Number.isNaN(fecha.getTime())) return "";
        return fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    }

    function normalizar(valor) {
        return String(valor || "").trim().toUpperCase();
    }

    let temporizadorToast;

    function toast(mensaje, esError = false) {
        const caja = $("#toast");
        caja.textContent = mensaje;
        caja.classList.toggle("error", esError);
        caja.classList.add("show");
        clearTimeout(temporizadorToast);
        temporizadorToast = setTimeout(() => caja.classList.remove("show"), 3800);
    }

    async function api(url, opciones = {}) {
        const headers = { ...(opciones.headers || {}) };
        if (opciones.body) headers["Content-Type"] = "application/json";
        return apiFetch(url, { ...opciones, headers });
    }


    const svg = trazo => `<svg class="ico" viewBox="0 0 24 24">${trazo}</svg>`;

    const ICO = {
        gota: svg('<path d="M12 2.7s6 6.1 6 10.3a6 6 0 0 1-12 0c0-4.2 6-10.3 6-10.3z"/>'),
        alerta: svg('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>'),
        reloj: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
        check: svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>'),
        cruz: svg('<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>'),
        lupa: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
        doc: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
        chevron: svg('<path d="m9 6 6 6-6 6"/>'),
        mas: svg('<path d="M12 5v14M5 12h14"/>'),
        pin: svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
        ojo: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>')
    };

    const TIPOS_PROBLEMA = {
        FUGA_AGUA: "Fuga de agua",
        CORTE_AGUA: "Corte de agua",
        BAJA_PRESION: "Baja presión",
        FACTURACION: "Problema de facturación",
        OTRO: "Otro problema"
    };

    const ESTADOS_SOLICITUD = {
        PENDIENTE:      { texto: "Pendiente",      color: "naranja", borde: "#f0a53a" },
        EN_EVALUACION:  { texto: "En evaluación",  color: "azul",    borde: "#0a74c9" },
        OBSERVADA:      { texto: "Observada",      color: "amarillo",borde: "#d4a800" },
        APROBADA:       { texto: "Aprobada",       color: "celeste", borde: "#12a8e6" },
        EN_INSTALACION: { texto: "En instalación", color: "morado",  borde: "#7c4ddb" },
        ACTIVADA:       { texto: "Activada",       color: "verde",   borde: "#14a463" },
        RECHAZADA:      { texto: "Rechazada",      color: "rojo",    borde: "#e0453f" },
        CANCELADA:      { texto: "Cancelada",      color: "gris",    borde: "#9aaab8" }
    };

    const ESTADOS_REPORTE = {
        PENDIENTE:   { texto: "Pendiente",   color: "naranja", borde: "#f0a53a" },
        ASIGNADO:    { texto: "Asignado",    color: "azul",    borde: "#0a74c9" },
        EN_PROCESO:  { texto: "En atención", color: "celeste", borde: "#12a8e6" },
        EN_ATENCION: { texto: "En atención", color: "celeste", borde: "#12a8e6" },
        RESUELTO:    { texto: "Resuelto",    color: "verde",   borde: "#14a463" },
        REABIERTO:   { texto: "Reabierto",   color: "morado",  borde: "#7c4ddb" }
    };

    const ESTADOS_EN_TRAMITE = ["PENDIENTE", "EN_EVALUACION", "OBSERVADA", "APROBADA", "EN_INSTALACION"];
    const ESTADOS_CANCELABLES = ["PENDIENTE", "OBSERVADA"];
    const PASOS_SOLICITUD = ["PENDIENTE", "EN_EVALUACION", "APROBADA", "EN_INSTALACION", "ACTIVADA"];

    function infoEstado(catalogo, estado) {
        const clave = normalizar(estado);
        return catalogo[clave] || {
            texto: mayusculaInicial(clave.replaceAll("_", " ")) || "Sin estado",
            color: "gris",
            borde: "#9aaab8"
        };
    }

    function pill(catalogo, estado, conIcono = false) {
        const info = infoEstado(catalogo, estado);
        const icono = conIcono ? ICO.reloj : "";
        return `<span class="pill pill-${info.color}">${icono}${esc(info.texto)}</span>`;
    }

    function tipoLegible(tipo) {
        return TIPOS_PROBLEMA[normalizar(tipo)] || mayusculaInicial(String(tipo || "Incidencia").replaceAll("_", " "));
    }


    /* =====================================================
       ESTADO DE LA PANTALLA
       ===================================================== */

    const datos = {
        perfil: null,
        reportes: [],
        solicitudes: [],
        filtroSolicitudes: "TODAS",
        filtroReportes: "TODOS",
        verTodasActividad: false,
        solicitudNueva: null,
        solicitudACancelar: null,
        suministros: [],
        suministroConsumo: null
    };


    /* =====================================================
       CARGA DE DATOS
       ===================================================== */

    async function cargarDatos() {

        const fallos = [];

        const intentar = (promesa, nombre, valorPorDefecto) =>
            promesa.catch(error => {
                console.error(`Error al cargar ${nombre}:`, error);
                fallos.push(nombre);
                return valorPorDefecto;
            });

        const [perfil, reportes, solicitudes, suministros] = await Promise.all([
            intentar(api("/api/clientes/me"), "tu perfil", null),
            intentar(api("/api/reportes/mis-reportes-ciudadano"), "tus reportes", []),
            intentar(api("/api/solicitudes-servicio/mis-solicitudes"), "tus solicitudes", []),
            intentar(api("/api/ciudadano/suministros"), "tus suministros", [])
        ]);

        datos.perfil = perfil;
        datos.reportes = Array.isArray(reportes) ? reportes : [];
        datos.solicitudes = Array.isArray(solicitudes) ? solicitudes : [];
        datos.suministros = Array.isArray(suministros) ? suministros : [];

        const aviso = $("#avisoCarga");

        if (fallos.length) {
            aviso.hidden = false;
            aviso.textContent =
                `No pudimos cargar ${fallos.join(", ")}. Actualiza la página o inténtalo más tarde.`;
        } else {
            aviso.hidden = true;
        }
    }

    async function recargarSolicitudes() {
        try {
            const lista = await api("/api/solicitudes-servicio/mis-solicitudes");
            datos.solicitudes = Array.isArray(lista) ? lista : [];
        } catch (error) {
            console.error(error);
        }
        renderizarTodo();
    }


    /* =====================================================
       RENDER: CABECERA / PERFIL
       ===================================================== */

    function nombreCompleto() {
        return mayusculaInicial(
            datos.perfil?.nombreCompleto || localStorage.getItem("username") || "Ciudadano"
        );
    }

    function primerNombre() {
        return nombreCompleto().split(" ")[0];
    }

    function renderizarUsuario() {
        const nombre = nombreCompleto();
        const inicial = nombre.charAt(0).toUpperCase();

        $("#userName").textContent = nombre;
        $("#userAvatar").textContent = inicial;
        $("#perfilAvatar").textContent = inicial;

        $("#perfilNombre").textContent = nombre;
        $("#perfilDni").textContent = datos.perfil?.dni || "—";
        $("#perfilTelefono").textContent = datos.perfil?.telefono || "No registrado";
        $("#perfilEmail").textContent = datos.perfil?.email || "No registrado";
        $("#perfilUsuario").textContent = localStorage.getItem("username") || "—";
        $("#perfilDesde").textContent = fechaCorta(datos.perfil?.fechaRegistro);

        const estado = normalizar(datos.perfil?.estado || "ACTIVO");
        const pillEstado = $("#perfilEstado");
        pillEstado.textContent = mayusculaInicial(estado);
        pillEstado.className = `pill ${estado === "ACTIVO" ? "pill-verde" : "pill-gris"}`;
    }


    /* =====================================================
       RENDER: INICIO
       ===================================================== */

    function renderizarKpis() {

        const activas = datos.solicitudes
            .filter(s => ESTADOS_EN_TRAMITE.includes(normalizar(s.estado))).length;

        const pendientes =
            datos.reportes.filter(r => normalizar(r.estado) === "PENDIENTE").length +
            datos.solicitudes.filter(s => normalizar(s.estado) === "PENDIENTE").length;

        $("#kpiSolicitudes").textContent = activas;
        $("#kpiReportes").textContent = datos.reportes.length;
        $("#kpiPendientes").textContent = pendientes;
    }

    function renderizarActividad() {

        const contenedor = $("#actividad");

        const movimientos = [
            ...datos.solicitudes.map(s => ({
                vista: "solicitudes",
                icono: ICO.gota,
                color: "azul",
                titulo: "Nueva conexión de agua",
                detalle: s.direccion || "Solicitud de instalación de suministro",
                fecha: s.fechaSolicitud,
                estado: pill(ESTADOS_SOLICITUD, s.estado, true)
            })),
            ...datos.reportes.map(r => ({
                vista: "reportes",
                icono: ICO.alerta,
                color: "rojo",
                titulo: tipoLegible(r.tipoProblema),
                detalle: "Reporte de incidencia",
                fecha: r.fechaCreacion,
                estado: pill(ESTADOS_REPORTE, r.estado, true)
            }))
        ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        $("#btnVerTodas").hidden = movimientos.length <= 5;
        $("#btnVerTodas").firstChild.textContent = datos.verTodasActividad ? "Ver menos " : "Ver todas ";

        if (!movimientos.length) {
            contenedor.innerHTML = `
                <div class="vacio">
                    <div class="ico-g">${ICO.reloj}</div>
                    <h4>Aún no tienes actividad</h4>
                    <p>Cuando solicites un servicio o reportes una incidencia, aparecerá aquí.</p>
                </div>`;
            return;
        }

        const visibles = datos.verTodasActividad ? movimientos : movimientos.slice(0, 5);

        contenedor.innerHTML = `
            <div class="act-cab"><span>Trámite</span><span>Fecha</span><span>Estado</span><span></span></div>
            ${visibles.map(m => `
                <div class="act-fila" data-vista="${m.vista}" tabindex="0" role="link">
                    <div class="act-item">
                        <span class="act-ico ${m.color}">${m.icono}</span>
                        <div>
                            <strong>${esc(m.titulo)}</strong>
                            <small>${esc(m.detalle)}</small>
                        </div>
                    </div>
                    <div class="act-fecha">${esc(fechaCorta(m.fecha))}<small>${esc(horaCorta(m.fecha))}</small></div>
                    <div>${m.estado}</div>
                    ${ICO.chevron}
                </div>`).join("")}`;
    }


    /* =====================================================
       RENDER: CHIPS DE FILTRO
       ===================================================== */

    function renderizarChips(contenedor, lista, catalogo, filtroActual, etiquetaTodos) {

        const claves = [...new Set(lista.map(i => normalizar(i.estado)))];

        const chips = [
            `<button type="button" class="chip ${filtroActual === etiquetaTodos ? "activo" : ""}" data-filtro="${etiquetaTodos}">Todas <b>${lista.length}</b></button>`,
            ...claves.map(clave => {
                const cantidad = lista.filter(i => normalizar(i.estado) === clave).length;
                return `<button type="button" class="chip ${filtroActual === clave ? "activo" : ""}" data-filtro="${clave}">${esc(infoEstado(catalogo, clave).texto)} <b>${cantidad}</b></button>`;
            })
        ];

        contenedor.innerHTML = lista.length ? chips.join("") : "";
    }


    /* =====================================================
       RENDER: MIS SOLICITUDES
       ===================================================== */

    function renderizarSolicitudes() {

        renderizarChips(
            $("#chipsSolicitudes"), datos.solicitudes, ESTADOS_SOLICITUD,
            datos.filtroSolicitudes, "TODAS"
        );

        const contenedor = $("#listaSolicitudes");

        if (!datos.solicitudes.length) {
            contenedor.innerHTML = `
                <div class="vacio">
                    <div class="ico-g">${ICO.doc}</div>
                    <h4>Aún no tienes solicitudes</h4>
                    <p>Solicita una nueva conexión de agua y sigue su avance desde aquí.</p>
                    <a href="#solicitar" class="btn-prim chico">${ICO.mas} Solicitar servicio</a>
                </div>`;
            return;
        }

        const lista = [...datos.solicitudes]
            .filter(s => datos.filtroSolicitudes === "TODAS" || normalizar(s.estado) === datos.filtroSolicitudes)
            .sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));

        contenedor.innerHTML = `<div class="lista">${lista.map(tarjetaSolicitud).join("")}</div>`;
    }

    function progresoSolicitud(estado) {

        const clave = normalizar(estado);

        if (clave === "RECHAZADA" || clave === "CANCELADA") return "";

        const indice = clave === "OBSERVADA"
            ? 1
            : PASOS_SOLICITUD.indexOf(clave);

        return `
            <ol class="progreso">
                ${PASOS_SOLICITUD.map((paso, i) => `
                    <li class="${i <= indice ? "hecho" : ""} ${i === indice ? "actual" : ""}">
                        ${esc(infoEstado(ESTADOS_SOLICITUD, paso).texto)}
                    </li>`).join("")}
            </ol>`;
    }

    function tarjetaSolicitud(s) {

        const info = infoEstado(ESTADOS_SOLICITUD, s.estado);
        const puedeCancelar = ESTADOS_CANCELABLES.includes(normalizar(s.estado));
        const esNueva = datos.solicitudNueva === s.id;

        return `
            <article class="item ${esNueva ? "nuevo" : ""}" style="--borde:${info.borde}">

                <div class="item-cab">
                    <div class="item-titulo">
                        <span class="act-ico azul">${ICO.gota}</span>
                        <div>
                            <strong>Solicitud de conexión #${esc(s.id)}</strong>
                            <small>Registrada el ${esc(fechaCorta(s.fechaSolicitud))} · ${esc(horaCorta(s.fechaSolicitud))}</small>
                        </div>
                    </div>
                    ${pill(ESTADOS_SOLICITUD, s.estado, true)}
                </div>

                <dl class="item-datos">
                    <div><dt>Dirección</dt><dd>${esc(s.direccion || "—")}</dd></div>
                    ${s.referencia ? `<div><dt>Referencia</dt><dd>${esc(s.referencia)}</dd></div>` : ""}
                    ${s.descripcion ? `<div><dt>Detalles</dt><dd>${esc(s.descripcion)}</dd></div>` : ""}
                    ${s.latitud != null && s.longitud != null ? `<div><dt>Ubicación</dt><dd>${Number(s.latitud).toFixed(5)}, ${Number(s.longitud).toFixed(5)}</dd></div>` : ""}
                </dl>

                ${s.observaciones ? `<p class="item-obs"><strong>Indicaciones del personal:</strong> ${esc(s.observaciones)}</p>` : ""}

                ${progresoSolicitud(s.estado)}

                ${["APROBADA", "EN_INSTALACION", "ACTIVADA"].includes(s.estado) ? `
                    <div class="item-pie">
                        <button type="button" class="btn-link" data-comprobante="${esc(s.id)}">Ver comprobante</button>
                    </div>` : ""}

                ${puedeCancelar ? `
                    <div class="item-pie">
                        <button type="button" class="btn-link rojo" data-cancelar="${esc(s.id)}">
                            ${ICO.cruz} Cancelar solicitud
                        </button>
                    </div>` : ""}

            </article>`;
    }


    /* =====================================================
       RENDER: MIS REPORTES
       ===================================================== */

    function renderizarReportes() {

        renderizarChips(
            $("#chipsReportes"), datos.reportes, ESTADOS_REPORTE,
            datos.filtroReportes, "TODOS"
        );

        const contenedor = $("#listaReportes");

        if (!datos.reportes.length) {
            contenedor.innerHTML = `
                <div class="vacio">
                    <div class="ico-g">${ICO.alerta}</div>
                    <h4>Aún no tienes reportes</h4>
                    <p>Cuando reportes un problema con tu servicio, podrás seguirlo desde aquí.</p>
                    <a href="reporte.html" class="btn-prim chico">${ICO.mas} Reportar incidencia</a>
                </div>`;
            return;
        }

        const lista = [...datos.reportes]
            .filter(r => datos.filtroReportes === "TODOS" || normalizar(r.estado) === datos.filtroReportes)
            .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));

        contenedor.innerHTML = `<div class="lista">${lista.map(tarjetaReporte).join("")}</div>`;
    }

    function tarjetaReporte(r) {

        const info = infoEstado(ESTADOS_REPORTE, r.estado);

        const enlaceSeguimiento = r.reporteId != null && r.codigoSuministro
            ? `seguimiento.html?id=${encodeURIComponent(r.reporteId)}&codigo=${encodeURIComponent(r.codigoSuministro)}`
            : null;

        return `
            <article class="item" style="--borde:${info.borde}">

                <div class="item-cab">
                    <div class="item-titulo">
                        <span class="act-ico rojo">${ICO.alerta}</span>
                        <div>
                            <strong>${esc(tipoLegible(r.tipoProblema))}</strong>
                            <small>Reporte #${esc(r.reporteId)} · ${esc(fechaCorta(r.fechaCreacion))} ${esc(horaCorta(r.fechaCreacion))}</small>
                        </div>
                    </div>
                    ${pill(ESTADOS_REPORTE, r.estado, true)}
                </div>

                <dl class="item-datos">
                    <div><dt>Descripción</dt><dd>${esc(r.descripcion || "Sin descripción")}</dd></div>
                    <div><dt>Dirección</dt><dd>${esc(r.direccion || "—")}</dd></div>
                    <div><dt>Código de suministro</dt><dd>${esc(r.codigoSuministro || "—")}</dd></div>
                </dl>

                ${enlaceSeguimiento ? `
                    <div class="item-pie">
                        <a class="btn-link" href="${enlaceSeguimiento}">${ICO.ojo} Ver seguimiento</a>
                    </div>` : ""}

            </article>`;
    }


    /* =====================================================
       RENDER GENERAL
       ===================================================== */

    function renderizarTodo() {
        renderizarUsuario();
        renderizarKpis();
        renderizarActividad();
        renderizarSolicitudes();
        renderizarReportes();
        renderizarSuministros();
        if (vistaActual === "consumo") prepararConsumo();
        actualizarAvisoTramite();
        actualizarTitulo(vistaActual);
    }


    /* =====================================================
       NAVEGACIÓN ENTRE VISTAS
       ===================================================== */

    const VISTAS = ["inicio", "solicitar", "solicitudes", "suministros", "consumo", "reportes", "perfil", "ayuda"];
    let vistaActual = "inicio";

    function textosCabecera(vista) {
        return {
            inicio:      ["Portal ciudadano", `Hola, ${primerNombre()} 👋`, "Gestiona tus servicios de agua desde un solo lugar."],
            solicitar:   ["Servicios", "Solicitar servicio", "Registra una nueva solicitud de conexión de agua."],
            solicitudes: ["Servicios", "Mis solicitudes", "Consulta el avance de tus trámites."],
            suministros: ["Servicios", "Mis suministros", "Tus conexiones de agua y su código."],
            consumo:     ["Servicios", "Mi consumo", "Tu consumo mensual de agua en m³."],
            reportes:    ["Incidencias", "Mis reportes", "Sigue el estado de los problemas que reportaste."],
            perfil:      ["Cuenta", "Mi perfil", "Información de tu cuenta ciudadana."],
            ayuda:       ["Soporte", "Ayuda", "Resuelve tus dudas sobre el servicio."]
        }[vista];
    }

    function actualizarTitulo(vista) {
        const [kicker, titulo, sub] = textosCabecera(vista);
        $("#topKicker").textContent = kicker;
        $("#topTitulo").textContent = titulo;
        $("#topSub").textContent = sub;
    }

    function mostrarVista() {

        const pedida = window.location.hash.replace("#", "");
        vistaActual = VISTAS.includes(pedida) ? pedida : "inicio";

        VISTAS.forEach(v => { $(`#vista-${v}`).hidden = v !== vistaActual; });

        $$(".p-link[data-vista]").forEach(enlace =>
            enlace.classList.toggle("activo", enlace.dataset.vista === vistaActual)
        );

        actualizarTitulo(vistaActual);
        cerrarMenuMovil();
        window.scrollTo({ top: 0, behavior: "instant" });

        if (vistaActual === "solicitar") {
            setTimeout(iniciarMapa, 60);
        }

        if (vistaActual === "consumo") prepararConsumo();
    }

    window.addEventListener("hashchange", mostrarVista);


    /* =====================================================
       MENÚ MÓVIL Y MENÚ DE USUARIO
       ===================================================== */

    function cerrarMenuMovil() {
        $("#sidebar").classList.remove("abierto");
        $("#backdrop").classList.remove("abierto");
    }

    $("#menuBtn").addEventListener("click", () => {
        $("#sidebar").classList.add("abierto");
        $("#backdrop").classList.add("abierto");
    });

    $("#backdrop").addEventListener("click", cerrarMenuMovil);

    const botonUsuario = $("#userBtn");
    const menuUsuario = $("#userDropdown");

    function alternarMenuUsuario(abrir) {
        menuUsuario.classList.toggle("abierto", abrir);
        botonUsuario.setAttribute("aria-expanded", String(abrir));
    }

    botonUsuario.addEventListener("click", evento => {
        evento.stopPropagation();
        alternarMenuUsuario(!menuUsuario.classList.contains("abierto"));
    });

    menuUsuario.addEventListener("click", () => alternarMenuUsuario(false));
    document.addEventListener("click", () => alternarMenuUsuario(false));

    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape") {
            alternarMenuUsuario(false);
            cerrarModal();
        }
    });

    $("#logoutBtn").addEventListener("click", cerrarSesion);


    /* =====================================================
       EVENTOS DE LISTAS (CHIPS, ACTIVIDAD, CANCELAR)
       ===================================================== */

    $("#chipsSolicitudes").addEventListener("click", evento => {
        const chip = evento.target.closest("[data-filtro]");
        if (!chip) return;
        datos.filtroSolicitudes = chip.dataset.filtro;
        renderizarSolicitudes();
    });

    $("#chipsReportes").addEventListener("click", evento => {
        const chip = evento.target.closest("[data-filtro]");
        if (!chip) return;
        datos.filtroReportes = chip.dataset.filtro;
        renderizarReportes();
    });

    $("#btnVerTodas").addEventListener("click", () => {
        datos.verTodasActividad = !datos.verTodasActividad;
        renderizarActividad();
    });

    function irA(vista) {
        window.location.hash = vista;
    }

    $("#actividad").addEventListener("click", evento => {
        const fila = evento.target.closest("[data-vista]");
        if (fila) irA(fila.dataset.vista);
    });

    $("#actividad").addEventListener("keydown", evento => {
        if (evento.key !== "Enter") return;
        const fila = evento.target.closest("[data-vista]");
        if (fila) irA(fila.dataset.vista);
    });

    $("#listaSolicitudes").addEventListener("click", evento => {
        const boton = evento.target.closest("[data-cancelar]");
        if (boton) abrirModalCancelar(Number(boton.dataset.cancelar));
    });


    /* =====================================================
       CANCELAR SOLICITUD
       ===================================================== */

    /* =====================================================
       COMPROBANTE DE APROBACIÓN
       ===================================================== */

    async function abrirComprobante(id) {
        try {
            const c = await api(`/api/ordenes-instalacion/comprobante/${id}`);
            const activada = c.estadoSolicitud === "ACTIVADA";
            const fh = v => new Date(v).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
            const sigue = activada
                ? "Ya cuentas con el servicio. Guarda tu código de suministro para consultar tus reportes."
                : c.visitaTecnica
                    ? "Un técnico fue asignado y tu visita está programada. Si algo cambia, lo verás actualizado aquí."
                    : "El personal coordinará la visita técnica. La fecha de instalación y la activación del servicio se confirmarán cuando se asigne al técnico.";
            $("#compCuerpo").innerHTML = `
                <div class="comp-cab">
                    <div class="comp-marca">
                        <img src="images/logo-aquaica.png" alt="" width="40" height="40">
                        <div><strong>Aqualca</strong><span>Sistema de Gestión del Servicio de Agua</span></div>
                    </div>
                    <span class="comp-estado">${activada ? "Activada" : "Aprobada"}</span>
                </div>
                <p class="comp-tipo">Comprobante de aprobación</p>
                <h3>${activada ? "¡Tu servicio fue activado!" : "¡Tu solicitud fue aprobada!"}</h3>
                <p class="comp-txt">Aprobamos tu solicitud de conexión de agua. Usa este código para consultar el avance de tu instalación.</p>
                <div class="comp-codigo"><span>N.º de orden de instalación</span><strong>${esc(c.codigoOrden)}</strong></div>
                <dl class="comp-datos">
                    <div><dt>Titular</dt><dd>${esc(c.titular)}</dd></div>
                    <div><dt>Solicitud</dt><dd>${esc(c.codigoSolicitud)}</dd></div>
                    <div><dt>Dirección</dt><dd>${esc(c.direccion)}</dd></div>
                    <div><dt>Visita técnica</dt><dd>${c.visitaTecnica ? esc(fh(c.visitaTecnica)) : "Pendiente de programación"}</dd></div>
                    <div><dt>Medidor</dt><dd>${c.medidorSerie ? esc(c.medidorSerie) : "Pendiente de instalación"}</dd></div>
                    ${c.codigoSuministro ? `<div><dt>Suministro</dt><dd>${esc(c.codigoSuministro)}</dd></div>` : ""}
                </dl>
                <p class="comp-sigue"><strong>¿Qué sigue?</strong> ${sigue}</p>
                <p class="comp-pie">Aprobada el ${esc(fh(c.fechaAprobacion))} · Emitido el ${esc(fh(c.fechaEmision))}</p>`;
            $("#modalComprobante").hidden = false;
        } catch (error) {
            toast(mensajeDeError(error, "No se pudo cargar el comprobante."), true);
        }
    }

    document.addEventListener("click", evento => {
        const boton = evento.target.closest("[data-comprobante]");
        if (boton) abrirComprobante(Number(boton.dataset.comprobante));
    });
    $("#compCerrar").addEventListener("click", () => { $("#modalComprobante").hidden = true; });
    $("#modalComprobante").addEventListener("click", evento => {
        if (evento.target === $("#modalComprobante")) $("#modalComprobante").hidden = true;
    });
    $("#compImprimir").addEventListener("click", () => window.print());


    function abrirModalCancelar(id) {
        const solicitud = datos.solicitudes.find(s => Number(s.id) === id);
        if (!solicitud) return;

        datos.solicitudACancelar = id;
        $("#modalTexto").textContent =
            `Vas a cancelar tu solicitud de conexión para "${solicitud.direccion}". Esta acción no se puede deshacer.`;
        $("#modalCancelar").hidden = false;
    }

    function cerrarModal() {
        $("#modalCancelar").hidden = true;
        datos.solicitudACancelar = null;
    }

    $("#modalNo").addEventListener("click", cerrarModal);

    $("#modalCancelar").addEventListener("click", evento => {
        if (evento.target === $("#modalCancelar")) cerrarModal();
    });

    $("#modalSi").addEventListener("click", async () => {

        const id = datos.solicitudACancelar;
        if (id == null) return;

        const boton = $("#modalSi");
        boton.disabled = true;
        boton.textContent = "Cancelando...";

        try {
            await api(`/api/solicitudes-servicio/${id}/cancelar`, { method: "PATCH" });
            cerrarModal();
            toast("Tu solicitud fue cancelada.");
            await recargarSolicitudes();
        } catch (error) {
            cerrarModal();
            toast(mensajeDeError(error, "No se pudo cancelar la solicitud. Solo puedes cancelar solicitudes pendientes u observadas."), true);
        } finally {
            boton.disabled = false;
            boton.textContent = "Sí, cancelar";
        }
    });

    function mensajeDeError(error, porDefecto) {
        const mensaje = error?.message || "";
        return !mensaje || mensaje === "Error en la solicitud" ? porDefecto : mensaje;
    }


    /* =====================================================
       FORMULARIO: SOLICITAR SERVICIO
       ===================================================== */

    const formulario = $("#formSolicitud");
    const campoDireccion = $("#solDireccion");
    const campoReferencia = $("#solReferencia");
    const campoDescripcion = $("#solDescripcion");

    [
        [campoDireccion, "#cntDireccion"],
        [campoReferencia, "#cntReferencia"],
        [campoDescripcion, "#cntDescripcion"]
    ].forEach(([campo, contador]) => {
        campo.addEventListener("input", () => {
            $(contador).textContent = campo.value.length;
            campo.classList.remove("error");
            $("#solError").textContent = "";
        });
    });

    function tieneSolicitudEnTramite() {
        return datos.solicitudes.some(s => ESTADOS_EN_TRAMITE.includes(normalizar(s.estado)));
    }

    function actualizarAvisoTramite() {
        const bloqueado = tieneSolicitudEnTramite();
        $("#alertaTramite").hidden = !bloqueado;
        $("#btnEnviarSolicitud").disabled = bloqueado;
    }

    /* ---------- Mapa ---------- */

    let mapa = null;
    let marcador = null;
    let coordenadas = null;

    function mostrarCoordenadas() {
        const texto = $("#solCoords");
        if (coordenadas) {
            texto.textContent = `Ubicación seleccionada: ${coordenadas.lat.toFixed(6)}, ${coordenadas.lng.toFixed(6)}`;
            texto.classList.add("ok");
        } else {
            texto.textContent = "Sin ubicación seleccionada.";
            texto.classList.remove("ok");
        }
    }

    function colocarMarcador(lat, lng, acercar = false) {

        if (!mapa) return;

        coordenadas = { lat, lng };

        if (!marcador) {
            marcador = L.marker([lat, lng], { draggable: true }).addTo(mapa);
            marcador.on("dragend", () => {
                const punto = marcador.getLatLng();
                coordenadas = { lat: punto.lat, lng: punto.lng };
                mostrarCoordenadas();
            });
        } else {
            marcador.setLatLng([lat, lng]);
        }

        if (acercar) mapa.setView([lat, lng], 17);
        mostrarCoordenadas();
    }

    function iniciarMapa() {

        if (!window.L) {
            $("#solMapa").innerHTML =
                '<p class="cargando">No se pudo cargar el mapa. Puedes enviar la solicitud sin ubicación.</p>';
            return;
        }

        if (mapa) {
            mapa.invalidateSize();
            return;
        }

        mapa = L.map("solMapa").setView([-14.0678, -75.7286], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap"
        }).addTo(mapa);

        mapa.on("click", evento => colocarMarcador(evento.latlng.lat, evento.latlng.lng));
    }

    async function buscarEnMapa() {

        const consulta = $("#solBuscar").value.trim();
        if (!consulta || !mapa) return;

        const boton = $("#btnBuscarMapa");
        boton.disabled = true;

        try {
            const url =
                "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pe&q=" +
                encodeURIComponent(consulta + ", Ica, Perú");

            const respuesta = await fetch(url, { headers: { Accept: "application/json" } });
            const resultados = await respuesta.json();

            if (!resultados.length) {
                toast("No encontramos esa dirección. Marca el punto directamente en el mapa.", true);
                return;
            }

            colocarMarcador(Number(resultados[0].lat), Number(resultados[0].lon), true);

        } catch (error) {
            toast("No se pudo buscar la dirección. Marca el punto directamente en el mapa.", true);
        } finally {
            boton.disabled = false;
        }
    }

    $("#btnBuscarMapa").addEventListener("click", buscarEnMapa);

    $("#solBuscar").addEventListener("keydown", evento => {
        if (evento.key === "Enter") {
            evento.preventDefault();
            buscarEnMapa();
        }
    });

    $("#btnMiUbicacion").addEventListener("click", () => {

        if (!navigator.geolocation || !mapa) {
            toast("Tu navegador no permite obtener la ubicación.", true);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            posicion => colocarMarcador(posicion.coords.latitude, posicion.coords.longitude, true),
            () => toast("No pudimos obtener tu ubicación. Revisa los permisos del navegador.", true),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });

    /* ---------- Limpiar y enviar ---------- */

    function limpiarFormulario() {
        formulario.reset();
        ["#cntDireccion", "#cntReferencia", "#cntDescripcion"].forEach(c => { $(c).textContent = "0"; });
        $$(".error", formulario).forEach(c => c.classList.remove("error"));
        $("#solError").textContent = "";

        if (marcador && mapa) {
            mapa.removeLayer(marcador);
            marcador = null;
        }

        coordenadas = null;
        mostrarCoordenadas();
    }

    $("#btnLimpiar").addEventListener("click", limpiarFormulario);

    formulario.addEventListener("submit", async evento => {

        evento.preventDefault();

        const error = $("#solError");
        error.textContent = "";

        if (tieneSolicitudEnTramite()) {
            error.textContent = "Ya tienes una solicitud en trámite.";
            return;
        }

        const direccion = campoDireccion.value.trim();

        if (!direccion) {
            campoDireccion.classList.add("error");
            error.textContent = "La dirección del predio es obligatoria.";
            campoDireccion.focus();
            return;
        }

        const carga = {
            direccion,
            referencia: campoReferencia.value.trim() || null,
            descripcion: campoDescripcion.value.trim() || null,
            latitud: coordenadas ? coordenadas.lat : null,
            longitud: coordenadas ? coordenadas.lng : null
        };

        const boton = $("#btnEnviarSolicitud");
        const textoOriginal = boton.innerHTML;

        boton.disabled = true;
        boton.textContent = "Enviando...";

        try {

            const creada = await api("/api/solicitudes-servicio", {
                method: "POST",
                body: JSON.stringify(carga)
            });

            datos.solicitudNueva = creada?.id ?? null;
            datos.filtroSolicitudes = "TODAS";

            limpiarFormulario();
            toast("¡Solicitud enviada! Puedes seguir su estado en «Mis solicitudes».");

            await recargarSolicitudes();
            irA("solicitudes");

            setTimeout(() => { datos.solicitudNueva = null; }, 3000);

        } catch (fallo) {

            error.textContent = mensajeDeError(
                fallo,
                "No se pudo registrar la solicitud. Revisa los datos e inténtalo nuevamente."
            );

        } finally {

            boton.innerHTML = textoOriginal;
            actualizarAvisoTramite();
        }
    });


    /* =====================================================
       INICIO
       ===================================================== */

/* =====================================================
       MIS SUMINISTROS Y MI CONSUMO
       ===================================================== */

    const m3 = valor => valor == null ? "—"
        : Number(valor).toLocaleString("es-PE", { maximumFractionDigits: 2 }) + " m³";

    const diaLocal = valor => fechaCorta(String(valor).slice(0, 10) + "T00:00:00");

    function renderizarSuministros() {

        const lista = $("#listaSuministros");

        if (!datos.suministros.length) {
            lista.innerHTML = `
                <div class="vacio">
                    <div class="ico-g">${ICO.gota}</div>
                    <h4>Aún no tienes suministros</h4>
                    <p>Cuando se active tu servicio, tu código de suministro aparecerá aquí. Puedes iniciar el trámite en <a href="#solicitar">Solicitar servicio</a>.</p>
                </div>`;
            return;
        }

        lista.innerHTML = datos.suministros.map(s => `
            <article class="item" style="--borde:#0ea5c6">
                <div class="item-cab">
                    <div class="item-titulo">
                        <span class="act-ico azul">${ICO.gota}</span>
                        <div>
                            <strong>Suministro ${esc(s.codigoSuministro)}</strong>
                            <small>${esc(s.direccion || "—")}</small>
                        </div>
                    </div>
                    <button type="button" class="btn-link" data-copiar="${esc(s.codigoSuministro)}">Copiar código</button>
                </div>

                <dl class="item-datos">
                    <div><dt>Medidor</dt><dd>${esc(s.medidorSerie || "Sin medidor activo")}</dd></div>
                    <div><dt>Instalado</dt><dd>${s.medidorInstalado ? esc(diaLocal(s.medidorInstalado)) : "—"}</dd></div>
                    <div><dt>Última lectura</dt><dd>${s.ultimaLectura == null ? "Sin lecturas" : `${esc(m3(s.ultimaLectura))} · ${esc(diaLocal(s.ultimaFechaLectura))}`}${s.simulada ? ' <span class="sim-tag">Simulada</span>' : ""}</dd></div>
                    <div><dt>Último consumo</dt><dd>${esc(m3(s.ultimoConsumoM3))}</dd></div>
                </dl>

                <div class="item-pie sum-acciones">
                    <button type="button" class="btn-sec chico" data-ver-consumo="${esc(s.id)}">Ver consumo</button>
                    <a class="btn-prim chico" href="reporte.html?codigo=${encodeURIComponent(s.codigoSuministro)}">Reportar un problema</a>
                </div>
            </article>`).join("");
    }

    function prepararConsumo() {

        const caja = $("#consumoContenido");
        const selector = $("#selSuministro");

        if (!datos.suministros.length) {
            $("#consumoSelector").hidden = true;
            caja.innerHTML = `
                <div class="vacio">
                    <div class="ico-g">${ICO.gota}</div>
                    <h4>Todavía no hay consumo para mostrar</h4>
                    <p>Tu consumo aparecerá aquí cuando tengas un suministro con medidor activo.</p>
                </div>`;
            return;
        }

        selector.innerHTML = datos.suministros.map(s =>
            `<option value="${esc(s.id)}">${esc(s.codigoSuministro)} · ${esc(s.direccion || "")}</option>`
        ).join("");

        $("#consumoSelector").hidden = datos.suministros.length < 2;

        const elegido = datos.suministros.some(s => s.id === datos.suministroConsumo)
            ? datos.suministroConsumo
            : datos.suministros[0].id;

        datos.suministroConsumo = elegido;
        selector.value = String(elegido);
        cargarConsumo(elegido);
    }

    async function cargarConsumo(id) {

        const caja = $("#consumoContenido");
        caja.innerHTML = '<div class="cargando">Cargando tu consumo...</div>';

        try {
            const filas = await api(`/api/ciudadano/suministros/${id}/consumo`);
            if (datos.suministroConsumo !== id) return;
            pintarConsumo(Array.isArray(filas) ? filas : []);
        } catch (error) {
            caja.innerHTML = `
                <div class="vacio">
                    <div class="ico-g">${ICO.alerta}</div>
                    <h4>No pudimos cargar tu consumo</h4>
                    <p>${esc(mensajeDeError(error, "Inténtalo de nuevo más tarde."))}</p>
                </div>`;
        }
    }

    function pintarConsumo(filas) {

        const caja = $("#consumoContenido");
        const mensuales = filas.filter(f => !f.inicial && f.consumoM3 != null);

        if (!mensuales.length) {
            caja.innerHTML = `
                <div class="vacio">
                    <div class="ico-g">${ICO.reloj}</div>
                    <h4>Aún no hay consumo registrado</h4>
                    <p>${filas.length
                        ? "Tu medidor ya tiene su lectura inicial. El consumo aparecerá desde la primera lectura mensual."
                        : "Todavía no hay lecturas de tu medidor."}</p>
                </div>`;
            return;
        }

        const visibles = mensuales.slice(-12);
        const valores = visibles.map(f => Number(f.consumoM3));
        const maximo = Math.max(...valores, 1);
        const total = valores.reduce((a, b) => a + b, 0);
        const hayPrueba = filas.some(f => f.simulada);

        const mes = f => new Date(f.periodo + "-01T00:00:00")
            .toLocaleDateString("es-PE", { month: "short", year: "2-digit" });

        const barras = visibles.map(f => `
            <div class="cons-barra ${f.simulada ? "sim" : ""}" title="${esc(m3(f.consumoM3))}">
                <div class="cons-zona">
                    <div class="cons-pila" style="height:${Math.max(8, (Number(f.consumoM3) / maximo) * 100)}%">
                        <span class="cons-val">${esc(Number(f.consumoM3).toLocaleString("es-PE", { maximumFractionDigits: 1 }))}</span>
                        <div class="cons-col"></div>
                    </div>
                </div>
                <small>${esc(mes(f))}</small>
            </div>`).join("");

        const tabla = [...filas].reverse().map(f => `
            <tr>
                <td>${esc(mes(f))}<br><small>${esc(diaLocal(f.fechaLectura))}</small></td>
                <td class="num">${f.inicial ? "—" : esc(m3(f.lecturaAnterior))}</td>
                <td class="num"><strong>${esc(m3(f.lecturaActual))}</strong></td>
                <td class="num">${f.inicial ? "—" : esc(m3(f.consumoM3))}</td>
                <td>${f.inicial ? "Lectura inicial" : f.simulada ? '<span class="sim-tag">Simulada</span>' : "Real"}</td>
            </tr>`).join("");

        caja.innerHTML = `
            <div class="cons-kpis">
                <div class="cons-kpi"><span>Último consumo</span><strong>${esc(m3(valores[valores.length - 1]))}</strong></div>
                <div class="cons-kpi"><span>Promedio mensual</span><strong>${esc(m3(total / valores.length))}</strong></div>
                <div class="cons-kpi"><span>Total de ${valores.length} ${valores.length === 1 ? "mes" : "meses"}</span><strong>${esc(m3(total))}</strong></div>
            </div>
            <div class="cons-barras" role="img" aria-label="Consumo mensual en metros cúbicos">${barras}</div>
            ${hayPrueba ? '<p class="cons-leyenda"><span class="sim-tag">Simulada</span> Las barras con rayas son datos de prueba, no una lectura real.</p>' : ""}
            <div class="cons-scroll">
                <table class="cons-tabla">
                    <thead><tr><th>Periodo</th><th class="num">Anterior</th><th class="num">Actual</th><th class="num">Consumo</th><th>Tipo</th></tr></thead>
                    <tbody>${tabla}</tbody>
                </table>
            </div>`;
    }

    $("#listaSuministros").addEventListener("click", evento => {

        const copiar = evento.target.closest("[data-copiar]");
        if (copiar) {
            const codigo = copiar.dataset.copiar;
            (navigator.clipboard ? navigator.clipboard.writeText(codigo) : Promise.reject())
                .then(() => toast("Código copiado: " + codigo))
                .catch(() => toast("Tu código es " + codigo));
            return;
        }

        const ver = evento.target.closest("[data-ver-consumo]");
        if (ver) {
            datos.suministroConsumo = Number(ver.dataset.verConsumo);
            window.location.hash = "consumo";
        }
    });

    $("#selSuministro").addEventListener("change", evento => {
        datos.suministroConsumo = Number(evento.target.value);
        cargarConsumo(datos.suministroConsumo);
    });


    async function iniciar() {

        $("#userName").textContent = nombreCompleto();
        $("#userAvatar").textContent = nombreCompleto().charAt(0).toUpperCase();

        $("#actividad").innerHTML = '<div class="cargando">Cargando tu actividad...</div>';
        $("#listaSolicitudes").innerHTML = '<div class="cargando">Cargando solicitudes...</div>';
        $("#listaReportes").innerHTML = '<div class="cargando">Cargando reportes...</div>';
        $("#listaSuministros").innerHTML = '<div class="cargando">Cargando suministros...</div>';

        mostrarVista();

        await cargarDatos();

        renderizarTodo();
    }

    iniciar();

})();