---
name: api-structure
description: Aplica cuando se crean o modifican controllers, services, rutas de la API REST, modelos Typegoose o se diseña la arquitectura de un endpoint nuevo.
---

## Capas (MUST respetar)
Controller → Service → DB Model (Typegoose)

- **Controller** (`src/controllers/`): extrae `this.user.id`, llama al service, devuelve la respuesta. Sin lógica de negocio ni queries directas.
- **Service** (`src/services/`): lógica de negocio. Sin tipos Express. Usa los modelos Typegoose directamente (no hay capa Repository por ahora).
- **DB Models** (`src/models/db/`): Typegoose. Solo definen el schema y exportan el Model.
- **Middleware**: `authMiddleware` antes de `useController` en rutas protegidas.

## Patrón de rutas protegidas
```typescript
// auth.middleware verifica JWT RS256 y setea res.locals.user.id = sub
// Los controllers NO comprueban autenticación — el middleware lo garantiza
router.get('/current', authMiddleware, useController(AreaController, c => c.getPlayerArea));
```

## Patrón de controller
```typescript
export default class AreaController extends BaseController {
    getPlayerArea = async () => {
        // this.user.id siempre es string en rutas con authMiddleware
        return service.getOrCreatePlayerArea(this.user.id!);
    };
}
```

## Modelos Typegoose
El proyecto NO usa `emitDecoratorMetadata`. **Todos los props necesitan `type:` explícito.**
```typescript
@prop({ required: true, type: Number }) worldX!: number;
@prop({ type: Buffer })                 hexData?: Buffer;
@prop({ ref: () => OtherClass })        relation?: Ref<OtherClass>;
```
Siempre añade índices relevantes con `@index(...)` en el decorador de clase.

## Codificación de datos binarios
Los datos de hexágonos se almacenan como `Buffer` en MongoDB (campo `hexData`).
Para serializar/deserializar usa `src/utils/hex.encoding.ts` — 10 bytes/hexágono.
La respuesta HTTP devuelve el Buffer codificado en **base64** (`.toString('base64')`).

## Convención de errores

Jerarquía en `src/errors/`:
```
AppError (base — code: ErrorCode, statusCode, message)
├── DomainError   → HTTP 400 — violaciones de invariantes de dominio
└── NotFoundError → HTTP 404
```
Auth errors → `new AppError(ErrorCode.PLAYER_NOT_AUTHENTICATED, msg, 401)`

- Lanza siempre desde services/models: `throw new DomainError(ErrorCode.X, msg)`
- El middleware `src/middlewares/error.middleware.ts` captura todo y serializa a JSON
- Los códigos viven en `ErrorCode` (`src/types/errors.types.ts`) — añade uno por cada error semánticamente distinto
- Nunca devuelvas 500 sin loggear el error original

## Variables de entorno requeridas
```
MONGODB_URI          # URI de MongoDB
KEYCLOAK_PUBLIC_KEY  # Raw Base64 desde Keycloak Realm Settings → Keys → RSA
```
