// Tarifas: ADMIN y SOPORTE consultan; solo ADMIN crea
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || "Usuario";
  const rol = localStorage.getItem("rol") || "Usuario";
  if (!token) { window.location.href = "login.html"; return; }
  if (!["ADMIN", "SOPORTE"].includes(rol)) { window.location.href = "dashboard.html"; return; }

  const $ = id => document.getElementById(id);
  $("usernameDisplay").textContent = username;
  $("roleDisplay").textContent = rol;
  $("userAvatar").textContent = username.charAt(0).toUpperCase();
  const avatarClassPorRol = {
    ADMIN: "avatar-admin",
    SOPORTE: "avatar-soporte",
    TECNICO: "avatar-tecnico",
    CIUDADANO: "avatar-ciudadano"
  };
  $("userAvatar").classList.add(avatarClassPorRol[rol] || "avatar-admin");
  $("logoutButton").addEventListener("click", () => {
    ["token", "username", "rol", "personalId", "clienteId"].forEach(k => localStorage.removeItem(k));
    window.location.href = "login.html";
  });

  $("logoutMenu")?.addEventListener("click", () => {
    ["token", "username", "rol", "personalId", "clienteId"].forEach(k => localStorage.removeItem(k));
    window.location.href = "login.html";
  });
  function cerrarMenusTarifas() {
    document.querySelectorAll(".dp-menu.abierto").forEach(menu => menu.classList.remove("abierto"));
    document.querySelectorAll(".dp-acciones [aria-expanded='true']").forEach(button => button.setAttribute("aria-expanded", "false"));
  }
  [["usuarioBtn", "usuarioMenu"], ["campanaBtn", "campanaMenu"]].forEach(([buttonId, menuId]) => {
    const button = $(buttonId), menu = $(menuId);
    if (!button || !menu) return;
    button.addEventListener("click", event => {
      event.stopPropagation();
      const open = !menu.classList.contains("abierto");
      cerrarMenusTarifas();
      menu.classList.toggle("abierto", open);
      button.setAttribute("aria-expanded", String(open));
    });
  });
  document.addEventListener("click", cerrarMenusTarifas);
  document.addEventListener("keydown", event => { if (event.key === "Escape") cerrarMenusTarifas(); });


  const CAT = { DOMESTICO: "Doméstico", COMERCIAL: "Comercial" };
  const esc = v => { const e = document.createElement("span"); e.textContent = v ?? ""; return e.innerHTML; };
  const soles = v => "S/ " + Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  const fecha = v => v ? new Date(String(v).slice(0, 10) + "T00:00:00").toLocaleDateString("es-PE") : "—";
  const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  let timer;

  function toast(mensaje, error = false) {
    const t = $("clientesToast");
    t.textContent = mensaje; t.classList.toggle("error", error); t.classList.add("show");
    clearTimeout(timer); timer = setTimeout(() => t.classList.remove("show"), 3500);
  }

  if (rol === "ADMIN") { $("tarFormCard").hidden = false; $("tarDesde").min = hoy(); $("tarDesde").value = hoy(); }

  async function cargar() {
    try {
      const lista = await apiFetch("/api/tarifas");
      const tarifas = Array.isArray(lista) ? lista : [];

      $("tarCards").innerHTML = Object.keys(CAT).map(c => {
        const t = tarifas.find(x => x.categoria === c && x.vigente);
        const clase = c === "COMERCIAL" ? " comercial" : "";
        return t
          ? `<article class="tar-card${clase}"><h3>${CAT[c]} · vigente</h3><strong>${soles(t.cargoFijo)}</strong><small>cargo fijo mensual</small><strong>${soles(t.precioM3)} por m³</strong><small>desde el ${fecha(t.vigenteDesde)}</small></article>`
          : `<article class="tar-card vacia"><h3>${CAT[c]}</h3><strong>Sin tarifa vigente</strong><small>No se podrán generar recibos de esta categoría.</small></article>`;
      }).join("");

      $("tarTabla").innerHTML = tarifas.length ? tarifas.map(t => `
        <tr>
          <td>${CAT[t.categoria] || esc(t.categoria)}</td>
          <td>${soles(t.cargoFijo)}</td>
          <td>${soles(t.precioM3)}</td>
          <td>${fecha(t.vigenteDesde)}</td>
          <td>${t.vigente ? '<span class="sol-badge e-ACTIVADA">Vigente</span>' : '<span class="sol-badge e-CANCELADA">Histórica / futura</span>'}</td>
          <td>${esc(t.creadaPor || "—")}</td>
        </tr>`).join("") : `<tr><td colspan="6" class="clientes-vacio">Todavía no hay tarifas. Crea la primera de cada categoría.</td></tr>`;
    } catch (e) {
      $("tarCards").innerHTML = `<p class="sol-nota">${esc(e.message)}</p>`;
    }
  }

  $("tarForm").addEventListener("submit", async e => {
    e.preventDefault();
    const err = $("tarError"); err.textContent = "";
    const b = e.target.querySelector("button"); b.disabled = true;
    try {
      await apiFetch("/api/tarifas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria: $("tarCategoria").value, cargoFijo: Number($("tarFijo").value), precioM3: Number($("tarPrecio").value), vigenteDesde: $("tarDesde").value })
      });
      toast("Tarifa guardada.");
      $("tarFijo").value = ""; $("tarPrecio").value = "";
      cargar();
    } catch (x) { err.textContent = x.message; }
    finally { b.disabled = false; }
  });

  cargar();
});
