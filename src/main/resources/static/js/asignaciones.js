document.addEventListener("DOMContentLoaded", () => {


    const usernameDisplay =
        document.getElementById("usernameDisplay");

    const roleDisplay =
        document.getElementById("roleDisplay");

    const userInitial =
        document.getElementById("userInitial");

    const container =
        document.getElementById(
            "asignacionesContainer"
        );


    const totalAsignaciones =
        document.getElementById(
            "totalAsignaciones"
        );

    const asignacionesPendientes =
        document.getElementById(
            "asignacionesPendientes"
        );

    const asignacionesAtencion =
        document.getElementById(
            "asignacionesAtencion"
        );

    const asignacionesFinalizadas =
        document.getElementById(
            "asignacionesFinalizadas"
        );


    const username =
        localStorage.getItem("username");

    const rol =
        localStorage.getItem("rol");

    const personalId =
        localStorage.getItem("personalId");




    if (username) {

        usernameDisplay.textContent =
            username;

        userInitial.textContent =
            username
                .charAt(0)
                .toUpperCase();

    }


    if (rol) {

        roleDisplay.textContent =
            rol;

    }

    if (!personalId) {

        container.innerHTML = `

            <div class="asignaciones-vacio">

                <span>⚠️</span>

                <h3>
                    No se encontró el personal
                </h3>

                <p>
                    Cierra sesión y vuelve a iniciar sesión
                    para actualizar tus datos.
                </p>

            </div>

        `;

        return;

    }

    async function cargarAsignaciones() {

        try {

            const asignaciones =
                await apiFetch(
                    `/api/personal/${personalId}/asignaciones`
                );
            console.log("ASIGNACIONES RECIBIDAS:", asignaciones);

asignaciones.forEach(asignacion => {
    console.log(
        "Reporte:",
        asignacion.reporteId,
        "Estado:",
        asignacion.estado
    );
});


            console.log(
                "Asignaciones recibidas:",
                asignaciones
            );


            actualizarEstadisticas(
                asignaciones
            );


            mostrarAsignaciones(
                asignaciones
            );


        } catch (error) {

            console.error(
                "Error al cargar asignaciones:",
                error
            );


            container.innerHTML = `

                <div class="asignaciones-vacio error">

                    <span>⚠️</span>

                    <h3>
                        No se pudieron cargar las asignaciones
                    </h3>

                    <p>
                        ${error.message}
                    </p>

                </div>

            `;

        }

    }


    function actualizarEstadisticas(asignaciones) {

    const total =
        asignaciones.length;

    const pendientes =
        asignaciones.filter(
            asignacion =>
                asignacion.estado === "PENDIENTE"
        ).length;

    const atencion =
        asignaciones.filter(
            asignacion =>
                asignacion.estado === "EN_ATENCION"
        ).length;

    const finalizadas =
        asignaciones.filter(
            asignacion =>
                asignacion.estado === "FINALIZADA"
        ).length;


    totalAsignaciones.textContent =
        total;

    asignacionesPendientes.textContent =
        pendientes;

    asignacionesAtencion.textContent =
        atencion;

    asignacionesFinalizadas.textContent =
        finalizadas;

}

    async function mostrarAsignaciones(
        asignaciones
    ) {

        container.innerHTML = "";


        if (
            !asignaciones ||
            asignaciones.length === 0
        ) {

            container.innerHTML = `

                <div class="asignaciones-vacio">

                    <span>✓</span>

                    <h3>
                        No tienes asignaciones
                    </h3>

                    <p>
                        Actualmente no tienes trabajos
                        asignados.
                    </p>

                </div>

            `;

            return;

        }



        for (const asignacion of asignaciones) {
            const tieneInforme =
    asignacion.estado === "EN_ATENCION"
        ? await tieneInformeTecnico(asignacion.reporteId)
        : false;

                const tarjeta =
                    document.createElement(
                        "article"
                    );


                tarjeta.className =
                    "asignacion-card";


                tarjeta.innerHTML = `

                    <div class="asignacion-card-header">

                        <div>

                            <span class="asignacion-id">

                                #${asignacion.reporteId}

                            </span>

                            <h3>

                                Reporte asignado

                            </h3>

                        </div>


                        <span class="asignacion-estado">

                            ${asignacion.estado ?? "-"}

                        </span>

                    </div>


                    <div class="asignacion-info">

                        <div>

                            <span>
                                Fecha de asignación
                            </span>

                            <strong>

                                ${
                                    formatearFecha(
                                        asignacion.fechaAsignacion
                                    )
                                }

                            </strong>

                        </div>


                        <div>

                            <span>
                                Observaciones
                            </span>

                            <strong>

                                ${
                                    asignacion.observaciones
                                    ?? "Sin observaciones"
                                }

                            </strong>

                        </div>

                    </div>


                    <div class="asignacion-actions">

                        <button
                            class="secondary-button"
                            onclick="verReporte(
                                ${asignacion.reporteId}
                            )">

                            Ver reporte

                        </button>


                        ${
                            asignacion.estado === "ACTIVA"
                            ?

                            `
                            <button
                                class="primary-button"
                                onclick="iniciarAtencion(
                                    ${asignacion.id},
                                    ${asignacion.reporteId}
                                )">

                                Iniciar atención

                            </button>
                            `

                            :

                            ""
                        }

                ${
    asignacion.estado === "EN_ATENCION"
        ?
        (
            tieneInforme
                ?
                `
                <button
                    class="secondary-button"
                    disabled>

                    ✅ Informe registrado

                </button>
                `
                :
                `
                <button
                    class="primary-button"
                    onclick="mostrarFormularioInforme(
                        ${asignacion.reporteId}
                    )">

                    📝 Registrar informe

                </button>
                `
        )
        :
        ""
}

${
    asignacion.estado === "EN_ATENCION"
        ?
        `
        <button
            class="secondary-button"
            onclick="mostrarSubirEvidencia(
                ${asignacion.reporteId}
            )">

            📷 Subir evidencia

        </button>
        `
        :
        ""
}

                    </div>

                `;


                container.appendChild(
                    tarjeta
                );

            }
        

    }

    window.verReporte =
        function(reporteId) {

            window.location.href =
                `reporte-detalle.html?id=${reporteId}`;

        };
    
    window.mostrarFormularioInforme =
    function(reporteId) {

        const formularioExistente =
            document.getElementById(
                `formularioInforme-${reporteId}`
            );

        if (formularioExistente) {
            return;
        }


        const tarjeta =
            document.querySelector(
                `.asignacion-card:has(button[onclick*="${reporteId}"])`
            );


        if (!tarjeta) {
            console.error(
                "No se encontró la tarjeta del reporte:",
                reporteId
            );

            return;
        }


        const formulario =
            document.createElement("div");

        formulario.id =
            `formularioInforme-${reporteId}`;

        formulario.className =
            "formulario-informe";


        formulario.innerHTML = `

            <div class="formulario-informe-header">

                <h3>
                    📝 Informe técnico
                </h3>

                <span>
                    Reporte #${reporteId}
                </span>

            </div>


            <div class="formulario-informe-campo">

                <label>
                    Diagnóstico
                </label>

                <textarea
                    id="diagnostico-${reporteId}"
                    placeholder="Describe el problema encontrado..."
                    rows="4"
                    required>
                </textarea>

            </div>


            <div class="formulario-informe-campo">

                <label>
                    Trabajo realizado
                </label>

                <textarea
                    id="trabajo-${reporteId}"
                    placeholder="Describe las acciones realizadas..."
                    rows="4"
                    required>
                </textarea>

            </div>


            <div class="formulario-informe-campo">

                <label>
                    Resultado
                </label>

                <select
                    id="resultado-${reporteId}">

                    <option value="">
                        Seleccionar resultado
                    </option>

                    <option value="SOLUCIONADO">
                        Solucionado
                    </option>

                    <option value="NO_SOLUCIONADO">
                        No solucionado
                    </option>

                    <option value="PENDIENTE">
                        Pendiente
                    </option>

                </select>

            </div>


            <div class="formulario-informe-actions">

                <button
                    type="button"
                    class="secondary-button"
                    onclick="cerrarFormularioInforme(${reporteId})">

                    Cancelar

                </button>


                <button
                    type="button"
                    class="primary-button"
                    onclick="guardarInforme(${reporteId})">

                    💾 Guardar informe

                </button>

            </div>

        `;


        tarjeta.appendChild(formulario);

    };

