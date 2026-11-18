---
name: Car Health QA
description: Úsala para verificar cambios de Car Health, revisar regresiones, ejecutar tests y build, comprobar flujos de autenticación, repostajes, mantenimiento, offline, i18n y responsive, o preparar una revisión antes de entregar.
---

# Car Health: verificación y revisión

## Objetivo

Comprobar que un cambio funciona sin romper los flujos críticos y sin dar por hecho lo que no se ha ejecutado.

## Antes de empezar

1. Revisa `git status` y `git diff`. No sobrescribas cambios del usuario.
2. Identifica qué áreas toca el cambio: backend, frontend, base de datos, correo o despliegue.
3. Si hay servidores arrancados, no los detengas sin pedirlo.
4. Comprueba si el cambio necesita una migración o una nueva variable de entorno.

## Verificación mínima

```bash
cd backend
./mvnw test

cd ../frontend
npm test
npm run build

cd ..
git diff --check
```

## Flujos que revisar

- Registro, verificación de correo y login.
- Login bloqueado si el correo no está verificado.
- Dashboard con y sin vehículo.
- Alta y edición de vehículo, incluida la foto.
- Alta de repostaje, cálculo de consumo y ahorro.
- Mantenimiento con recambios y factura.
- Estadísticas y gráficas.
- Descarga del dossier PDF.
- Modo sin conexión y cola de cambios.
- Selector ES/EN y formato de fechas, moneda y etiquetas.
- Navegación móvil, foco de teclado y estados vacíos.

## Cómo reportar

Ordena los hallazgos por gravedad:

1. **Bloqueante**: rompe un flujo principal, seguridad o pérdida de datos.
2. **Importante**: comportamiento incorrecto, regresión visual o error no controlado.
3. **Menor**: detalle de copy, animación, espaciado o accesibilidad.

Para cada hallazgo incluye:

- qué se esperaba;
- qué ocurrió;
- pasos para reproducirlo;
- archivo y línea si es un problema de código;
- si se ha verificado o solo se ha inferido.

## Reglas

- No digas que algo pasa si no lo has ejecutado o comprobado.
- No modifiques código durante una revisión solicitada; informa primero.
- No borres la base H2, logs, capturas ni datos de usuario sin permiso.
- No expongas secretos, tokens ni contenido de correos reales.
- Si un test falla por el entorno, distínguelo de un fallo del cambio.

## Referencias

- Checklist ampliada: `references/qa-checklist.md`
- Contexto de producto y arquitectura: `AGENTS.md`
