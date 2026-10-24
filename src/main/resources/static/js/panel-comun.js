/* =========================================================
   UTILIDADES COMUNES DEL PANEL (solicitudes e instalaciones)
   Sesión, cabecera de usuario, avisos, API y formatos.
   ========================================================= */

window.Panel = (function () {

    "use strict";

    const $ = id => document.getElementById(id);

    /* ---------- Textos y formatos ---------- */

    function esc(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[c]);
    }

    function normalizar(valor) {
        return String(valor || "").trim().toUpperCase();
    }

    function titulo(texto) {
        return String(texto || "").toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
    }

    function iniciales(nombre) {
        return String(nombre || "?").split(/\s+/).filter(Boolean).slice(0, 2)
            .map(p => p.charAt(0).toUpperCase()).join("");
    }

    function fecha(valor) {
        const f = new Date(valor);
        return !valor || Number.isNaN(f.getTime())
            ? "—"
            : f.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
    }

    function hora(valor) {
        const f = new Date(valor);
        return !valor || Number.isNaN(f.getTime())
            ? ""
            : f.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    }

    function fechaHora(valor) {
        return valor ? `${fecha(valor)} · ${hora(valor)}` : "—";
    }

    function gradiente(nombre) {
        const paleta = [
            ["#0077b6", "#00a6d6"], ["#14b8a6", "#0ea5b7"], ["#7c3aed", "#a78bfa"],
            ["#f59e0b", "#f97316"], ["#059669", "#10b981"], ["#ec4899", "#f472b6"]
        ];
        let hash = 0;
        for (let i = 0; i < nombre.length; i++) {
            hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
        }
        const [a, b] = paleta[Math.abs(hash) % paleta.length];
        return `linear-gradient(135deg, ${a}, ${b})`;
    }

    function pill(color, texto, punto = false) {
        return `<span class="dp-pill ${punto ? "pri" : ""} ${color}">${esc(texto)}</span>`;
    }

    /* ---------- Avisos ---------- */

    let temporizador;

    function toast(mensaje, esError = false) {
        const caja = $("toast");
        if (!caja) return;
        caja.textContent = mensaje;
        caja.classList.toggle("error", esError);
        caja.classList.add("show");
        clearTimeout(temporizador);
        temporizador = setTimeout(() => caja.classList.remove("show"), 4200);
    }

    /* ---------- API ---------- */

    async function api(url, opciones = {}) {
        const headers = { ...(opciones.headers || {}) };
        if (opciones.body) headers["Content-Type"] = "application/json";
        return apiFetch(url, { ...opciones, headers });
    }

    function mensajeError(error, porDefecto) {
        const mensaje = error?.message || "";
        return !mensaje || mensaje === "Error en la solicitud" ? porDefecto : mensaje;
    }

    /* ---------- Sesión y cabecera ---------- */

    function cerrarSesion() {
        ["token", "username", "rol", "personalId", "clienteId"]
            .forEach(c => localStorage.removeItem(c));
        window.location.href = "login.html";
    }

    function cerrarMenus() {
        document.querySelectorAll(".dp-menu.abierto").forEach(m => m.classList.remove("abierto"));
        document.querySelectorAll("[aria-expanded='true']").forEach(b => b.setAttribute("aria-expanded", "false"));
    }

    /**
     * Valida la sesión y llena la cabecera.
     * roles: lista de roles que pueden ver la página.
     * Devuelve { username, rol } o null si redirigió.
     */
    function iniciar(roles) {

        const token = localStorage.getItem("token");
        const rol = localStorage.getItem("rol") || "";
        const username = localStorage.getItem("username") || "Usuario";

        if (!token) {
            window.location.href = "login.html";
            return null;
        }

        if (rol === "CIUDADANO") {
            window.location.href = "ciudadano.html";
            return null;
        }

        if (!roles.includes(rol)) {
            window.location.href = "dashboard.html";
            return null;
        }

        $("usernameDisplay").textContent = username;
        $("roleDisplay").textContent = rol;

        const avatar = $("userAvatar");
        avatar.textContent = username.charAt(0).toUpperCase();
        avatar.style.background = gradiente(username);

        $("logoutButton")?.addEventListener("click", cerrarSesion);
        $("logoutMenu").addEventListener("click", cerrarSesion);

        $("usuarioBtn").addEventListener("click", evento => {
            evento.stopPropagation();
            const abrir = !$("usuarioMenu").classList.contains("abierto");
            cerrarMenus();
            $("usuarioMenu").classList.toggle("abierto", abrir);
            $("usuarioBtn").setAttribute("aria-expanded", String(abrir));
        });

        document.addEventListener("click", cerrarMenus);
        document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarMenus(); });

        return { username, rol };
    }

    /* ---------- Confirmación (promesa) ---------- */

    function confirmar(titulo, texto, textoBoton = "Confirmar", peligro = false) {

        return new Promise(resolver => {

            const modal = $("modalConfirmar");
            $("confirmarTitulo").textContent = titulo;
            $("confirmarTexto").textContent = texto;

            const si = $("confirmarSi");
            const no = $("confirmarNo");

            si.textContent = textoBoton;
            si.className = peligro ? "pc-btn peligro" : "pc-btn prim";

            modal.hidden = false;

            const cerrar = respuesta => {
                modal.hidden = true;
                si.removeEventListener("click", alSi);
                no.removeEventListener("click", alNo);
                resolver(respuesta);
            };

            const alSi = () => cerrar(true);
            const alNo = () => cerrar(false);

            si.addEventListener("click", alSi);
            no.addEventListener("click", alNo);
        });
    }

    return {
        $, esc, normalizar, titulo, iniciales, fecha, hora, fechaHora,
        gradiente, pill, toast, api, mensajeError, iniciar, confirmar
    };

})();