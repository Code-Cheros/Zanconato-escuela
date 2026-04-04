-- 00_prechecks.sql
-- Ejecutar primero. No modifica datos.

SELECT
  COUNT(*) AS total_pagos,
  COUNT(*) FILTER (WHERE tipo = 'OTRO') AS pagos_otro,
  COUNT(*) FILTER (WHERE tipo = 'OTRO' AND COALESCE(notas, '') ~ '\\[CANTIDAD:[0-9]{1,4}\\]') AS otro_con_marca_cantidad,
  COUNT(*) FILTER (WHERE tipo = 'OTRO' AND NOT (COALESCE(notas, '') ~ '\\[CANTIDAD:[0-9]{1,4}\\]')) AS otro_sin_marca_cantidad
FROM "Pago";

SELECT
  COUNT(*) AS grupos_duplicados_talonario
FROM (
  SELECT "estudianteId", anio
  FROM "Talonario"
  GROUP BY "estudianteId", anio
  HAVING COUNT(*) > 1
) d;

SELECT
  COUNT(*) AS pagos_registrador_huerfano
FROM "Pago" p
LEFT JOIN "Usuario" u ON u.id = p."registradoPor"
WHERE u.id IS NULL;

SELECT
  COUNT(*) AS historial_usuario_huerfano
FROM "HistorialConfiguracion" h
LEFT JOIN "Usuario" u ON u.id = h."usuarioId"
WHERE u.id IS NULL;

SELECT
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'Pago'
      AND column_name = 'cantidad'
  ) AS pago_tiene_columna_cantidad;
