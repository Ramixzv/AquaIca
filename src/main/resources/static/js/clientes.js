document.addEventListener("DOMContentLoaded", () => {

  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || "Usuario";
  const rol = localStorage.getItem("rol") || "Usuario";

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  if (!['ADMIN', 'SOPORTE'].includes(rol)) {
    window.location.href = "dashboard.html";
    return;
  }

  document.getElementById("usernameDisplay").textContent = username;
  document.getElementById("roleDisplay").textContent = rol;
  document.getElementById("userAvatar").textContent = username.charAt(0).toUpperCase();

  document.getElementById("logoutButton").addEventListener("click", () => {
    ["token", "username", "rol", "personalId", "clienteId"].forEach(k => localStorage.removeItem(k));
    window.location.href = "login.html";
  });

  // Menú de usuario y campanita compartidos con el Dashboard.
  const cerrarSesionMenu = () => {
    ["token", "username", "rol", "personalId", "clienteId"].forEach(k => localStorage.removeItem(k));
    window.location.href = "login.html";
  };
  document.getElementById("logoutMenu")?.addEventListener("click", cerrarSesionMenu);

  function cerrarMenusCabecera() {
    document.querySelectorAll(".dp-menu.abierto").forEach(menu => menu.classList.remove("abierto"));
    document.querySelectorAll(".dp-acciones [aria-expanded='true']").forEach(boton => boton.setAttribute("aria-expanded", "false"));
  }
  [["usuarioBtn", "usuarioMenu"], ["campanaBtn", "campanaMenu"]].forEach(([botonId, menuId]) => {
    const boton = document.getElementById(botonId);
    const menu = document.getElementById(menuId);
    if (!boton || !menu) return;
    boton.addEventListener("click", evento => {
      evento.stopPropagation();
      const abrir = !menu.classList.contains("abierto");
      cerrarMenusCabecera();
      menu.classList.toggle("abierto", abrir);
      boton.setAttribute("aria-expanded", String(abrir));
    });
  });
  document.addEventListener("click", cerrarMenusCabecera);
  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") cerrarMenusCabecera();
  });

  const $ = id => document.getElementById(id);
  const tabla = $("clientesTable");
  const modal = $("clienteModal");
  const form = $("clienteForm");
  const error = $("formError");
  const guardar = $("guardarCliente");

  let clientes = [];
  let toastTimer;

  // Iconos SVG
  const iconEdit = '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  const iconBlock = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>';
  const iconCheck = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>';

  function escapeHtml(value) {
    const el = document.createElement('span');
    el.textContent = value ?? '';
    return el.innerHTML;
  }

  function avatarGradient(name) {
    const colors = [
      ['#0077b6', '#00a6d6'],
      ['#14b8a6', '#0ea5b7'],
      ['#7c3aed', '#a78bfa'],
      ['#059669', '#10b981'],
      ['#ec4899', '#f472b6']
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = colors[Math.abs(hash) % colors.length];
    return `linear-gradient(135deg,${c[0]},${c[1]})`;
  }

  function toast(message, isError = false) {
    const el = $("clientesToast");
    el.textContent = message;
    el.classList.toggle('error', isError);
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PE');
  }

  async function loadClients() {
    try {
      const result = await apiFetch('/api/clientes');
      clientes = Array.isArray(result) ? result : [];
      updateStats();
      render();
    } catch (e) {
      tabla.innerHTML = `<tr><td colspan="7" class="clientes-vacio">${escapeHtml(e.message)}</td></tr>`;
    }
  }

  function updateStats() {
    $('statTotal').textContent = clientes.length;
    $('statActivos').textContent = clientes.filter(c => c.titularVerificado === true).length;
    $('statInactivos').textContent = clientes.filter(c => c.titularVerificado !== true).length;
    $('statCorreo').textContent = clientes.filter(c => c.tieneUsuario === true).length;
  }

  function render() {
    const q = $('buscarCliente').value.trim().toLowerCase();
    const state = $('filtroEstado').value;

    const filtered = clientes.filter(c => 
      (!q || (c.nombreCompleto || '').toLowerCase().includes(q) || (c.dni || '').includes(q)) &&
      (!state || c.estado === state)
    );

    if (!filtered.length) {
      tabla.innerHTML = '<tr><td colspan="7" class="clientes-vacio">No se encontraron clientes con esos criterios.</td></tr>';
      return;
    }

    tabla.innerHTML = filtered.map(c => {
      const active = c.estado === 'ACTIVO';
      return `
        <tr>
          <td>
            <div class="cliente-persona">
              <div class="cliente-avatar" style="background:${avatarGradient(c.nombreCompleto || 'C')}">
                ${escapeHtml((c.nombreCompleto || 'C').charAt(0).toUpperCase())}
              </div>
              <div>
                <strong>${escapeHtml(c.nombreCompleto)}</strong>
                <small>Cliente #${c.id}</small>
              </div>
            </div>
          </td>
          <td>${escapeHtml(c.dni)}</td>
          <td>${escapeHtml(c.telefono || '—')}</td>
          <td>${escapeHtml(c.email || '—')}</td>
          <td>${formatDate(c.fechaRegistro)}</td>
          <td><span class="cliente-estado ${active ? 'activo' : 'inactivo'}">${active ? 'Activo' : 'Inactivo'}</span></td>
          <td>
            <div class="cliente-acciones">
              <button class="cliente-btn-icon" title="Editar" aria-label="Editar cliente" data-action="edit" data-id="${c.id}">${iconEdit}</button>
              <button class="cliente-btn-icon ${active ? 'peligro' : 'exito'}" title="${active ? 'Desactivar' : 'Activar'}" aria-label="${active ? 'Desactivar' : 'Activar'} cliente" data-action="toggle" data-id="${c.id}">${active ? iconBlock : iconCheck}</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function openModal(client = null) {
    form.reset();
    error.textContent = '';
    $('clienteId').value = client ? client.id : '';
    
    const editing = !!client;
    $('modalKicker').textContent = editing ? 'Edición' : 'Nuevo registro';
    $('modalTitulo').textContent = editing ? 'Editar cliente' : 'Nuevo cliente';
    $('estadoField').hidden = !editing;

    if (client) {
      $('nombreCompleto').value = client.nombreCompleto || '';
      $('dni').value = client.dni || '';
      $('telefono').value = client.telefono || '';
      $('email').value = client.email || '';
      $('estado').value = client.estado || 'ACTIVO';
    }

    modal.classList.add('show');
    $('nombreCompleto').focus();
  }

  function closeModal() {
    modal.classList.remove('show');
  }

  $('nuevoClienteButton').addEventListener('click', () => openModal());
  $('cerrarModal').addEventListener('click', closeModal);
  $('cancelarModal').addEventListener('click', closeModal);
  
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  $('dni').addEventListener('input', () => {
    $('dni').value = $('dni').value.replace(/\D/g, '').slice(0, 8);
  });

  $('telefono').addEventListener('input', () => {
    $('telefono').value = $('telefono').value.replace(/\D/g, '').slice(0, 15);
  });

  $('buscarCliente').addEventListener('input', render);
  $('filtroEstado').addEventListener('change', render);

  // Acciones de la tabla (Editar / Toggle Estado)
  tabla.addEventListener('click', async e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const client = clientes.find(c => String(c.id) === btn.dataset.id);
    if (!client) return;

    if (btn.dataset.action === 'edit') {
      openModal(client);
      return;
    }

    const next = client.estado === 'ACTIVO' ? 'desactivar' : 'activar';
    if (!confirm(`¿Deseas ${next} al cliente ${client.nombreCompleto}?`)) return;

    try {
      await apiFetch(`/api/clientes/${client.id}`, { method: 'DELETE' });
      toast(`Cliente ${next === 'activar' ? 'activado' : 'desactivado'} correctamente`);
      await loadClients();
    } catch (err) {
      toast(err.message, true);
    }
  });

  // Envío del formulario
  form.addEventListener('submit', async e => {
    e.preventDefault();
    error.textContent = '';

    const id = $('clienteId').value;
    const data = {
      nombreCompleto: $('nombreCompleto').value.trim(),
      dni: $('dni').value.trim(),
      telefono: $('telefono').value.trim(),
      email: $('email').value.trim()
    };

    if (id) data.estado = $('estado').value;

    if (!/^\d{8}$/.test(data.dni)) {
      error.textContent = 'El DNI debe tener exactamente 8 dígitos.';
      return;
    }

    if (data.telefono && !/^\d{7,15}$/.test(data.telefono)) {
      error.textContent = 'El teléfono debe tener entre 7 y 15 dígitos.';
      return;
    }

    guardar.disabled = true;
    guardar.textContent = 'Guardando...';

    try {
      await apiFetch(id ? `/api/clientes/${id}` : '/api/clientes', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      closeModal();
      toast(id ? 'Cliente actualizado correctamente' : 'Cliente registrado correctamente');
      await loadClients();
    } catch (err) {
      error.textContent = err.message;
    } finally {
      guardar.disabled = false;
      guardar.textContent = 'Guardar cliente';
    }
  });

  // Inicialización
  loadClients();
});