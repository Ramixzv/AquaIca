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

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {

        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }


    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http

            .csrf(csrf -> csrf.disable())


            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )


            .httpBasic(httpBasic ->
                httpBasic.disable()
            )


            .formLogin(formLogin ->
                formLogin.disable()
            )


            .authorizeHttpRequests(auth -> auth


                // ==========================================
                // ERRORES
                // ==========================================

                .requestMatchers("/error").permitAll()


                // ==========================================
                // PÁGINAS Y RECURSOS PÚBLICOS
                // ==========================================

                .requestMatchers(
                    "/",
                    "/index.html",
                    "/login.html",
                    "/reporte.html",
                    "/reporte-detalle.html",
                    "/dashboard.html",
                    "/reportes.html",
                    "/asignaciones.html",
                    "/mis-reportes.html",
                    "/seguimientos.html",
                    "/seguimiento.html",
                    "/evidencias.html",
                    "/css/**",
                    "/js/**",
                    "/images/**",
                    "/favicon.ico"
                ).permitAll()


                // ==========================================
                // AUTENTICACIÓN
                // ==========================================

                .requestMatchers(
                    "/api/auth/**"
                ).permitAll()


                // ==========================================
                // CREAR REPORTE CIUDADANO
                // ==========================================

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/reportes"
                ).permitAll()

                .requestMatchers(HttpMethod.POST, "/api/reportes/*/reabrir")
                .hasRole("ADMIN")


                // ==========================================
                // MIS REPORTES - USUARIO AUTENTICADO
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/reportes/mis-reportes"
                ).authenticated()


                // ==========================================
                // CONSULTA PÚBLICA POR CÓDIGO DE SUMINISTRO
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/reportes/suministro/**"
                ).permitAll()


                // ==========================================
                // CONSULTA PÚBLICA DE REPORTE
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/reportes/publico/**"
                ).permitAll()


                // ==========================================
                // USUARIOS
                // ==========================================

                .requestMatchers(
                    "/api/usuarios/**"
                ).hasRole("ADMIN")


                // ==========================================
                // PERSONAL / ASIGNACIONES
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/personal/*/asignaciones"
                ).hasAnyRole(
                    "ADMIN",
                    "SOPORTE",
                    "TECNICO"
                )


                .requestMatchers(
                    "/api/personal/**"
                ).hasAnyRole(
                    "ADMIN",
                    "SOPORTE"
                )


                // ==========================================
                // REPORTES - ADMIN / SOPORTE / TECNICO
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/reportes"
                ).hasAnyRole(
                    "ADMIN",
                    "SOPORTE",
                    "TECNICO"
                )


                // ==========================================
                // EVIDENCIAS DE REPORTES
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/reportes/*/evidencias"
                ).hasAnyRole(
                    "ADMIN",
                    "SOPORTE",
                    "TECNICO"
                )


                .requestMatchers(
                    HttpMethod.POST,
                    "/api/reportes/*/evidencias"
                ).permitAll()


                .requestMatchers(
                    HttpMethod.POST,
                    "/api/reportes/*/evidencias/tecnico"
                ).hasRole("TECNICO")


                .requestMatchers(
                    HttpMethod.GET,
                    "/api/evidencias"
                ).hasAnyRole(
                    "ADMIN",
                    "SOPORTE",
                    "TECNICO"
                )


                .requestMatchers(
                    HttpMethod.GET,
                    "/api/evidencias/archivo/**"
                ).hasAnyRole(
                    "ADMIN",
                    "SOPORTE",
                    "TECNICO"
                )


                // ==========================================
                // SEGUIMIENTOS
                // ==========================================

                // Seguimiento interno
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/reportes/*/seguimientos"
                ).hasAnyRole(
                    "ADMIN",
                    "SOPORTE",
                    "TECNICO"
                )


                // Crear seguimiento
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/reportes/*/seguimientos"
                ).hasAnyRole(
                    "ADMIN",
                    "SOPORTE",
                    "TECNICO"
                )


                // Todos los seguimientos
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/seguimientos"
                ).hasAnyRole(
                    "ADMIN",
                    "SOPORTE",
                    "TECNICO"
                )


                // ==========================================
                // ASIGNACIONES
                // ==========================================

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/reportes/*/asignaciones"
                ).hasAnyRole(
                    "ADMIN",
                    "SOPORTE"
                )


                .requestMatchers(
                    HttpMethod.GET,
                    "/api/reportes/*/asignaciones"
                ).hasAnyRole(
                    "ADMIN",
                    "SOPORTE",
                    "TECNICO"
                )


                .requestMatchers(
                    HttpMethod.POST,
                    "/api/asignaciones/*/iniciar"
                ).hasAnyRole(
                    "ADMIN",
                    "SOPORTE",
                    "TECNICO"
                )

                // ==========================================
// BITÁCORAS
// ==========================================

// Registrar bitácora
.requestMatchers(
    HttpMethod.POST,
    "/api/bitacoras"
).hasRole("TECNICO")

.requestMatchers(
    HttpMethod.GET,
    "/api/bitacoras/publico/**"
).permitAll()

// Consultar bitácoras de un reporte
.requestMatchers(
    HttpMethod.GET,
    "/api/bitacoras/reporte/**"
).hasAnyRole(
    "ADMIN",
    "SOPORTE",
    "TECNICO"
)

// Consultar bitácoras de una asignación
.requestMatchers(
    HttpMethod.GET,
    "/api/bitacoras/asignacion/**"
).hasAnyRole(
    "ADMIN",
    "SOPORTE",
    "TECNICO"
)


                // ==========================================
                // INFORME TÉCNICO
                // ==========================================

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/reportes/*/informe-tecnico"
                ).hasAnyRole(
                    "ADMIN",
                    "SOPORTE",
                    "TECNICO"
                )


                .requestMatchers(
                    HttpMethod.GET,
                    "/api/reportes/*/informe-tecnico"
                ).hasAnyRole(
                    "ADMIN",
                    "SOPORTE",
                    "TECNICO"
                )


                // ==========================================
                // SUMINISTROS
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/suministros/*"
                ).permitAll()


                // ==========================================
                // REPORTE INDIVIDUAL
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/reportes/*"
                ).hasAnyRole(
                    "ADMIN",
                    "SOPORTE",
                    "TECNICO"
                )


                // ==========================================
                // CUALQUIER OTRA PETICIÓN
                // ==========================================

                .anyRequest().authenticated()

            )


            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );


        return http.build();
    }
}