Genera tests unitarios completos con Vitest para el archivo indicado.

Archivo: $ARGUMENTS

Sigue estas convenciones del proyecto:
- Framework: Vitest con globals activados (describe, it, expect, beforeEach — sin imports)
- Los tests van en `src/test/unit/` respetando la estructura de carpetas del archivo fuente
- Usa `import type` para tipos (verbatimModuleSyntax)
- Importa con alias `@/` y extensión `.js` (ESM + NodeNext)
- Cubre: comportamiento esperado, casos edge, entradas inválidas y valores límite
- Si el módulo tiene dependencias externas, usa vi.mock() de Vitest (no jest.mock)
- No generes tests para métodos privados, solo la API pública
