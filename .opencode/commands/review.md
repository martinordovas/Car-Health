---
description: Revisa los cambios actuales de Car Health y reporta problemas
agent: plan
---

Carga la skill `carhealth-qa`.

Revisa el diff actual de Car Health, priorizando:

- errores de seguridad o aislamiento entre usuarios;
- pérdida o corrupción de datos;
- regresiones en offline, autenticación o i18n;
- contratos de API inconsistentes;
- falta de pruebas en lógica nueva.

Ordena los hallazgos por gravedad e incluye archivo y línea cuando sea posible. No edites archivos ni hagas commits.
