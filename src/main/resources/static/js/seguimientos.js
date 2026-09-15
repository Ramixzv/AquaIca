document.addEventListener("DOMContentLoaded", () => {

    cargarUsuario();
    cargarSeguimientos();

});


let todosLosSeguimientos = [];


function cargarUsuario() {

    const usuarioGuardado =
        localStorage.getItem("usuario");

    if (!usuarioGuardado) {
        return;
    }

    try {

        const usuario =
            JSON.parse(usuarioGuardado);

        const usernameDisplay =
            document.getElementById("usernameDisplay");

        const roleDisplay =
            document.getElementById("roleDisplay");

        const userInitial =
            document.getElementById("userInitial");


        if (usernameDisplay) {

            usernameDisplay.textContent =
                usuario.username ||
                usuario.nombre ||
                "Usuario";

        }


        if (roleDisplay) {

            roleDisplay.textContent =
                usuario.rol ||
                "Usuario";

        }


        if (userInitial) {

            const nombre =
                usuario.nombre ||
                usuario.username ||
                "U";

            userInitial.textContent =
                nombre.charAt(0).toUpperCase();

        }

    } catch (error) {

        console.error(
            "Error al cargar usuario:",
            error
        );

    }

}


async function cargarSeguimientos() {

    const container =
        document.getElementById(
            "seguimientosContainer"
        );


    try {

        const response =
            await fetch(
                "/api/seguimientos",
                {
                    method: "GET",
                    headers: obtenerHeaders()
                }
            );


        if (!response.ok) {

            throw new Error(
                "No se pudieron obtener los seguimientos. Código: "
                + response.status
            );

        }


        const seguimientos =
            await response.json();


        todosLosSeguimientos =
            seguimientos;


        actualizarEstadisticas(
            seguimientos
        );


        mostrarSeguimientos(
            seguimientos
        );


    } catch (error) {

        console.error(
            "Error al cargar seguimientos:",
            error
        );


        container.innerHTML = `

            <div class="seguimientos-vacio">

                <div class="vacio-icon">
                    !
                </div>

                <h3>
                    No se pudo cargar la actividad
                </h3>

                <p>
                    Ocurrió un problema al obtener
                    los seguimientos.
                </p>

            </div>

        `;

    }

}


function obtenerHeaders() {

    const token =
        localStorage.getItem("token");


    const headers = {
        "Content-Type": "application/json"
    };


    if (token) {

        headers["Authorization"] =
            "Bearer " + token;

    }


    return headers;

}

function actualizarEstadisticas(seguimientos) {

    const total = seguimientos.length;

    const asignados =
        seguimientos.filter(
            seguimiento =>
                (seguimiento.estado || "")
                    .trim()
                    .toUpperCase() === "TECNICO_ASIGNADO"
        ).length;

    const atencion =
        seguimientos.filter(
            seguimiento =>
                (seguimiento.estado || "")
                    .trim()
                    .toUpperCase() === "EN_ATENCION"
        ).length;

    const trabajo =
        seguimientos.filter(
            seguimiento =>
                (seguimiento.estado || "")
                    .trim()
                    .toUpperCase() === "TRABAJO_REALIZADO"
        ).length;

    const resueltos =
        seguimientos.filter(
            seguimiento =>
                (seguimiento.estado || "")
                    .trim()
                    .toUpperCase() === "RESUELTO"
        ).length;


    document.getElementById(
        "totalSeguimientos"
    ).textContent = total;

    document.getElementById(
        "seguimientosAsignados"
    ).textContent = asignados;

    document.getElementById(
        "seguimientosAtencion"
    ).textContent = atencion;

    document.getElementById(
        "seguimientosTrabajo"
    ).textContent = trabajo;

    document.getElementById(
        "seguimientosResueltos"
    ).textContent = resueltos;
}


