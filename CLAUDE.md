# HexRise API — Claude Context

## Project Overview
Procedural hexagon world-map generator exposed as a REST API. Each hexagon has 18 triangular sections (6 exterior, 6 interior, 6 center) filled with terrain elements. A `HexBoard` arranges hexagons on a 50×50 grid with neighbor-compatibility rules, and a `RuleEngine` governs element distribution during generation.

## Tech Stack
- **Runtime**: Node.js (ES2022, ESM — `"type": "module"`)
- **Language**: TypeScript 6 — strict mode, `verbatimModuleSyntax`
- **API**: Express 5
- **Testing**: Vitest 4 (globals enabled — no imports needed in tests)
- **Visualization**: `canvas` library (PNG output in `tests/output/`)
- **Auth**: Keycloak (types/stubs only, not yet implemented)
- **Build**: `tsc` + `tsc-alias` for path alias resolution

## Directory Structure
```
src/
  app.ts                   # Express factory — createApp()
  index.ts                 # Server entry — port 3000
  controllers/
    index.ts               # BaseController + useController wrapper
    world.controller.ts    # WorldController stub
  models/
    hexagon.model.ts       # Core 18-slot Uint8Array hexagon entity
    hexagongenerator.model.ts  # Procedural generation (5 archetypes)
    hexboard.model.ts      # 50×50 grid + neighbor validation + flood-fill groups
    rules.model.ts         # RuleEngine: 4 rule implementations
  routes/
    index.ts               # Route utility helpers
    world.routes.ts        # GET /world/map
  types/
    hexagon.types.ts       # ElementId, BiomeId enums + ElementDefinition
    hexboard.types.ts      # Board/grid types
    rules.types.ts         # IRule interface
    express.types.ts       # Express + Keycloak request extension
  middlewares/             # Reserved — empty
  test/
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

## Scripts
```bash
npm run dev              # ts-node-dev hot reload (development)
npm run build            # tsc + tsc-alias (outputs to dist/)
npm start                # run compiled dist/index.js
npm test                 # vitest unit tests (src/test/unit)
npm run test:simulator   # vitest simulator — canvas PNG rendering
npx tsc --noEmit         # type-check without building
```

## Testing Conventions
- Vitest globals (`describe`, `it`, `expect`, `beforeEach`) — no imports needed
- Unit tests: `src/test/unit/` — fast, no canvas
- Simulator tests: `src/test/simulator/` — generate PNG to `tests/output/`
- `CustomReporter.ts` provides emoji/color output formatting

## API Pattern
```typescript
// Controllers extend BaseController; useController handles errors + response
export class WorldController extends BaseController {
  getMap = async () => { /* this.req, this.res, this.user available */ }
}
// In routes:
router.get('/map', (req, res) => useController(WorldController, req, res, c => c.getMap()))
```

## Important Notes
- No database — all state is in-memory; generation is purely algorithmic
- Keycloak auth is stubbed via types only — `req.user` comes from Keycloak token
- `tsc-alias` runs post-build to rewrite `@/` aliases in `dist/`
- Morgan is installed but not wired up in `app.ts`
