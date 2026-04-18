---
name: api-structure
description: Aplica cuando se crean o modifican controllers, services, repositories, rutas de la API REST, o se diseña la arquitectura de un endpoint nuevo.
---

## Capas (MUST respetar)
Controller → Service → Repository → DB

- Controller: extrae params, llama service, devuelve respuesta HTTP
- Service: lógica de negocio, sin tipos Express (Request/Response)
- Repository: todas las queries a DB, devuelve entidades de dominio
- Middleware: validación Zod antes de llegar al controller

## Convención de errores

Jerarquía en `src/errors/`:
```
AppError (base — code: ErrorCode, statusCode, message)
├── DomainError   → HTTP 400 — violaciones de invariantes de dominio
└── NotFoundError → HTTP 404
```

- Lanza siempre desde modelos/services: `throw new DomainError(ErrorCode.X, msg)`
- El middleware `src/middlewares/error.middleware.ts` captura todo y serializa a JSON:
  `{ "error": { "code": "...", "message": "..." } }`
- Los códigos viven en `ErrorCode` (`src/types/errors.types.ts`) — añade uno nuevo por cada error semánticamente distinto
- Nunca devuelvas 500 sin loggear el error original (`console.error` mínimo)