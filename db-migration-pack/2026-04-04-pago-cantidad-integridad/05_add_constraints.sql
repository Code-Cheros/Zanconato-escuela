-- 05_add_constraints.sql
-- Ejecutar solo cuando prechecks y fix_orphans estén limpios.

-- A) Unicidad talonario por estudiante+año.
ALTER TABLE "Talonario"
ADD CONSTRAINT "Talonario_estudianteId_anio_key"
UNIQUE ("estudianteId", anio);

-- B) FK Pago.registradoPor -> Usuario.id
ALTER TABLE "Pago"
ADD CONSTRAINT "Pago_registradoPor_fkey"
FOREIGN KEY ("registradoPor")
REFERENCES "Usuario" (id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

-- C) FK HistorialConfiguracion.usuarioId -> Usuario.id
ALTER TABLE "HistorialConfiguracion"
ADD CONSTRAINT "HistorialConfiguracion_usuarioId_fkey"
FOREIGN KEY ("usuarioId")
REFERENCES "Usuario" (id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

-- D) Check de cantidad positiva (sin obligar en no-OTRO).
ALTER TABLE "Pago"
ADD CONSTRAINT "Pago_cantidad_positive_chk"
CHECK ("cantidad" IS NULL OR "cantidad" > 0);
