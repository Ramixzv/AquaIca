const API_URL = "http://localhost:8080";

let todasLasEvidencias = [];



function obtenerToken() {

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("accessToken")
    );
}

function obtenerDatosUsuario() {

    const token = obtenerToken();

    if (!token) {
        return null;
    }

    try {

        const payload =
            token.split(".")[1];

        const datos =
            JSON.parse(
                atob(
                    payload
                        .replace(/-/g, "+")
                        .replace(/_/g, "/")
                )
            );

        return datos;

    } catch (error) {

        console.error(
            "No se pudo leer el JWT:",
            error
        );

        return null;
    }
}


function cargarUsuario() {

    const datos =
        obtenerDatosUsuario();

    if (!datos) {
        return;
    }


    const username =
        datos.sub ||
        datos.username ||
        "Usuario";


    const rol =
        datos.rol ||
        datos.role ||
        "Usuario";


    const usernameElement =
        document.getElementById(
            "usernameDisplay"
        );

    const roleElement =
        document.getElementById(
            "roleDisplay"
        );

    const initialElement =
        document.getElementById(
            "userInitial"
        );


    usernameElement.textContent =
        username;


    roleElement.textContent =
        rol;


    initialElement.textContent =
        username
            .charAt(0)
            .toUpperCase();
}

async function cargarEvidencias() {

    const token =
        obtenerToken();


    if (!token) {

        mostrarError(
            "No hay una sesión activa."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/evidencias`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `Error ${response.status}`
            );
        }


        todasLasEvidencias =
            await response.json();


        actualizarEstadisticas(
            todasLasEvidencias
        );


        mostrarEvidencias(
            todasLasEvidencias
        );


    } catch (error) {

        console.error(
            "Error al obtener evidencias:",
            error
        );


        mostrarError(
            "No se pudieron cargar las evidencias."
        );
    }
}


function actualizarEstadisticas(
    evidencias
) {

    const total =
        evidencias.length;


    const ciudadano =
        evidencias.filter(
            evidencia =>
                (evidencia.origen || "")
                    .trim()
                    .toUpperCase() ===
                "CIUDADANO"
        ).length;


    const tecnico =
        evidencias.filter(
            evidencia =>
                (evidencia.origen || "")
                    .trim()
                    .toUpperCase() ===
                "TECNICO"
        ).length;


    document.getElementById(
        "totalEvidencias"
    ).textContent = total;


    document.getElementById(
        "evidenciasCiudadano"
    ).textContent = ciudadano;


    document.getElementById(
        "evidenciasTecnico"
    ).textContent = tecnico;
}


function mostrarEvidencias(
    evidencias
) {

    const container =
        document.getElementById(
            "evidenciasContainer"
        );


    container.innerHTML = "";


    if (evidencias.length === 0) {

        container.innerHTML = `

            <div class="evidencias-empty">

                <div class="empty-icon">
                    ▧
                </div>

                <h3>
                    No hay evidencias
                </h3>

                <p>
                    Todavía no se han registrado
                    archivos en el sistema.
                </p>

            </div>

        `;

        return;
    }


    evidencias.forEach(
        evidencia => {

            const card =
                crearTarjetaEvidencia(
                    evidencia
                );


            container.appendChild(
                card
            );

        }
    );
}


function crearTarjetaEvidencia(
    evidencia
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "evidencia-card";


    const esImagen =
        (evidencia.tipoArchivo || "")
            .startsWith("image/");


    const origen =
        (evidencia.origen || "")
            .toUpperCase();


    const fecha =
        formatearFecha(
            evidencia.fechaCreacion
        );


    const preview =
        document.createElement(
            "div"
        );


    preview.className =
        "evidencia-preview";


    if (esImagen) {

        const img =
            document.createElement(
                "img"
            );


        img.alt =
            evidencia.nombreArchivo;


        img.className =
            "evidencia-image";


        img.src =
            "images/loading.gif";


        cargarImagen(
            evidencia,
            img
        );


        preview.appendChild(
            img
        );

    } else {

        preview.innerHTML = `

            <div class="file-preview">

                <span class="file-icon">
                    ▧
                </span>

                <span>
                    Archivo
                </span>

            </div>

        `;
    }


    const contenido =
        document.createElement(
            "div"
        );


    contenido.className =
        "evidencia-card-content";


    contenido.innerHTML = `

        <div class="evidencia-top">

            <span class="evidencia-origen ${origen.toLowerCase()}">

                ${origen === "TECNICO"
                    ? "TÉCNICO"
                    : "CIUDADANO"}

            </span>

            <span class="evidencia-fecha">
                ${fecha}
            </span>

        </div>


        <h3>
            ${escapeHtml(
                evidencia.nombreArchivo
            )}
        </h3>


        <div class="evidencia-reporte">

            <span>
                Reporte
            </span>

            <strong>
                #${evidencia.reporteId}
            </strong>

        </div>


        <div class="evidencia-footer">

            <span class="evidencia-tipo">

                ${escapeHtml(
                    evidencia.tipoArchivo ||
                    "Archivo"
                )}

            </span>


            <button
                class="ver-evidencia-button">

                Ver archivo →

            </button>

        </div>

    `;


    const boton =
        contenido.querySelector(
            ".ver-evidencia-button"
        );


    boton.addEventListener(
        "click",
        () => {

            abrirEvidencia(
                evidencia
            );

        }
    );


    card.appendChild(
        preview
    );


    card.appendChild(
        contenido
    );


    return card;
}


async function cargarImagen(
    evidencia,
    img
) {

    const token =
        obtenerToken();


    try {

        const response =
            await fetch(
                `${API_URL}/api/evidencias/archivo/` +
                `${evidencia.reporteId}/` +
                `${encodeURIComponent(
                    evidencia.nombreArchivo
                )}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "No se pudo cargar la imagen"
            );
        }


        const blob =
            await response.blob();


        img.src =
            URL.createObjectURL(
                blob
            );


    } catch (error) {

        console.error(
            "Error cargando evidencia:",
            error
        );


        img.parentElement.innerHTML = `

            <div class="file-preview error">

                <span class="file-icon">
                    !
                </span>

                <span>
                    No disponible
                </span>

            </div>

        `;
    }
}


