---
name: typescript-conventions
description: Aplica cuando se escribe o revisa código TypeScript, se crean funciones, interfaces o se trabaja con tipos. Reglas de estilo y convenciones del proyecto.
---

## Reglas TypeScript
- strict mode ON — nunca `any`, usa `unknown` con narrowing explícito
- ES modules siempre (import/export), nunca CommonJS (require)
- Destructura imports: `import { foo } from 'bar.js'`
- `import type` obligatorio para imports solo de tipos (`verbatimModuleSyntax` lo enforcea)
- Interfaces para shapes de datos, `type` para unions/intersections/aliases

## Extensiones en imports (ESM + NodeNext)
Siempre incluye `.js` en imports de archivos locales aunque el fuente sea `.ts`:
```typescript
import { Hexagon } from '@/models/hexagon.model.js'
import type { ElementId } from '@/types/hexagon.types.js'
```

## Typegoose
- `experimentalDecorators: true` está en tsconfig (`ignoreDeprecations: "6.0"` lo permite)
- El proyecto NO usa `emitDecoratorMetadata` — **todos los `@prop` necesitan `type:` explícito**
- Para referencias usa `import type { Ref } from '@typegoose/typegoose'`
- Non-null assertion (`!`) es apropiado en controllers sobre `this.user.id` cuando la ruta tiene `authMiddleware`

## Tipos de retorno inferidos
Prefiere inferencia en funciones simples. Anota explícitamente cuando:
- La función es pública en un service/controller
- El tipo inferido sería `any` o demasiado amplio

## Patrones preferidos
- Errores: lanza `DomainError` / `NotFoundError` / `AppError` — **no** usar Result pattern `{ data, error }`
- Async/await siempre, nunca `.then()/.catch()` encadenados
- Funciones puras en `utils/`, sin side effects
- No uses `BigInt` en hot paths — solo en utils de encoding donde el dataset es acotado
