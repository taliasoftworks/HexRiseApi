# HexRise API — Claude Context

## Project Overview
HexRise is a **persistent online strategy game** where each player embodies a god controlling heroes. The world is infinite, divided into **areas** (HexBoards of 50×50) identified by `(worldX, worldY)` coordinates. The game is turn-based per area, progresses through historical epochs (Paleolithic → Futuristic), and resets completely every ~1 month via a **Cataclysm** — only player score/experience survive.

The core mechanic is placing hexagon pieces to build each area's board. Each hexagon has 18 triangular sections filled with terrain elements. A `RuleEngine` governs element distribution and neighbor compatibility. Placed pieces score points based on element matches with adjacent hexagons.

Full game documentation: `docs/game-mechanics.md`, `docs/game-rules.md`, `docs/data-model.md`.
Development roadmap: `todo.txt`.

## Tech Stack
- **Runtime**: Node.js (ES2022, ESM — `"type": "module"`)
- **Language**: TypeScript 6 — strict mode, `verbatimModuleSyntax`
- **API**: Express 5
- **Database**: MongoDB via Mongoose + Typegoose (decorators)
- **Testing**: Vitest 4 (globals enabled — no imports needed in tests)
- **Visualization**: `canvas` library (PNG output in `tests/output/`)
- **Auth**: Keycloak — JWT RS256 verified with `jose` using `KEYCLOAK_PUBLIC_KEY` from env
- **Build**: `tsc` + `tsc-alias` for path alias resolution

## Directory Structure
```
src/
  app.ts                   # Express factory — createApp()
  index.ts                 # Server entry — connectDB() then listen
  db/
    connection.ts          # Mongoose connect — reads MONGODB_URI from env
  controllers/
    index.ts               # BaseController + useController wrapper
    world.controller.ts    # WorldController stub
    area.controller.ts     # AreaController — GET /area/current
  models/
    hexagon.model.ts       # Core 18-slot Uint8Array hexagon entity
    hexagongenerator.model.ts  # Procedural generation (5 archetypes)
    hexboard.model.ts      # 50×50 grid + neighbor validation + flood-fill groups
    rules.model.ts         # RuleEngine: 4 rule implementations
    db/
      area.db.model.ts     # Typegoose Area document (worldX, worldY, biome, hexData, hexCount)
      player.db.model.ts   # Typegoose Player document (keycloakId, currentArea ref)
  services/
    area.service.ts        # getOrCreatePlayerArea — find/create + encode board
  routes/
    index.ts               # useController helper
    world.routes.ts        # GET /world/map
    area.routes.ts         # GET /area/current (auth required)
  errors/
    AppError.ts            # Base error class — code: ErrorCode, statusCode, message
    DomainError.ts         # Domain/validation errors (HTTP 400)
    NotFoundError.ts       # 404 errors
    index.ts               # Barrel export
  types/
    hexagon.types.ts       # ElementId, BiomeId enums + ElementDefinition
    hexboard.types.ts      # Board/grid types + DEFAULT_HEXBOARD_WIDTH/HEIGHT
    rules.types.ts         # IRule interface
    express.types.ts       # Express + Keycloak request extension
    errors.types.ts        # ErrorCode enum
  middlewares/
    error.middleware.ts    # Global error handler — AppError → JSON, unknown → 500 + log
    auth.middleware.ts     # JWT RS256 verification — sets res.locals.user.id = sub
  utils/
    hex.encoding.ts        # Binary pack/unpack — 10 bytes per hexagon
  __test__/
    unit/                  # Fast unit tests (npm test)
    simulator/             # Visual simulation tests — generates PNGs
    utils/                 # Color maps, CustomReporter, output dir helper
tests/output/              # Generated PNG visualizations (git-ignored)
```

## Path Aliases
`@/` resolves to `./src/`. Always use it for intra-src imports.
```typescript
// ESM + NodeNext requires explicit .js extension even for .ts source files
import { Hexagon } from '@/models/hexagon.model.js'
import type { ElementId } from '@/types/hexagon.types.js'
```
Use `import type` for type-only imports (`verbatimModuleSyntax` enforces this).