async function abrirEvidencia(
    evidencia
) {

    const token =
        obtenerToken();


    try {

        const response =
            await fetch(
                `${API_URL}/api/evidencias/archivo/` +
                `${evidencia.reporteId}/` +
                `${encodeURIComponent(
                    evidencia.nombreArchivo
                )}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "No se pudo abrir el archivo"
            );
        }


        const blob =
            await response.blob();


        const url =
            URL.createObjectURL(
                blob
            );


        window.open(
            url,
            "_blank"
        );


    } catch (error) {

        console.error(error);

        alert(
            "No se pudo abrir la evidencia."
        );
    }
}


document
    .getElementById("filtroOrigen")
    .addEventListener(
        "change",
        function () {

            const filtro =
                this.value;


            if (filtro === "TODOS") {

                mostrarEvidencias(
                    todasLasEvidencias
                );

                return;
            }


            const filtradas =
                todasLasEvidencias.filter(
                    evidencia =>
                        (
                            evidencia.origen ||
                            ""
                        )
                        .toUpperCase() ===
                        filtro
                );


            mostrarEvidencias(
                filtradas
            );
        }
    );


function formatearFecha(
    fecha
) {

    if (!fecha) {
        return "-";
    }


    const date =
        new Date(fecha);


    return date.toLocaleString(
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


function escapeHtml(
    texto
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        texto;


    return div.innerHTML;
}


function mostrarError(
    mensaje
) {

    const container =
        document.getElementById(
            "evidenciasContainer"
        );


    container.innerHTML = `

        <div class="evidencias-empty">

            <div class="empty-icon">
                !
            </div>

            <h3>
                Ocurrió un problema
            </h3>

            <p>
                ${mensaje}
            </p>

        </div>

    `;
}

document
    .getElementById("logoutButton")
    .addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "jwt"
            );

            localStorage.removeItem(
                "accessToken"
            );


            window.location.href =
                "login.html";
        }
    );


cargarUsuario();

cargarEvidencias();