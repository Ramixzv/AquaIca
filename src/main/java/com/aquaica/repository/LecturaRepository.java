package com.aquaica.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aquaica.entity.Lectura;
import com.aquaica.entity.Medidor;

import jakarta.persistence.LockModeType;

public interface LecturaRepository extends JpaRepository<Lectura, Long> {

    /** Última lectura registrada del medidor (la "cola" de su cadena). */
    Optional<Lectura> findFirstByMedidorIdAndEstadoOrderByIdDesc(Long medidorId, String estado);

    /** Última lectura VÁLIDA del medidor: las anuladas no cuentan para la cadena. */
    default Optional<Lectura> ultimaValida(Long medidorId) {
        return findFirstByMedidorIdAndEstadoOrderByIdDesc(medidorId, "VALIDA");
    }

    boolean existsByMedidorId(Long medidorId);

    /** ¿Ya hay una lectura de ese periodo? (la INICIAL no cuenta). */
    boolean existsByMedidorIdAndPeriodoAndOrigenNotAndEstado(Long medidorId, LocalDate periodo, String origen, String estado);

    @Query("""
            SELECT l FROM Lectura l
            JOIN FETCH l.medidor m
            JOIN FETCH m.suministro
            LEFT JOIN FETCH l.registradoPor
            WHERE m.id = :medidorId
            ORDER BY l.fechaLectura DESC, l.id DESC
            """)
    List<Lectura> listarPorMedidor(@Param("medidorId") Long medidorId);

    @Query("""
            SELECT l FROM Lectura l
            JOIN FETCH l.medidor m
            JOIN FETCH m.suministro s
            LEFT JOIN FETCH l.registradoPor
            WHERE s.id = :suministroId
            ORDER BY l.fechaLectura DESC, l.id DESC
            """)
    List<Lectura> listarPorSuministro(@Param("suministroId") Long suministroId);

    /** Para cada medidor, su lectura más reciente. */
    @Query("""
            SELECT l FROM Lectura l
            JOIN FETCH l.medidor m
            JOIN FETCH m.suministro
            WHERE l.id IN (SELECT MAX(l2.id) FROM Lectura l2 WHERE l2.estado = 'VALIDA' GROUP BY l2.medidor.id)
            """)
    List<Lectura> ultimasPorMedidor();

    @Query("""
            SELECT m FROM Medidor m
            JOIN FETCH m.suministro s
            WHERE m.estado = 'ACTIVO'
            ORDER BY s.codigoSuministro
            """)
    List<Medidor> medidoresActivos();

    @Query("SELECT COUNT(m) > 0 FROM Medidor m WHERE m.id = :id")
    boolean medidorExiste(@Param("id") Long id);

    /**
     * Bloquea la fila del medidor hasta terminar la transacción, para que dos
     * lecturas simultáneas no rompan la cadena anterior -> actual.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Medidor m JOIN FETCH m.suministro WHERE m.id = :id")
    Optional<Medidor> bloquearMedidor(@Param("id") Long id);

    /** Borra las lecturas SIMULADAS de un medidor. Devuelve cuántas eliminó. */
    long deleteByMedidorIdAndOrigen(Long medidorId, String origen);

    /** Borra todas las lecturas SIMULADAS del sistema. Devuelve cuántas eliminó. */
    long deleteByOrigen(String origen);

    /** Lecturas válidas de un mes, sin la inicial: son las que se pueden facturar. */
    List<Lectura> findByPeriodoAndEstadoAndOrigenNot(LocalDate periodo, String estado, String origen);
}
