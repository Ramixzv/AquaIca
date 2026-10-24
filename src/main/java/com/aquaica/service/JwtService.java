
package com.aquaica.service;

import com.aquaica.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private static final String SECRET_KEY =
            "AquaIca-Secret-Key-Para-JWT-2026-Seguridad-123456789";

    private static final long EXPIRATION_TIME =
            1000 * 60 * 60;

    private final SecretKey secretKey;

    public JwtService() {
        this.secretKey = Keys.hmacShaKeyFor(
                SECRET_KEY.getBytes(StandardCharsets.UTF_8)
        );
    }

    public String generarToken(Usuario usuario) {

        var builder = Jwts.builder()
                .subject(usuario.getUsername())
                .claim("rol", usuario.getRol());

        if (usuario.getPersonal() != null) {
            builder.claim("personalId", usuario.getPersonal().getId());
        }

        if (usuario.getCliente() != null) {
            builder.claim("clienteId", usuario.getCliente().getId());
        }

        return builder
                .issuedAt(new Date())
                .expiration(
                        new Date(System.currentTimeMillis() + EXPIRATION_TIME)
                )
                .signWith(secretKey)
                .compact();
    }

    public String obtenerUsername(String token) {
        return obtenerClaims(token).getSubject();
    }

    public String obtenerRol(String token) {
        return obtenerClaims(token).get("rol", String.class);
    }

    public Long obtenerPersonalId(String token) {
        return obtenerClaims(token).get("personalId", Long.class);
    }

    public Long obtenerClienteId(String token) {
        return obtenerClaims(token).get("clienteId", Long.class);
    }

    private Claims obtenerClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
