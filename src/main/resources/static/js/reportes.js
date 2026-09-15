document.addEventListener("DOMContentLoaded", () => {

    const usernameDisplay =
        document.getElementById("usernameDisplay");

    const roleDisplay =
        document.getElementById("roleDisplay");

    const reportesTable =
        document.getElementById("reportesTable");

    const cantidadReportes =
        document.getElementById("cantidadReportes");


    const buscarReporte =
        document.getElementById("buscarReporte");

    const filtroEstado =
        document.getElementById("filtroEstado");

    const filtroPrioridad =
        document.getElementById("filtroPrioridad");

    const filtroProblema =
        document.getElementById("filtroProblema");


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


    let reportes = [];

    async function cargarReportes() {

        try {

            reportes =
                await apiFetch("/api/reportes");

            console.log(
                "Reportes recibidos:",
                reportes
            );


            mostrarReportes(reportes);


        } catch (error) {

            console.error(
                "Error al cargar reportes:",
                error
            );


            reportesTable.innerHTML = `
                <tr>

                    <td colspan="7">

                        No se pudieron cargar
                        los reportes.

                    </td>

                </tr>
            `;
        }
    }

    function mostrarReportes(lista) {

        reportesTable.innerHTML = "";


        cantidadReportes.textContent =
            `${lista.length} reportes`;


        if (lista.length === 0) {

            reportesTable.innerHTML = `
                <tr>

                    <td colspan="7">

                        No existen reportes
                        que coincidan con la búsqueda.

                    </td>

                </tr>
            `;

            return;
        }


        const ordenados =
            [...lista].sort((a, b) => {

                return new Date(b.fechaCreacion) -
                       new Date(a.fechaCreacion);

            });


        ordenados.forEach(reporte => {

            const fila =
                document.createElement("tr");


            fila.classList.add(
                "reporte-fila"
            );


            fila.innerHTML = `

                <td>
                    <strong>
                        #${reporte.reporteId}
                    </strong>
                </td>


                <td>

                    <div class="titular-cell">

                        <strong>
                            ${reporte.nombreTitular ?? "-"}
                        </strong>

                        <small>
                            DNI:
                            ${reporte.dni ?? "-"}
                        </small>

                    </div>

                </td>


                <td>

                    ${reporte.codigoSuministro ?? "-"}

                </td>


                <td>

                    ${formatearProblema(
                        reporte.tipoProblema
                    )}

                </td>


                <td>

                    <span class="
                        prioridad-badge
                        prioridad-${reporte.prioridad?.toLowerCase()}
                    ">

                        ${reporte.prioridad ?? "-"}

                    </span>

                </td>


                <td>

                    <span class="
                        estado-badge
                        estado-${reporte.estado?.toLowerCase()}
                    ">

                        ${formatearEstado(
                            reporte.estado
                        )}

                    </span>

                </td>


                <td>

                    ${formatearFecha(
                        reporte.fechaCreacion
                    )}

                </td>

            `;


            fila.addEventListener(
                "click",
                () => {

                    window.location.href =
                        `reporte-detalle.html?id=${reporte.reporteId}`;

                }
            );


            reportesTable.appendChild(
                fila
            );

        });

    }

    function aplicarFiltros() {

        const texto =
            buscarReporte.value
                .toLowerCase()
                .trim();


        const estado =
            filtroEstado.value;


        const prioridad =
            filtroPrioridad.value;


        const problema =
            filtroProblema.value;


        const filtrados =
            reportes.filter(reporte => {


                const coincideTexto =

                    !texto ||

                    String(
                        reporte.reporteId
                    )
                    .includes(texto) ||

                    (
                        reporte.nombreTitular ?? ""
                    )
                    .toLowerCase()
                    .includes(texto) ||

                    (
                        reporte.codigoSuministro ?? ""
                    )
                    .toLowerCase()
                    .includes(texto);


                const coincideEstado =

                    !estado ||

                    reporte.estado === estado;


                const coincidePrioridad =

                    !prioridad ||

                    reporte.prioridad === prioridad;


                const coincideProblema =

                    !problema ||

                    reporte.tipoProblema === problema;


                return (

                    coincideTexto &&
                    coincideEstado &&
                    coincidePrioridad &&
                    coincideProblema

                );

            });


        mostrarReportes(
            filtrados
        );

    }



    buscarReporte.addEventListener(
        "input",
        aplicarFiltros
    );


    filtroEstado.addEventListener(
        "change",
        aplicarFiltros
    );


    filtroPrioridad.addEventListener(
        "change",
        aplicarFiltros
    );


    filtroProblema.addEventListener(
        "change",
        aplicarFiltros
    );


    function formatearProblema(
        problema
    ) {

        const nombres = {

            FUGA_AGUA:
                "Fuga de agua",

            CORTE_AGUA:
                "Corte de agua",

            BAJA_PRESION:
                "Baja presión",

            FACTURACION:
                "Facturación",

            OTRO:
                "Otro"

        };


        return nombres[problema] ??
               problema ??
               "-";

    }



    function formatearEstado(
        estado
    ) {

        const nombres = {

            PENDIENTE:
                "Pendiente",

            EN_PROCESO:
                "En proceso",

            RESUELTO:
                "Resuelto"

        };


        return nombres[estado] ??
               estado ??
               "-";

    }



    function formatearFecha(
        fecha
    ) {

        if (!fecha) {
            return "-";
        }


        const fechaObj =
            new Date(fecha);


        return fechaObj.toLocaleDateString(
            "es-PE",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
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


            window.location.href =
                "login.html";

        }
    );

    cargarReportes();

});