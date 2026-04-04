-- 01_add_pago_cantidad.sql
-- Cambio aditivo (sin romper): agrega columna cantidad en Pago.

ALTER TABLE "Pago"
ADD COLUMN IF NOT EXISTS "cantidad" INTEGER;

COMMENT ON COLUMN "Pago"."cantidad" IS 'Cantidad asociada al pago, usada en recibo (especialmente tipo OTRO).';
