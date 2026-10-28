// Campana de notificaciones: se coloca sola junto al usuario en el encabezado
(function () {
    const token = localStorage.getItem("token");
    if (!token || window.__notifIniciado) return;
    window.__notifIniciado = true;

    const ICONO = '<svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';

    const esc = v => { const e = document.createElement("span"); e.textContent = v ?? ""; return e.innerHTML; };

    async function api(url, opciones) {
        const r = await fetch(url, Object.assign({ headers: { Authorization: "Bearer " + token } }, opciones));
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.status === 204 ? null : r.json();
    }

    function hace(fecha) {
        const min = Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));
        if (min < 1) return "ahora";
        if (min < 60) return `hace ${min} min`;
        if (min < 1440) return `hace ${Math.round(min / 60)} h`;
        return new Date(fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
    }

    function iniciar() {

        // El dashboard ya trae su propia campana
        if (document.getElementById("campanaWrap")) return;

        const ancla = document.querySelector(".p-user") || document.querySelector(".user-info");
        if (!ancla) return;

        const wrap = document.createElement("div");
        wrap.className = "notif-wrap";
        wrap.innerHTML = `
            <button type="button" class="notif-btn" aria-label="Notificaciones" aria-expanded="false">
                ${ICONO}<span class="notif-badge" hidden>0</span>
            </button>
            <div class="notif-panel" hidden>
                <div class="notif-cab"><strong>Notificaciones</strong><button type="button" class="notif-todas">Marcar todas como leídas</button></div>
                <div class="notif-lista"></div>
            </div>`;

        // La campana y el usuario forman un grupo para no alterar el diseño del encabezado
        const grupo = document.createElement("div");
        grupo.className = "notif-grupo";
        ancla.parentNode.insertBefore(grupo, ancla);
        grupo.appendChild(wrap);
        grupo.appendChild(ancla);

        const boton = wrap.querySelector(".notif-btn");
        const badge = wrap.querySelector(".notif-badge");
        const panel = wrap.querySelector(".notif-panel");
        const lista = wrap.querySelector(".notif-lista");

        async function refrescarCantidad() {
            try {
                const { noLeidas } = await api("/api/notificaciones/cantidad");
                badge.textContent = noLeidas > 99 ? "99+" : noLeidas;
                badge.hidden = noLeidas === 0;
            } catch (e) { /* sin sesión o sin red: se ignora */ }
        }

        async function cargarLista() {
            lista.innerHTML = '<p class="notif-vacio">Cargando...</p>';
            try {
                const datos = await api("/api/notificaciones");
                lista.innerHTML = datos.length ? datos.map(n => `
                    <button type="button" class="notif-item ${n.leida ? "" : "nueva"}" data-id="${n.id}" data-enlace="${esc(n.enlace || "")}">
                        <span class="notif-punto"></span>
                        <span class="notif-txt"><strong>${esc(n.titulo)}</strong><span>${esc(n.mensaje)}</span><small>${hace(n.fechaCreacion)}</small></span>
                    </button>`).join("") : '<p class="notif-vacio">No tienes notificaciones.</p>';
            } catch (e) {
                lista.innerHTML = '<p class="notif-vacio">No se pudieron cargar.</p>';
            }
        }

        function abrir(abierto) {
            panel.hidden = !abierto;
            boton.setAttribute("aria-expanded", String(abierto));
            if (abierto) cargarLista();
        }

        boton.addEventListener("click", e => { e.stopPropagation(); abrir(panel.hidden); });
        document.addEventListener("click", e => { if (!wrap.contains(e.target)) abrir(false); });
        document.addEventListener("keydown", e => { if (e.key === "Escape") abrir(false); });

        wrap.querySelector(".notif-todas").addEventListener("click", async () => {
            try { await api("/api/notificaciones/leer-todas", { method: "PATCH" }); } catch (e) { /* nada */ }
            cargarLista(); refrescarCantidad();
        });

        lista.addEventListener("click", async e => {
            const item = e.target.closest(".notif-item");
            if (!item) return;
            try { await api(`/api/notificaciones/${item.dataset.id}/leida`, { method: "PATCH" }); } catch (x) { /* nada */ }
            abrir(false);
            refrescarCantidad();
            if (item.dataset.enlace) window.location.href = item.dataset.enlace;
        });

        refrescarCantidad();
        setInterval(refrescarCantidad, 45000);
        window.addEventListener("focus", refrescarCantidad);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
    else iniciar();
})();
