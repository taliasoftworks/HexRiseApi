---
name: testing-patterns
description: Aplica cuando se escriben tests unitarios, se pide coverage, se hace mock de dependencias o se trabaja con Jest en el proyecto.
---

## Estructura de tests
- Un archivo `src/__test__/unit/nombre.test.ts` por cada archivo fuente
- Describe por módulo, `it()` describe comportamiento (no implementación)
- Arrange / Act / Assert con línea en blanco entre secciones
- Framework: **Vitest** con globals activados — `describe`, `it`, `expect`, `beforeEach` no necesitan import

## Mocks
- Mockea dependencias externas, nunca lógica interna
- `vi.mock()` al nivel del módulo, no dentro de tests individuales
- Usa `beforeEach` para resetear mocks: `vi.clearAllMocks()`

## Errores de dominio
Usa el helper `expectDomainError` para verificar tipo y código a la vez:
```typescript
import { DomainError } from '@/errors/index.js';
import { ErrorCode } from '@/types/errors.types.js';

function expectDomainError(fn: () => unknown, code: ErrorCode): void {
    let caught: unknown;
    try { fn(); } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe(code);
}
// uso:
expectDomainError(() => hexagon.rotate(9), ErrorCode.HEXAGON_ROTATION_OUT_OF_RANGE);
```

## Coverage mínimo
- Services/Models: 90% branches
- Controllers: 70% (solo rutas feliz/error)
- Utils: 100%