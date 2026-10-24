package com.aquaica.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.MedidorDTO;
import com.aquaica.entity.Medidor;
import com.aquaica.entity.Suministro;
import com.aquaica.repository.MedidorRepository;
import com.aquaica.repository.SuministroRepository;

@Service
public class MedidorService {

    public static final String ACTIVO = "ACTIVO";
    public static final String INACTIVO = "INACTIVO";

    private final MedidorRepository medidorRepository;
    private final SuministroRepository suministroRepository;

    public MedidorService(
            MedidorRepository medidorRepository,
            SuministroRepository suministroRepository) {

        this.medidorRepository = medidorRepository;
        this.suministroRepository = suministroRepository;
    }

    @Transactional(readOnly = true)
    public List<MedidorDTO> listarTodos() {
        return medidorRepository.findAll().stream().map(MedidorDTO::de).toList();
    }

    @Transactional(readOnly = true)
    public MedidorDTO buscarPorId(Long id) {
        return MedidorDTO.de(buscarEntidad(id));
    }

    /** Medidor ACTIVO del suministro (el que se usa para lecturas). */
    @Transactional(readOnly = true)
    public MedidorDTO buscarActivoPorSuministro(Long suministroId) {
        return MedidorDTO.de(
                medidorRepository.findBySuministroIdAndEstado(suministroId, ACTIVO)
                        .orElseThrow(() -> new IllegalArgumentException(
                                "El suministro no tiene un medidor activo")));
    }

    /** Todos los medidores que ha tenido el suministro, del más reciente al más antiguo. */
    @Transactional(readOnly = true)
    public List<MedidorDTO> historialPorSuministro(Long suministroId) {
        return medidorRepository
                .findBySuministroIdOrderByFechaInstalacionDescIdDesc(suministroId)
                .stream().map(MedidorDTO::de).toList();
    }

    /** Uso interno (lo llama la instalación). Devuelve la entidad. */
    @Transactional
    public Medidor registrar(
            String numeroSerie,
            Long suministroId,
            LocalDate fechaInstalacion) {

        if (numeroSerie == null || numeroSerie.isBlank()) {
            throw new IllegalArgumentException("El número de serie es obligatorio");
        }

        String serie = numeroSerie.trim();

        if (serie.length() > 50) {
            throw new IllegalArgumentException(
                    "El número de serie no puede superar los 50 caracteres");
        }

        if (medidorRepository.existsByNumeroSerie(serie)) {
            throw new IllegalArgumentException("Ya existe un medidor con ese número de serie");
        }

        Suministro suministro = suministroRepository.findById(suministroId)
                .orElseThrow(() -> new IllegalArgumentException("Suministro no encontrado"));

        if (medidorRepository.existsBySuministroIdAndEstado(suministroId, ACTIVO)) {
            throw new IllegalArgumentException(
                    "El suministro ya tiene un medidor activo. Desactívalo, indicando el "
                    + "motivo del retiro, antes de registrar uno nuevo");
        }

        if (fechaInstalacion == null) {
            throw new IllegalArgumentException("La fecha de instalación es obligatoria");
        }

        if (fechaInstalacion.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La fecha de instalación no puede ser futura");
        }

        Medidor medidor = new Medidor();
        medidor.setNumeroSerie(serie);
        medidor.setSuministro(suministro);
        medidor.setFechaInstalacion(fechaInstalacion);
        medidor.setEstado(ACTIVO);

        return medidorRepository.save(medidor);
    }

    /** Registro manual desde la API: devuelve DTO. */
    @Transactional
    public MedidorDTO registrarManual(
            String numeroSerie,
            Long suministroId,
            LocalDate fechaInstalacion) {

        return MedidorDTO.de(registrar(numeroSerie, suministroId, fechaInstalacion));
    }

    /**
     * Desactivar un medidor (retiro) exige un motivo y guarda la fecha de retiro.
     * Reactivarlo solo es posible si el suministro no tiene otro medidor activo.
     */
    @Transactional
    public MedidorDTO cambiarEstado(Long id, String estado, String motivo) {

        if (!ACTIVO.equals(estado) && !INACTIVO.equals(estado)) {
            throw new IllegalArgumentException("El estado debe ser ACTIVO o INACTIVO");
        }

        Medidor medidor = buscarEntidad(id);

        if (estado.equals(medidor.getEstado())) {
            return MedidorDTO.de(medidor);
        }

        if (INACTIVO.equals(estado)) {

            if (motivo == null || motivo.isBlank()) {
                throw new IllegalArgumentException("Indica el motivo del retiro del medidor");
            }

            if (motivo.trim().length() > 255) {
                throw new IllegalArgumentException(
                        "El motivo no puede superar los 255 caracteres");
            }

            medidor.setEstado(INACTIVO);
            medidor.setFechaRetiro(LocalDate.now());
            medidor.setMotivoRetiro(motivo.trim());

        } else {

            if (medidorRepository.existsBySuministroIdAndEstado(
                    medidor.getSuministro().getId(), ACTIVO)) {
                throw new IllegalArgumentException(
                        "El suministro ya tiene otro medidor activo. Desactívalo antes "
                        + "de reactivar este");
            }

            medidor.setEstado(ACTIVO);
            medidor.setFechaRetiro(null);
            medidor.setMotivoRetiro(null);
        }

        return MedidorDTO.de(medidorRepository.save(medidor));
    }

    private Medidor buscarEntidad(Long id) {
        return medidorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Medidor no encontrado"));
    }
}
