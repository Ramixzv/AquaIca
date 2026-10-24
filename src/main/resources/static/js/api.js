async function apiFetch(url, options = {}) {

    const token = localStorage.getItem("token");

    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers: headers
    });

    if (response.status === 401) {

        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("rol");

        window.location.href = "login.html";

        throw new Error("Sesión expirada");
    }

    if (response.status === 403) {

        throw new Error(
            "No tienes permisos para realizar esta operación"
        );
    }

    if (!response.ok) {

        let mensaje = "Error en la solicitud";

        try {
            const errorData = await response.json();

            if (errorData.message) {
                mensaje = errorData.message;
            }

        } catch (error) {

        }

        throw new Error(mensaje);
    }

    if (response.status === 204) {
        return null;
    }

    return await response.json();
}