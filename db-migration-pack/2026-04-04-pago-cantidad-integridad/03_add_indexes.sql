-- 03_add_indexes.sql
-- Indices operativos para consultas frecuentes.
-- CREATE INDEX CONCURRENTLY no puede ejecutarse dentro de transaccion.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pago_fecha"
ON "Pago" (fecha);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pago_tipo"
ON "Pago" (tipo);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pago_estudianteId"
ON "Pago" ("estudianteId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pago_registradoPor"
ON "Pago" ("registradoPor");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_talonario_estudiante_anio"
ON "Talonario" ("estudianteId", anio);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_comprobante_pagado_tipo"
ON "Comprobante" (pagado, tipo);
