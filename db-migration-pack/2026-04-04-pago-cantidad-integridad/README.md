# Paquete de Migracion Segura - Pago.cantidad + Integridad

## Objetivo
Este paquete agrega soporte estructural para cantidad en pagos y endurece integridad referencial sin romper datos existentes.

## Snapshot verificado en Azure (zaconato-db / postgres)
- grupos_duplicados_talonario: 0
- pagos_registrador_huerfano: 464
- historial_usuario_huerfano: 17
- pagos_otro: 8
- pagos_otro con marca [CANTIDAD:n]: 0
- columna Pago.cantidad: no existe

## Orden de ejecucion
1. 00_prechecks.sql
2. 01_add_pago_cantidad.sql
3. 02_backfill_pago_cantidad.sql
4. 03_add_indexes.sql
5. 04_fix_orphans.sql
6. 00_prechecks.sql (re-ejecutar)
7. 05_add_constraints.sql
8. 00_prechecks.sql (confirmacion final)

## Notas importantes
- 03_add_indexes.sql usa CREATE INDEX CONCURRENTLY; ejecutar fuera de transaccion.
- 05_add_constraints.sql fallara si quedan huérfanos. Por eso 04 es obligatorio antes.
- Este paquete no elimina columnas ni datos.
- Si ya existen constraints con el mismo nombre en otro entorno, ajustar nombres o usar condicionales en una version local.

## Ajuste recomendado en aplicacion (despues de 01)
- Guardar Pago.cantidad directamente desde registrar pago cuando tipo = OTRO.
- Mantener fallback de lectura desde notas durante transicion.

## Validacion funcional minima
- Registrar pago tipo OTRO con cantidad > 1.
- Imprimir recibo y verificar etiqueta CANTIDAD y valor unitario.
- Crear pago normal (COLEGIATURA/MATRICULA) y verificar que no rompe flujo.
- Revisar historial y detalle de pago.
