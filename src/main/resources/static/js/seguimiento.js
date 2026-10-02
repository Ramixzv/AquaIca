document.addEventListener('DOMContentLoaded', () => {

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const codigo = params.get('codigo');

    const volverLink = document.getElementById('volverLink');
    volverLink.href = codigo
        ? `mis-reportes.html?codigo=${encodeURIComponent(codigo)}`
        : 'mis-reportes.html';

    const cargando = document.getElementById('segCargando');
    const error = document.getElementById('segError');
    const contenido = document.getElementById('segContenido');

    if (!id || !codigo) {
        mostrarError();
        return;
    }

    fetch(`/api/reportes/publico/${id}?codigo=${encodeURIComponent(codigo)}`)
        .then(res => {
            if (!res.ok) throw new Error('No encontrado');
            return res.json();
        })
        .then(mostrarReporte)
        .catch(mostrarError);

    function mostrarReporte(reporte) {
        document.getElementById('segNumero').textContent = `REPORTE #${reporte.reporteId}`;
        document.getElementById('segTipoProblema').textContent = reporte.tipoProblema;
        document.getElementById('segPrioridad').textContent = reporte.prioridad;
        document.getElementById('segDireccion').textContent = reporte.direccion;
        document.getElementById('segDescripcion').textContent = reporte.descripcion;

        const fecha = new Date(reporte.fechaCreacion);
        document.getElementById('segFecha').textContent = fecha.toLocaleDateString('es-PE');

        const badge = document.getElementById('segEstadoBadge');
        badge.textContent = formatearEstado(reporte.estado);
        badge.className = 'estado-badge ' + claseEstado(reporte.estado);

        cargando.style.display = 'none';
        cargarTimeline(id, codigo);
        contenido.style.display = 'block';
    }

    function mostrarError() {
        cargando.style.display = 'none';
        error.style.display = 'block';
    }

    function formatearEstado(estado) {
        const mapa = {
            PENDIENTE: 'Pendiente',
            EN_PROCESO: 'En proceso',
            RESUELTO: 'Resuelto',
            NO_RESUELTO: 'No resuelto'
        };
        return mapa[estado] || estado;
    }

    function claseEstado(estado) {
        const mapa = {
            PENDIENTE: 'estado-pendiente',
            EN_PROCESO: 'estado-proceso',
            RESUELTO: 'estado-resuelto',
            NO_RESUELTO: 'estado-no-resuelto'
        };
        return mapa[estado] || 'estado-default';
  
    }

    function cargarTimeline(id, codigo) {

    Promise.all([

        fetch(
            `/api/reportes/publico/${id}/seguimientos?codigo=${encodeURIComponent(codigo)}`
        )
            .then(res => res.ok ? res.json() : []),

        fetch(
            `/api/bitacoras/publico/${id}?codigo=${encodeURIComponent(codigo)}`
        )
            .then(res => res.ok ? res.json() : [])

    ])
        .then(([seguimientos, bitacoras]) => {

            mostrarTimeline(
                seguimientos,
                bitacoras
            );

        })
        .catch(() => {

            mostrarTimeline([], []);

        });
}

function mostrarTimeline(seguimientos, bitacoras) {

    const seccion = document.getElementById('segTimelineSection');
    const contenedor = document.getElementById('segTimeline');

        const eventosSeguimiento = (seguimientos || []).map(item => ({
        tipo: 'SEGUIMIENTO',
        fechaCreacion: item.fechaCreacion,
        estado: item.estado,
        comentario: item.comentario,
        personalNombre: item.personalNombre
    }));

    const eventosBitacora = (bitacoras || []).map(item => ({
        tipo: 'BITACORA',
        fechaCreacion: item.fechaCreacion,
        descripcion: item.descripcion,
        personalNombre: item.personalNombre
    }));

    const eventos = [
        ...eventosSeguimiento,
        ...eventosBitacora
    ];

    if (eventos.length === 0) {
        contenedor.innerHTML = '<p class="seg-timeline-empty">Aún no hay actualizaciones registradas para este reporte.</p>';
        seccion.style.display = 'block';
        return;
    }

    // orden cronológico: más antiguo primero
    const ordenados = [...eventos].sort(
    (a, b) =>
        new Date(a.fechaCreacion) -
        new Date(b.fechaCreacion)
);

    contenedor.innerHTML = ordenados.map((item, index) => {

        const esActual = index === ordenados.length - 1;

        const icono = esActual
            ? '<svg class="icon-svg" viewBox="0 0 24 24" style="stroke:none;fill:currentColor"><circle cx="12" cy="12" r="5"/></svg>'
            : '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg>';

        const fecha = new Date(item.fechaCreacion);
        const fechaTexto = fecha.toLocaleDateString('es-PE') + ', ' +
            fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="seg-timeline-item ${esActual ? 'is-current' : ''}">
                <div class="seg-timeline-dot">${icono}</div>
                <div class="seg-timeline-box">
                    <div class="seg-timeline-top">
                        <h4>
    ${
        item.tipo === 'BITACORA'
            ? 'Actualización del técnico'
            : escapeHTMLSeg(
                formatearEstadoSeguimiento(item.estado)
            )
    }
</h4>
                        <span class="seg-timeline-date">${fechaTexto}</span>
                    </div>
                    <p>
    ${
        item.tipo === 'BITACORA'
            ? escapeHTMLSeg(item.descripcion || '')
            : escapeHTMLSeg(item.comentario || '')
    }
</p>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('segTimelineSection').style.display = 'block';
}

function formatearEstadoSeguimiento(estado) {
    const mapa = {
        PENDIENTE: 'Pendiente',
        TECNICO_ASIGNADO: 'Técnico asignado',
        EN_ATENCION: 'Técnico en atención',
        TRABAJO_REALIZADO: 'Trabajo realizado',
        RESUELTO: 'Reporte resuelto',
        NO_RESUELTO: 'No resuelto'
    };
    return mapa[estado] || estado;
}

function escapeHTMLSeg(valor) {
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}   
}
);