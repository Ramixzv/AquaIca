(function () {

    const TODOS = ["ADMIN", "SOPORTE", "TECNICO"];
    const GESTION = ["ADMIN", "SOPORTE"];
    const SOLO_ADMIN = ["ADMIN"];

    const ICONOS = {
        dashboard: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
        reportes: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
        asignaciones: '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>',
        seguimientos: '<path d="M3 12a9 9 0 1 1 3 6.7"/><path d="M3 21v-6h6"/>',
        evidencias: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
        solicitudes: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 12v5M9.5 14.5h5"/>',
        instalaciones: '<path d="M14.7 6.3a4 4 0 0 0-5.6 5.1L4 16.5V20h3.5l5.1-5.1a4 4 0 0 0 5.1-5.6l-2.6 2.6-2-2z"/>',
        lecturas: '<circle cx="12" cy="12" r="9"/><path d="M12 12l4-4M12 6v1.5M6 12h1.5M18 12h-1.5"/>',
        suministros: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
        clientes: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M16 11h6"/>',
        personal: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
        recibos: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
        configuracion: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
    };

    const MODULOS = [
        { href: "dashboard.html",    etiqueta: "Dashboard",       icono: "dashboard",     roles: TODOS },
        { href: "reportes.html",     etiqueta: "Reportes",        icono: "reportes",      roles: TODOS, tambien: ["reporte-detalle.html"] },
        { href: "asignaciones.html", etiqueta: "Asignaciones",    icono: "asignaciones",  roles: TODOS },
        { href: "seguimientos.html", etiqueta: "Seguimientos",    icono: "seguimientos",  roles: TODOS },
        { href: "evidencias.html",   etiqueta: "Evidencias",      icono: "evidencias",    roles: TODOS },
        { href: "solicitudes.html",  etiqueta: "Solicitudes",     icono: "solicitudes",   roles: GESTION },
        { href: "instalaciones.html", etiqueta: "Instalaciones", icono: "instalaciones", roles: ["TECNICO"] },
        { href: "lecturas.html",      etiqueta: "Lecturas",        icono: "lecturas",      roles: TODOS },
        { href: "suministros.html",  etiqueta: "Suministros",     icono: "suministros",   roles: GESTION },
        { href: "clientes.html",     etiqueta: "Clientes",        icono: "clientes",      roles: GESTION },
        { href: "personal.html",     etiqueta: "Personal",        icono: "personal",      roles: GESTION },
        { href: "recibos.html",      etiqueta: "Recibos y pagos", icono: "recibos",       roles: GESTION, proximamente: true },
        { href: "configuracion.html",etiqueta: "Configuración",   icono: "configuracion", roles: SOLO_ADMIN, proximamente: true }
    ];

    const menu = document.getElementById("sidebarMenu")
        || document.querySelector(".sidebar-menu");

    if (!menu) {
        return;
    }

    const barra = menu.closest(".sidebar");

    if (!document.querySelector('link[href$="sidebar-pro.css"]')) {
        const enlace = document.createElement("link");
        enlace.rel = "stylesheet";
        enlace.href = "css/sidebar-pro.css";
        document.head.appendChild(enlace);
    }

    if (barra) {

        barra.classList.add("sidebar-pro");

        const logo = barra.querySelector(".brand-logo");

        if (logo && !logo.querySelector("img")) {
            logo.innerHTML = '<img src="images/logo-aquaica.png" alt="Logo Aqualca">';
        }

        const pie = barra.querySelector(".sidebar-bottom");

        if (pie && !pie.querySelector(".sidebar-olas")) {
            pie.insertAdjacentHTML("afterbegin", `
                <div class="sidebar-olas" aria-hidden="true">
                    <svg viewBox="0 0 250 120" preserveAspectRatio="none">
                        <path d="M0 62C40 36 78 92 130 68S210 28 250 58V120H0Z" fill="rgba(255,255,255,.14)"/>
                        <path d="M0 88C46 64 92 112 146 90S218 62 250 82V120H0Z" fill="rgba(255,255,255,.13)"/>
                        <circle cx="92" cy="44" r="14" fill="rgba(255,255,255,.26)"/>
                        <circle cx="134" cy="70" r="7" fill="rgba(255,255,255,.28)"/>
                        <circle cx="34" cy="62" r="5" fill="rgba(255,255,255,.26)"/>
                    </svg>
                </div>
                <p class="sidebar-frase">Servicio de agua<br>más cerca de la ciudad.</p>`);
        }
    }

    const rol = localStorage.getItem("rol");
    const paginaActual =
        (window.location.pathname.split("/").pop() || "index.html")
            .toLowerCase();

    const visibles = MODULOS.filter(modulo =>
        !rol || modulo.roles.includes(rol)
    );

    menu.innerHTML = visibles.map(modulo => {

        const icono = `
            <span class="menu-icon">
                <svg class="icon-svg" viewBox="0 0 24 24">${ICONOS[modulo.icono]}</svg>
            </span>`;

        if (modulo.proximamente) {
            return `
                <div class="menu-item menu-item-off" aria-disabled="true">
                    ${icono}
                    <span class="menu-texto">${modulo.etiqueta}</span>
                    <em>Próximamente</em>
                </div>`;
        }

        const activo =
            modulo.href === paginaActual ||
            (modulo.tambien || []).includes(paginaActual);

        return `
            <a href="${modulo.href}" class="menu-item${activo ? " active" : ""}">
                ${icono}
                <span class="menu-texto">${modulo.etiqueta}</span>
            </a>`;
    }).join("");

})();