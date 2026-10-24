package com.aquaica.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aquaica.entity.Recibo;

public interface ReciboRepository extends JpaRepository<Recibo, Long> {

    List<Recibo> findAllByOrderByIdDesc();

    boolean existsByLecturaIdAndEstadoNot(Long lecturaId, String estado);

    Optional<Recibo> findFirstByLecturaIdAndEstadoNot(Long lecturaId, String estado);

    boolean existsBySuministroIdAndPeriodoAndEstadoNot(
            Long suministroId, LocalDate periodo, String estado);

    // Limpieza de datos de prueba: los recibos DE PRUEBA se eliminan junto a sus lecturas simuladas.

    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM Recibo r WHERE r.dePrueba = true AND r.lectura.id = :lecturaId")
    int eliminarDePruebaPorLectura(@Param("lecturaId") Long lecturaId);

    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM Recibo r WHERE r.dePrueba = true AND r.lectura.id IN "
            + "(SELECT l.id FROM Lectura l WHERE l.medidor.id = :medidorId AND l.origen = 'SIMULADA')")
    int eliminarDePruebaPorMedidor(@Param("medidorId") Long medidorId);

    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM Recibo r WHERE r.dePrueba = true")
    int eliminarTodosDePrueba();
}
