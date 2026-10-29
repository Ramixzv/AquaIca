/* =========================================================
   AQUALCA · PÁGINAS PÚBLICAS
   - Cabecera adaptada a la sesión (ciudadano / personal / visitante)
   - Menú móvil, sombra al hacer scroll, índice activo, aparición suave
   ========================================================= */

(function () {

    "use strict";

    const $ = (selector, raiz = document) => raiz.querySelector(selector);
    const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

    /* ---------- Sesión ---------- */

    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol") || "";
    const logueado = !!token && !!rol;
    const esCiudadano = rol === "CIUDADANO";

    const destinoPortal = esCiudadano ? "ciudadano.html" : "dashboard.html";
    const textoPortal = esCiudadano ? "Ir a mi portal" : "Ir a mi panel";

    $$("[data-solo='anonimo']").forEach(el => { el.hidden = logueado; });
    $$("[data-solo='logueado']").forEach(el => { el.hidden = !logueado; });

    $$("[data-portal-link]").forEach(enlace => {
        enlace.href = destinoPortal;
        const texto = $(".js-texto", enlace);
        if (texto) texto.textContent = textoPortal;
    });

    // Botón principal del hero: crea cuenta, o lleva directo a reportar
    $$("[data-cta-principal]").forEach(enlace => {

        if (!logueado) return;

        const texto = $(".js-texto", enlace);

        if (esCiudadano) {
            enlace.href = "ciudadano.html?reportar=1#reportes";
            if (texto) texto.textContent = "Reportar un problema";

            const icono = $("svg", enlace);
            if (icono) {
                icono.innerHTML =
                    '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>';
            }
        } else {
            enlace.href = "dashboard.html";
            if (texto) texto.textContent = "Ir a mi panel";
        }
    });


    /* ---------- Menú móvil ---------- */

    const nav = $("#nav");
    const botonMenu = $("#menuBtn");

    function cerrarMenu() {
        if (!nav) return;
        nav.classList.remove("abierto");
        botonMenu.setAttribute("aria-expanded", "false");
    }

    if (nav && botonMenu) {

        botonMenu.addEventListener("click", () => {
            const abrir = !nav.classList.contains("abierto");
            nav.classList.toggle("abierto", abrir);
            botonMenu.setAttribute("aria-expanded", String(abrir));
        });

        nav.addEventListener("click", evento => {
            if (evento.target.closest("a")) cerrarMenu();
        });

        document.addEventListener("keydown", evento => {
            if (evento.key === "Escape") cerrarMenu();
        });

        document.addEventListener("click", evento => {
            if (!evento.target.closest(".cabecera")) cerrarMenu();
        });
    }


    /* ---------- Sombra de la cabecera ---------- */

    const cabecera = $(".cabecera");

    function alHacerScroll() {
        if (cabecera) cabecera.classList.toggle("con-sombra", window.scrollY > 8);
    }

    window.addEventListener("scroll", alHacerScroll, { passive: true });
    alHacerScroll();


    /* ---------- Aparición suave ---------- */

    const revelables = $$(".rev");

    if ("IntersectionObserver" in window) {

        const observador = new IntersectionObserver(entradas => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add("visible");
                    observador.unobserve(entrada.target);
                }
            });
        }, { threshold: 0.12 });

        revelables.forEach(el => observador.observe(el));

    } else {
        revelables.forEach(el => el.classList.add("visible"));
    }


    /* ---------- Índice de la guía: sección activa ---------- */

    const enlacesIndice = $$(".indice a");

    if (enlacesIndice.length && "IntersectionObserver" in window) {

        const secciones = enlacesIndice
            .map(a => $(a.getAttribute("href")))
            .filter(Boolean);

        const vigilante = new IntersectionObserver(entradas => {
            entradas.forEach(entrada => {
                if (!entrada.isIntersecting) return;
                enlacesIndice.forEach(a =>
                    a.classList.toggle("activo", a.getAttribute("href") === `#${entrada.target.id}`)
                );
            });
        }, { rootMargin: "-35% 0px -55% 0px" });

        secciones.forEach(s => vigilante.observe(s));

        // Al volver arriba (antes de la primera sección) no se marca ninguna
        window.addEventListener("scroll", () => {
            if (secciones[0] && secciones[0].getBoundingClientRect().top > window.innerHeight * 0.6) {
                enlacesIndice.forEach(a => a.classList.remove("activo"));
            }
        }, { passive: true });
    }


    /* ---------- Subir ---------- */

    const subir = $("#subir");

    if (subir) {
        subir.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }

})();