window.mostrarSubirEvidencia =
    function(reporteId) {

        const existente =
            document.getElementById(
                `formularioEvidencia-${reporteId}`
            );

        if (existente) {
            return;
        }


        const tarjeta =
            document.querySelector(
                `.asignacion-card:has(button[onclick*="${reporteId}"])`
            );


        if (!tarjeta) {

            console.error(
                "No se encontró la tarjeta del reporte:",
                reporteId
            );

            return;
        }


        const formulario =
            document.createElement("div");

        formulario.id =
            `formularioEvidencia-${reporteId}`;

        formulario.className =
            "formulario-evidencia";


        formulario.innerHTML = `

            <div class="formulario-evidencia-header">

                <h3>
                    📷 Evidencia técnica
                </h3>

                <span>
                    Reporte #${reporteId}
                </span>

            </div>


            <div class="formulario-evidencia-campo">

                <label>
                    Seleccionar fotografía
                </label>

                <input
                    type="file"
                    id="archivoEvidencia-${reporteId}"
                    accept="image/*">

            </div>


            <div class="formulario-evidencia-actions">

                <button
                    type="button"
                    class="secondary-button"
                    onclick="cerrarFormularioEvidencia(
                        ${reporteId}
                    )">

                    Cancelar

                </button>


                <button
                    type="button"
                    class="primary-button"
                    onclick="subirEvidenciaTecnico(
                        ${reporteId}
                    )">

                    📤 Subir fotografía

                </button>

            </div>

        `;


        tarjeta.appendChild(
            formulario
        );

    }; 

