package com.aquaica.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.aquaica.security.JwtAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(formLogin -> formLogin.disable())
            .authorizeHttpRequests(auth -> auth
                // ERRORES
                .requestMatchers("/error").permitAll()

                // PÁGINAS Y RECURSOS PÚBLICOS
                .requestMatchers(
                    "/", "/index.html", "/como-funciona.html",
                    "/instalaciones.html",
                    "/solicitudes.html", "/lecturas.html", "/indicadores.html", "/tarifas.html", "/recibos.html", "/login.html", "/registro.html", "/ciudadano.html","/reporte.html", "/reporte-detalle.html",
                    "/dashboard.html", "/reportes.html", "/asignaciones.html", "/mis-reportes.html",
                    "/seguimientos.html", "/seguimiento.html", "/evidencias.html", "/personal.html",
                    "/clientes.html", "/suministros.html", "/css/**", "/js/**", "/images/**", "/favicon.ico"
                ).permitAll()

                // AUTENTICACIÓN
                .requestMatchers("/api/auth/**").permitAll()

                // CREAR REPORTE CIUDADANO
                .requestMatchers(HttpMethod.POST, "/api/reportes").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/reportes/*/reabrir").hasRole("ADMIN")

                // MIS REPORTES - USUARIO AUTENTICADO
                .requestMatchers(HttpMethod.GET, "/api/reportes/mis-reportes").authenticated()

                // MIS REPORTES - PERSONAL AUTENTICADO
                .requestMatchers(HttpMethod.GET, "/api/reportes/mis-reportes").authenticated()

                // REPORTES PROPIOS DEL CIUDADANO
                .requestMatchers(HttpMethod.GET, "/api/reportes/mis-reportes-ciudadano").hasRole("CIUDADANO")

                // CONSULTA PÚBLICA POR CÓDIGO DE SUMINISTRO
                .requestMatchers(HttpMethod.GET, "/api/reportes/suministro/**").permitAll()

                // CONSULTA PÚBLICA DE REPORTE
                .requestMatchers(HttpMethod.GET, "/api/reportes/publico/**").permitAll()

                // USUARIOS
                .requestMatchers("/api/usuarios/**").hasRole("ADMIN")

                // CLIENTES
                // PERFIL DEL CIUDADANO AUTENTICADO
                .requestMatchers(HttpMethod.GET, "/api/clientes/me").hasRole("CIUDADANO")

                // CLIENTES - GESTIÓN ADMINISTRATIVA
                .requestMatchers("/api/clientes/**").hasAnyRole("ADMIN", "SOPORTE")

                // PERSONAL / ASIGNACIONES
                .requestMatchers(HttpMethod.GET, "/api/personal/*/asignaciones").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")
                .requestMatchers("/api/personal/**").hasAnyRole("ADMIN", "SOPORTE")

                // REPORTES - ADMIN / SOPORTE / TECNICO
                .requestMatchers(HttpMethod.GET, "/api/reportes").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")

                // EVIDENCIAS DE REPORTES
                .requestMatchers(HttpMethod.GET, "/api/reportes/*/evidencias").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")
                .requestMatchers(HttpMethod.POST, "/api/reportes/*/evidencias").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/reportes/*/evidencias/tecnico").hasRole("TECNICO")
                .requestMatchers(HttpMethod.GET, "/api/evidencias").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")
                .requestMatchers(HttpMethod.GET, "/api/evidencias/archivo/**").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")

                // SEGUIMIENTOS
                .requestMatchers(HttpMethod.GET, "/api/reportes/*/seguimientos").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")
                .requestMatchers(HttpMethod.POST, "/api/reportes/*/seguimientos").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")
                .requestMatchers(HttpMethod.GET, "/api/seguimientos").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")

                // ASIGNACIONES
                .requestMatchers(HttpMethod.POST, "/api/reportes/*/asignaciones").hasAnyRole("ADMIN", "SOPORTE")
                .requestMatchers(HttpMethod.GET, "/api/reportes/*/asignaciones").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")
                .requestMatchers(HttpMethod.POST, "/api/asignaciones/*/iniciar").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")

                // BITÁCORAS
                .requestMatchers(HttpMethod.POST, "/api/bitacoras").hasRole("TECNICO")
                .requestMatchers(HttpMethod.GET, "/api/bitacoras/publico/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/bitacoras/reporte/**").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")
                .requestMatchers(HttpMethod.GET, "/api/bitacoras/asignacion/**").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")

                // INFORME TÉCNICO
                .requestMatchers(HttpMethod.POST, "/api/reportes/*/informe-tecnico").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")
                .requestMatchers(HttpMethod.GET, "/api/reportes/*/informe-tecnico").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")

                // SUMINISTROS
                .requestMatchers(HttpMethod.GET, "/api/suministros").hasAnyRole("ADMIN", "SOPORTE")
                .requestMatchers(HttpMethod.GET, "/api/suministros/cliente/**").hasAnyRole("ADMIN", "SOPORTE")
                .requestMatchers(HttpMethod.POST, "/api/suministros").hasAnyRole("ADMIN", "SOPORTE")
                .requestMatchers(HttpMethod.PUT, "/api/suministros/**").hasAnyRole("ADMIN", "SOPORTE")
                .requestMatchers(HttpMethod.PATCH, "/api/suministros/*/categoria").hasAnyRole("ADMIN", "SOPORTE")
                .requestMatchers(HttpMethod.DELETE, "/api/suministros/**").hasAnyRole("ADMIN", "SOPORTE")
                .requestMatchers(HttpMethod.GET, "/api/suministros/*").permitAll()

                // REPORTE INDIVIDUAL
                .requestMatchers(HttpMethod.GET, "/api/reportes/*").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")

                
            // CIUDADANO: sus operaciones
