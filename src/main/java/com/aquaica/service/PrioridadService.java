package com.aquaica.service;

import org.springframework.stereotype.Service;

@Service
public class PrioridadService {

    public String calcularPrioridad(String tipoProblema) {

        if (tipoProblema == null) {
            return "MEDIA";
        }

        return switch (tipoProblema.toUpperCase()) {

            case "FUGA_AGUA" ->
                    "ALTA";

            case "CORTE_AGUA" ->
                    "ALTA";

            case "BAJA_PRESION" ->
                    "MEDIA";

            case "FACTURACION" ->
                    "BAJA";

            default ->
                    "MEDIA";
        };
    }
}