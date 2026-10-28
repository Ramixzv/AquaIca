
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const loginMessage = document.getElementById("loginMessage");
    const loginButton = loginForm.querySelector(".login-button");

    // Login tradicional con usuario y contraseña
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        loginMessage.hidden = true;
        loginMessage.textContent = "";

        loginButton.disabled = true;
        loginButton.textContent = "Iniciando sesión...";

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Usuario o contraseña incorrectos."
                );
            }

            iniciarSesionAquaIca(data, username);

        } catch (error) {
            console.error("Error de login:", error);
            mostrarMensaje(loginMessage, error.message);
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Iniciar sesión";
        }
    });
});


// Función compartida para guardar la sesión de AquaIca
function iniciarSesionAquaIca(data, usuarioAlternativo = "") {
    if (!data.token || !data.rol) {
        throw new Error("La respuesta del servidor está incompleta.");
    }

    // Solo se permite el acceso ciudadano mediante Google
    const rol = data.rol;

    if (!["CIUDADANO", "ADMIN", "SOPORTE", "TECNICO"].includes(rol)) {
        throw new Error("El rol de usuario no está reconocido.");
    }

    if (rol === "CIUDADANO" && data.clienteId == null) {
        throw new Error(
            "La cuenta ciudadana no tiene un cliente asociado."
        );
    }

    // Limpiar identificadores de una sesión anterior
    localStorage.removeItem("personalId");
    localStorage.removeItem("clienteId");

    localStorage.setItem("token", data.token);
    localStorage.setItem(
        "username",
        data.username || usuarioAlternativo
    );
    localStorage.setItem("rol", rol);

    if (data.personalId != null) {
        localStorage.setItem("personalId", data.personalId);
    }

    if (data.clienteId != null) {
        localStorage.setItem("clienteId", data.clienteId);
    }

    if (rol === "CIUDADANO") {
        window.location.href = "ciudadano.html";
    } else {
        window.location.href = "dashboard.html";
    }
}


// Función invocada por el botón de Google del login.html
window.manejarLoginGoogle = async function (credential) {
    const googleMessage = document.getElementById("googleMessage");

    googleMessage.hidden = true;
    googleMessage.textContent = "";

    try {
        if (!credential) {
            throw new Error("Google no proporcionó una credencial válida.");
        }

        const response = await fetch("/api/auth/google", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ credential })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "No se pudo iniciar sesión con Google."
            );
        }

        // Este flujo es exclusivamente para ciudadanos
        if (data.rol !== "CIUDADANO") {
            throw new Error(
                "El acceso con Google está disponible solo para ciudadanos."
            );
        }

        iniciarSesionAquaIca(data);

    } catch (error) {
        console.error("Error de login con Google:", error);
        mostrarMensaje(googleMessage, error.message);
    }
};


function mostrarMensaje(elemento, mensaje) {
    elemento.textContent = mensaje || "Ocurrió un error inesperado.";
    elemento.hidden = false;
}
