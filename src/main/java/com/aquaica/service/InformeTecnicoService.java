package com.aquaica.service;

import java.time.LocalDateTime;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.InformeTecnicoResponseDTO;
import com.aquaica.entity.Asignacion;
import com.aquaica.entity.InformeTecnico;
import com.aquaica.entity.Personal;
import com.aquaica.entity.Reporte;
import com.aquaica.entity.Seguimiento;
import com.aquaica.repository.AsignacionRepository;
import com.aquaica.repository.InformeTecnicoRepository;
import com.aquaica.repository.PersonalRepository;
import com.aquaica.repository.ReporteRepository;
import com.aquaica.repository.SeguimientoRepository;
import com.aquaica.security.CustomUserDetails;

@Service
public class InformeTecnicoService {

    private final InformeTecnicoRepository informeTecnicoRepository;
    private final ReporteRepository reporteRepository;
    private final PersonalRepository personalRepository;
    private final AsignacionRepository asignacionRepository;
    private final SeguimientoRepository seguimientoRepository;

    public InformeTecnicoService(
            InformeTecnicoRepository informeTecnicoRepository,
            ReporteRepository reporteRepository,
            PersonalRepository personalRepository,
            AsignacionRepository asignacionRepository,
            SeguimientoRepository seguimientoRepository) {

        this.informeTecnicoRepository = informeTecnicoRepository;
        this.reporteRepository = reporteRepository;
        this.personalRepository = personalRepository;
        this.asignacionRepository = asignacionRepository;
        this.seguimientoRepository = seguimientoRepository;
    }

    @Transactional
    public InformeTecnicoResponseDTO registrarInforme(
            Long reporteId,
            String diagnostico,
            String trabajoRealizado,
            String resultado) {



        Reporte reporte = reporteRepository
                .findById(reporteId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Reporte no encontrado"
                        )
                );



        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();


        if (authentication == null ||
                !(authentication.getPrincipal()
                        instanceof CustomUserDetails)) {

            throw new RuntimeException(
                    "No se pudo obtener el usuario autenticado"
            );
        }


        CustomUserDetails userDetails =
                (CustomUserDetails)
                        authentication.getPrincipal();


        if (userDetails.getUsuario().getPersonal() == null) {

            throw new RuntimeException(
                    "El usuario no tiene personal asociado"
            );
        }


        Long personalId =
                userDetails.getUsuario()
                        .getPersonal()
                        .getId();


        if (personalId == null) {

            throw new RuntimeException(
                    "El usuario no tiene personal asociado"
            );
        }



        Personal personal =
                personalRepository
                        .findById(personalId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Personal no encontrado"
                                )
                        );


        Asignacion asignacion =
        asignacionRepository
                .findFirstByReporteIdAndPersonalIdAndEstado(
                        reporteId,
                        personalId,
                        "EN_ATENCION"
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "No tienes una asignación activa para este reporte"
                        )
                );

        if (!"EN_ATENCION".equalsIgnoreCase(
                asignacion.getEstado())) {

            throw new RuntimeException(
                    "Debes iniciar la atención del reporte antes de registrar el informe"
            );
        }


        if (informeTecnicoRepository
                .findByAsignacionId(asignacion.getId())
                .isPresent()) {

            throw new RuntimeException(
                    "Este reporte ya tiene un informe técnico registrado"
            );
        }


        if (diagnostico == null ||
                diagnostico.trim().isEmpty()) {

            throw new RuntimeException(
                    "El diagnóstico es obligatorio"
            );
        }


        if (trabajoRealizado == null ||
                trabajoRealizado.trim().isEmpty()) {

            throw new RuntimeException(
                    "El trabajo realizado es obligatorio"
            );
        }


        if (resultado == null ||
                resultado.trim().isEmpty()) {

            throw new RuntimeException(
                    "El resultado es obligatorio"
            );
        }


        InformeTecnico informe =
                new InformeTecnico();

        informe.setReporte(reporte);
        informe.setAsignacion(asignacion);
        informe.setPersonal(personal);

        informe.setDiagnostico(
                diagnostico.trim()
        );

        informe.setTrabajoRealizado(
                trabajoRealizado.trim()
        );

        informe.setResultado(
                resultado.trim()
        );

        informe.setFechaCreacion(
                LocalDateTime.now()
        );


        InformeTecnico guardado =
                informeTecnicoRepository.save(
                        informe
                );

