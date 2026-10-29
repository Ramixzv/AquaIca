/* =========================================================
   SEGUIMIENTO DE REPORTE · Portal ciudadano

   Endpoints (sin cambios en el backend):
     GET /api/reportes/publico/{id}?codigo=
     GET /api/reportes/publico/{id}/seguimientos?codigo=
     GET /api/bitacoras/publico/{id}?codigo=
     GET /api/clientes/me   (solo para mostrar el nombre en la cabecera)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    'use strict';

    const $ = id => document.getElementById(id);

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const codigo = params.get('codigo');

    function esc(valor) {
        return String(valor ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
    }

    function normalizar(valor) {
        return String(valor || '').trim().toUpperCase();
    }

    function titulo(texto) {
        return String(texto || '').toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
    }

    function fechaCorta(valor) {
        const f = new Date(valor);
        return !valor || Number.isNaN(f.getTime())
            ? '—'
            : f.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function horaCorta(valor) {
        const f = new Date(valor);
        return !valor || Number.isNaN(f.getTime())
            ? ''
            : f.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    }

    const svg = trazo => `<svg class="ico" viewBox="0 0 24 24">${trazo}</svg>`;


    /* =====================================================
       SESIÓN Y CABECERA DEL PORTAL
       ===================================================== */

    const logueado =
        !!localStorage.getItem('token') &&
        localStorage.getItem('rol') === 'CIUDADANO';

    function cerrarSesion() {
        ['token', 'username', 'rol', 'personalId', 'clienteId']
            .forEach(c => localStorage.removeItem(c));
        window.location.href = 'login.html';
    }

    function pintarUsuario(nombre) {
        $('userName').textContent = nombre;
        $('userAvatar').textContent = nombre.charAt(0).toUpperCase();
    }

    if (logueado) {

        pintarUsuario(localStorage.getItem('username') || 'Ciudadano');

        // El nombre completo viene del perfil (igual que en el portal)
        apiFetch('/api/clientes/me')
            .then(perfil => {
                if (perfil && perfil.nombreCompleto) {
                    pintarUsuario(perfil.nombreCompleto);
                }
            })
            .catch(() => { /* se queda con el usuario */ });

    } else {

        // Consulta pública sin sesión: no hay menú de usuario
        $('userMenu').hidden = true;
        $('loginLink').hidden = false;
        $('volverLink').href = codigo
            ? `mis-reportes.html?codigo=${encodeURIComponent(codigo)}`
            : 'mis-reportes.html';
    }

    // Menú móvil
    const sidebar = $('sidebar');
    const backdrop = $('backdrop');

    function cerrarMenuMovil() {
        sidebar.classList.remove('abierto');
        backdrop.classList.remove('abierto');
    }

    $('menuBtn').addEventListener('click', () => {
        sidebar.classList.add('abierto');
        backdrop.classList.add('abierto');
    });

    backdrop.addEventListener('click', cerrarMenuMovil);

    // Menú de usuario
    const botonUsuario = $('userBtn');
    const menuUsuario = $('userDropdown');

    function alternarMenuUsuario(abrir) {
        menuUsuario.classList.toggle('abierto', abrir);
        botonUsuario.setAttribute('aria-expanded', String(abrir));
    }

    botonUsuario.addEventListener('click', evento => {
        evento.stopPropagation();
        alternarMenuUsuario(!menuUsuario.classList.contains('abierto'));
    });

    menuUsuario.addEventListener('click', () => alternarMenuUsuario(false));
    document.addEventListener('click', () => alternarMenuUsuario(false));

    document.addEventListener('keydown', evento => {
        if (evento.key === 'Escape') {
            alternarMenuUsuario(false);
            cerrarMenuMovil();
        }
    });

    $('logoutBtn').addEventListener('click', cerrarSesion);


    /* =====================================================
       CATÁLOGOS
       ===================================================== */

    const TIPOS = {
        FUGA_AGUA:    { texto: 'Fuga de agua',            trazo: '<path d="M12 2.7s6 6.1 6 10.3a6 6 0 0 1-12 0c0-4.2 6-10.3 6-10.3z"/>' },
        CORTE_AGUA:   { texto: 'Corte de agua',           trazo: '<path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>' },
        BAJA_PRESION: { texto: 'Baja presión',            trazo: '<path d="M12 14l4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/>' },
        FACTURACION:  { texto: 'Problema de facturación', trazo: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>' },
        OTRO:         { texto: 'Otro problema',           trazo: '<circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>' }
    };

    // color = variable --ec del estado en el banner
    const ESTADOS = {
        PENDIENTE:   { texto: 'Pendiente',   color: '#e08a00' },
        ASIGNADO:    { texto: 'Asignado',    color: '#0a74c9' },
        EN_PROCESO:  { texto: 'En atención', color: '#0b8fb8' },
        EN_ATENCION: { texto: 'En atención', color: '#0b8fb8' },
        RESUELTO:    { texto: 'Resuelto',    color: '#14a463' },
        NO_RESUELTO: { texto: 'No resuelto', color: '#e0453f' },
        REABIERTO:   { texto: 'Reabierto',   color: '#7c4ddb' }
    };

    const PRIORIDADES = {
        ALTA:  'pill-rojo',
        MEDIA: 'pill-amarillo',
        BAJA:  'pill-verde'
    };

    // Pasos que ve el ciudadano
    const PASOS = [
        { clave: 'RECIBIDO',  texto: 'Reporte recibido',    trazo: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>' },
        { clave: 'ASIGNADO',  texto: 'Técnico asignado',    trazo: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M16 11l2 2 4-4"/>' },
        { clave: 'ATENCION',  texto: 'En atención',         trazo: '<path d="M14.7 6.3a4 4 0 0 0-5.6 5.1L4 16.5V20h3.5l5.1-5.1a4 4 0 0 0 5.1-5.6l-2.6 2.6-2-2z"/>' },
        { clave: 'RESUELTO',  texto: 'Resuelto',            trazo: '<path d="M20 6L9 17l-5-5"/>' }
    ];

    // A qué paso corresponde cada estado de seguimiento
    const PASO_DE_ESTADO = {
        PENDIENTE: 0, REPORTADO: 0, REVISADO: 0, REABIERTO: 0,
        ASIGNADO: 1, TECNICO_ASIGNADO: 1,
        EN_ATENCION: 2, TRABAJO_REALIZADO: 2,
        RESUELTO: 3, NO_RESUELTO: 3
    };

    // Estados de seguimiento para la línea de tiempo
    const AVANCES = {
        PENDIENTE:         { texto: 'Reporte recibido',     color: 'sg-c-azul',    trazo: PASOS[0].trazo },
        REPORTADO:         { texto: 'Reporte recibido',     color: 'sg-c-azul',    trazo: PASOS[0].trazo },
        REVISADO:          { texto: 'Reporte revisado',     color: 'sg-c-celeste', trazo: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>' },
        ASIGNADO:          { texto: 'Técnico asignado',     color: 'sg-c-azul',    trazo: PASOS[1].trazo },
        TECNICO_ASIGNADO:  { texto: 'Técnico asignado',     color: 'sg-c-azul',    trazo: PASOS[1].trazo },
        EN_ATENCION:       { texto: 'Técnico en atención',  color: 'sg-c-celeste', trazo: PASOS[2].trazo },
        TRABAJO_REALIZADO: { texto: 'Trabajo realizado',    color: 'sg-c-morado',  trazo: '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>' },
        RESUELTO:          { texto: 'Reporte resuelto',     color: 'sg-c-verde',   trazo: PASOS[3].trazo },
        NO_RESUELTO:       { texto: 'Problema no resuelto', color: 'sg-c-rojo',    trazo: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>' },
        REABIERTO:         { texto: 'Caso reabierto',       color: 'sg-c-morado',  trazo: '<path d="M3 12a9 9 0 1 1 3 6.7"/><path d="M3 21v-6h6"/>' }
    };

    const AVANCE_BITACORA = {
        texto: 'Actualización del técnico',
        color: 'sg-c-gris',
        trazo: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'
    };

    function tipoInfo(tipo) {
        return TIPOS[normalizar(tipo)] || {
            texto: titulo(String(tipo || '-').replaceAll('_', ' ')),
            trazo: '<circle cx="12" cy="12" r="9"/>'
        };
    }

    function estadoInfo(estado) {
        return ESTADOS[normalizar(estado)] || {
            texto: titulo(String(estado || '-').replaceAll('_', ' ')),
            color: '#5d7184'
        };
    }

    function avanceInfo(estado) {
        return AVANCES[normalizar(estado)] || {
            texto: titulo(String(estado || 'Actualización').replaceAll('_', ' ')),
            color: 'sg-c-azul',
            trazo: '<circle cx="12" cy="12" r="4"/>'
        };
    }


    /* =====================================================
       CARGA
       ===================================================== */

    const cargando = $('segCargando');
    const error = $('segError');
    const contenido = $('segContenido');

    function mostrarError() {
        cargando.hidden = true;
        contenido.hidden = true;
        error.hidden = false;
    }

    if (!id || !codigo) {
        mostrarError();
        return;
    }

    fetch(`/api/reportes/publico/${encodeURIComponent(id)}?codigo=${encodeURIComponent(codigo)}`)
        .then(res => {
            if (!res.ok) throw new Error('No encontrado');
            return res.json();
        })
        .then(reporte => {
            mostrarReporte(reporte);
            cargarAvances(reporte);
        })
        .catch(mostrarError);


    /* =====================================================
       REPORTE
       ===================================================== */

    function mostrarReporte(reporte) {

        const tipo = tipoInfo(reporte.tipoProblema);
        const estado = estadoInfo(reporte.estado);

        $('segNumero').textContent = `Reporte #${reporte.reporteId}`;
        $('segTipoProblema').textContent = tipo.texto;
        $('segIcono').innerHTML = svg(tipo.trazo);
        $('segSubtitulo').textContent =
            `Registrado el ${fechaCorta(reporte.fechaCreacion)}` +
            (horaCorta(reporte.fechaCreacion) ? ` · ${horaCorta(reporte.fechaCreacion)}` : '');

        const insignia = $('segEstadoBadge');
        insignia.style.setProperty('--ec', estado.color);
        insignia.querySelector('b').textContent = estado.texto;

        $('segTipoDetalle').textContent = tipo.texto;
        $('segDireccion').textContent = reporte.direccion || '—';
        $('segCodigo').textContent = reporte.codigoSuministro || codigo;
        $('segDescripcion').textContent = reporte.descripcion || 'Sin descripción';
        $('segFecha').textContent =
            `${fechaCorta(reporte.fechaCreacion)}${horaCorta(reporte.fechaCreacion) ? ' · ' + horaCorta(reporte.fechaCreacion) : ''}`;

        const prioridad = $('segPrioridad');
        prioridad.textContent = reporte.prioridad ? titulo(reporte.prioridad) : '—';
        prioridad.className = `pill ${PRIORIDADES[normalizar(reporte.prioridad)] || 'pill-gris'}`;

        cargando.hidden = true;
        contenido.hidden = false;

        // Se pinta con lo que ya se sabe; luego se afina con los seguimientos
        pintarPasos(reporte, []);
    }


    /* =====================================================
       PASOS DE AVANCE
       ===================================================== */

    function pintarPasos(reporte, seguimientos) {

        const estado = normalizar(reporte.estado);

        // Paso alcanzado según el estado del reporte
        const porEstado = {
            PENDIENTE: 0, REABIERTO: 0,
            ASIGNADO: 1, EN_PROCESO: 1,
            EN_ATENCION: 2,
            RESUELTO: 3, NO_RESUELTO: 3
        }[estado];

        // Último paso informado por los seguimientos
        const ordenados = [...seguimientos].sort(
            (a, b) => new Date(a.fechaCreacion) - new Date(b.fechaCreacion)
        );

        const ultimoSeg = ordenados.length
            ? (PASO_DE_ESTADO[normalizar(ordenados[ordenados.length - 1].estado)] ?? 0)
            : 0;

        let alcanzado;

        if (['PENDIENTE', 'REABIERTO', 'RESUELTO', 'NO_RESUELTO'].includes(estado)) {
            alcanzado = porEstado;
        } else {
            alcanzado = Math.max(porEstado ?? 0, ultimoSeg);
        }

        const noResuelto = estado === 'NO_RESUELTO';
        const resuelto = estado === 'RESUELTO';

        // Fecha de cada paso (la más reciente de ese paso)
        const fechas = [reporte.fechaCreacion, null, null, null];

        ordenados.forEach(s => {
            const paso = PASO_DE_ESTADO[normalizar(s.estado)];
            if (paso != null && paso > 0) fechas[paso] = s.fechaCreacion;
        });

        $('segPasos').innerHTML = PASOS.map((paso, indice) => {

            let clase = 'pendiente';
            let texto = paso.texto;
            let trazo = paso.trazo;

            if (indice < alcanzado) {
                clase = 'hecho';
            } else if (indice === alcanzado) {
                clase = resuelto && indice === 3 ? 'completo' : 'actual';
            }

            if (indice === 3 && noResuelto) {
                clase = 'error';
                texto = 'No resuelto';
                trazo = AVANCES.NO_RESUELTO.trazo;
            }

            const fecha = indice <= alcanzado && fechas[indice]
                ? fechaCorta(fechas[indice])
                : '';

            return `
                <li class="sg-paso ${clase}">
                    <span class="sg-paso-punto">${svg(clase === 'hecho' ? '<path d="M20 6L9 17l-5-5"/>' : trazo)}</span>
                    <strong>${esc(texto)}</strong>
                    <small>${esc(fecha)}</small>
                </li>`;
        }).join('');

        const frase = {
            0: 'Recibimos tu reporte y pronto será atendido.',
            1: 'Ya hay un técnico asignado a tu reporte.',
            2: 'Un técnico está atendiendo tu incidencia.',
            3: noResuelto
                ? 'No pudimos resolverlo todavía. Revisaremos tu caso.'
                : 'Tu incidencia fue resuelta. ¡Gracias por avisarnos!'
        }[alcanzado] || '';

        $('segAvanceTexto').textContent = frase;
    }


    /* =====================================================
       LÍNEA DE TIEMPO
       ===================================================== */

    function cargarAvances(reporte) {

        Promise.all([

            fetch(`/api/reportes/publico/${encodeURIComponent(id)}/seguimientos?codigo=${encodeURIComponent(codigo)}`)
                .then(res => res.ok ? res.json() : []),

            fetch(`/api/bitacoras/publico/${encodeURIComponent(id)}?codigo=${encodeURIComponent(codigo)}`)
                .then(res => res.ok ? res.json() : [])

        ])
            .then(([seguimientos, bitacoras]) => {
                pintarPasos(reporte, seguimientos || []);
                mostrarTimeline(seguimientos || [], bitacoras || []);
            })
            .catch(() => mostrarTimeline([], []));
    }

    function mostrarTimeline(seguimientos, bitacoras) {

        const contenedor = $('segTimeline');

        const eventos = [

            ...seguimientos.map(s => ({
                tipo: 'SEGUIMIENTO',
                fechaCreacion: s.fechaCreacion,
                estado: s.estado,
                texto: s.comentario,
                quien: s.nombrePersonal || s.personalNombre
            })),

            ...bitacoras.map(b => ({
                tipo: 'BITACORA',
                fechaCreacion: b.fechaCreacion,
                texto: b.descripcion,
                quien: b.personalNombre
            }))
        ];

        if (eventos.length === 0) {
            contenedor.innerHTML =
                '<div class="sg-vacio-tl">Aún no hay actualizaciones registradas para este reporte.</div>';
            return;
        }

        // Orden cronológico: lo más antiguo primero
        const ordenados = eventos.sort(
            (a, b) => new Date(a.fechaCreacion) - new Date(b.fechaCreacion)
        );

        contenedor.innerHTML = `<ol class="sg-timeline">${
            ordenados.map((evento, indice) => {

                const info = evento.tipo === 'BITACORA' ? AVANCE_BITACORA : avanceInfo(evento.estado);
                const actual = indice === ordenados.length - 1;

                return `
                    <li class="sg-tl-item ${info.color} ${actual ? 'actual' : ''}">
                        <span class="sg-tl-punto">${svg(info.trazo)}</span>
                        <div class="sg-tl-card">
                            <div class="sg-tl-top">
                                <strong>${esc(info.texto)}${actual ? '<span class="sg-tl-tag">Actual</span>' : ''}</strong>
                                <time>${esc(fechaCorta(evento.fechaCreacion))} · ${esc(horaCorta(evento.fechaCreacion))}</time>
                            </div>
                            ${evento.texto ? `<p>${esc(evento.texto)}</p>` : ''}
                            ${evento.quien
                                ? `<span class="sg-tl-quien"><b>${esc(String(evento.quien).charAt(0).toUpperCase())}</b>${esc(evento.quien)}</span>`
                                : ''}
                        </div>
                    </li>`;
            }).join('')
        }</ol>`;
    }

});