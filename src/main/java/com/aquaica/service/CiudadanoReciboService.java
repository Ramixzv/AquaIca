package com.aquaica.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.ComprobantePagoDTO;
import com.aquaica.dto.ReciboCiudadanoDTO;
import com.aquaica.entity.Pago;
import com.aquaica.entity.Recibo;
import com.aquaica.repository.PagoRepository;
import com.aquaica.repository.ReciboRepository;
import com.aquaica.repository.UsuarioRepository;

/**
 * Recibos y pagos del portal ciudadano. Solo se ven y pagan los recibos de los suministros
 * del cliente autenticado. El pago es SIMULADO: no se cobra dinero real.
 */
@Service
public class CiudadanoReciboService {

    public static final List<String> MEDIOS = List.of("TARJETA", "YAPE", "TRANSFERENCIA");

    private final ReciboRepository reciboRepository;
    private final PagoRepository pagoRepository;
    private final UsuarioRepository usuarioRepository;

    public CiudadanoReciboService(
            ReciboRepository reciboRepository,
            PagoRepository pagoRepository,
            UsuarioRepository usuarioRepository) {

        this.reciboRepository = reciboRepository;
        this.pagoRepository = pagoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /** Recibos del cliente, del más reciente al más antiguo. Los anulados no se muestran. */
    @Transactional(readOnly = true)
    public List<ReciboCiudadanoDTO> misRecibos(Long clienteId) {
        return reciboRepository
                .findBySuministroClienteIdAndEstadoNotOrderByIdDesc(clienteId, ReciboService.ANULADO)
                .stream()
                .map(r -> ReciboCiudadanoDTO.de(r, pagoRepository.findByReciboId(r.getId()).orElse(null)))
                .toList();
    }

    /** Paga el recibo completo. El recibo se bloquea mientras se paga para evitar un doble pago. */
    @Transactional
    public ReciboCiudadanoDTO pagar(Long reciboId, String medio, Long clienteId, Long usuarioId) {

        if (medio == null || !MEDIOS.contains(medio)) {
            throw new IllegalArgumentException("Elige un medio de pago válido.");
        }

        Recibo recibo = propio(reciboRepository.bloquear(reciboId).orElse(null), clienteId);

        if (ReciboService.PAGADO.equals(recibo.getEstado())) {
            throw new IllegalArgumentException("Este recibo ya fue pagado.");
        }

        if (ReciboService.ANULADO.equals(recibo.getEstado())) {
            throw new IllegalArgumentException("Este recibo fue anulado y ya no se puede pagar.");
        }

        Pago pago = new Pago();
        // Código temporal: el definitivo se deriva del id generado.
        pago.setCodigo("TMP-" + Math.abs(System.nanoTime() % 1_000_000_000_000L));
        pago.setRecibo(recibo);
        pago.setMonto(recibo.getTotal());
        pago.setMedio(medio);
        pago.setDePrueba(recibo.isDePrueba());
        pago.setFechaPago(LocalDateTime.now());
        pago.setPagadoPor(usuarioRepository.getReferenceById(usuarioId));

        Pago guardado = pagoRepository.save(pago);
        guardado.setCodigo(String.format("PAG-%d-%06d", LocalDate.now().getYear(), guardado.getId()));
        pagoRepository.save(guardado);

        recibo.setEstado(ReciboService.PAGADO);
        reciboRepository.save(recibo);

        return ReciboCiudadanoDTO.de(recibo, guardado);
    }

    @Transactional(readOnly = true)
    public ComprobantePagoDTO comprobante(Long reciboId, Long clienteId) {

        Recibo recibo = propio(reciboRepository.findById(reciboId).orElse(null), clienteId);

        Pago pago = pagoRepository.findByReciboId(reciboId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Este recibo todavía no tiene un pago registrado."));

        return ComprobantePagoDTO.de(recibo, pago);
    }

    // Mismo error si no existe o es de otra persona, para no revelar qué recibos existen.
    private Recibo propio(Recibo recibo, Long clienteId) {

        if (recibo == null
                || recibo.getSuministro().getCliente() == null
                || !recibo.getSuministro().getCliente().getId().equals(clienteId)) {
            throw new AccessDeniedException("No puedes acceder a este recibo.");
        }

        return recibo;
    }
}
