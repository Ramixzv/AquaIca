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

    const avatarElement =
        document.getElementById(
            "userAvatar"
        );


    usernameElement.textContent =
        username;


    roleElement.textContent =
        rol;


    initialElement.textContent =
        username
            .charAt(0)
            .toUpperCase();


    if (avatarElement) {

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

        avatarElement.style.background =
            `linear-gradient(135deg, ${colorA}, ${colorB})`;

    }
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
                    <svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
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
                    <svg class="icon-svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>
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
                    <svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>
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
                <svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>
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