Seguimiento seguimiento = new Seguimiento();

seguimiento.setReporte(reporte);
seguimiento.setPersonal(personal);

seguimiento.setEstado("TRABAJO_REALIZADO");

seguimiento.setComentario(
        "El técnico registró el informe de atención del reporte."
);

seguimiento.setFechaCreacion(
        LocalDateTime.now()
);

seguimientoRepository.save(seguimiento);
if ("SOLUCIONADO".equalsIgnoreCase(resultado)) {

    reporte.setEstado("RESUELTO");

    asignacion.setEstado("FINALIZADA");

    reporteRepository.save(reporte);

    asignacionRepository.save(asignacion);


    Seguimiento seguimientoResolucion =
            new Seguimiento();

    seguimientoResolucion.setReporte(reporte);

    seguimientoResolucion.setPersonal(personal);

    seguimientoResolucion.setEstado("RESUELTO");

    seguimientoResolucion.setComentario(
            "La incidencia fue atendida y solucionada."
    );

    seguimientoResolucion.setFechaCreacion(
            LocalDateTime.now()
    );

    seguimientoRepository.save(
            seguimientoResolucion
    );
}

if ("NO_RESUELTO".equalsIgnoreCase(resultado)
||"NO_SOLUCIONADO".equalsIgnoreCase(resultado) ) {

    reporte.setEstado("NO_RESUELTO");

    asignacion.setEstado("FINALIZADA");

    reporteRepository.save(reporte);
    asignacionRepository.save(asignacion);


    Seguimiento seguimientoNoResuelto =
            new Seguimiento();

    seguimientoNoResuelto.setReporte(reporte);

    seguimientoNoResuelto.setPersonal(personal);

    seguimientoNoResuelto.setEstado("NO_RESUELTO");

    seguimientoNoResuelto.setComentario(
            "La incidencia no pudo ser solucionada y requiere una nueva intervención."
    );

    seguimientoNoResuelto.setFechaCreacion(
            LocalDateTime.now()
    );

    seguimientoRepository.save(
            seguimientoNoResuelto
    );
}



        return new InformeTecnicoResponseDTO(
        guardado.getId(),
        reporte.getId(),
        asignacion.getId(),
        personal.getId(),
        personal.getNombre(),
        guardado.getDiagnostico(),
        guardado.getTrabajoRealizado(),
        guardado.getResultado(),
        guardado.getFechaCreacion()
);
        
    }


    public InformeTecnicoResponseDTO obtenerInformePorReporte(
            Long reporteId) {

        InformeTecnico informe =
        informeTecnicoRepository
                .findFirstByReporteIdOrderByFechaCreacionDesc(reporteId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Este reporte no tiene informe técnico"
                        )
                );


        return new InformeTecnicoResponseDTO(
        informe.getId(),
        informe.getReporte().getId(),
        informe.getAsignacion().getId(),
        informe.getPersonal().getId(),
        informe.getPersonal().getNombre(),
        informe.getDiagnostico(),
        informe.getTrabajoRealizado(),
        informe.getResultado(),
        informe.getFechaCreacion()
                );
        }

        public InformeTecnicoResponseDTO obtenerInformePorAsignacion(
        Long asignacionId) {

    InformeTecnico informe =
            informeTecnicoRepository
                    .findByAsignacionId(asignacionId)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Esta asignación no tiene informe técnico"
                            )
                    );

    return new InformeTecnicoResponseDTO(
            informe.getId(),
            informe.getReporte().getId(),
            informe.getAsignacion().getId(),
            informe.getPersonal().getId(),
            informe.getPersonal().getNombre(),
            informe.getDiagnostico(),
            informe.getTrabajoRealizado(),
            informe.getResultado(),
            informe.getFechaCreacion()
    );
}
        }