## Key Domain Concepts
| Concept | Values |
|---|---|
| **ElementId** | Empty(0), Forest(1), Mountain(2), House(3), Water(4), Road(5) |
| **BiomeId** | Grassland(0), Desert(1), Frozen(2) |
| **Hexagon slots** | positions 0-5 = exterior, 6-11 = interior, 12-17 = center |
| **Rotation** | 0-5; slot access is rotation-aware |
| **Generation archetypes** | `uniform`, `single_spike`, `sparse`, `path`, `normal` |
| **RuleEngine rules** | MaxThreeElements, PriorityConflict, InitialWeight, OuterRepetition |
| **Area** | One HexBoard on the world grid; identified by `(worldX, worldY)` |
| **World distance** | Chebyshev: `max(|Δx|, |Δy|)`; new areas spawn ≥ 5 from all others |

## Database Layer

### Typegoose models — `src/models/db/`
`experimentalDecorators: true` is set in tsconfig (required by Typegoose).

```typescript
// All prop types must be explicit — project does NOT use emitDecoratorMetadata
@prop({ required: true, type: Number }) worldX!: number;
@prop({ type: Buffer }) hexData?: Buffer;
@prop({ ref: () => Area }) currentArea?: Ref<Area>;
```

**Area** (`areas` collection):
| Field | Type | Description |
|---|---|---|
| `worldX` / `worldY` | Number | Unique area coordinates. Compound unique index. |
| `biome` | Number | BiomeId — shared by all hexagons in the area |
| `hexData` | Buffer | Packed binary — see Hex Encoding section |
| `hexCount` | Number | Number of placed hexagons |

**Player** (`players` collection):
| Field | Type | Description |
|---|---|---|
| `keycloakId` | String | Keycloak `sub` claim. Unique index. |
| `currentArea` | Ref\<Area\> | ObjectId reference to the player's active area |

### Service pattern
`src/services/area.service.ts` — no Express types, pure business logic.
DB queries go directly in services for now (no separate repository layer yet).

## Hex Encoding — `src/utils/hex.encoding.ts`

Binary format: **10 bytes per hexagon** (sparse — only placed hexagons are stored).

```
Bytes 0-1  uint16 BE  grid index = y × BOARD_WIDTH + x   (0–2499 for 50×50)
Bytes 2-8  7 bytes    18 elements × 3 bits packed         (54 bits + 2 padding)
Byte  9    uint8      rotation in bits 0-2                (0–5)
```

Biome is stored at area level, not per-hexagon. Full 50×50 board → ~24 KB raw.
The `hexagons` field in API responses is **base64-encoded** Buffer.

Increasing `DEFAULT_HEXBOARD_WIDTH/HEIGHT` in `src/types/hexboard.types.ts` is the only change needed to support larger boards.

## Auth Middleware — `src/middlewares/auth.middleware.ts`

- Verifies `Authorization: Bearer <jwt>` using RS256 with `KEYCLOAK_PUBLIC_KEY` from env
- Keycloak provides the raw Base64 key (no PEM headers) — the middleware wraps it automatically
- Sets `res.locals.user = { id: payload.sub }` on success
- Always returns 401 (`PLAYER_NOT_AUTHENTICATED`) on failure — **controllers don't re-check auth**
- Public key is cached in memory after first verification

Apply to routes that require authentication:
```typescript
router.get('/current', authMiddleware, useController(AreaController, c => c.getPlayerArea));
```

## Scripts
```bash
npm run dev              # ts-node-dev hot reload (development)
npm run build            # tsc + tsc-alias (outputs to dist/)
npm start                # run compiled dist/index.js
npm test                 # vitest unit tests (src/__test__/unit)
npm run test:simulator   # vitest simulator — canvas PNG rendering
npx tsc --noEmit         # type-check without building
```

## Environment Variables
```bash
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hexrise
# Keycloak: Realm Settings → Keys → RSA → Public Key (raw Base64, no PEM headers)
KEYCLOAK_PUBLIC_KEY=MIIBIjAN...
```

