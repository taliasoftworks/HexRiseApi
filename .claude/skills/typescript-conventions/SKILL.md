---
name: typescript-conventions
description: Aplica cuando se escribe o revisa código TypeScript, se crean funciones, interfaces o se trabaja con tipos. Reglas de estilo y convenciones del proyecto.
---

## Reglas TypeScript
- strict mode ON — nunca `any`, usa `unknown` con narrowing explícito
- ES modules siempre (import/export), nunca CommonJS (require)
- Destructura imports: `import { foo } from 'bar'`
- Interfaces para shapes de datos, `type` para unions/intersections
- Zod para validación de inputs externos, no interfaces solas

## Patrones preferidos
- Errores: lanza `DomainError` / `NotFoundError` desde modelos y services — **no** usar Result pattern `{ data, error }`
- Async/await siempre, nunca .then()/.catch() encadenados
- Funciones puras en utils/, sin side effects