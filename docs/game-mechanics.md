# HexRise — Game Mechanics

## Core Concept
HexRise is a persistent online world where each player embodies a god controlling heroes. The world is infinite, divided into **areas** (HexBoards) that represent the current play zone. The game progresses through historical epochs from the Paleolithic to a futuristic era.

---

## Turn System
- The game is **turn-based per area**.
- Each player can perform a set of **actions per turn** determined by:
  - Number of heroes controlled
  - Available buildings/cities in the area
- Turn order within a shared area: **Player A → Player B → Machine (AI)**.
- If a player is offline in a shared area, the **AI controls their elements defensively**.
- Online co-presence: both players have a **time limit to act** each turn.

---

## Piece Placement (Core Mechanic)
- Each player always holds **5 hexagon pieces** in hand, generated randomly.
- When a piece is placed, a new random piece is added to the last slot (FIFO queue).
- Pieces can only be placed **adjacent to existing hexagons** on the board.
- The first area starts with a **single hexagon** on an empty board.

### Scoring
| Condition | Points |
|---|---|
| Place a piece | Base points |
| Each shared element side with adjacent hex | Bonus points per matching side |
| All sides match adjacent hexagons | Extra "perfect fit" bonus |

---

## Hexagon Structure
Each hexagon piece is divided into **18 triangular sections** across 3 concentric rings:
- **Exterior ring**: positions 0–5
- **Interior ring**: positions 6–11
- **Center ring**: positions 12–17

Each section contains one element. Elements determine resource groups and asset counts.

### Elements
| ID | Name | Notes |
|---|---|---|
| 0 | Empty | No resource |
| 1 | Forest | Food, wood |
| 2 | Mountain | Stone, minerals |
| 3 | House | Population |
| 4 | Water | Food, navigation |
| 5 | Road | Movement bonus |

*(More elements may be added as the game expands.)*

### Biomes
| ID | Name |
|---|---|
| 0 | Grassland |
| 1 | Desert |
| 2 | Frozen |

*(More biomes may be added. Each area has a single biome.)*

---

## Element Groups & Assets
When hexagons share the same element on adjacent sides, they form **element groups**. Each group tracks:
- Total asset count (sum of matching element sections across connected hexagons)
- Available resources derived from the group size

Asset counts influence gameplay features:
- **Food availability** → hero sustenance, population growth
- **Population threshold** → ability to found settlements
- **Resource thresholds** → enable construction (farms, workshops, etc.)

---

## Hero System
- Each player starts with **one randomly generated hero** with randomized stats.
- Heroes improve by performing actions (combat, exploration, construction).
- Hero count can increase by spending epoch progression points.
- Heroes define the number of **actions available per turn**.

### Hero Stats (initial — expand later)
- Strength, Agility, Intelligence (all randomized at spawn)
- Level (starts at 1, increases with XP)

---

## Epoch Progression
The game starts in the **Paleolithic** and advances through epochs:
1. Paleolithic
2. Neolithic
3. Ancient
4. Medieval
5. Renaissance / Industrial
6. Modern
7. Futuristic

Advancing requires accumulating epoch points (earned via actions, settlements, discoveries). Each epoch unlocks new elements, buildings, heroes, and technologies.

---

## AI (The Machine)
The AI opposes the player actively:
- Spawns hostile events (wolf packs, natural disasters, raids)
- Controls offline players' assets defensively
- Difficulty scales with the player's current epoch and area age
- Goal: destroy player progress before the Cataclysm resets the world

---

## Cataclysm
- A **world-wide reset** occurs every **~1 month** (configurable).
- On Cataclysm:
  - All areas, hexagons, heroes, and world progress are **deleted**
  - Players retain their **accumulated experience and score**
  - Score can be spent on: permanent upgrades, extra heroes, new technologies, etc.
- The next cycle begins fresh, but experienced players start stronger.
