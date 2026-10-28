package com.aquaica.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aquaica.entity.Notificacion;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    List<Notificacion> findTop30ByUsuarioIdOrderByIdDesc(Long usuarioId);

    long countByUsuarioIdAndLeidaFalse(Long usuarioId);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE Notificacion n SET n.leida = true WHERE n.id = :id AND n.usuario.id = :usuarioId")
    int marcarUna(@Param("id") Long id, @Param("usuarioId") Long usuarioId);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE Notificacion n SET n.leida = true WHERE n.usuario.id = :usuarioId AND n.leida = false")
    int marcarTodas(@Param("usuarioId") Long usuarioId);
}
