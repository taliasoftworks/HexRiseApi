# HexRise — Game Rules

## World Structure
- The world is a **2D infinite grid** of areas, each identified by `(worldX, worldY)` integer coordinates.
- Each area is a **50×50 HexBoard**.
- Areas are created on demand when players need them.

---

## Player Spawn Rules

### First Login (new cycle after Cataclysm or first ever)
1. A new area is created for the player.
2. The area is placed at coordinates that maintain a **minimum Chebyshev distance of 5** from all other existing areas with active players.
   - Chebyshev distance: `max(|Δx|, |Δy|) ≥ 5`
3. The player spawns with:
   - 1 randomly generated hero (random stats)
   - 5 randomly generated hex pieces in hand
   - 1 starting hexagon placed on the board

### Returning Player
- On login, the player is returned to their **last active area**.
- Their piece hand and board state are restored from the saved area.

---

## Area Sharing Rules

### Two Players in the Same Area
- Both players take turns in sequence within that area.
- **Online co-presence**: each player has a time limit to act per turn.
- **One player offline**: the AI controls offline player's heroes and settlements defensively.
- Shared areas can lead to cooperation or conflict depending on player decisions.

---

## Epoch Balancing (Multiplayer Fairness)
- When a new area is created adjacent to an existing player's territory, the system attempts to **match the historical epoch** of nearby players.
- A Paleolithic player should not spawn next to a Modern-era player.
- Epoch matching is best-effort based on proximity and available spawn locations.
- The minimum distance rule (≥5) naturally provides a buffer for players to grow before encountering others.

---

## Piece Placement Rules
1. A piece **must be placed adjacent** to at least one existing hexagon.
2. The piece must not **overlap** an occupied cell.
3. Neighbor compatibility rules (element matching) from the `RuleEngine` may affect whether placement is valid.
4. After placing, the player's hand is refreshed: a new random piece replaces the placed one.
5. The player always holds **exactly 5 pieces**.

---

## Scoring Rules
- **Base score**: awarded for each piece placed.
- **Side match bonus**: for each side of the placed hexagon that shares an element with an adjacent hexagon's touching side.
- **Perfect fit bonus**: if all occupied adjacent sides match, a multiplied bonus is awarded.
- Score is accumulated and survives the Cataclysm as **persistent experience**.

---

## Cataclysm Rules
- Triggered **once per month** (server-side scheduled event).
- On trigger:
  - All `Area` documents are deleted from the database.
  - All `Player.currentArea` references are cleared.
  - All hero instances and world state are destroyed.
- **Preserved per player**:
  - Total accumulated score / experience
  - Permanent upgrades purchased between cycles
- Players are notified in advance (TBD: push notification system).

---

## Progression Rules
- Players spend accumulated experience/score between cycles to buy:
  - Permanent stat bonuses for future heroes
  - Additional hero slots
  - Starting technologies (unlock certain elements from turn 1)
  - Better starting piece quality
- Within a cycle, epoch advancement is earned by:
  - Placing pieces and expanding the board
  - Founding and growing settlements
  - Completing AI-generated challenges
  - Surviving Cataclysm warnings / mini-events

---

## AI Interaction Rules
- The AI generates events each turn within an area:
  - **Hostile events**: wolf packs, bandit raids (early epochs); armies, plagues (later epochs)
  - **Environmental events**: storms, droughts, floods (biome-dependent)
- Events must be resolved before the player's next turn or they incur penalties.
- AI difficulty scales with:
  - Current epoch of the area
  - Number of turns since area creation
  - Player score (experienced players face harder AI)
