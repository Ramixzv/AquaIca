document.addEventListener("DOMContentLoaded", () => {

    const usernameDisplay =
        document.getElementById("usernameDisplay");

    const roleDisplay =
        document.getElementById("roleDisplay");

    const totalReportes =
        document.getElementById("totalReportes");

    const reportesPendientes =
        document.getElementById("reportesPendientes");

    const reportesProceso =
        document.getElementById("reportesProceso");

    const reportesResueltos =
        document.getElementById("reportesResueltos");

    const reportesTable =
        document.getElementById("reportesTable");

    const filtroTipoProblema =
    document.getElementById("filtroTipoProblema");

    let mapaIncidencias = null;
    let marcadoresIncidencias = [];
    let zonasIncidencias = [];
    let todosLosReportes = [];

    const username = localStorage.getItem("username");
    const rol = localStorage.getItem("rol");

    if (username) {
        usernameDisplay.textContent = username;
    }

    if (rol) {
        roleDisplay.textContent = rol;
    }

    function inicializarMapa() {

    mapaIncidencias = L.map("mapaIncidencias")
        .setView(
            [-14.0672, -75.7281],
            13
        );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(mapaIncidencias);
}


function mostrarIncidenciasEnMapa(reportes) {

    if (!mapaIncidencias) {
        return;
    }

    // Eliminar marcadores anteriores

    marcadoresIncidencias.forEach(
        marcador => mapaIncidencias.removeLayer(marcador)
    );

    marcadoresIncidencias = [];


    reportes.forEach(reporte => {

        const latitud =
            Number(
                reporte.latitud ??
                reporte.latitude
            );

        const longitud =
            Number(
                reporte.longitud ??
                reporte.longitude
            );


        // Si no tiene coordenadas, lo ignoramos

        if (
            Number.isNaN(latitud) ||
            Number.isNaN(longitud)
        ) {
            return;
        }


        const marcador =
            L.marker([
                latitud,
                longitud
            ]);


        marcador.bindPopup(`

            <div class="mapa-popup">

                <h3>
                    Reporte #${reporte.reporteId}
                </h3>

                <p>
                    <strong>Problema:</strong>
                    ${reporte.tipoProblema ?? "-"}
                </p>

                <p>
                    <strong>Prioridad:</strong>
                    ${reporte.prioridad ?? "-"}
                </p>

                <p>
                    <strong>Estado:</strong>
                    ${reporte.estado ?? "-"}
                </p>

            </div>

        `);


        marcador.addTo(mapaIncidencias);
        marcador.setZIndexOffset(1000);

        marcadoresIncidencias.push(marcador);

    });
}

function mostrarZonasIncidencia(reportes) {

    if (!mapaIncidencias) {
        return;
    }

    // Eliminar zonas anteriores

    zonasIncidencias.forEach(
        zona => mapaIncidencias.removeLayer(zona)
    );

    zonasIncidencias = [];


    /*
     * Tamaño de cada zona.
     *
     * 0.003 grados ≈ unos cientos de metros
     * en la zona de Ica.
     */

    const tamanioLatitud = 0.003;
    const tamanioLongitud = 0.003;


    const zonas = {};


    // Agrupar reportes por zona

    reportes.forEach(reporte => {

        const latitud =
            Number(
                reporte.latitud ??
                reporte.latitude
            );

        const longitud =
            Number(
                reporte.longitud ??
                reporte.longitude
            );


        if (
            Number.isNaN(latitud) ||
            Number.isNaN(longitud)
        ) {
            return;
        }


        const zonaLat =
            Math.floor(
                latitud / tamanioLatitud
            );

        const zonaLon =
            Math.floor(
                longitud / tamanioLongitud
            );


        const clave =
            `${zonaLat}_${zonaLon}`;


        if (!zonas[clave]) {

            zonas[clave] = {
                latMin:
                    zonaLat * tamanioLatitud,

                latMax:
                    (zonaLat + 1) *
                    tamanioLatitud,

                lonMin:
                    zonaLon * tamanioLongitud,

                lonMax:
                    (zonaLon + 1) *
                    tamanioLongitud,

                reportes: []
            };

        }


        zonas[clave].reportes.push(
            reporte
        );

    });


    // Crear las zonas en el mapa

    Object.values(zonas).forEach(zona => {

        const cantidad =
            zona.reportes.length;


        let color;

        let nivel;


        if (cantidad === 1) {

            color = "#2ecc71";
            nivel = "Baja";

        } else if (cantidad <= 3) {

            color = "#f1c40f";
            nivel = "Media";

        } else {

            color = "#e74c3c";
            nivel = "Alta";

        }


        const rectangulo =
            L.rectangle(
                [
                    [
                        zona.latMin,
                        zona.lonMin
                    ],

                    [
                        zona.latMax,
                        zona.lonMax
                    ]
                ],
                {
                    color: color,
                    weight: 2,
                    fillColor: color,
                    fillOpacity: 0.25
                }
            );


        rectangulo.bindPopup(`

            <div class="mapa-popup">

                <h3>
                    Zona de incidencia
                </h3>

                <p>
                    <strong>Nivel:</strong>
                    ${nivel}
                </p>

                <p>
                    <strong>Incidencias:</strong>
                    ${cantidad}
                </p>

                <p>
                    <strong>Reportes:</strong>
                    ${zona.reportes
                        .map(
                            reporte =>
                                `#${reporte.reporteId}`
                        )
                        .join(", ")
                    }
                </p>

            </div>

        `);


        rectangulo.addTo(
            mapaIncidencias
        );


        zonasIncidencias.push(
            rectangulo
        );

    });

}

function cargarTiposProblema(reportes) {

    const tipos = [
        ...new Set(
            reportes
                .map(
                    reporte =>
                        reporte.tipoProblema
                )
                .filter(Boolean)
        )
    ];


    filtroTipoProblema.innerHTML = `

        <option value="TODOS">
            Todos los problemas
        </option>

    `;


    tipos.forEach(tipo => {

        const option =
            document.createElement("option");

        option.value = tipo;

        option.textContent =
            tipo.replaceAll("_", " ");

        filtroTipoProblema.appendChild(option);

    });
}

filtroTipoProblema.addEventListener(
    "change",
    () => {

        const tipoSeleccionado =
            filtroTipoProblema.value;


        if (tipoSeleccionado === "TODOS") {

            mostrarIncidenciasEnMapa(
                todosLosReportes
            );

            return;
        }


        const reportesFiltrados =
            todosLosReportes.filter(
                reporte =>
                    reporte.tipoProblema ===
                    tipoSeleccionado
            );


        mostrarIncidenciasEnMapa(
            reportesFiltrados
        );

    }
);

    async function cargarReportes() {

        try {

            const reportes = await apiFetch("/api/reportes");

            console.log("Reportes recibidos:", reportes);

            todosLosReportes = reportes;

            actualizarEstadisticas(reportes);

            mostrarReportes(reportes);

            cargarTiposProblema(reportes);

            mostrarIncidenciasEnMapa(reportes);

            mostrarZonasIncidencia(reportes);

        } catch (error) {

            console.error(
                "Error al cargar los reportes:",
                error
            );

            reportesTable.innerHTML = `
                <tr>
                    <td colspan="5">
                        No se pudieron cargar los reportes.
                    </td>
                </tr>
            `;
        }
    }

    function actualizarEstadisticas(reportes) {

        totalReportes.textContent = reportes.length;

        const pendientes = reportes.filter(
            reporte => reporte.estado === "PENDIENTE"
        ).length;

        const enProceso = reportes.filter(
            reporte => reporte.estado === "EN_PROCESO"
        ).length;

        const resueltos = reportes.filter(
            reporte => reporte.estado === "RESUELTO"
        ).length;

        reportesPendientes.textContent = pendientes;

        reportesProceso.textContent = enProceso;

        reportesResueltos.textContent = resueltos;
    }

    function mostrarReportes(reportes) {

    reportesTable.innerHTML = "";

    if (reportes.length === 0) {

        reportesTable.innerHTML = `
            <tr>
                <td colspan="5">
                    No existen reportes registrados.
                </td>
            </tr>
        `;

        return;
    }

    const reportesRecientes = [...reportes]
        .sort((a, b) => {

            return new Date(b.fechaCreacion) -
                   new Date(a.fechaCreacion);

        })
        .slice(0, 5);


    reportesRecientes.forEach(reporte => {

        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>#${reporte.reporteId}</td>

            <td>
                ${reporte.codigoSuministro ?? "-"}
            </td>

            <td>
                ${reporte.tipoProblema ?? "-"}
            </td>

            <td>
                ${reporte.prioridad ?? "-"}
            </td>

            <td>
                ${reporte.estado ?? "-"}
            </td>
        `;

        reportesTable.appendChild(fila);
    });
}
    const logoutButton =
        document.getElementById("logoutButton");

    logoutButton.addEventListener("click", () => {

        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("rol");

        window.location.href = "login.html";
    });


    inicializarMapa();

    cargarReportes();

});