package com.aquaica.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.TarifaDTO;
import com.aquaica.entity.Tarifa;
import com.aquaica.repository.TarifaRepository;
import com.aquaica.repository.UsuarioRepository;

/**
 * Tarifa = cargo fijo mensual + precio por m³, según la categoría del suministro.
 * Las tarifas no se editan: una nueva reemplaza a la anterior desde su fecha de vigencia,
 * así los recibos pasados siempre se pueden explicar.
 */
@Service
public class TarifaService {

    private static final BigDecimal MAX_CARGO_FIJO = new BigDecimal("99999999.99");
    private static final BigDecimal MAX_PRECIO = new BigDecimal("9999999.999");

    private final TarifaRepository tarifaRepository;
    private final UsuarioRepository usuarioRepository;

    public TarifaService(
            TarifaRepository tarifaRepository,
            UsuarioRepository usuarioRepository) {

        this.tarifaRepository = tarifaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /** Todas las tarifas, agrupadas por categoría, marcando la vigente de hoy. */
    @Transactional(readOnly = true)
    public List<TarifaDTO> listar() {

        LocalDate hoy = LocalDate.now();
        Map<String, Long> vigentes = new HashMap<>();

        for (String categoria : SuministroService.CATEGORIAS) {
            vigenteEn(categoria, hoy).ifPresent(t -> vigentes.put(categoria, t.getId()));
        }

        return tarifaRepository.findAllByOrderByCategoriaAscVigenteDesdeDescIdDesc().stream()
                .map(t -> TarifaDTO.de(t, t.getId().equals(vigentes.get(t.getCategoria()))))
                .toList();
    }

    /** La tarifa de hoy de cada categoría. */
    @Transactional(readOnly = true)
    public List<TarifaDTO> vigentes() {

        LocalDate hoy = LocalDate.now();

        return SuministroService.CATEGORIAS.stream()
                .map(categoria -> vigenteEn(categoria, hoy))
                .flatMap(Optional::stream)
                .map(t -> TarifaDTO.de(t, true))
                .toList();
    }

    /** Tarifa aplicable a una categoría en una fecha. La usará la facturación. */
    @Transactional(readOnly = true)
    public Optional<Tarifa> vigenteEn(String categoria, LocalDate fecha) {
        return tarifaRepository
                .findFirstByCategoriaAndVigenteDesdeLessThanEqualOrderByVigenteDesdeDescIdDesc(
                        categoria, fecha);
    }

    @Transactional
    public TarifaDTO crear(
            String categoria,
            BigDecimal cargoFijo,
            BigDecimal precioM3,
            LocalDate vigenteDesde,
            Long usuarioId) {

        if (categoria == null || !SuministroService.CATEGORIAS.contains(categoria)) {
            throw new IllegalArgumentException("La categoría debe ser DOMESTICO o COMERCIAL.");
        }

        if (cargoFijo == null || cargoFijo.signum() < 0) {
            throw new IllegalArgumentException(
                    "El cargo fijo es obligatorio y no puede ser negativo.");
        }

        if (precioM3 == null || precioM3.signum() <= 0) {
            throw new IllegalArgumentException("El precio por m³ debe ser mayor que cero.");
        }

        BigDecimal fijo = cargoFijo.setScale(2, RoundingMode.HALF_UP);
        BigDecimal precio = precioM3.setScale(3, RoundingMode.HALF_UP);

        if (fijo.compareTo(MAX_CARGO_FIJO) > 0 || precio.compareTo(MAX_PRECIO) > 0) {
            throw new IllegalArgumentException("Los montos exceden el valor permitido.");
        }

        if (vigenteDesde == null) {
            throw new IllegalArgumentException("La fecha de vigencia es obligatoria.");
        }

        if (vigenteDesde.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "La tarifa no puede empezar en el pasado: cambiaría cómo se explican recibos ya emitidos.");
        }

        Optional<Tarifa> ultima =
                tarifaRepository.findFirstByCategoriaOrderByVigenteDesdeDescIdDesc(categoria);

        if (ultima.isPresent() && vigenteDesde.isBefore(ultima.get().getVigenteDesde())) {
            throw new IllegalArgumentException(
                    "Ya existe una tarifa de " + categoria + " con vigencia desde "
                    + ultima.get().getVigenteDesde()
                    + ". La nueva debe empezar en esa fecha o después.");
        }

        Tarifa tarifa = new Tarifa();
        tarifa.setCategoria(categoria);
        tarifa.setCargoFijo(fijo);
        tarifa.setPrecioM3(precio);
        tarifa.setVigenteDesde(vigenteDesde);

        if (usuarioId != null) {
            tarifa.setCreadaPor(usuarioRepository.getReferenceById(usuarioId));
        }

        Tarifa guardada = tarifaRepository.save(tarifa);

        boolean vigente = vigenteEn(categoria, LocalDate.now())
                .map(t -> t.getId().equals(guardada.getId())).orElse(false);

        return TarifaDTO.de(guardada, vigente);
    }
}
