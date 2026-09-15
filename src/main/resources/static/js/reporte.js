document.addEventListener("DOMContentLoaded", () => {

    const formulario =
        document.getElementById("reporteForm");

    const mensaje =
        document.getElementById("reporteMensaje");

    const codigoInput =
        document.getElementById("codigoSuministro");

    const buscarButton =
        document.getElementById("buscarSuministro");

    const datosSuministro =
        document.getElementById("datosSuministro");

    const titularSuministro =
        document.getElementById("titularSuministro");

    const dniSuministro =
        document.getElementById("dniSuministro");

    const direccionSuministro =
        document.getElementById("direccionSuministro");

    const evidenciaInput =
        document.getElementById("evidencia");


    let suministroEncontrado = false;

    buscarButton.addEventListener("click", async () => {

        const codigo =
            codigoInput.value.trim();


        if (!codigo) {

            mostrarMensaje(
                "Ingresa un código de suministro.",
                "error"
            );

            return;
        }


        buscarButton.disabled = true;

        buscarButton.textContent =
            "Buscando...";


        try {

            const respuesta = await fetch(
                `/api/suministros/${encodeURIComponent(codigo)}`
            );


            if (respuesta.status === 404) {

                suministroEncontrado = false;

                datosSuministro.style.display =
                    "none";

                mostrarMensaje(
                    "No encontramos un suministro asociado a ese código.",
                    "error"
                );

                return;
            }


            if (!respuesta.ok) {

                throw new Error(
                    "Error al consultar el suministro"
                );
            }


            const suministro =
                await respuesta.json();


            console.log(
                "Suministro encontrado:",
                suministro
            );


            titularSuministro.textContent =
                suministro.nombreTitular ?? "-";

            dniSuministro.textContent =
                suministro.dni ?? "-";

            direccionSuministro.textContent =
                suministro.direccion ?? "-";


            datosSuministro.style.display =
                "block";


            suministroEncontrado = true;


            mostrarMensaje(
                "Suministro validado correctamente.",
                "success"
            );


        } catch (error) {

            console.error(
                "Error al buscar suministro:",
                error
            );


            suministroEncontrado = false;

            datosSuministro.style.display =
                "none";


            mostrarMensaje(
                "No se pudo consultar el suministro.",
                "error"
            );


        } finally {

            buscarButton.disabled = false;

            buscarButton.textContent =
                "Buscar";
        }

    });


    codigoInput.addEventListener("input", () => {

        suministroEncontrado = false;

        datosSuministro.style.display =
            "none";

        limpiarMensaje();

    });


    formulario.addEventListener("submit", async (event) => {

        event.preventDefault();


        const codigoSuministro =
            codigoInput.value.trim();

        const tipoProblema =
            document.getElementById("tipoProblema").value;

        const descripcion =
            document.getElementById("descripcion")
                .value
                .trim();


        const archivo =
            evidenciaInput.files[0];

        if (!codigoSuministro ||
            !tipoProblema ||
            !descripcion) {

            mostrarMensaje(
                "Completa todos los campos.",
                "error"
            );

            return;
        }


        if (!suministroEncontrado) {

            mostrarMensaje(
                "Primero debes validar tu código de suministro.",
                "error"
            );

            return;
        }

        if (archivo) {

            const tiposPermitidos = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];


            if (!tiposPermitidos.includes(
                archivo.type
            )) {

                mostrarMensaje(
                    "La evidencia debe ser una imagen JPG, PNG o WEBP.",
                    "error"
                );

                return;
            }


            const tamañoMaximo =
                5 * 1024 * 1024;


            if (archivo.size > tamañoMaximo) {

                mostrarMensaje(
                    "La imagen no puede superar los 5 MB.",
                    "error"
                );

                return;
            }
        }


        const boton =
            formulario.querySelector(
                "button[type='submit']"
            );


        boton.disabled = true;

        boton.textContent =
            "Enviando...";


        try {

            const formData =
                new URLSearchParams();


            formData.append(
                "codigoSuministro",
                codigoSuministro
            );


            formData.append(
                "tipoProblema",
                tipoProblema
            );


            formData.append(
                "descripcion",
                descripcion
            );


            const respuesta =
                await fetch(
                    "/api/reportes",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/x-www-form-urlencoded"
                        },

                        body: formData
                    }
                );


            if (!respuesta.ok) {

                const textoError =
                    await respuesta.text();


                console.error(
                    "Error del servidor:",
                    textoError
                );


                mostrarMensaje(
                    "No se pudo registrar el reporte.",
                    "error"
                );

                return;
            }


            const reporte =
                await respuesta.json();


            console.log(
                "Reporte creado:",
                reporte
            );

            if (archivo) {

                const evidenciaData =
                    new FormData();


                evidenciaData.append(
                    "archivo",
                    archivo
                );


                const respuestaEvidencia =
                    await fetch(
                        `/api/reportes/${reporte.id}/evidencias`,
                        {
                            method: "POST",

                            body: evidenciaData
                        }
                    );


                if (!respuestaEvidencia.ok) {

                    console.error(
                        "El reporte se creó, pero la evidencia no pudo guardarse."
                    );


                    mostrarMensaje(
                        `Reporte #${reporte.id} registrado, pero no se pudo guardar la evidencia.`,
                        "error"
                    );

                    return;
                }


                console.log(
                    "Evidencia guardada correctamente."
                );
            }

            mostrarMensaje(
                `Reporte registrado correctamente. Código: #${reporte.id}`,
                "success"
            );


            formulario.reset();


            datosSuministro.style.display =
                "none";


            suministroEncontrado = false;


        } catch (error) {

            console.error(
                "Error al crear reporte:",
                error
            );


            mostrarMensaje(
                "No se pudo conectar con AquaIca.",
                "error"
            );


        } finally {

            boton.disabled = false;

            boton.textContent =
                "Enviar reporte";
        }

    });


    function mostrarMensaje(texto, tipo) {

        mensaje.textContent =
            texto;

        mensaje.className =
            `reporte-mensaje ${tipo}`;
    }


    function limpiarMensaje() {

        mensaje.textContent =
            "";

        mensaje.className =
            "reporte-mensaje";
    }

});