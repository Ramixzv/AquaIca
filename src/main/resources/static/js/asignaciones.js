document.addEventListener("DOMContentLoaded", () => {


    const usernameDisplay =
        document.getElementById("usernameDisplay");

    const roleDisplay =
        document.getElementById("roleDisplay");

    const userInitial =
        document.getElementById("userInitial");

    const userAvatar =
        document.getElementById("userAvatar");

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

        if (userAvatar) {

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
            ? await tieneInformeTecnico(asignacion.id)
            : false;

    const bitacoras =
        asignacion.estado === "EN_ATENCION" && rol === "TECNICO"
            ? await obtenerBitacoras(asignacion.id)
            : [];

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

                    ${
    asignacion.estado === "EN_ATENCION"
        ?
        `
        <div class="bitacoras-section">

            <div class="bitacoras-header">

                <div>
                    <h3>📝 Bitácora de atención</h3>

                    <p>
                        Actualizaciones realizadas durante la atención
                    </p>
                </div>

                <button
                    class="secondary-button"
                    onclick="mostrarFormularioBitacora(
                        ${asignacion.reporteId},
                        ${asignacion.id}
                    )">

                    + Nueva bitácora

                </button>

            </div>

            <div class="bitacoras-list">

                ${
                    bitacoras.length > 0
                        ?
                        bitacoras.map(bitacora => `
                            
                            <div class="bitacora-item">

                                <div class="bitacora-fecha">
                                    🕐 ${formatearFecha(
                                        bitacora.fechaCreacion
                                    )}
                                </div>

                                <strong>
                                    ${bitacora.personalNombre}
                                </strong>

                                <p>
                                    ${bitacora.descripcion}
                                </p>

                            </div>

                        `).join("")
                        :
                        `
                        <div class="bitacora-vacia">
                            No hay actualizaciones registradas todavía.
                        </div>
                        `
                }

            </div>

        </div>
        `
        :
        ""
}


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
                        ${asignacion.reporteId},
                        ${asignacion.id}
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
    function(reporteId, asignacionId) {

        const formularioExistente =
            document.getElementById(
                `formularioInforme-${asignacionId}`
            );

        if (formularioExistente) {
            return;
        }


        const tarjeta =
            document.querySelector(
                `.asignacion-card:has(button[onclick*="${asignacionId}"])`
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
            `formularioInforme-${asignacionId}`;

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
                    id="diagnostico-${asignacionId}"
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
                    id="trabajo-${asignacionId}"
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
                    id="resultado-${asignacionId}">

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
                    onclick="cerrarFormularioInforme(${asignacionId})">

                    Cancelar

                </button>


                <button
                    type="button"
                    class="primary-button"
                    onclick="guardarInforme(${reporteId}, ${asignacionId})">

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

async function tieneInformeTecnico(asignacionId) {

    try {

        await apiFetch(
            `/api/reportes/asignacion/${asignacionId}/informe-tecnico`
        );

        return true;

    } catch (error) {

        return false;

    }
}

async function obtenerBitacoras(asignacionId) {

    try {

        const bitacoras =
            await apiFetch(
                `/api/bitacoras/asignacion/${asignacionId}`
            );

        return bitacoras || [];

    } catch (error) {

        console.error(
            "Error al obtener bitácoras:",
            error
        );

        return [];
    }
}

window.mostrarFormularioBitacora =
    function(reporteId, asignacionId) {

        const formularioExistente =
            document.getElementById(
                `formularioBitacora-${asignacionId}`
            );

        if (formularioExistente) {
            return;
        }

        const tarjeta =
            document.querySelector(
                `.asignacion-card:has(button[onclick*="${asignacionId}"])`
            );

        if (!tarjeta) {

            console.error(
                "No se encontró la tarjeta de la asignación:",
                asignacionId
            );

            return;
        }

        const formulario =
            document.createElement("div");

        formulario.id =
            `formularioBitacora-${asignacionId}`;

        formulario.className =
            "formulario-bitacora";

        formulario.innerHTML = `

            <div class="formulario-bitacora-header">

                <h3>
                    📝 Nueva bitácora
                </h3>

                <span>
                    Reporte #${reporteId}
                </span>

            </div>

            <div class="formulario-bitacora-campo">

                <label>
                    Actualización de atención
                </label>

                <textarea
                    id="descripcionBitacora-${asignacionId}"
                    placeholder="Describe lo realizado, encontrado o actualizado durante la atención..."
                    rows="4"
                    required>
                </textarea>

            </div>

            <div class="formulario-bitacora-actions">

                <button
                    type="button"
                    class="secondary-button"
                    onclick="cerrarFormularioBitacora(
                        ${asignacionId}
                    )">

                    Cancelar

                </button>

                <button
                    type="button"
                    class="primary-button"
                    onclick="guardarBitacora(
                        ${reporteId},
                        ${asignacionId}
                    )">

                    💾 Guardar bitácora

                </button>

            </div>

        `;

        tarjeta.appendChild(formulario);
    };

    window.guardarBitacora =
    async function(reporteId, asignacionId) {

        const textarea =
            document.getElementById(
                `descripcionBitacora-${asignacionId}`
            );

        const descripcion =
            textarea.value.trim();

        if (!descripcion) {

            alert(
                "Debes ingresar una descripción."
            );

            return;
        }

        if (!personalId) {

            alert(
                "No se encontró el personal autenticado."
            );

            return;
        }

        try {

            const parametros =
                new URLSearchParams();

            parametros.append(
                "reporteId",
                reporteId
            );

            parametros.append(
                "asignacionId",
                asignacionId
            );

            parametros.append(
                "personalId",
                personalId
            );

            parametros.append(
                "descripcion",
                descripcion
            );

            const bitacora =
                await apiFetch(
                    `/api/bitacoras?${parametros.toString()}`,
                    {
                        method: "POST"
                    }
                );

            console.log(
                "Bitácora registrada:",
                bitacora
            );

            alert(
                "La bitácora se registró correctamente."
            );

            cargarAsignaciones();

        } catch (error) {

            console.error(
                "Error al registrar bitácora:",
                error
            );

            alert(
                error.message ||
                "No se pudo registrar la bitácora."
            );
        }
    };

    window.cerrarFormularioBitacora =
    function(asignacionId) {

        const formulario =
            document.getElementById(
                `formularioBitacora-${asignacionId}`
            );

        if (formulario) {
            formulario.remove();
        }
    };

window.guardarInforme =
    async function(reporteId, asignacionId) {

        const diagnostico =
            document.getElementById(
                `diagnostico-${asignacionId}`
            ).value.trim();


        const trabajoRealizado =
            document.getElementById(
                `trabajo-${asignacionId}`
            ).value.trim();


        const resultado =
            document.getElementById(
                `resultado-${asignacionId}`
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