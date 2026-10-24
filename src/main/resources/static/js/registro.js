
const registroForm = document.getElementById("registroForm");
const registroMessage = document.getElementById("registroMessage");
const registroButton = document.getElementById("registroButton");

registroForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const dni = document.getElementById("dni").value.trim();
    const nombreCompleto = document.getElementById("nombreCompleto").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const email = document.getElementById("email").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!/^\d{8}$/.test(dni)) {
        mostrarMensaje("El DNI debe contener exactamente 8 números.");
        return;
    }

    if (password !== confirmPassword) {
        mostrarMensaje("Las contraseñas no coinciden.");
        return;
    }

    if (password.length < 10 || password.length > 72) {
        mostrarMensaje("La contraseña debe tener entre 10 y 72 caracteres.");
        return;
    }

    registroButton.disabled = true;
    registroButton.textContent = "Creando cuenta...";

    try {
        const respuesta = await fetch("/api/auth/registro-ciudadano", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
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

        registroMessage.hidden = false;
        registroMessage.classList.add("registro-exito");
        registroMessage.textContent =
            "¡Cuenta creada correctamente! Ahora puedes iniciar sesión.";

        registroForm.reset();

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1800);

    } catch (error) {
        mostrarMensaje(error.message || "Error de conexión con el servidor.");
    } finally {
        registroButton.disabled = false;
        registroButton.textContent = "Crear cuenta ciudadana";
    }
});

function mostrarMensaje(mensaje) {
    registroMessage.hidden = false;
    registroMessage.classList.remove("registro-exito");
    registroMessage.textContent = mensaje;
}
