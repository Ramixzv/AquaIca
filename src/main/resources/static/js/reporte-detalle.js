document.addEventListener("DOMContentLoaded", () => {

    const reporteIdElement =
        document.getElementById("reporteId");

    const tipoProblema =
        document.getElementById("tipoProblema");

    const tipoProblemaDetalle =
        document.getElementById("tipoProblemaDetalle");

    const nombreTitular =
        document.getElementById("nombreTitular");

    const dni =
        document.getElementById("dni");

    const codigoSuministro =
        document.getElementById("codigoSuministro");

    const direccion =
        document.getElementById("direccion");

    const descripcion =
        document.getElementById("descripcion");

    const fechaCreacion =
        document.getElementById("fechaCreacion");

    const latitud =
        document.getElementById("latitud");

    const longitud =
        document.getElementById("longitud");

    const prioridadBadge =
        document.getElementById("prioridadBadge");

    const estadoBadge =
        document.getElementById("estadoBadge");

    const evidenciasContainer =
        document.getElementById("evidenciasContainer");



    const usernameDisplay =
        document.getElementById("usernameDisplay");

    const userAvatar =
        document.getElementById("userAvatar");

    const roleDisplay =
        document.getElementById("roleDisplay");

    const username =
        localStorage.getItem("username");

    const rol =
        localStorage.getItem("rol");


    if (username) {
        usernameDisplay.textContent = username;
    }

    if (rol) {
        roleDisplay.textContent = rol;
    }

    if (userAvatar && username) {

        userAvatar.textContent = username.charAt(0).toUpperCase();

        const paletaAvatares = [
            ["#0077b6", "#00a6d6"],
            ["#14b8a6", "#0ea5b7"],
            ["#7c3aed", "#a78bfa"],
            ["#f59e0b", "#f97316"],
            ["#059669", "#10b981"],
            ["#ec4899", "#f472b6"]
        ];

        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }

        const [colorA, colorB] =
            paletaAvatares[Math.abs(hash) % paletaAvatares.length];

        userAvatar.style.background =
            `linear-gradient(135deg, ${colorA}, ${colorB})`;
    }

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const id =
        parametros.get("id");


    console.log(
        "ID del reporte:",
        id
    );


    if (!id) {

        alert(
            "No se especificó el reporte."
        );

        window.location.href =
            "reportes.html";

        return;
    }

    const asignacionModal =
        document.getElementById(
            "asignacionModal"
        );

    const asignarButton =
        document.getElementById(
            "asignarButton"
        );

    const reabrirButton =
    document.getElementById(
        "reabrirButton"
    );

    const cerrarModal =
        document.getElementById(
            "cerrarModal"
        );

    const cancelarModal =
        document.getElementById(
            "cancelarModal"
        );

    const confirmarAsignacion =
        document.getElementById(
            "confirmarAsignacion"
        );

    const tecnicoSelect =
        document.getElementById(
            "tecnicoSelect"
        );

    const observacionesAsignacion =
        document.getElementById(
            "observacionesAsignacion"
        );

    const modalReporteId =
        document.getElementById(
            "modalReporteId"
        );

    const modalProblema =
        document.getElementById(
            "modalProblema"
        );

    const asignacionMensaje =
        document.getElementById(
            "asignacionMensaje"
        );

    async function cargarReporte() {

        try {

            const reporte =
                await apiFetch(
                    `/api/reportes/${id}`
                );


            console.log(
                "Reporte recibido:",
                reporte
            );


            mostrarReporte(
                reporte
            );
            mostrarMapa(reporte);
             


        } catch (error) {

            console.error(
                "Error al cargar el reporte:",
                error
            );


            alert(
                "No se pudo cargar la información del reporte."
            );


            window.location.href =
                "reportes.html";
        }
    }
    function mostrarMapa(reporte) {

    const mapaElemento =
        document.getElementById("mapaReporte");

    if (!mapaElemento) {
        return;
    }

    const latitud =
        parseFloat(reporte.latitud);

    const longitud =
        parseFloat(reporte.longitud);

    if (isNaN(latitud) || isNaN(longitud)) {

        mapaElemento.innerHTML = `
            <div class="mapa-sin-ubicacion">
                <span>📍</span>

                <h3>
                    Ubicación no disponible
                </h3>

                <p>
                    Este reporte todavía no tiene
                    coordenadas registradas.
                </p>
            </div>
        `;

        return;
    }

    const mapa =
        L.map("mapaReporte").setView(
            [latitud, longitud],
            16
        );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(mapa);

    const marcador =
        L.marker([
            latitud,
            longitud
        ]).addTo(mapa);

    marcador.bindPopup(`
        <strong>
            📍 Ubicación del reporte
        </strong>

        <br>

        Reporte #${reporte.reporteId}

        <br>

        ${formatearProblema(reporte.tipoProblema)}
    `).openPopup();

    setTimeout(() => {
        mapa.invalidateSize();
    }, 300);
}

    async function cargarInformeTecnico() {

    const container =
        document.getElementById(
            "informeTecnicoContainer"
        );

    if (!container) {
        return;
    }

    try {

        const informe =
            await apiFetch(
                `/api/reportes/${id}/informe-tecnico`
            );

        console.log(
            "Informe técnico recibido:",
            informe
        );


        container.innerHTML = `

            <div class="informe-tecnico-card">

                <div class="informe-tecnico-header">

                    <div>

                        <h3>
                            Informe de atención
                        </h3>

                        <p>
                            Registrado el
                            ${formatearFecha(
                                informe.fechaCreacion
                            )}
                        </p>

                    </div>


                    <span class="informe-resultado">

                        ${formatearResultadoInforme(
                            informe.resultado
                        )}

                    </span>

                </div>


                <div class="informe-tecnico-meta">

                    <div class="informe-meta-item">

                        <span>
                            Técnico responsable
                        </span>

                        <strong>
                            ${informe.personalNombre ?? "-"}
                        </strong>

                    </div>


                    <div class="informe-meta-item">

                        <span>
                            Fecha del informe
                        </span>

                        <strong>
                            ${formatearFecha(
                                informe.fechaCreacion
                            )}
                        </strong>

                    </div>

                </div>


                <div class="informe-campos">

                    <div class="informe-campo">

                        <span>
                            Diagnóstico
                        </span>

                        <p>
                            ${informe.diagnostico ?? "-"}
                        </p>

                    </div>


                    <div class="informe-campo">

                        <span>
                            Trabajo realizado
                        </span>

                        <p>
                            ${informe.trabajoRealizado ?? "-"}
                        </p>

                    </div>

                </div>

            </div>

        `;

    } catch (error) {

        console.error(
            "Error al cargar informe técnico:",
            error
        );


        /*
         * Si el endpoint responde 404 porque
         * todavía no existe informe, mostramos
         * un mensaje normal.
         */

        container.innerHTML = `

            <div class="informe-tecnico-vacio">

                <div class="informe-vacio-icon">
                    <svg class="icon-svg" viewBox="0 0 24 24" style="width:28px;height:28px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>
                </div>

                <h3>
                    Informe técnico pendiente
                </h3>

                <p>
                    Este reporte todavía no tiene
                    un informe técnico registrado.
                </p>

            </div>

        `;
    }
}
    async function cargarSeguimientos() {

    const timeline =
        document.getElementById("seguimientoTimeline");

    if (!timeline) {
        return;
    }

    try {

        const [seguimientos, bitacoras] = await Promise.all([

            apiFetch(
                `/api/reportes/${id}/seguimientos`
            ),

            apiFetch(
                `/api/bitacoras/reporte/${id}`
            )

        ]);

        console.log(
            "Seguimientos recibidos:",
            seguimientos
        );

        console.log(
            "Bitácoras recibidas:",
            bitacoras
        );


        // ==============================
        // CONVERTIR SEGUIMIENTOS
        // ==============================

        const eventosSeguimiento =
            (seguimientos || []).map(seguimiento => ({

                tipo: "SEGUIMIENTO",

                fechaCreacion:
                    seguimiento.fechaCreacion,

                estado:
                    seguimiento.estado,

                comentario:
                    seguimiento.comentario,

                personalNombre:
                    seguimiento.nombrePersonal

            }));


        // ==============================
        // CONVERTIR BITÁCORAS
        // ==============================

        const eventosBitacora =
            (bitacoras || []).map(bitacora => ({

                tipo: "BITACORA",

                fechaCreacion:
                    bitacora.fechaCreacion,

                descripcion:
                    bitacora.descripcion,

                personalNombre:
                    bitacora.personalNombre

            }));


        // ==============================
        // UNIR TODO
        // ==============================

        const eventos = [

            ...eventosSeguimiento,

            ...eventosBitacora

        ];


        timeline.innerHTML = "";


        if (eventos.length === 0) {

            timeline.innerHTML = `

                <div class="seguimiento-vacio">

                    <svg
                        class="icon-svg"
                        viewBox="0 0 24 24"
                        style="width:24px;height:24px;color:#0077b6;"
                    >
                        <path d="M3 12a9 9 0 1 1 3 6.7"/>
                        <path d="M3 21v-6h6"/>
                    </svg>

                    <p>
                        Este reporte todavía no tiene actualizaciones.
                    </p>

                </div>

            `;

            return;
        }


        // ==============================
        // ORDEN CRONOLÓGICO
        // ==============================

        const ordenados =
            [...eventos].sort(
                (a, b) =>
                    new Date(a.fechaCreacion) -
                    new Date(b.fechaCreacion)
            );




        ordenados.forEach(
            (evento, indice) => {

                const item =
                    document.createElement("div");

                item.className =
                    "seguimiento-item";


                const esActual =
                    indice === ordenados.length - 1;


                // ICONO

                const icono =
                    evento.tipo === "BITACORA"

                        ? "📝"

                        : (
                            esActual
                                ? "●"
                                : "✓"
                        );


                // TITULO

                const titulo =
                    evento.tipo === "BITACORA"

                        ? "Actualización del técnico"

                        : formatearEstado(
                            evento.estado
                        );


                // DESCRIPCION

                const descripcionEvento =
                    evento.tipo === "BITACORA"

                        ? evento.descripcion || ""

                        : evento.comentario || "";


                item.innerHTML = `

                    <div class="seguimiento-punto">
                        ${icono}
                    </div>


                    <div class="seguimiento-contenido">

                        <div class="seguimiento-header">

                            <strong>
                                ${titulo}
                            </strong>

                            <span>
                                ${formatearFecha(
                                    evento.fechaCreacion
                                )}
                            </span>

                        </div>


                        <p>
                            ${descripcionEvento}
                        </p>


                        ${
                            evento.personalNombre
                                ? `
                                    <small>
                                        Actualizado por:
                                        ${evento.personalNombre}
                                    </small>
                                `
                                : ""
                        }

                    </div>

                `;


                timeline.appendChild(item);

            }
        );


    } catch (error) {

        console.error(
            "Error al cargar seguimientos y bitácoras:",
            error
        );


        timeline.innerHTML = `

            <div class="seguimiento-vacio error">

                <span>⚠️</span>

                <p>
                    No se pudieron cargar las actualizaciones.
                </p>

            </div>

        `;

    }
}

function formatearEstado(estado) {

    const estados = {

        "REPORTADO":
            "Reporte recibido",

        "REVISADO":
            "Reporte revisado",

        "ASIGNADO":
            "Técnico asignado",

        "EN_ATENCION":
            "Técnico en atención",

        "TRABAJO_REALIZADO":
            "Trabajo realizado",

        "RESUELTO":
            "Reporte resuelto",

        "NO_RESUELTO":
            "Problema no resuelto"

    };

    return estados[estado] || estado;
}

function formatearResultadoInforme(resultado) {

    const resultados = {

        SOLUCIONADO:
            "Solucionado",

        NO_SOLUCIONADO:
            "No solucionado",

        PENDIENTE:
            "Pendiente"

    };

    return resultados[resultado]
        ?? resultado
        ?? "-";
}

function formatearFecha(fecha) {

    if (!fecha) {
        return "";
    }

    return new Date(fecha).toLocaleString(
        "es-PE",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );
}


    function mostrarReporte(reporte) {

        reporteIdElement.textContent =
            `#${reporte.reporteId}`;


        const problemaFormateado =
            formatearProblema(
                reporte.tipoProblema
            );


        tipoProblema.textContent =
            problemaFormateado;


        tipoProblemaDetalle.textContent =
            problemaFormateado;


        nombreTitular.textContent =
            reporte.nombreTitular ?? "-";


        dni.textContent =
            reporte.dni ?? "-";


        codigoSuministro.textContent =
            reporte.codigoSuministro ?? "-";


        direccion.textContent =
            reporte.direccion ?? "-";


        descripcion.textContent =
            reporte.descripcion ?? "-";


        latitud.textContent =
            reporte.latitud ?? "-";


        longitud.textContent =
            reporte.longitud ?? "-";


        fechaCreacion.textContent =
            formatearFecha(
                reporte.fechaCreacion
            );


        configurarPrioridad(
            reporte.prioridad
        );


        configurarEstado(
            reporte.estado
        );

        if (
        rol === "ADMIN" &&
        reporte.estado === "NO_RESUELTO"
        ) {
        reabrirButton.style.display = "inline-flex";
        } else {
        reabrirButton.style.display = "none";
        }


        // Información para el modal

        modalReporteId.textContent =
            `Reporte #${reporte.reporteId}`;


        modalProblema.textContent =
            `${problemaFormateado} • ${reporte.prioridad ?? "-"}`;
    }

    reabrirButton.addEventListener("click", async () => {

    const confirmar = confirm(
        "¿Deseas reabrir este caso para una nueva intervención?"
    );

    if (!confirmar) {
        return;
    }

    try {

        reabrirButton.disabled = true;
        reabrirButton.textContent = "Reabriendo...";

        await apiFetch(
            `/api/reportes/${id}/reabrir`,
            {
                method: "POST"
            }
        );

        alert(
            "El caso fue reabierto correctamente."
        );

        await cargarReporte();

        // Recargar asignaciones y seguimientos
        if (typeof cargarAsignaciones === "function") {
            await cargarAsignaciones();
        }

        if (typeof cargarSeguimientos === "function") {
            await cargarSeguimientos();
        }

    } catch (error) {

        console.error(
            "Error al reabrir caso:",
            error
        );

        alert(
            error.message ||
            "No se pudo reabrir el caso."
        );

    } finally {

        reabrirButton.disabled = false;
        reabrirButton.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24" style="width:14px;height:14px;vertical-align:-2px;margin-right:5px;"><path d="M3 12a9 9 0 1 1 3 6.7"/><path d="M3 21v-6h6"/></svg>Reabrir caso`;
    }

});

    async function cargarEvidencias() {

    try {

        const evidencias =
            await apiFetch(
                `/api/reportes/${id}/evidencias`
            );

        console.log(
            "Evidencias recibidas:",
            evidencias
        );

        evidenciasContainer.innerHTML = "";

        if (!evidencias || evidencias.length === 0) {

            evidenciasContainer.innerHTML = `
                <div class="sin-evidencias">

                    <svg class="icon-svg" viewBox="0 0 24 24" style="width:26px;height:26px;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>

                    <p>
                        Este reporte no tiene evidencias adjuntas.
                    </p>

                </div>
            `;

            return;
        }

        for (const evidencia of evidencias) {

            const tarjeta =
                document.createElement("div");

            tarjeta.className =
                "evidencia-item";


            const urlImagen =
                `/api/evidencias/archivo/${evidencia.reporteId}/${encodeURIComponent(evidencia.nombreArchivo)}`;


            try {

                const token =
                    localStorage.getItem("token");


                const respuestaImagen =
                    await fetch(
                        urlImagen,
                        {
                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );


                if (!respuestaImagen.ok) {

                    throw new Error(
                        `Error al cargar imagen: ${respuestaImagen.status}`
                    );

                }


                const blob =
                    await respuestaImagen.blob();


                const urlBlob =
                    URL.createObjectURL(blob);


                tarjeta.innerHTML = `

                    <div class="evidencia-header">

                        <strong>
                            Evidencia del ${evidencia.origen ?? "CIUDADANO"}
                        </strong>

                        <span>
                            ${formatearFecha(
                                evidencia.fechaCreacion
                            )}
                        </span>

                    </div>


                    <div class="evidencia-imagen">

                        <img
                            src="${urlBlob}"
                            alt="Evidencia del reporte"
                            loading="lazy"
                        >

                    </div>


                    <div class="evidencia-nombre">

                        <svg class="icon-svg" viewBox="0 0 24 24" style="width:12px;height:12px;vertical-align:-1px;margin-right:4px;"><path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a1.5 1.5 0 0 1-2.12-2.12l8.49-8.48"/></svg>${evidencia.nombreArchivo}

                    </div>

                `;


                evidenciasContainer.appendChild(
                    tarjeta
                );


            } catch (errorImagen) {

                console.error(
                    "Error al cargar la imagen:",
                    errorImagen
                );


                tarjeta.innerHTML = `

                    <div class="sin-evidencias error">

                        <p>
                            No se pudo cargar la imagen:
                            ${evidencia.nombreArchivo}
                        </p>

                    </div>

                `;


                evidenciasContainer.appendChild(
                    tarjeta
                );
            }
        }


    } catch (error) {

        console.error(
            "Error al cargar evidencias:",
            error
        );


        evidenciasContainer.innerHTML = `

            <div class="sin-evidencias error">

                <p>
                    No se pudieron cargar las evidencias.
                </p>

            </div>

        `;
    }
}


    function formatearProblema(
        problema
    ) {

        const problemas = {

            FUGA_AGUA:
                "Fuga de agua",

            CORTE_AGUA:
                "Corte de agua",

            BAJA_PRESION:
                "Baja presión",

            FACTURACION:
                "Problema de facturación",

            OTRO:
                "Otro problema"

        };


        return problemas[problema]
            ?? problema
            ?? "-";
    }


    function configurarPrioridad(
        prioridad
    ) {

        prioridadBadge.textContent =
            prioridad ?? "-";


        prioridadBadge.className =
            "prioridad-badge";


        if (!prioridad) {
            return;
        }


        prioridadBadge.classList.add(
            `prioridad-${prioridad.toLowerCase()}`
        );
    }

    function configurarEstado(
        estado
    ) {

        const estadoTexto = {

            PENDIENTE:
                "Pendiente",

            EN_PROCESO:
                "En proceso",

            RESUELTO:
                "Resuelto",

            ASIGNADO:
                "En proceso"

        };


        estadoBadge.textContent =
            estadoTexto[estado]
            ?? estado
            ?? "-";


        estadoBadge.className =
            "estado-badge";


        if (!estado) {
            return;
        }


        let claseEstado =
            estado.toLowerCase();


        if (estado === "ASIGNADO") {

            claseEstado =
                "en_proceso";

        }


        estadoBadge.classList.add(
            `estado-${claseEstado}`
        );
    }



    asignarButton.addEventListener(
        "click",
        async () => {

            abrirModal();

            await cargarTecnicos();

        }
    );

    function abrirModal() {

        asignacionModal.classList.add(
            "show"
        );


        limpiarMensaje();


        observacionesAsignacion.value =
            "";


        tecnicoSelect.innerHTML = `

            <option value="">
                Cargando técnicos...
            </option>

        `;
    }

    function cerrarAsignacionModal() {

        asignacionModal.classList.remove(
            "show"
        );
    }


    cerrarModal.addEventListener(
        "click",
        cerrarAsignacionModal
    );


    cancelarModal.addEventListener(
        "click",
        cerrarAsignacionModal
    );


    asignacionModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                asignacionModal
            ) {

                cerrarAsignacionModal();

            }

        }
    );

    async function cargarTecnicos() {

        try {

            const personal =
                await apiFetch(
                    "/api/personal"
                );


            console.log(
                "Personal recibido:",
                personal
            );


            const tecnicosActivos =
                personal.filter(
                    persona =>
                        persona.estado
                            ?.toUpperCase() ===
                        "ACTIVO"
                );


            tecnicoSelect.innerHTML = `

                <option value="">
                    Selecciona un técnico
                </option>

            `;


            if (
                tecnicosActivos.length === 0
            ) {

                tecnicoSelect.innerHTML = `

                    <option value="">
                        No hay técnicos activos
                    </option>

                `;

                return;
            }


            tecnicosActivos.forEach(
                tecnico => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        tecnico.id;


                    option.textContent =
                        `${tecnico.nombre} - ${tecnico.especialidad ?? "Sin especialidad"}`;


                    tecnicoSelect.appendChild(
                        option
                    );

                }
            );


        } catch (error) {

            console.error(
                "Error al cargar personal:",
                error
            );


            tecnicoSelect.innerHTML = `

                <option value="">
                    No se pudieron cargar los técnicos
                </option>

            `;


            mostrarMensaje(
                "No se pudo obtener la lista de técnicos.",
                "error"
            );

        }
    }


    confirmarAsignacion.addEventListener(
        "click",
        async () => {

            const personalId =
                tecnicoSelect.value;


            const observaciones =
                observacionesAsignacion.value.trim();


            if (!personalId) {

                mostrarMensaje(
                    "Selecciona un técnico.",
                    "error"
                );

                return;
            }


            confirmarAsignacion.disabled =
                true;


            confirmarAsignacion.textContent =
                "Asignando...";


            try {

                const parametros =
                    new URLSearchParams();


                parametros.append(
                    "personalId",
                    personalId
                );


                if (observaciones) {

                    parametros.append(
                        "observaciones",
                        observaciones
                    );

                }


                const asignacion =
                    await apiFetch(
                        `/api/reportes/${id}/asignaciones`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/x-www-form-urlencoded"
                            },

                            body: parametros
                        }
                    );


                console.log(
                    "Asignación creada:",
                    asignacion
                );


                mostrarMensaje(
                    "Técnico asignado correctamente.",
                    "success"
                );


                setTimeout(
                    () => {

                        cerrarAsignacionModal();

                        cargarReporte();

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "Error al asignar técnico:",
                    error
                );


                mostrarMensaje(
                    error.message,
                    "error"
                );


            } finally {

                confirmarAsignacion.disabled =
                    false;


                confirmarAsignacion.textContent =
                    "Asignar técnico";

            }

        }
    );


    function mostrarMensaje(
        texto,
        tipo
    ) {

        asignacionMensaje.textContent =
            texto;


        asignacionMensaje.className =
            `asignacion-mensaje ${tipo}`;
    }


    function limpiarMensaje() {

        asignacionMensaje.textContent =
            "";


        asignacionMensaje.className =
            "asignacion-mensaje";
    }



    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    logoutButton.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "username"
            );

            localStorage.removeItem(
                "rol"
            );


            window.location.href =
                "login.html";

        }
    );


    cargarReporte();

    cargarEvidencias();

    cargarSeguimientos();

    cargarInformeTecnico();

});