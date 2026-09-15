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
                    📋
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

        const seguimientos =
            await apiFetch(
                `/api/reportes/${id}/seguimientos`
            );

        console.log(
            "Seguimientos recibidos:",
            seguimientos
        );

        timeline.innerHTML = "";

        if (!seguimientos || seguimientos.length === 0) {

            timeline.innerHTML = `
                <div class="seguimiento-vacio">
                    <span>📋</span>
                    <p>
                        Este reporte todavía no tiene actualizaciones.
                    </p>
                </div>
            `;

            return;
        }

        seguimientos.forEach((seguimiento, indice) => {

            const item =
                document.createElement("div");

            item.className =
                "seguimiento-item";

            item.innerHTML = `

                <div class="seguimiento-punto">
                    ${indice === seguimientos.length - 1 ? "●" : "✓"}
                </div>

                <div class="seguimiento-contenido">

                    <div class="seguimiento-header">

                        <strong>
                            ${formatearEstado(
                                seguimiento.estado
                            )}
                        </strong>

                        <span>
                            ${formatearFecha(
                                seguimiento.fechaCreacion
                            )}
                        </span>

                    </div>

                    <p>
                        ${seguimiento.comentario || ""}
                    </p>

                    ${
                        seguimiento.nombrePersonal
                        ? `
                            <small>
                                Actualizado por:
                                ${seguimiento.nombrePersonal}
                            </small>
                        `
                        : ""
                    }

                </div>

            `;

            timeline.appendChild(item);

        });

    } catch (error) {

        console.error(
            "Error al cargar seguimientos:",
            error
        );

        timeline.innerHTML = `
            <div class="seguimiento-vacio error">

                <span>⚠️</span>

                <p>
                    No se pudieron cargar los seguimientos.
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


        // Información para el modal

        modalReporteId.textContent =
            `Reporte #${reporte.reporteId}`;


        modalProblema.textContent =
            `${problemaFormateado} • ${reporte.prioridad ?? "-"}`;
    }

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

                    <span>📷</span>

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

                        📎 ${evidencia.nombreArchivo}

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