Refactoriza el siguiente código siguiendo las convenciones del proyecto definidas en CLAUDE.md.

$ARGUMENTS

Reglas a aplicar:
- No añadas abstracciones ni features que no existan ya en el código
- Mantén la misma API pública (mismos exports, mismas firmas)
- Usa `import type` para imports de solo tipos
- Path alias `@/` con extensión `.js` en todos los imports internos
- Sin comentarios salvo que el WHY sea no obvio
- Nombrado en inglés, camelCase para variables/funciones, PascalCase para clases/tipos

Por cada cambio: una línea explicando el motivo (no el qué, sino el porqué).