.requestMatchers(
    HttpMethod.POST,
    "/api/solicitudes-servicio"
).hasRole("CIUDADANO")

.requestMatchers(
    HttpMethod.GET,
    "/api/solicitudes-servicio/mis-solicitudes"
).hasRole("CIUDADANO")

.requestMatchers(
    HttpMethod.PATCH,
    "/api/solicitudes-servicio/*/cancelar"
).hasRole("CIUDADANO")

// ADMIN / SOPORTE: gestión administrativa
.requestMatchers(
    "/api/solicitudes-servicio",
    "/api/solicitudes-servicio/estado/**",
    "/api/solicitudes-servicio/cliente/**",
    "/api/solicitudes-servicio/*/estado",
    "/api/solicitudes-servicio/*"
).hasAnyRole("ADMIN", "SOPORTE")



                // ÓRDENES DE INSTALACIÓN
                .requestMatchers(HttpMethod.GET, "/api/ordenes-instalacion/comprobante/*").hasRole("CIUDADANO")
                .requestMatchers(HttpMethod.GET, "/api/ordenes-instalacion/mis-ordenes").hasRole("TECNICO")
                .requestMatchers(HttpMethod.PATCH, "/api/ordenes-instalacion/*/completar").hasRole("TECNICO")
                .requestMatchers("/api/ordenes-instalacion/**").hasAnyRole("ADMIN", "SOPORTE")

                // MEDIDORES: lectura para el personal; registrar o desactivar solo ADMIN y SOPORTE
                .requestMatchers(HttpMethod.GET, "/api/medidores", "/api/medidores/**").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")
                .requestMatchers("/api/medidores", "/api/medidores/**").hasAnyRole("ADMIN", "SOPORTE")

                // LECTURAS simuladas (datos de prueba): solo ADMIN
                .requestMatchers(HttpMethod.POST, "/api/lecturas/medidor/*/simular").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/lecturas/simuladas", "/api/lecturas/medidor/*/simuladas").hasRole("ADMIN")

                // LECTURAS: registrar y consultar ADMIN, SOPORTE y TECNICO; anular solo ADMIN y SOPORTE
                .requestMatchers(HttpMethod.PATCH, "/api/lecturas/*/anular").hasAnyRole("ADMIN", "SOPORTE")
                .requestMatchers("/api/lecturas", "/api/lecturas/**").hasAnyRole("ADMIN", "SOPORTE", "TECNICO")

                // INDICADORES: solo ADMIN y SOPORTE
                .requestMatchers(HttpMethod.GET, "/api/indicadores").hasAnyRole("ADMIN", "SOPORTE")

                // NOTIFICACIONES: cualquier usuario autenticado, solo las suyas
                .requestMatchers("/api/notificaciones", "/api/notificaciones/**").authenticated()

                // RECIBOS: generar y consultar ADMIN y SOPORTE; anular solo ADMIN
                .requestMatchers(HttpMethod.PATCH, "/api/recibos/*/anular").hasRole("ADMIN")
                .requestMatchers("/api/recibos", "/api/recibos/**").hasAnyRole("ADMIN", "SOPORTE")

                // TARIFAS: crear solo ADMIN; consultar ADMIN y SOPORTE
                .requestMatchers(HttpMethod.POST, "/api/tarifas").hasRole("ADMIN")
                .requestMatchers("/api/tarifas", "/api/tarifas/**").hasAnyRole("ADMIN", "SOPORTE")

                // PORTAL CIUDADANO: sus suministros y su consumo
                .requestMatchers(HttpMethod.GET, "/api/ciudadano/**").hasRole("CIUDADANO")
                .requestMatchers(HttpMethod.POST, "/api/ciudadano/recibos/*/pagar").hasRole("CIUDADANO")

                // CUALQUIER OTRA PETICIÓN
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}