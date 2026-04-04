-- 02_backfill_pago_cantidad.sql
-- Backfill seguro desde notas con marca [CANTIDAD:n].
-- No elimina ni reescribe notas.

-- 1) Pasa marca a columna cantidad para OTRO.
UPDATE "Pago"
SET "cantidad" = CAST((regexp_match(COALESCE(notas, ''), '\\[CANTIDAD:([0-9]{1,4})\\]'))[1] AS INTEGER)
WHERE tipo = 'OTRO'
  AND "cantidad" IS NULL
  AND COALESCE(notas, '') ~ '\\[CANTIDAD:[0-9]{1,4}\\]';

-- 2) Fallback conservador para OTRO sin marca: cantidad = 1.
UPDATE "Pago"
SET "cantidad" = 1
WHERE tipo = 'OTRO'
  AND "cantidad" IS NULL;

-- 3) Validación posterior al backfill.
SELECT
  COUNT(*) FILTER (WHERE tipo = 'OTRO') AS total_otro,
  COUNT(*) FILTER (WHERE tipo = 'OTRO' AND "cantidad" IS NOT NULL AND "cantidad" > 0) AS otro_con_cantidad_valida,
  COUNT(*) FILTER (WHERE tipo = 'OTRO' AND ("cantidad" IS NULL OR "cantidad" <= 0)) AS otro_invalido
FROM "Pago";
