
package com.aquaica.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.SuministroDTO;
import com.aquaica.entity.Cliente;
import com.aquaica.entity.Suministro;
import com.aquaica.repository.ClienteRepository;
import com.aquaica.repository.SuministroRepository;

@Service
public class SuministroService {

    private final SuministroRepository suministroRepository;
    private final ClienteRepository clienteRepository;

    public SuministroService(
            SuministroRepository suministroRepository,
            ClienteRepository clienteRepository) {
        this.suministroRepository = suministroRepository;
        this.clienteRepository = clienteRepository;
    }

    @Transactional(readOnly = true)
    public Optional<Suministro> buscarPorCodigo(String codigo) {
        return suministroRepository.findByCodigoSuministro(codigo);
    }

    @Transactional(readOnly = true)
    public List<Suministro> listarTodos() {
        return suministroRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Suministro> buscar(String termino) {
        if (termino == null || termino.isBlank()) {
            return listarTodos();
        }

        String busqueda = termino.trim();

        return suministroRepository
                .findByCodigoSuministroContainingIgnoreCaseOrDireccionContainingIgnoreCase(
                        busqueda, busqueda);
    }

    @Transactional(readOnly = true)
    public List<Suministro> listarPorCliente(Long clienteId) {
        if (!clienteRepository.existsById(clienteId)) {
            throw new IllegalArgumentException("Cliente no encontrado");
        }

        return suministroRepository.findByClienteId(clienteId);
    }

    @Transactional
    public Suministro registrar(
            String codigo,
            String direccion,
            Double latitud,
            Double longitud,
            Long clienteId) {

        validarDatos(codigo, direccion, latitud, longitud);

        String codigoLimpio = codigo.trim();

        if (suministroRepository.existsByCodigoSuministro(codigoLimpio)) {
            throw new IllegalArgumentException(
                    "Ya existe un suministro con ese código");
        }

        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Cliente no encontrado"));

        if (!"ACTIVO".equalsIgnoreCase(cliente.getEstado())) {
            throw new IllegalArgumentException(
                    "No se puede asociar un suministro a un cliente inactivo");
        }

        Suministro suministro = new Suministro();
        suministro.setCodigoSuministro(codigoLimpio);
        suministro.setDireccion(direccion.trim());
        suministro.setLatitud(latitud);
        suministro.setLongitud(longitud);
        suministro.setCliente(cliente);

        // Se conservan estos campos por compatibilidad con la tabla actual.
        suministro.setNombreTitular(cliente.getNombreCompleto());
        suministro.setDni(cliente.getDni());

        Suministro suministroGuardado =
        suministroRepository.save(suministro);
        cliente.setTitularVerificado(true);
        clienteRepository.save(cliente);
        return suministroGuardado;
    }

    @Transactional
    public Suministro actualizar(
            Long id,
            String codigo,
            String direccion,
            Double latitud,
            Double longitud,
            Long clienteId) {

        validarDatos(codigo, direccion, latitud, longitud);

        Suministro suministro = suministroRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Suministro no encontrado"));

        String codigoLimpio = codigo.trim();

        suministroRepository.findByCodigoSuministro(codigoLimpio)
                .filter(otro -> !otro.getId().equals(id))
                .ifPresent(otro -> {
                    throw new IllegalArgumentException(
                            "Ya existe otro suministro con ese código");
                });

        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Cliente no encontrado"));

        if (!"ACTIVO".equalsIgnoreCase(cliente.getEstado())) {
            throw new IllegalArgumentException(
                    "No se puede asociar un suministro a un cliente inactivo");
        }

        suministro.setCodigoSuministro(codigoLimpio);
        suministro.setDireccion(direccion.trim());
        suministro.setLatitud(latitud);
        suministro.setLongitud(longitud);
        suministro.setCliente(cliente);
        suministro.setNombreTitular(cliente.getNombreCompleto());
        suministro.setDni(cliente.getDni());

        return suministroRepository.save(suministro);
    }

    @Transactional
    public void eliminar(Long id) {
        Suministro suministro = suministroRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Suministro no encontrado"));

        if (!suministroRepository.existsById(id)) {
            throw new IllegalArgumentException("Suministro no encontrado");
        }

        suministroRepository.delete(suministro);
    }

    private void validarDatos(
            String codigo,
            String direccion,
            Double latitud,
            Double longitud) {

        if (codigo == null || codigo.isBlank()) {
            throw new IllegalArgumentException(
                    "El código del suministro es obligatorio");
        }

        if (codigo.trim().length() > 20) {
            throw new IllegalArgumentException(
                    "El código no puede superar los 20 caracteres");
        }

        if (direccion == null || direccion.isBlank()) {
            throw new IllegalArgumentException(
                    "La dirección es obligatoria");
        }

        if (latitud != null && (latitud < -90 || latitud > 90)) {
            throw new IllegalArgumentException("Latitud inválida");
        }

        if (longitud != null && (longitud < -180 || longitud > 180)) {
            throw new IllegalArgumentException("Longitud inválida");
        }

        if ((latitud == null) != (longitud == null)) {
            throw new IllegalArgumentException(
                    "Debes proporcionar ambas coordenadas o ninguna");
        }
    }

    
@Transactional(readOnly = true)
public List<SuministroDTO> listarTodosDTO() {
    return suministroRepository.findAll()
            .stream()
            .map(this::convertirADTO)
            .collect(Collectors.toList());
}

@Transactional(readOnly = true)
public Optional<SuministroDTO> buscarPorCodigoDTO(String codigo) {
    return suministroRepository.findByCodigoSuministro(codigo)
            .map(this::convertirADTO);
}

@Transactional(readOnly = true)
public List<SuministroDTO> buscarDTO(String termino) {
    return buscar(termino)
            .stream()
            .map(this::convertirADTO)
            .collect(Collectors.toList());
}

@Transactional(readOnly = true)
public List<SuministroDTO> listarPorClienteDTO(Long clienteId) {
    return listarPorCliente(clienteId)
            .stream()
            .map(this::convertirADTO)
            .collect(Collectors.toList());
}

public static final List<String> CATEGORIAS = List.of("DOMESTICO", "COMERCIAL");

@Transactional
public SuministroDTO cambiarCategoria(Long id, String categoria) {

    if (categoria == null || !CATEGORIAS.contains(categoria)) {
        throw new IllegalArgumentException("La categoría debe ser DOMESTICO o COMERCIAL.");
    }

    Suministro suministro = suministroRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Suministro no encontrado"));

    suministro.setCategoria(categoria);

    return convertirADTO(suministroRepository.save(suministro));
}

private SuministroDTO convertirADTO(Suministro suministro) {
    Cliente cliente = suministro.getCliente();

    SuministroDTO dto = new SuministroDTO(
            suministro.getId(),
            suministro.getCodigoSuministro(),
            suministro.getDireccion(),
            suministro.getLatitud(),
            suministro.getLongitud(),
            cliente.getId(),
            cliente.getNombreCompleto(),
            cliente.getDni()
    );
    dto.setCategoria(suministro.getCategoria());
    return dto;
}

}