## Testing Conventions
- Vitest globals (`describe`, `it`, `expect`, `beforeEach`) — no imports needed
- Unit tests: `src/__test__/unit/` — fast, no canvas, mock Mongoose models with `vi.mock()`
- Simulator tests: `src/__test__/simulator/` — generate PNG to `tests/output/`
- `CustomReporter.ts` provides emoji/color output formatting

## Error System

**Jerarquía:**
```
AppError (base)
├── DomainError      → HTTP 400 — violaciones de invariantes de dominio
└── NotFoundError    → HTTP 404 — recurso no encontrado
```

**Uso en modelos/services:**
```typescript
import { DomainError } from '@/errors/index.js';
import { ErrorCode } from '@/types/errors.types.js';

throw new DomainError(ErrorCode.HEXBOARD_POSITION_OCCUPIED, 'mensaje');
```

**Respuesta HTTP generada por `errorMiddleware`:**
```json
{ "error": { "code": "HEXBOARD_POSITION_OCCUPIED", "message": "mensaje" } }
```

**Códigos definidos en `ErrorCode`:**
| Código | HTTP | Origen |
|---|---|---|
| `HEXAGON_INVALID_SIZE` | 400 | `Hexagon` constructor |
| `HEXAGON_ROTATION_OUT_OF_RANGE` | 400 | `Hexagon.rotate()` |
| `HEXAGON_INDEX_OUT_OF_RANGE` | 400 | `Hexagon.getElement()` |
| `HEXBOARD_OUT_OF_BOUNDS` | 400 | `HexBoard.placeHex()` |
| `HEXBOARD_POSITION_OCCUPIED` | 400 | `HexBoard.placeHex()` |
| `HEXBOARD_NO_ADJACENT` | 400 | `HexBoard.placeHex()` |
| `HEXBOARD_NEIGHBOR_CONFLICT` | 400 | `HexBoard.placeHex()` |
| `NOT_FOUND` | 404 | `NotFoundError` |
| `PLAYER_NOT_AUTHENTICATED` | 401 | `authMiddleware` |
| `INTERNAL_ERROR` | 500 | errores inesperados (middleware) |

**Tests — helper para verificar tipo y código:**
```typescript
function expectDomainError(fn: () => unknown, code: ErrorCode): void {
    let caught: unknown;
    try { fn(); } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe(code);
}
```

## API Pattern

### Routes protegidas
```typescript
// authMiddleware siempre antes de useController en rutas protegidas
router.get('/current', authMiddleware, useController(AreaController, c => c.getPlayerArea));
```

### Controllers
```typescript
// Controllers extienden BaseController
// this.user.id es siempre string en rutas protegidas (authMiddleware garantiza el sub)
export default class AreaController extends BaseController {
    getPlayerArea = async () => {
        return service.getOrCreatePlayerArea(this.user.id!);
    };
}
```

### Endpoints actuales
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/area/current` | ✅ | Devuelve el área actual del jugador (la crea si es la primera vez) |
| GET | `/world/map` | ❌ | Stub — sin implementar |

### Endpoints planificados (prioridad — ver todo.txt) (ver todo.txt)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/player/init` | ✅ | Inicializa jugador: héroe + 5 piezas + área |
| GET | `/player/me` | ✅ | Estado completo del jugador |
| GET | `/player/me/hand` | ✅ | Mano actual (5 piezas) |
| POST | `/player/me/place-piece` | ✅ | Coloca una pieza, calcula puntos, refresca mano |
| GET | `/player/me/heroes` | ✅ | Lista de héroes del jugador |

## Important Notes
- `tsc-alias` runs post-build to rewrite `@/` aliases in `dist/`
- Keycloak public key is read from `KEYCLOAK_PUBLIC_KEY` env var (raw Base64 from Realm Settings)
- Area coordinates are unbounded integers — the world is infinite

## Documentation
See @docs/game-rules.md for complete game rules.
See @docs/game-mechanics.md for points game mechanics and rules.
See @docs/data-model.md to check data modeling.