window.subirEvidenciaTecnico =
    async function(reporteId) {

        const input =
            document.getElementById(
                `archivoEvidencia-${reporteId}`
            );


        if (!input || !input.files.length) {

            alert(
                "Debes seleccionar una fotografía."
            );

            return;
        }


        const archivo =
            input.files[0];


        const formulario =
            new FormData();

        formulario.append(
            "archivo",
            archivo
        );


        try {

            console.log(
                "Subiendo evidencia técnica:",
                {
                    reporteId,
                    nombre: archivo.name
                }
            );


            const evidencia =
                await apiFetch(
                    `/api/reportes/${reporteId}/evidencias/tecnico`,
                    {
                        method: "POST",
                        body: formulario
                    }
                );


            console.log(
                "Evidencia técnica registrada:",
                evidencia
            );


            alert(
                "La fotografía se subió correctamente."
            );


            cerrarFormularioEvidencia(
                reporteId
            );


        } catch (error) {

            console.error(
                "Error al subir evidencia técnica:",
                error
            );


            alert(
                error.message ||
                "No se pudo subir la fotografía."
            );

        }

    };

window.cerrarFormularioEvidencia =
    function(reporteId) {

        const formulario =
            document.getElementById(
                `formularioEvidencia-${reporteId}`
            );

        if (formulario) {

            formulario.remove();

        }

    };

async function tieneInformeTecnico(reporteId) {

    try {

        await apiFetch(
            `/api/reportes/${reporteId}/informe-tecnico`
        );

        return true;

    } catch (error) {

        return false;

    }
}

window.guardarInforme =
    async function(reporteId) {

        const diagnostico =
            document.getElementById(
                `diagnostico-${reporteId}`
            ).value.trim();


        const trabajoRealizado =
            document.getElementById(
                `trabajo-${reporteId}`
            ).value.trim();


        const resultado =
            document.getElementById(
                `resultado-${reporteId}`
            ).value;


        if (!diagnostico) {

            alert(
                "Debes ingresar el diagnóstico."
            );

            return;
        }


        if (!trabajoRealizado) {

            alert(
                "Debes ingresar el trabajo realizado."
            );

            return;
        }


        if (!resultado) {

            alert(
                "Debes seleccionar un resultado."
            );

            return;
        }


        try {

            const parametros =
                new URLSearchParams();

            parametros.append(
                "diagnostico",
                diagnostico
            );

            parametros.append(
                "trabajoRealizado",
                trabajoRealizado
            );

            parametros.append(
                "resultado",
                resultado
            );


            const informe =
                await apiFetch(
                    `/api/reportes/${reporteId}/informe-tecnico?${parametros.toString()}`,
                    {
                        method: "POST"
                    }
                );


            console.log(
                "Informe registrado:",
                informe
            );


            alert(
                "El informe técnico se registró correctamente."
            );


            cargarAsignaciones();


        } catch (error) {

            console.error(
                "Error al guardar informe:",
                error
            );


            alert(
                error.message ||
                "No se pudo registrar el informe."
            );

        }

    };

    window.iniciarAtencion =
    async function(
        asignacionId,
        reporteId
    ) {

        const confirmar =
            confirm(
                "¿Deseas iniciar la atención de este reporte?"
            );

        if (!confirmar) {
            return;
        }

        try {

            const resultado =
                await apiFetch(
                    `/api/asignaciones/${asignacionId}/iniciar`,
                    {
                        method: "POST"
                    }
                );

            console.log(
                "Atención iniciada correctamente:",
                resultado
            );

            alert(
                "La atención del reporte ha sido iniciada correctamente."
            );

            cargarAsignaciones();

        } catch (error) {

            console.error(
                "Error al iniciar atención:",
                error
            );

            alert(
                error.message ||
                "No se pudo iniciar la atención."
            );

        }

    };

    function formatearFecha(
        fecha
    ) {

        if (!fecha) {
            return "-";
        }


        return new Date(
            fecha
        ).toLocaleString(
            "es-PE",
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        );

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

            localStorage.removeItem(
                "personalId"
            );


            window.location.href =
                "login.html";

        }
    );

    cargarAsignaciones();

});