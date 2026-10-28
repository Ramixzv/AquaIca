/* =========================================================
   VENTANA "REPORTAR UN PROBLEMA" · PORTAL CIUDADANO

   Cómo se abre: cualquier elemento con el atributo data-abrir-reporte.
   Si además trae data-codigo="100000001", el suministro llega preseleccionado.

   Flujo (el mismo que usaba reporte.html):
     POST /api/reportes                        -> crea el reporte
     POST /api/reportes/{id}/evidencias        -> sube la imagen (opcional)

   Necesita que ciudadano.js publique window.AquaIcaPortal.
   ========================================================= */

(function () {

    "use strict";

    const modal = document.getElementById("modalReporte");

    if (!modal) {
        return;
    }

    const $ = id => document.getElementById(id);

    const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
    const PESO_MAXIMO = 5 * 1024 * 1024;

    const el = {
        form: $("rpForm"),
        cerrar: $("rpCerrar"),
        codigo: $("rpCodigo"),
        codigos: $("rpCodigos"),
        buscar: $("rpBuscar"),
        encontrado: $("rpEncontrado"),
        titular: $("rpTitular"),
        dni: $("rpDni"),
        direccion: $("rpDireccion"),
        tipo: $("rpTipo"),
        descripcion: $("rpDescripcion"),
        contador: $("rpContador"),
        drop: $("rpDrop"),
        archivo: $("rpArchivo"),
        dropVacio: $("rpDropVacio"),
        dropLleno: $("rpDropLleno"),
        miniatura: $("rpMiniatura"),
        nombreArchivo: $("rpNombreArchivo"),
        pesoArchivo: $("rpPesoArchivo"),
        quitar: $("rpQuitar"),
        mensaje: $("rpMensaje"),
        limpiar: $("rpLimpiar"),
        enviar: $("rpEnviar")
    };

    let suministro = null;     // suministro validado (de los del ciudadano)
    let disparador = null;     // elemento que abrió la ventana, para devolverle el foco
    let enviando = false;
    let urlMiniatura = null;


    /* =====================================================
       UTILIDADES
       ===================================================== */

    function portal() {
        return window.AquaIcaPortal || {
            datos: { suministros: [], perfil: null },
            toast: () => {},
            irA: () => {},
            recargarReportes: async () => {}
        };
    }

    function normalizar(valor) {
        return String(valor || "").trim().toUpperCase();
    }

    function tituloNombre(texto) {
        return String(texto || "")
            .toLowerCase()
            .replace(/(^|\s)\S/g, letra => letra.toUpperCase());
    }

    function pesoLegible(bytes) {
        return bytes >= 1024 * 1024
            ? (bytes / (1024 * 1024)).toFixed(1) + " MB"
            : Math.max(1, Math.round(bytes / 1024)) + " KB";
    }

    function mostrarMensaje(texto, tipo = "error") {
        el.mensaje.textContent = texto;
        el.mensaje.classList.toggle("ok", tipo === "ok");
        el.mensaje.hidden = false;
    }

    function limpiarMensaje() {
        el.mensaje.hidden = true;
        el.mensaje.textContent = "";
    }

    function hayCambios() {
        return el.descripcion.value.trim() !== "" || el.archivo.files.length > 0;
    }


    /* =====================================================
       ABRIR Y CERRAR
       ===================================================== */

    function abrir(codigoInicial, origen) {

        disparador = origen || null;

        reiniciar();

        const lista = portal().datos.suministros || [];

        el.codigos.innerHTML = lista
            .map(s => `<option value="${String(s.codigoSuministro).replace(/"/g, "&quot;")}"></option>`)
            .join("");

        // Si hay un solo suministro, no tiene sentido pedirle que lo escriba.
        const inicial = codigoInicial || (lista.length === 1 ? lista[0].codigoSuministro : "");

        if (inicial) {
            el.codigo.value = inicial;
            buscar();
        }

        modal.hidden = false;
        document.body.classList.add("rp-abierto");

        window.setTimeout(() => {
            (suministro ? el.tipo : el.codigo).focus();
        }, 30);
    }

    function cerrar(forzar = false) {

        if (enviando) {
            return;
        }

        if (!forzar && hayCambios() &&
            !window.confirm("¿Cerrar sin enviar? Se perderá lo que escribiste.")) {
            return;
        }

        modal.hidden = true;
        document.body.classList.remove("rp-abierto");
        quitarArchivo();

        if (disparador && document.contains(disparador)) {
            disparador.focus();
        }
    }


    /* =====================================================
       SUMINISTRO
       ===================================================== */

    function buscar() {

        const texto = normalizar(el.codigo.value);

        limpiarMensaje();

        if (!texto) {
            ocultarSuministro();
            mostrarMensaje("Escribe tu código de suministro.");
            el.codigo.focus();
            return;
        }

        const propios = portal().datos.suministros || [];

        if (!propios.length) {
            ocultarSuministro();
            mostrarMensaje("Aún no tienes suministros activos. Cuando se active tu servicio podrás reportar desde aquí.");
            return;
        }

        const encontrado = propios.find(s => normalizar(s.codigoSuministro) === texto);

        if (!encontrado) {
            ocultarSuministro();
            mostrarMensaje("No encontramos ese código entre tus suministros. Revísalo en tu recibo de agua.");
            el.codigo.focus();
            return;
        }

        const perfil = portal().datos.perfil || {};

        suministro = encontrado;

        el.codigo.value = encontrado.codigoSuministro;
        el.titular.textContent = tituloNombre(perfil.nombreCompleto) || "—";
        el.dni.textContent = perfil.dni || "—";
        el.direccion.textContent = encontrado.direccion || "—";
        el.encontrado.hidden = false;
    }

    function ocultarSuministro() {
        suministro = null;
        el.encontrado.hidden = true;
    }

    el.buscar.addEventListener("click", buscar);

    el.codigo.addEventListener("keydown", evento => {
        if (evento.key === "Enter") {
            evento.preventDefault();
            buscar();
        }
    });

    el.codigo.addEventListener("input", () => {

        const escrito = normalizar(el.codigo.value);

        if (suministro && escrito !== normalizar(suministro.codigoSuministro)) {
            ocultarSuministro();
        }

        limpiarMensaje();

        // Al elegir un código de la lista desplegable, se valida solo.
        const coincide = (portal().datos.suministros || [])
            .some(s => normalizar(s.codigoSuministro) === escrito);

        if (coincide && !suministro) {
            buscar();
        }
    });


    /* =====================================================
       TIPO, DESCRIPCIÓN Y ATAJOS
       ===================================================== */

    el.descripcion.addEventListener("input", () => {
        el.contador.textContent = `${el.descripcion.value.length}/500`;
        limpiarMensaje();
    });

    el.tipo.addEventListener("change", limpiarMensaje);

    modal.querySelectorAll("[data-tipo]").forEach(boton => {
        boton.addEventListener("click", () => {
            el.tipo.value = boton.dataset.tipo;
            limpiarMensaje();
            el.descripcion.focus();
        });
    });


    /* =====================================================
       EVIDENCIA
       ===================================================== */

    function mostrarArchivo(archivo) {

        if (urlMiniatura) {
            URL.revokeObjectURL(urlMiniatura);
        }

        urlMiniatura = URL.createObjectURL(archivo);

        el.miniatura.src = urlMiniatura;
        el.nombreArchivo.textContent = archivo.name;
        el.pesoArchivo.textContent = pesoLegible(archivo.size);

        el.dropVacio.hidden = true;
        el.dropLleno.hidden = false;
        el.drop.classList.add("con-archivo");
    }

    function quitarArchivo() {

        el.archivo.value = "";

        if (urlMiniatura) {
            URL.revokeObjectURL(urlMiniatura);
            urlMiniatura = null;
        }

        el.miniatura.removeAttribute("src");
        el.dropLleno.hidden = true;
        el.dropVacio.hidden = false;
        el.drop.classList.remove("con-archivo");
    }

    function validarArchivo(archivo) {

        if (!TIPOS_IMAGEN.includes(archivo.type)) {
            return "La evidencia debe ser una imagen JPG, PNG o WEBP.";
        }

        if (archivo.size > PESO_MAXIMO) {
            return "La imagen no puede superar los 5 MB.";
        }

        return null;
    }

    function elegirArchivo(archivo) {

        limpiarMensaje();

        if (!archivo) {
            quitarArchivo();
            return;
        }

        const problema = validarArchivo(archivo);

        if (problema) {
            quitarArchivo();
            mostrarMensaje(problema);
            return;
        }

        mostrarArchivo(archivo);
    }

    el.archivo.addEventListener("change", () => elegirArchivo(el.archivo.files[0]));

    el.quitar.addEventListener("click", () => {
        quitarArchivo();
        el.archivo.focus();
    });

    ["dragenter", "dragover"].forEach(nombre => {
        el.drop.addEventListener(nombre, evento => {
            evento.preventDefault();
            el.drop.classList.add("arrastrando");
        });
    });

    ["dragleave", "drop"].forEach(nombre => {
        el.drop.addEventListener(nombre, () => el.drop.classList.remove("arrastrando"));
    });

    el.drop.addEventListener("drop", evento => {

        evento.preventDefault();

        const archivo = evento.dataTransfer && evento.dataTransfer.files[0];

        if (!archivo) {
            return;
        }

        // Pasa el archivo al input para que el formulario y la validación lo vean igual.
        const lote = new DataTransfer();
        lote.items.add(archivo);
        el.archivo.files = lote.files;

        elegirArchivo(archivo);
    });


    /* =====================================================
       LIMPIAR
       ===================================================== */

    function reiniciar() {
        el.form.reset();
        el.contador.textContent = "0/500";
        ocultarSuministro();
        quitarArchivo();
        limpiarMensaje();
        enviando = false;
        el.enviar.disabled = false;
        el.limpiar.disabled = false;
        el.enviar.lastChild.textContent = " Enviar reporte";
    }

    el.limpiar.addEventListener("click", () => {
        reiniciar();
        el.codigo.focus();
    });


    /* =====================================================
       ENVIAR
       ===================================================== */

    el.form.addEventListener("submit", async evento => {

        evento.preventDefault();

        if (enviando) {
            return;
        }

        limpiarMensaje();

        if (!suministro) {
            mostrarMensaje("Primero busca y valida tu código de suministro.");
            el.codigo.focus();
            return;
        }

        if (!el.tipo.value) {
            mostrarMensaje("Selecciona el tipo de problema.");
            el.tipo.focus();
            return;
        }

        const descripcion = el.descripcion.value.trim();

        if (!descripcion) {
            mostrarMensaje("Describe el problema para que el equipo técnico pueda atenderlo.");
            el.descripcion.focus();
            return;
        }

        const archivo = el.archivo.files[0];

        if (archivo) {
            const problema = validarArchivo(archivo);
            if (problema) {
                mostrarMensaje(problema);
                return;
            }
        }

        enviando = true;
        el.enviar.disabled = true;
        el.limpiar.disabled = true;
        el.enviar.lastChild.textContent = " Enviando...";

        try {

            const cuerpo = new URLSearchParams();
            cuerpo.append("codigoSuministro", suministro.codigoSuministro);
            cuerpo.append("tipoProblema", el.tipo.value);
            cuerpo.append("descripcion", descripcion);

            const reporte = await apiFetch("/api/reportes", {
                method: "POST",
                body: cuerpo
            });

            let evidenciaGuardada = true;

            if (archivo) {
                try {
                    const datos = new FormData();
                    datos.append("archivo", archivo);
                    await apiFetch(`/api/reportes/${reporte.id}/evidencias`, {
                        method: "POST",
                        body: datos
                    });
                } catch (error) {
                    console.error("El reporte se creó, pero la evidencia no pudo guardarse:", error);
                    evidenciaGuardada = false;
                }
            }

            enviando = false;
            cerrar(true);

            const app = portal();

            app.toast(
                evidenciaGuardada
                    ? `Reporte #${reporte.id} enviado. Puedes seguir su avance en Mis reportes.`
                    : `Reporte #${reporte.id} enviado, pero no pudimos guardar la imagen.`,
                !evidenciaGuardada
            );

            await app.recargarReportes();
            app.irA("reportes");

        } catch (error) {

            console.error("Error al crear el reporte:", error);

            enviando = false;
            el.enviar.disabled = false;
            el.limpiar.disabled = false;
            el.enviar.lastChild.textContent = " Enviar reporte";

            mostrarMensaje("No se pudo enviar el reporte. Revisa tu conexión e inténtalo de nuevo.");
        }
    });


    /* =====================================================
       TECLADO, FONDO Y APERTURA
       ===================================================== */

    el.cerrar.addEventListener("click", () => cerrar());

    modal.addEventListener("mousedown", evento => {
        if (evento.target === modal) {
            cerrar();
        }
    });

    document.addEventListener("keydown", evento => {

        if (modal.hidden) {
            return;
        }

        if (evento.key === "Escape") {
            evento.preventDefault();
            cerrar();
            return;
        }

        // El foco se queda dentro de la ventana mientras está abierta.
        if (evento.key === "Tab") {

            const enfocables = [...modal.querySelectorAll(
                "button:not([disabled]), input:not([disabled]):not([type='hidden']), select, textarea, [tabindex]:not([tabindex='-1'])"
            )].filter(nodo => nodo.offsetParent !== null);

            if (!enfocables.length) {
                return;
            }

            const primero = enfocables[0];
            const ultimo = enfocables[enfocables.length - 1];

            if (evento.shiftKey && document.activeElement === primero) {
                evento.preventDefault();
                ultimo.focus();
            } else if (!evento.shiftKey && document.activeElement === ultimo) {
                evento.preventDefault();
                primero.focus();
            }
        }
    });

    document.addEventListener("click", evento => {

        const origen = evento.target.closest("[data-abrir-reporte]");

        if (!origen || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.button !== 0) {
            return;
        }

        evento.preventDefault();
        abrir(origen.dataset.codigo || "", origen);
    });

})();
