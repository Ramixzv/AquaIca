package com.aquaica.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.ReporteResponseDTO;
import com.aquaica.entity.Personal;
import com.aquaica.entity.Reporte;
import com.aquaica.entity.Seguimiento;
import com.aquaica.entity.Suministro;
import com.aquaica.repository.PersonalRepository;
import com.aquaica.repository.ReporteRepository;
import com.aquaica.repository.SeguimientoRepository;
import com.aquaica.repository.SuministroRepository;
import com.aquaica.security.CustomUserDetails;

@Service
public class ReporteService {

    private final ReporteRepository reporteRepository;
    private final SuministroRepository suministroRepository;
    private final PrioridadService prioridadService;
    private final SeguimientoRepository seguimientoRepository;
    private final PersonalRepository personalRepository;

    public ReporteService(
            ReporteRepository reporteRepository,
            SuministroRepository suministroRepository,
            PrioridadService prioridadService,
            SeguimientoRepository seguimientoRepository,
            PersonalRepository personalRepository) {

        this.reporteRepository = reporteRepository;
        this.suministroRepository = suministroRepository;
        this.prioridadService = prioridadService;
        this.seguimientoRepository = seguimientoRepository;
        this.personalRepository = personalRepository;
    }

    public Reporte crearReporte(
            String codigoSuministro,
            String tipoProblema,
            String descripcion) {

        
        Suministro suministro = suministroRepository
                .findByCodigoSuministro(codigoSuministro)
                .orElseThrow(() ->
                        new RuntimeException("Suministro no encontrado"));

        
        Reporte reporte = new Reporte();

        reporte.setSuministroId(suministro);
        reporte.setTipoProblema(tipoProblema);
        reporte.setDescripcion(descripcion);
        reporte.setEstado("PENDIENTE");
        String prioridad = prioridadService.calcularPrioridad(tipoProblema);
        reporte.setPrioridad(prioridad);
        reporte.setFechaCreacion(LocalDateTime.now());

        
        return reporteRepository.save(reporte);
    }

    public List<ReporteResponseDTO> obtenerTodosLosReportes() {
    return reporteRepository.obtenerTodosLosReportes();
}

public Optional<ReporteResponseDTO> obtenerReportePorId(Long id) {
    return reporteRepository.obtenerReportePorId(id);
}
public List<ReporteResponseDTO> obtenerReportesPorCodigoSuministro(
        String codigo) {

    return reporteRepository.obtenerReportesPorCodigoSuministro(codigo);
}

public List<ReporteResponseDTO> obtenerMisReportes(String dni) {

    return reporteRepository.obtenerReportesPorDni(dni);

}

public Optional<ReporteResponseDTO> obtenerReportePublico(
        Long id,
        String codigo) {

    return reporteRepository.obtenerReportePorId(id)
            .filter(reporte ->
                    reporte.getCodigoSuministro() != null &&
                    reporte.getCodigoSuministro()
                            .equalsIgnoreCase(codigo.trim())
            );
}

@Transactional
public Reporte reabrirCaso(Long reporteId) {

    Reporte reporte = reporteRepository
            .findById(reporteId)
            .orElseThrow(() ->
                    new RuntimeException(
                            "Reporte no encontrado"
                    )
            );


    if (!"NO_RESUELTO".equalsIgnoreCase(
            reporte.getEstado())) {

        throw new RuntimeException(
                "Solo se pueden reabrir reportes no resueltos"
        );
    }


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


    Personal personal =
            personalRepository
                    .findById(personalId)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Personal no encontrado"
                            )
                    );


    reporte.setEstado("REABIERTO");

    Reporte guardado =
            reporteRepository.save(reporte);


    Seguimiento seguimiento =
            new Seguimiento();

    seguimiento.setReporte(reporte);
    seguimiento.setPersonal(personal);
    seguimiento.setEstado("REABIERTO");

    seguimiento.setComentario(
            "El caso fue reabierto por el administrador para una nueva intervención."
    );

    seguimiento.setFechaCreacion(
            LocalDateTime.now()
    );


    seguimientoRepository.save(seguimiento);


    return guardado;
}


}
