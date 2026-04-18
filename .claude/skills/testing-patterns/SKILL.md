---
name: testing-patterns
description: Aplica cuando se escriben tests unitarios, se pide coverage, se hace mock de dependencias o se trabaja con Vitest en el proyecto.
---

## Estructura de tests
- Un archivo `src/__test__/unit/nombre.test.ts` por cada archivo fuente
- `describe` por módulo, `it()` describe comportamiento (no implementación)
- Arrange / Act / Assert con línea en blanco entre secciones
- Framework: **Vitest** con globals activados — `describe`, `it`, `expect`, `beforeEach` no necesitan import

## Mocks
- Mockea dependencias externas, nunca lógica interna
- `vi.mock()` al nivel del módulo, no dentro de tests individuales
- Usa `beforeEach(() => vi.clearAllMocks())` para resetear

### Mock de modelos Typegoose/Mongoose
Los modelos exportan un objeto con métodos estáticos. Mockéalos así:
```typescript
vi.mock('@/models/db/area.db.model.js', () => ({
    AreaModel: {
        find: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        updateOne: vi.fn(),
    },
}));
```
Nunca conectes a una base de datos real en tests unitarios.

### Mock de jose (authMiddleware)
```typescript
vi.mock('jose', () => ({
    importSPKI: vi.fn().mockResolvedValue({}),
    jwtVerify: vi.fn().mockResolvedValue({ payload: { sub: 'test-player-id' } }),
}));
```

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

## Errores de auth (AppError)
```typescript
import { AppError } from '@/errors/index.js';
import { ErrorCode } from '@/types/errors.types.js';

function expectAppError(fn: () => unknown, code: ErrorCode, status: number): void {
    let caught: unknown;
    try { fn(); } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(AppError);
    expect((caught as AppError).code).toBe(code);
    expect((caught as AppError).statusCode).toBe(status);
}
```

## Coverage mínimo
- Services/Models de dominio: 90% branches
- Controllers: 70% (happy path + error de auth)
- Utils (hex.encoding, etc.): 100%
