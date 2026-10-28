
let googleCredential = null;

document.addEventListener("DOMContentLoaded", () => {
    const registroForm = document.getElementById("registroForm");
    const registroMessage = document.getElementById("registroMessage");
    const registroButton = document.getElementById("registroButton");

    const googleForm = document.getElementById("googleRegistroForm");
    const googleMessage = document.getElementById("googleRegistroMessage");
    const googleSubmit = document.getElementById("googleRegistroSubmit");

    // REGISTRO TRADICIONAL: se conserva el comportamiento actual.
    registroForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const dni = document.getElementById("dni").value.trim();
        const nombreCompleto =
            document.getElementById("nombreCompleto").value.trim();
        const telefono = document.getElementById("telefono").value.trim();
        const email = document.getElementById("email").value.trim();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (!/^\d{8}$/.test(dni)) {
            mostrarMensaje(registroMessage,
                "El DNI debe contener exactamente 8 números.");
            return;
        }

        if (password !== confirmPassword) {
            mostrarMensaje(registroMessage,
                "Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 10 || password.length > 72) {
            mostrarMensaje(registroMessage,
                "La contraseña debe tener entre 10 y 72 caracteres.");
            return;
        }

        registroButton.disabled = true;
        registroButton.textContent = "Creando cuenta...";
        ocultarMensaje(registroMessage);

        try {
            const respuesta = await fetch("/api/auth/registro-ciudadano", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dni,
                    nombreCompleto,
                    telefono,
                    email,
                    username,
                    password
                })
            });

            const mensaje = await respuesta.text();

            if (!respuesta.ok) {
                throw new Error(mensaje || "No se pudo crear la cuenta.");
            }

            mostrarMensaje(registroMessage,
                "¡Cuenta creada correctamente! Ahora puedes iniciar sesión.",
                true);

            registroForm.reset();

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1800);

        } catch (error) {
            mostrarMensaje(registroMessage,
                error.message || "Error de conexión con el servidor.");
        } finally {
            registroButton.disabled = false;
            registroButton.textContent = "Crear cuenta ciudadana";
        }
    });

    // Inicializar Google Identity Services.
    const inicializarGoogle = () => {
        if (!window.google?.accounts?.id) {
            mostrarMensaje(googleMessage,
                "No se pudo cargar Google. Recarga la página e inténtalo otra vez.");
            return;
        }

        google.accounts.id.initialize({
            client_id:
                "782958105473-e0pa8e07gbjfnl4jml0cviekalqa95j9.apps.googleusercontent.com",

            callback: (response) => {
                if (!response.credential) {
                    mostrarMensaje(googleMessage,
                        "Google no devolvió una credencial válida.");
                    return;
                }

                googleCredential = response.credential;

                ocultarMensaje(googleMessage);
                googleForm.hidden = false;

                googleForm.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });

        google.accounts.id.renderButton(
            document.getElementById("googleRegistroButton"),
            {
                theme: "outline",
                size: "large",
                text: "signup_with",
                shape: "rectangular",
                width: 280
            }
        );
    };

    // El script de Google se carga de forma asíncrona.
    const esperarGoogle = () => {
        if (window.google?.accounts?.id) {
            inicializarGoogle();
        } else {
            setTimeout(esperarGoogle, 250);
        }
    };

    esperarGoogle();

    // REGISTRO CON GOOGLE.
    googleForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!googleCredential) {
            mostrarMensaje(googleMessage,
                "Primero verifica tu cuenta con Google.");
            return;
        }

        const dni = document.getElementById("googleDni").value.trim();
        const nombreCompleto =
            document.getElementById("googleNombre").value.trim();
        const telefono =
            document.getElementById("googleTelefono").value.trim();
        const username =
            document.getElementById("googleUsername").value.trim();

        if (!/^\d{8}$/.test(dni)) {
            mostrarMensaje(googleMessage,
                "El DNI debe contener exactamente 8 números.");
            return;
        }

        if (!/^[a-zA-Z0-9._-]{4,50}$/.test(username)) {
            mostrarMensaje(googleMessage,
                "El usuario debe tener entre 4 y 50 caracteres válidos.");
            return;
        }

        googleSubmit.disabled = true;
        googleSubmit.textContent = "Creando cuenta...";
        ocultarMensaje(googleMessage);

        try {
            const respuesta = await fetch("/api/auth/google/registro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    credential: googleCredential,
                    dni,
                    nombreCompleto,
                    telefono,
                    username
                })
            });

            const data = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "No se pudo crear la cuenta con Google."
                );
            }

            if (!data.token ||
                data.rol !== "CIUDADANO" ||
                data.clienteId == null) {
                throw new Error(
                    "La respuesta del servidor no contiene una sesión ciudadana válida."
                );
            }

            // Guardar el JWT propio de AquaIca, nunca el token de Google.
            localStorage.removeItem("personalId");
            localStorage.removeItem("clienteId");

            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.username || username);
            localStorage.setItem("rol", data.rol);
            localStorage.setItem("clienteId", data.clienteId);

            googleCredential = null;
            window.location.href = "ciudadano.html";

        } catch (error) {
            console.error("Error de registro con Google:", error);

            mostrarMensaje(googleMessage,
                error.message || "No se pudo conectar con el servidor.");
        } finally {
            googleSubmit.disabled = false;
            googleSubmit.textContent = "Crear cuenta con Google";
        }
    });
});

function mostrarMensaje(elemento, mensaje, exito = false) {
    elemento.textContent = mensaje;
    elemento.hidden = false;
    elemento.classList.toggle("registro-exito", exito);
}

function ocultarMensaje(elemento) {
    elemento.hidden = true;
    elemento.textContent = "";
    elemento.classList.remove("registro-exito");
}
