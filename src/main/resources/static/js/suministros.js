document.addEventListener("DOMContentLoaded", () => {
    const API = "/api/suministros";
    const API_CLIENTES = "/api/clientes";

    const $ = (id) => document.getElementById(id);

    /* =====================================================
       SESIÓN, PERMISOS Y DATOS DEL USUARIO
       ===================================================== */

    const sesionToken = localStorage.getItem("token");
    const sesionUsuario = localStorage.getItem("username") || "Usuario";
    const sesionRol = localStorage.getItem("rol") || "Usuario";

    if (!sesionToken) {
        window.location.href = "login.html";
        return;
    }

    if (!["ADMIN", "SOPORTE"].includes(sesionRol)) {
        window.location.href = "dashboard.html";
        return;
    }

    $("usernameDisplay").textContent = sesionUsuario;
    $("roleDisplay").textContent = sesionRol;

    function gradienteAvatar(nombre) {
        const paleta = [
            ["#0077b6", "#00a6d6"],
            ["#14b8a6", "#0ea5b7"],
            ["#7c3aed", "#a78bfa"],
            ["#f59e0b", "#f97316"],
            ["#059669", "#10b981"],
            ["#ec4899", "#f472b6"]
        ];

        let hash = 0;
        for (let i = 0; i < nombre.length; i++) {
            hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
        }

        const [a, b] = paleta[Math.abs(hash) % paleta.length];
        return `linear-gradient(135deg, ${a}, ${b})`;
    }

    const avatarUsuario = $("userAvatar");
    avatarUsuario.textContent = sesionUsuario.charAt(0).toUpperCase();
    avatarUsuario.style.background = gradienteAvatar(sesionUsuario);

    $("logoutButton").addEventListener("click", () => {
        ["token", "username", "rol", "personalId", "clienteId"]
            .forEach(clave => localStorage.removeItem(clave));
        window.location.href = "login.html";
    });

    const ICONO_EDITAR = '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
    const ICONO_ELIMINAR = '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
    const ICONO_PIN = '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    const ICONO_PIN_X = '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><path d="M9.5 7.5l5 5M14.5 7.5l-5 5"/></svg>';

    const modal = $("modalSuministro");
    const formulario = $("formSuministro");
    const tabla = $("tablaSuministros");

    let suministros = [];
    let clientes = [];
    let mapa = null;
    let marcador = null;
    let idEditando = null;
    let busquedaTimer = null;
    let mapaConsulta = null;
    let marcadorConsulta = null;

   
    async function peticion(url, opciones = {}) {
        const headers = { ...(opciones.headers || {}) };

        if (opciones.body) {
            headers["Content-Type"] = "application/json";
        }

        return apiFetch(url, { ...opciones, headers });
    }

    function escapar(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, (caracter) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[caracter]);
    }

    function notificar(mensaje, error = false) {
        let toast = $("suministrosToast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "suministrosToast";
            toast.className = "suministros-toast";
            document.body.appendChild(toast);
        }

        toast.textContent = mensaje;
        toast.classList.toggle("error", error);
        toast.classList.add("show");

        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove("show");
        }, 3500);
    }

    async function cargarClientes() {
        const selector = $("clienteId");

        selector.innerHTML =
            '<option value="">Cargando clientes...</option>';

        try {
            const datos = await peticion(API_CLIENTES);

            clientes = Array.isArray(datos)
                ? datos
                : datos.content || datos.clientes || [];

            const activos = clientes.filter(
                cliente =>
                    String(cliente.estado || "ACTIVO").toUpperCase()
                    === "ACTIVO"
            );

            selector.innerHTML =
                '<option value="">Selecciona un cliente</option>';

            activos.forEach(cliente => {
                const opcion = document.createElement("option");
                opcion.value = cliente.id;
                opcion.textContent =
                    `${cliente.nombreCompleto} — DNI ${cliente.dni}`;
                selector.appendChild(opcion);
            });

        } catch (error) {
            selector.innerHTML =
                '<option value="">No se pudieron cargar los clientes</option>';

            console.error("Error al cargar clientes:", error);
            notificar(
                "No se pudieron cargar los clientes. Revisa la API y tu sesión.",
                true
            );
        }
    }

    async function cargarSuministros(termino = "") {
        tabla.innerHTML =
            '<tr><td colspan="6" class="suministros-vacio">Cargando suministros...</td></tr>';

        try {
            const url = termino.trim()
                ? `${API}?buscar=${encodeURIComponent(termino.trim())}`
                : API;

            suministros = await peticion(url);

            renderizarTabla();
            actualizarEstadisticas();

        } catch (error) {
            console.error("Error al cargar suministros:", error);

            tabla.innerHTML =
                '<tr><td colspan="6" class="suministros-vacio">No se pudieron cargar los suministros.</td></tr>';

            notificar("Error al cargar los suministros.", true);
        }
    }

    function renderizarTabla() {
        const filtro = $("filtroUbicacion").value;

        const lista = suministros.filter(suministro => {
            const tiene =
                suministro.latitud != null &&
                suministro.longitud != null;

            return !filtro ||
                (filtro === "CON" && tiene) ||
                (filtro === "SIN" && !tiene);
        });

        if (!lista.length) {
            tabla.innerHTML =
                '<tr><td colspan="6" class="suministros-vacio">No se encontraron suministros con esos criterios.</td></tr>';
            return;
        }

        tabla.innerHTML = lista.map(suministro => {
            const tieneUbicacion =
                suministro.latitud != null &&
                suministro.longitud != null;

            const nombre = suministro.nombreCliente || "Cliente";

            return `
                <tr>
                    <td>
                        <span class="suministro-codigo">
                            ${ICONO_PIN}${escapar(suministro.codigoSuministro)}
                        </span>
                    </td>

                    <td>
                        <div class="suministro-cliente">
                            <div class="suministro-avatar"
                                 style="background:${gradienteAvatar(nombre)}">
                                ${escapar(nombre.charAt(0).toUpperCase())}
                            </div>
                            <strong>${escapar(suministro.nombreCliente)}</strong>
                        </div>
                    </td>

                    <td>${escapar(suministro.dniCliente)}</td>
                    <td>${escapar(suministro.direccion)}</td>

                    <td>
                        ${
                            tieneUbicacion
                            ? `<button type="button"
                                class="suministro-ubicacion"
                                data-accion="mapa"
                                data-id="${suministro.id}">
                                ${ICONO_PIN}Ver en mapa
                              </button>`
                            : `<span class="suministro-sin-ubicacion">${ICONO_PIN_X}Sin ubicación</span>`
                        }
                    </td>

                    <td>
                        <div class="suministro-acciones">
                            <button type="button"
                                class="suministro-btn-icon"
                                data-accion="editar"
                                data-id="${suministro.id}"
                                title="Editar suministro"
                                aria-label="Editar suministro">
                                ${ICONO_EDITAR}
                            </button>

                            <button type="button"
                                class="suministro-btn-icon peligro"
                                data-accion="eliminar"
                                data-id="${suministro.id}"
                                title="Eliminar suministro"
                                aria-label="Eliminar suministro">
                                ${ICONO_ELIMINAR}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    function actualizarEstadisticas() {
        $("totalSuministros").textContent = suministros.length;

        $("clientesAsociados").textContent =
            new Set(suministros.map(s => s.clienteId)).size;

        const conUbicacion = suministros.filter(s =>
            s.latitud != null && s.longitud != null
        ).length;

        $("suministrosGeolocalizados").textContent = conUbicacion;
        $("suministrosSinUbicacion").textContent =
            suministros.length - conUbicacion;
    }

    function abrirModal(suministro = null) {
        idEditando = suministro?.id ?? null;
        formulario.reset();

        $("suministroId").value = suministro?.id ?? "";
        $("codigoSuministro").value =
            suministro?.codigoSuministro ?? "";
        $("direccionSuministro").value =
            suministro?.direccion ?? "";
        $("latitud").value = suministro?.latitud ?? "";
        $("longitud").value = suministro?.longitud ?? "";

        $("tituloModal").textContent = suministro
            ? "Editar suministro"
            : "Nuevo suministro";

        $("clienteId").value = suministro?.clienteId ?? "";

        // Si el titular está inactivo no aparece en la lista: lo agregamos
        if (
            suministro?.clienteId &&
            $("clienteId").value !== String(suministro.clienteId)
        ) {
            const opcion = document.createElement("option");
            opcion.value = suministro.clienteId;
            opcion.textContent =
                `${suministro.nombreCliente} — DNI ${suministro.dniCliente}`;
            $("clienteId").appendChild(opcion);
            $("clienteId").value = suministro.clienteId;
        }

        modal.classList.remove("oculto");

        // Leaflet necesita que el contenedor sea visible.
        setTimeout(() => {
            inicializarMapa();

            if (!mapa) {
                return;
            }

            if (
                suministro?.latitud != null &&
                suministro?.longitud != null
            ) {
                colocarMarcador(
                    suministro.latitud,
                    suministro.longitud,
                    true
                );
            } else {
                mapa.setView([-14.0678, -75.7286], 13);
                limpiarMarcador();
            }

            mapa.invalidateSize();
        }, 150);
    }

    function cerrarModal() {
        modal.classList.add("oculto");
        idEditando = null;
    }
    
function abrirVisorMapa(suministro) {
    const lat = Number(suministro.latitud);
    const lng = Number(suministro.longitud);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        notificar("Este suministro no tiene coordenadas válidas.", true);
        return;
    }

    $("visorMapaTitulo").textContent =
        `Suministro ${suministro.codigoSuministro}`;

    $("visorMapaDireccion").textContent =
        suministro.direccion || "Dirección no registrada";

    $("visorMapaCoordenadas").textContent =
        `Latitud: ${lat.toFixed(7)} · Longitud: ${lng.toFixed(7)}`;

    const overlay = $("visorMapaOverlay");
    overlay.classList.remove("oculto");

    // Crear el mapa una sola vez.
    if (!mapaConsulta) {
        mapaConsulta = L.map("mapaConsultaSuministro")
            .setView([lat, lng], 17);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap"
        }).addTo(mapaConsulta);

        marcadorConsulta = L.marker([lat, lng])
            .addTo(mapaConsulta);
    } else {
        mapaConsulta.setView([lat, lng], 17);
        marcadorConsulta.setLatLng([lat, lng]);
    }

    marcadorConsulta.bindPopup(
        `<strong>${escapar(suministro.codigoSuministro)}</strong><br>` +
        `${escapar(suministro.direccion || "Sin dirección")}`
    );

    // Leaflet debe recalcular el tamaño al mostrar la ventana.
    setTimeout(() => {
        mapaConsulta.invalidateSize();
        marcadorConsulta.openPopup();
    }, 150);
}

function cerrarVisorMapa() {
    $("visorMapaOverlay").classList.add("oculto");
}


    function inicializarMapa() {
        if (mapa) {
            return;
        }

        if (typeof L === "undefined") {
            notificar(
                "No se pudo cargar Leaflet. Revisa tu conexión a Internet.",
                true
            );
            return;
        }

        mapa = L.map("mapaSuministro").setView(
            [-14.0678, -75.7286],
            13
        );

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution: "&copy; OpenStreetMap"
            }
        ).addTo(mapa);

        mapa.on("click", evento => {
            colocarMarcador(
                evento.latlng.lat,
                evento.latlng.lng,
                false
            );
        });
    }

    function colocarMarcador(latitud, longitud, centrar = false) {
        if (!mapa) {
            return;
        }

        const posicion = [Number(latitud), Number(longitud)];

        if (!marcador) {
            marcador = L.marker(posicion, {
                draggable: true
            }).addTo(mapa);

            marcador.on("dragend", () => {
                const posicionActual = marcador.getLatLng();
                actualizarCoordenadas(
                    posicionActual.lat,
                    posicionActual.lng
                );
            });
        } else {
            marcador.setLatLng(posicion);
        }

        actualizarCoordenadas(latitud, longitud);

        if (centrar) {
            mapa.setView(posicion, 17);
        }
    }

    function limpiarMarcador() {
        if (mapa && marcador) {
            mapa.removeLayer(marcador);
        }

        marcador = null;
        $("latitud").value = "";
        $("longitud").value = "";
    }

    function actualizarCoordenadas(latitud, longitud) {
        $("latitud").value = Number(latitud).toFixed(7);
        $("longitud").value = Number(longitud).toFixed(7);
    }

    async function buscarDireccion() {
        const direccion = $("buscarDireccion").value.trim();

        if (!direccion) {
            notificar("Escribe una dirección para buscar.", true);
            return;
        }

        try {
            const consulta = `${direccion}, Ica, Peru`;

            const url =
                "https://nominatim.openstreetmap.org/search?" +
                new URLSearchParams({
                    q: consulta,
                    format: "jsonv2",
                    limit: "1",
                    countrycodes: "pe"
                });

            const respuesta = await fetch(url, {
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!respuesta.ok) {
                throw new Error("No se pudo consultar el servicio de mapas.");
            }

            const resultados = await respuesta.json();

            if (!resultados.length) {
                notificar(
                    "No se encontró esa dirección. Intenta con otra referencia.",
                    true
                );
                return;
            }

            const resultado = resultados[0];

            colocarMarcador(
                Number(resultado.lat),
                Number(resultado.lon),
                true
            );

            notificar("Dirección localizada. Puedes ajustar el marcador.");

        } catch (error) {
            console.error("Error al buscar dirección:", error);
            notificar(
                "No se pudo buscar la dirección. Revisa tu conexión.",
                true
            );
        }
    }


    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();

        const clienteId = Number($("clienteId").value);
        const latitudTexto = $("latitud").value;
        const longitudTexto = $("longitud").value;

        if (!clienteId) {
            notificar("Selecciona un cliente.", true);
            return;
        }

        if (!latitudTexto || !longitudTexto) {
            notificar(
                "Selecciona la ubicación del suministro en el mapa.",
                true
            );
            return;
        }

        const datos = {
            codigoSuministro: $("codigoSuministro").value.trim(),
            direccion: $("direccionSuministro").value.trim(),
            latitud: Number(latitudTexto),
            longitud: Number(longitudTexto),
            clienteId
        };

        const boton = formulario.querySelector(
            'button[type="submit"]'
        );

        boton.disabled = true;

        try {
            const url = idEditando
                ? `${API}/${idEditando}`
                : API;

            await peticion(url, {
                method: idEditando ? "PUT" : "POST",
                body: JSON.stringify(datos)
            });

            notificar(
                idEditando
                    ? "Suministro actualizado correctamente."
                    : "Suministro registrado correctamente."
            );

            cerrarModal();
            await cargarSuministros(
                $("buscarSuministro").value
            );

        } catch (error) {
            console.error("Error al guardar suministro:", error);
            notificar(
                error.message || "No se pudo guardar el suministro.",
                true
            );
        } finally {
            boton.disabled = false;
        }
    });


    tabla.addEventListener("click", async evento => {
        const boton = evento.target.closest("[data-accion]");

        if (!boton) {
            return;
        }

        const id = Number(boton.dataset.id);
        const suministro = suministros.find(s => s.id === id);

        if (!suministro) {
            return;
        }

        switch (boton.dataset.accion) {
            case "editar":
                await cargarClientes();
                abrirModal(suministro);
                break;
            case "mapa":
                abrirVisorMapa(suministro);
                break;

            case "eliminar":
                if (!confirm(
                    `¿Seguro que deseas eliminar el suministro ${suministro.codigoSuministro}?`
                )) {
                    return;
                }

                try {
                    await peticion(`${API}/${id}`, {
                        method: "DELETE"
                    });

                    notificar("Suministro eliminado correctamente.");
                    await cargarSuministros(
                        $("buscarSuministro").value
                    );

                } catch (error) {
                    console.error("Error al eliminar:", error);
                    notificar(
                        "No se pudo eliminar. Puede tener reportes asociados.",
                        true
                    );
                }
                break;
        }
    });


    $("btnNuevoSuministro").addEventListener("click", async () => {
        await cargarClientes();
        abrirModal();
    });

    $("btnCerrarModal").addEventListener("click", cerrarModal);
    $("btnCancelarSuministro").addEventListener("click", cerrarModal);
    $("btnBuscarDireccion").addEventListener("click", buscarDireccion);
    
$("cerrarVisorMapa").addEventListener("click", cerrarVisorMapa);
$("cerrarVisorMapaFooter").addEventListener("click", cerrarVisorMapa);

$("visorMapaOverlay").addEventListener("click", evento => {
    if (evento.target === $("visorMapaOverlay")) {
        cerrarVisorMapa();
    }
});


    $("buscarDireccion").addEventListener("keydown", evento => {
        if (evento.key === "Enter") {
            evento.preventDefault();
            buscarDireccion();
        }
    });

    $("buscarSuministro").addEventListener("input", () => {
        clearTimeout(busquedaTimer);

        busquedaTimer = setTimeout(() => {
            cargarSuministros($("buscarSuministro").value);
        }, 300);
    });

    $("filtroUbicacion").addEventListener("change", renderizarTabla);

    modal.addEventListener("click", evento => {
        if (evento.target === modal) {
            cerrarModal();
        }
    });

    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape") {
            cerrarModal();
            cerrarVisorMapa();
        }
    });

    // Inicio
    cargarSuministros();
});