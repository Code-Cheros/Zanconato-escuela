-- 04_fix_orphans.sql
-- Corrige huérfanos antes de crear llaves foráneas.
-- Reasigna a un usuario ADMINISTRATIVO activo (el más antiguo).

DO $$
DECLARE
  v_fallback_user_id TEXT;
BEGIN
  SELECT id
  INTO v_fallback_user_id
  FROM "Usuario"
  WHERE rol = 'ADMINISTRATIVO'
    AND activo = true
  ORDER BY "creadoEn" ASC
  LIMIT 1;

  IF v_fallback_user_id IS NULL THEN
    RAISE EXCEPTION 'No existe un Usuario ADMINISTRATIVO activo para reasignar huérfanos.';
  END IF;

  UPDATE "Pago" p
  SET "registradoPor" = v_fallback_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM "Usuario" u WHERE u.id = p."registradoPor"
  );

  UPDATE "HistorialConfiguracion" h
  SET "usuarioId" = v_fallback_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM "Usuario" u WHERE u.id = h."usuarioId"
  );
END $$;

-- Validación final de huérfanos.
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
