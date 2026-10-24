// Cambia el header del landing según la sesión guardada por auth.js
(function () {
    // Página del portal ciudadano: cámbiala cuando exista
    const PORTAL_CIUDADANO = "portal-ciudadano.html";

    const actions = document.getElementById("navActions");
    const token = localStorage.getItem("token");
    if (!actions || !token) return;

    const rol = localStorage.getItem("rol") || "";
    const usuario = localStorage.getItem("username") || "";
    const destino = rol === "CIUDADANO" ? PORTAL_CIUDADANO : "dashboard.html";
    const texto = rol === "CIUDADANO" ? "Mi portal" : "Ir a mi panel";

    const enlace = document.createElement("a");
    enlace.href = destino;
    enlace.className = "personal-button";
    enlace.textContent = usuario ? texto + " (" + usuario + ")" : texto;

    actions.replaceChildren(enlace);
})();
