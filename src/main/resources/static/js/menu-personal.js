
document.addEventListener("DOMContentLoaded", () => {

    const rol = localStorage.getItem("rol");
    const menu = document.querySelector(".sidebar-menu");

    // Solo ADMIN y SOPORTE pueden ver estos módulos.
    if (!menu || !["ADMIN", "SOPORTE"].includes(rol)) {
        return;
    }

    // Agregar Personal si todavía no aparece en el menú.
    if (!menu.querySelector('a[href="personal.html"]')) {

        const enlacePersonal = document.createElement("a");

        enlacePersonal.href = "personal.html";
        enlacePersonal.className = "menu-item";

        enlacePersonal.innerHTML = `
            <span class="menu-icon">
                <svg class="icon-svg"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     stroke-width="2"
                     stroke-linecap="round"
                     stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
            </span>
            Personal
        `;

        menu.appendChild(enlacePersonal);
    }

    // Agregar Clientes si todavía no aparece en el menú.
    if (!menu.querySelector('a[href="clientes.html"]')) {

        const enlaceClientes = document.createElement("a");

        enlaceClientes.href = "clientes.html";
        enlaceClientes.className = "menu-item";

        enlaceClientes.innerHTML = `
            <span class="menu-icon">
                <svg class="icon-svg"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     stroke-width="2"
                     stroke-linecap="round"
                     stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="10" cy="7" r="4"/>
                    <path d="M20 8v6"/>
                    <path d="M23 11h-6"/>
                </svg>
            </span>
            Clientes
        `;

        menu.appendChild(enlaceClientes);
    }

});
