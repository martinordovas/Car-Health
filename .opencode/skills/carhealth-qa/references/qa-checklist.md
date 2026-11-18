# Checklist de QA

## Backend

- [ ] `./mvnw test` termina correctamente.
- [ ] Los tests nuevos cubren el camino feliz y los errores esperados.
- [ ] El endpoint nuevo aparece en OpenAPI.
- [ ] Las migraciones se aplican desde una base vacía.
- [ ] No se ha editado una migración ya aplicada.
- [ ] Las consultas filtran por usuario/vehículo.
- [ ] Los errores no filtran stack traces ni secretos.

## Frontend

- [ ] `npm test` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] No hay errores nuevos en la consola del navegador.
- [ ] La pantalla funciona con datos, sin datos y con error.
- [ ] Los formularios validan y muestran el foco correctamente.
- [ ] La navegación y los guards funcionan.
- [ ] La vista es usable en móvil y escritorio.
- [ ] Las animaciones respetan `prefers-reduced-motion`.

## i18n

- [ ] Todas las cadenas visibles están en `es.json` y `en.json`.
- [ ] Las dos versiones tienen las mismas claves.
- [ ] No hay textos en español hardcodeados en la versión inglesa.
- [ ] Fechas, moneda y unidades cambian con el idioma.
- [ ] Los `aria-label` y títulos también están traducidos.

## Offline

- [ ] La app carga desde la caché después de una primera visita.
- [ ] Un repostaje guardado sin conexión aparece como pendiente.
- [ ] Al recuperar la conexión se envía una sola vez.
- [ ] Los datos de un usuario no se mezclan con los de otro.
- [ ] Los errores de sincronización se pueden revisar o descartar.

## Autenticación

- [ ] Registro con correo nuevo.
- [ ] Código de verificación correcto e incorrecto.
- [ ] Código caducado.
- [ ] Reenvío con cooldown.
- [ ] Login bloqueado antes de verificar.
- [ ] Login correcto después de verificar.
- [ ] Cierre de sesión y nueva entrada.

## Correo local

- [ ] Mailpit está levantado antes de activar `MAIL_ENABLED=true`.
- [ ] El correo llega a `http://127.0.0.1:8025`.
- [ ] El HTML y el texto plano son legibles.
- [ ] El enlace o código no expone datos sensibles.
- [ ] La prueba no se ha hecho contra un correo real sin permiso.

## Entrega

- [ ] `git status` no contiene archivos accidentales.
- [ ] `git diff --check` pasa.
- [ ] Los cambios no relacionados no se han mezclado.
- [ ] La respuesta final indica qué se ha probado y qué no.
