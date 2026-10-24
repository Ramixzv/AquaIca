document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const rol = localStorage.getItem("rol");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    if (rol === "TECNICO") {
        window.location.href = "dashboard.html";
        return;
    }

    const usernameDisplay = document.getElementById("usernameDisplay");
    const roleDisplay = document.getElementById("roleDisplay");
    const userAvatar = document.getElementById("userAvatar");

    if (username) usernameDisplay.textContent = username;
    if (rol) roleDisplay.textContent = rol;

    if (userAvatar && username) {
        userAvatar.textContent = username.charAt(0).toUpperCase();
        userAvatar.style.background = gradientePorNombre(username);
    }

    document.getElementById("logoutButton").addEventListener("click", () => {
        ["token", "username", "rol", "personalId"].forEach(k => localStorage.removeItem(k));
        window.location.href = "login.html";
    });


    const tabla = document.getElementById("personalTable");

    const buscar = document.getElementById("buscarPersonal");
    const filtroEspecialidad = document.getElementById("filtroEspecialidad");
    const filtroRol = document.getElementById("filtroRol");
    const filtroEstado = document.getElementById("filtroEstado");

    const modal = document.getElementById("personalModal");
    const form = document.getElementById("personalForm");
    const formError = document.getElementById("formError");
    const guardarBtn = document.getElementById("guardarPersonal");

    const campo = id => document.getElementById(id);

    const ESPECIALIDADES = {
        REDES_FUGAS: "Redes y fugas",
        PRESION_TUBERIAS: "Presión y tuberías",
        FACTURACION: "Facturación y atención",
        GENERAL: "Atención general"
    };

    const ROLES = {
        ADMIN: "Administrador",
        SOPORTE: "Soporte",
        TECNICO: "Técnico"
    };

    let personal = [];


    function escapar(texto) {
        const div = document.createElement("div");
        div.textContent = texto ?? "";
        return div.innerHTML;
    }

    function gradientePorNombre(nombre) {

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

    let toastTimer;

    function mostrarToast(mensaje, esError = false) {

        const toast = document.getElementById("personalToast");

        toast.textContent = mensaje;
        toast.classList.toggle("error", esError);
        toast.classList.add("show");

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
    }

    const iconoEditar = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`;
    const iconoBloquear = `<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>`;
    const iconoActivar = `<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>`;



    async function cargarEspecialidades() {

        let lista = Object.keys(ESPECIALIDADES);

        try {
            const respuesta = await apiFetch("/api/personal/especialidades");
            if (Array.isArray(respuesta) && respuesta.length) {
                lista = respuesta.map(e => typeof e === "string" ? e : e.name);
            }
        } catch (error) {
            console.warn("Usando especialidades por defecto:", error);
        }

        lista.forEach(clave => {

            const etiqueta = ESPECIALIDADES[clave] || clave;

            [filtroEspecialidad, campo("especialidad")].forEach(select => {
                const option = document.createElement("option");
                option.value = clave;
                option.textContent = etiqueta;
                select.appendChild(option);
            });
        });
    }

    async function cargarPersonal() {

        try {
            personal = await apiFetch("/api/personal");
            actualizarKpis();
            renderizar();
        } catch (error) {
            tabla.innerHTML = `<tr><td colspan="7" class="personal-vacio">${escapar(error.message)}</td></tr>`;
        }
    }

    function actualizarKpis() {

        campo("statTotal").textContent = personal.length;
        campo("statTecnicos").textContent = personal.filter(p => p.rol === "TECNICO").length;
        campo("statActivos").textContent = personal.filter(p => p.estado === "ACTIVO").length;
        campo("statInactivos").textContent = personal.filter(p => p.estado !== "ACTIVO").length;
    }

    function renderizar() {

        const texto = buscar.value.trim().toLowerCase();

        const filtrados = personal.filter(p => {

            const coincideTexto =
                !texto ||
                (p.nombre || "").toLowerCase().includes(texto) ||
                (p.dni || "").includes(texto) ||
                (p.username || "").toLowerCase().includes(texto);

            return coincideTexto &&
                (!filtroEspecialidad.value || p.especialidad === filtroEspecialidad.value) &&
                (!filtroRol.value || p.rol === filtroRol.value) &&
                (!filtroEstado.value || p.estado === filtroEstado.value);
        });

        if (!filtrados.length) {
            tabla.innerHTML = `<tr><td colspan="7" class="personal-vacio">No se encontró personal con esos criterios.</td></tr>`;
            return;
        }

        tabla.innerHTML = filtrados.map(p => {

            const esp = p.especialidad || "NINGUNA";
            const activo = p.estado === "ACTIVO";

            return `
                <tr>
                    <td>
                        <div class="persona-celda">
                            <div class="persona-avatar" style="background:${gradientePorNombre(p.nombre || "U")}">
                                ${escapar((p.nombre || "U").charAt(0).toUpperCase())}
                            </div>
                            <div>
                                <strong>${escapar(p.nombre)}</strong>
                                <small>DNI: ${escapar(p.dni)}</small>
                            </div>
                        </div>
                    </td>
                    <td><span class="badge badge-esp-${esp}">${escapar(ESPECIALIDADES[esp] || esp)}</span></td>
                    <td>${escapar(p.username || "—")}</td>
                    <td>${p.rol ? `<span class="badge badge-rol-${p.rol}">${escapar(ROLES[p.rol] || p.rol)}</span>` : "—"}</td>
                    <td>${escapar(p.telefono || "—")}</td>
                    <td><span class="badge badge-estado-${activo ? "ACTIVO" : "INACTIVO"}">${activo ? "Activo" : "Inactivo"}</span></td>
                    <td>
                        <div class="acciones-celda">
                            <button class="btn-icono" title="Editar" data-accion="editar" data-id="${p.id}">${iconoEditar}</button>
                            ${activo
                                ? `<button class="btn-icono peligro" title="Desactivar" data-accion="desactivar" data-id="${p.id}">${iconoBloquear}</button>`
                                : `<button class="btn-icono exito" title="Reactivar" data-accion="reactivar" data-id="${p.id}">${iconoActivar}</button>`}
                        </div>
                    </td>
                </tr>`;
        }).join("");
    }

    [buscar, filtroEspecialidad, filtroRol, filtroEstado].forEach(el => {
        el.addEventListener("input", renderizar);
        el.addEventListener("change", renderizar);
    });

    tabla.addEventListener("click", event => {

        const boton = event.target.closest("button[data-accion]");
        if (!boton) return;

        const persona = personal.find(p => String(p.id) === boton.dataset.id);
        if (!persona) return;

        if (boton.dataset.accion === "editar") abrirModal(persona);
        if (boton.dataset.accion === "desactivar") desactivar(persona);
        if (boton.dataset.accion === "reactivar") reactivar(persona);
    });

    function abrirModal(persona = null) {

        form.reset();
        formError.textContent = "";
        campo("personalId").value = persona ? persona.id : "";

        const esEdicion = !!persona;

        campo("modalKicker").textContent = esEdicion ? "Edición" : "Nuevo registro";
        campo("modalTitulo").textContent = esEdicion ? "Editar personal" : "Nuevo personal";
        campo("estadoField").style.display = esEdicion ? "block" : "none";

        campo("passwordLabel").textContent = esEdicion ? "Nueva contraseña" : "Contraseña *";
        campo("password").placeholder = esEdicion ? "Dejar vacío para no cambiarla" : "Contraseña";

        if (esEdicion) {
            campo("nombre").value = persona.nombre || "";
            campo("dni").value = persona.dni || "";
            campo("telefono").value = persona.telefono || "";
            campo("especialidad").value = persona.especialidad || "";
            campo("username").value = persona.username || "";
            campo("rol").value = persona.rol || "TECNICO";
            campo("estado").value = persona.estado || "ACTIVO";
        } else {
            campo("rol").value = "TECNICO";
        }

        modal.classList.add("show");
        campo("nombre").focus();
    }

    function cerrarModal() {
        modal.classList.remove("show");
    }

    campo("nuevoPersonalButton").addEventListener("click", () => abrirModal());
    campo("cerrarModal").addEventListener("click", cerrarModal);
    campo("cancelarModal").addEventListener("click", cerrarModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) cerrarModal();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") cerrarModal();
    });

    ["dni", "telefono"].forEach(id => {
        campo(id).addEventListener("input", () => {
            campo(id).value = campo(id).value.replace(/\D/g, "");
        });
    });


    form.addEventListener("submit", async event => {

        event.preventDefault();
        formError.textContent = "";

        const id = campo("personalId").value;
        const esEdicion = !!id;

        const datos = {
            nombre: campo("nombre").value.trim(),
            dni: campo("dni").value.trim(),
            telefono: campo("telefono").value.trim(),
            especialidad: campo("especialidad").value,
            username: campo("username").value.trim(),
            password: campo("password").value,
            rol: campo("rol").value
        };

        if (esEdicion) datos.estado = campo("estado").value;

        if (!/^\d{8}$/.test(datos.dni)) {
            formError.textContent = "El DNI debe tener exactamente 8 dígitos.";
            return;
        }

        if (datos.telefono && !/^\d{9}$/.test(datos.telefono)) {
            formError.textContent = "El teléfono debe tener 9 dígitos.";
            return;
        }

        if (!esEdicion && datos.password.length < 6) {
            formError.textContent = "La contraseña debe tener al menos 6 caracteres.";
            return;
        }

        if (esEdicion && datos.password && datos.password.length < 6) {
            formError.textContent = "La nueva contraseña debe tener al menos 6 caracteres.";
            return;
        }

        guardarBtn.disabled = true;
        guardarBtn.textContent = "Guardando...";

        try {

            await apiFetch(esEdicion ? `/api/personal/${id}` : "/api/personal", {
                method: esEdicion ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos)
            });

            cerrarModal();
            mostrarToast(esEdicion ? "Personal actualizado correctamente" : "Personal registrado correctamente");
            await cargarPersonal();

        } catch (error) {

            formError.textContent = error.message;

        } finally {

            guardarBtn.disabled = false;
            guardarBtn.textContent = "Guardar";
        }
    });


    async function desactivar(persona) {

        if (persona.username && persona.username === username) {
            mostrarToast("No puedes desactivar tu propia cuenta", true);
            return;
        }

        if (!confirm(`¿Desactivar a ${persona.nombre}? No podrá iniciar sesión.`)) return;

        try {
            await apiFetch(`/api/personal/${persona.id}`, { method: "DELETE" });
            mostrarToast("Personal desactivado");
            await cargarPersonal();
        } catch (error) {
            mostrarToast(error.message, true);
        }
    }

    async function reactivar(persona) {

        try {

            await apiFetch(`/api/personal/${persona.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre: persona.nombre,
                    dni: persona.dni,
                    telefono: persona.telefono,
                    especialidad: persona.especialidad,
                    username: persona.username,
                    rol: persona.rol,
                    estado: "ACTIVO"
                })
            });

            mostrarToast("Personal reactivado");
            await cargarPersonal();

        } catch (error) {
            mostrarToast(error.message, true);
        }
    }


    cargarEspecialidades().then(cargarPersonal);
});