function mostrarSeguimientos(
    seguimientos
) {

    const container =
        document.getElementById(
            "seguimientosContainer"
        );


    if (!seguimientos ||
        seguimientos.length === 0) {

        container.innerHTML = `

            <div class="seguimientos-vacio">

                <div class="vacio-icon">
                    ↻
                </div>

                <h3>
                    No hay actividad registrada
                </h3>

                <p>
                    Los seguimientos de los reportes
                    aparecerán aquí.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        seguimientos.map(
            (seguimiento, index) =>
                crearSeguimientoHTML(
                    seguimiento,
                    index
                )
        ).join("");

}


function crearSeguimientoHTML(
    seguimiento,
    index
) {

    const estado =
        seguimiento.estado ||
        "SIN_ESTADO";


    const estadoInfo =
        obtenerInformacionEstado(
            estado
        );


    const fecha =
        formatearFecha(
            seguimiento.fechaCreacion
        );


    const nombrePersonal =
        seguimiento.nombrePersonal ||
        "Personal AquaIca";


    const comentario =
        seguimiento.comentario ||
        "Sin comentario registrado";


    const reporteId =
        seguimiento.reporteId;


    return `

        <article
            class="seguimiento-global-item
                   ${estadoInfo.clase}">


            <div class="seguimiento-global-line">


                <div class="seguimiento-global-icon">

                    ${estadoInfo.icono}

                </div>


            </div>



            <div class="seguimiento-global-content">


                <div class="seguimiento-global-top">


                    <div>

                        <span
                            class="seguimiento-estado
                                   ${estadoInfo.clase}">

                            ${estadoInfo.nombre}

                        </span>


                        <h3>

                            ${estadoInfo.titulo}

                        </h3>

                    </div>


                    <time>

                        ${fecha}

                    </time>


                </div>



                <div
                    class="seguimiento-reporte">

                    <span>
                        Reporte
                    </span>

                    <strong>
                        #${reporteId}
                    </strong>

                </div>



                <p
                    class="seguimiento-comentario">

                    ${escaparHTML(
                        comentario
                    )}

                </p>



                <div
                    class="seguimiento-global-footer">


                    <span
                        class="seguimiento-personal">

                        <span class="personal-mini-icon">
                            ${obtenerInicial(
                                nombrePersonal
                            )}
                        </span>

                        ${escaparHTML(
                            nombrePersonal
                        )}

                    </span>


                    <a
                        href="reporte-detalle.html?id=${reporteId}"
                        class="ver-reporte-button">

                        Ver reporte →

                    </a>


                </div>


            </div>


        </article>

    `;

}


function obtenerInformacionEstado(
    estado
) {

    switch (estado) {

        case "TECNICO_ASIGNADO":

            return {

                nombre: "Técnico asignado",

                titulo: "Asignación registrada",

                icono: "✓",

                clase: "estado-asignado"

            };


        case "EN_ATENCION":

            return {

                nombre: "En atención",

                titulo: "Reporte en atención",

                icono: "↻",

                clase: "estado-atencion"

            };


        case "TRABAJO_REALIZADO":

            return {

                nombre: "Trabajo realizado",

                titulo: "Trabajo registrado",

                icono: "✓",

                clase: "estado-trabajo"

            };


        case "RESUELTO":

            return {

                nombre: "Resuelto",

                titulo: "Reporte solucionado",

                icono: "✓",

                clase: "estado-resuelto"

            };


        default:

            return {

                nombre: estado.replaceAll(
                    "_",
                    " "
                ),

                titulo: "Actividad registrada",

                icono: "•",

                clase: "estado-default"

            };

    }

}


const estadoFiltro =
    document.getElementById(
        "estadoFiltro"
    );


if (estadoFiltro) {

    estadoFiltro.addEventListener(
        "change",
        () => {

            const estadoSeleccionado =
                estadoFiltro.value;


            if (!estadoSeleccionado) {

                mostrarSeguimientos(
                    todosLosSeguimientos
                );

                return;

            }


            const filtrados =
                todosLosSeguimientos.filter(
                    seguimiento =>
                        seguimiento.estado ===
                        estadoSeleccionado
                );


            mostrarSeguimientos(
                filtrados
            );

        }
    );

}

function formatearFecha(
    fecha
) {

    if (!fecha) {
        return "Fecha no disponible";
    }


    const fechaObjeto =
        new Date(fecha);


    if (isNaN(fechaObjeto.getTime())) {

        return fecha;

    }


    return fechaObjeto.toLocaleString(
        "es-PE",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function obtenerInicial(
    nombre
) {

    if (!nombre) {
        return "A";
    }


    return nombre
        .trim()
        .charAt(0)
        .toUpperCase();

}


function escaparHTML(
    texto
) {

    const div =
        document.createElement("div");

    div.textContent = texto;

    return div.innerHTML;

}

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "usuario"
            );

            window.location.href =
                "login.html";

        }
    );

}