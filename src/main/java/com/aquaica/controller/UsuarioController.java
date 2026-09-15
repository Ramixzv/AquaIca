package com.aquaica.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.entity.Usuario;
import com.aquaica.service.UsuarioService;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> registrarUsuario(
            @RequestParam Long personalId,
            @RequestParam String username,
            @RequestParam String password,
            @RequestParam String rol) {

        Usuario usuario = usuarioService.registrarUsuario(
                personalId,
                username,
                password,
                rol
        );

        Map<String, Object> respuesta = new HashMap<>();

        respuesta.put("id", usuario.getId());
        respuesta.put("username", usuario.getUsername());
        respuesta.put("rol", usuario.getRol());
        respuesta.put("estado", usuario.getEstado());
        respuesta.put("personalId", usuario.getPersonal().getId());
        respuesta.put("mensaje", "Usuario registrado correctamente");

        return ResponseEntity.ok(respuesta);
    }
}