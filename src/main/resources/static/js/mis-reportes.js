document.addEventListener("DOMContentLoaded", () => {

    const inputCodigo = document.getElementById("codigoSuministro");
    const botonBuscar = document.getElementById("buscarReportesButton");


    botonBuscar.addEventListener("click", buscarReportes);


    inputCodigo.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {
            buscarReportes();
        }

    });

});


async function buscarReportes() {

    const inputCodigo = document.getElementById("codigoSuministro");
    const botonBuscar = document.getElementById("buscarReportesButton");
    const mensaje = document.getElementById("busquedaMensaje");

    const codigo = inputCodigo.value.trim();

    if (!codigo) {

        mostrarMensaje(
            "Ingresa tu código de suministro.",
            "error"
        );

        inputCodigo.focus();

        return;
    }

    botonBuscar.disabled = true;
    botonBuscar.textContent = "🔄 Consultando...";

    mensaje.innerHTML = "";


    try {

        console.log(
            "Consultando suministro:",
            codigo
        );


        const reportes = await apiFetch(
            `/api/reportes/suministro/${encodeURIComponent(codigo)}`
        );


        console.log(
            "Reportes encontrados:",
            reportes
        );

        if (!reportes || reportes.length === 0) {

            ocultarResultados();

            mostrarMensaje(
                "No se encontraron reportes asociados a este código de suministro.",
                "info"
            );

            return;
        }

        mostrarInformacionSuministro(
            reportes[0]
        );


        actualizarEstadisticas(
            reportes
        );


        mostrarReportes(
            reportes
        );


        mostrarMensaje(
            `Se encontraron ${reportes.length} reporte(s).`,
            "success"
        );


    } catch (error) {

        console.error(
            "Error consultando reportes:",
            error
        );

        ocultarResultados();

        mostrarMensaje(
            error.message ||
            "No se pudieron consultar los reportes.",
            "error"
        );


    } finally {

        botonBuscar.disabled = false;
        botonBuscar.textContent = "🔍 Consultar";

    }

}

function mostrarInformacionSuministro(reporte) {

    const suministroInfo =
        document.getElementById("suministroInfo");

    const nombreTitular =
        document.getElementById("nombreTitular");

    const dniTitular =
        document.getElementById("dniTitular");

    const direccion =
        document.getElementById("direccionSuministro");


    nombreTitular.textContent =
        reporte.nombreTitular || "-";

    dniTitular.textContent =
        reporte.dni || "-";

    direccion.textContent =
        reporte.direccion || "-";


    suministroInfo.style.display = "grid";

}

function actualizarEstadisticas(reportes) {

    const total =
        reportes.length;


    const pendientes =
        reportes.filter(
            reporte =>
                reporte.estado === "PENDIENTE"
        ).length;


    const enProceso =
        reportes.filter(
            reporte =>
                reporte.estado === "EN_ATENCION"
        ).length;


    const resueltos =
        reportes.filter(
            reporte =>
                reporte.estado === "RESUELTO"
        ).length;


    document.getElementById(
        "totalReportes"
    ).textContent = total;


    document.getElementById(
        "reportesPendientes"
    ).textContent = pendientes;


    document.getElementById(
        "reportesProceso"
    ).textContent = enProceso;


    document.getElementById(
        "reportesResueltos"
    ).textContent = resueltos;


    document.getElementById(
        "mrStats"
    ).style.display = "grid";

}

function mostrarReportes(reportes) {

    const historial =
        document.getElementById("mrHistorial");

    const container =
        document.getElementById("misReportesContainer");


    historial.style.display = "block";


    container.innerHTML =
        reportes
            .map(reporte =>
                crearTarjetaReporte(reporte)
            )
            .join("");

}

function crearTarjetaReporte(reporte) {

    const estadoClase =
        obtenerClaseEstado(
            reporte.estado
        );


    const estadoTexto =
        obtenerTextoEstado(
            reporte.estado
        );


    const prioridadTexto =
        reporte.prioridad || "NORMAL";


    return `
        <article class="reporte-card">

            <div class="reporte-card-header">

                <div>

                    <span class="reporte-numero">
                        Reporte #${reporte.reporteId}
                    </span>

                    <h3>
                        ${escapeHTML(
                            reporte.tipoProblema ||
                            "Incidencia"
                        )}
                    </h3>

                </div>


                <span class="estado-badge ${estadoClase}">
                    ${estadoTexto}
                </span>

            </div>


            <div class="reporte-card-info">

                <div>

                    <span>
                        Prioridad
                    </span>

                    <strong>
                        ${escapeHTML(
                            prioridadTexto
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Fecha
                    </span>

                    <strong>
                        ${formatearFecha(
                            reporte.fechaCreacion
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Dirección
                    </span>

                    <strong>
                        ${escapeHTML(
                            reporte.direccion ||
                            "-"
                        )}
                    </strong>

                </div>

            </div>


            <div class="reporte-card-description">

                <span>
                    Descripción
                </span>

                <p>
                    ${escapeHTML(
                        reporte.descripcion ||
                        "Sin descripción"
                    )}
                </p>

            </div>


            <div class="reporte-card-actions">

                <button
                    type="button"
                    class="secondary-button"
                    onclick="verReporte(${reporte.reporteId})">

                    Ver reporte

                </button>


                <button
                    type="button"
                    class="primary-button"
                    onclick="verSeguimiento(${reporte.reporteId})">

                    Ver seguimiento

                </button>

            </div>

        </article>
    `;
}

function obtenerClaseEstado(estado) {

    switch (estado) {

        case "PENDIENTE":
            return "estado-pendiente";

        case "EN_ATENCION":
            return "estado-proceso";

        case "RESUELTO":
            return "estado-resuelto";

        case "NO_RESUELTO":
            return "estado-no-resuelto";

        default:
            return "estado-default";
    }

}


function obtenerTextoEstado(estado) {

    switch (estado) {

        case "PENDIENTE":
            return "Pendiente";

        case "EN_ATENCION":
            return "En atención";

        case "RESUELTO":
            return "Resuelto";

        case "NO_RESUELTO":
            return "No resuelto";

        case "TRABAJO_REALIZADO":
            return "Trabajo realizado";

        default:
            return estado || "Sin estado";
    }

}

function formatearFecha(fecha) {

    if (!fecha) {
        return "-";
    }


    const fechaObjeto =
        new Date(fecha);


    if (isNaN(fechaObjeto)) {
        return fecha;
    }


    return fechaObjeto.toLocaleDateString(
        "es-PE",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}

function mostrarMensaje(texto, tipo) {

    const mensaje =
        document.getElementById("busquedaMensaje");


    mensaje.textContent = texto;

    mensaje.className =
        `busqueda-mensaje ${tipo}`;

}


function ocultarResultados() {

    document.getElementById(
        "suministroInfo"
    ).style.display = "none";


    document.getElementById(
        "mrStats"
    ).style.display = "none";


    document.getElementById(
        "mrHistorial"
    ).style.display = "none";

}

function verReporte(reporteId) {

    window.location.href =
        `reporte-detalle.html?id=${reporteId}`;

}


function verSeguimiento(reporteId) {

    window.location.href =
        `seguimiento.html?id=${reporteId}`;

}

function escapeHTML(valor) {

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}