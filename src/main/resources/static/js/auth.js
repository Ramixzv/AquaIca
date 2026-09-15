document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const loginMessage = document.getElementById("loginMessage");
    const loginButton = loginForm.querySelector(".login-button");

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

                body: JSON.stringify({
                    username: username,
                    password: password
                })

            });

            const data = await response.json();

            
            if (!response.ok) {

                throw new Error(
                    data.message || "Usuario o contraseña incorrectos"
                );

            }

            
            localStorage.setItem("token", data.token);

            
            if (data.username) {
                localStorage.setItem("username", data.username);
            }

            if (data.rol) {
                localStorage.setItem("rol", data.rol);
            }

            if (data.personalId) {
                localStorage.setItem("personalId", data.personalId);
            }

            console.log("Login exitoso");
            console.log("Token recibido correctamente");

           
            window.location.href = "dashboard.html";

        } catch (error) {

            console.error("Error de login:", error);

            loginMessage.textContent = error.message;

            loginMessage.hidden = false;

        } finally {

            loginButton.disabled = false;
            loginButton.textContent = "Iniciar sesión";

        }

    });

});