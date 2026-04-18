# HexRise — Data Model

## Overview
All persistent data is stored in MongoDB. The main collections are `areas`, `players`, and (future) `heroes`.

---

## Area (`areas` collection)
Represents one HexBoard in the world grid.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | MongoDB document ID |
| `worldX` | Number | X coordinate in world grid |
| `worldY` | Number | Y coordinate in world grid |
| `biome` | Number | `BiomeId` — shared by all hexagons in this area |
| `hexData` | Buffer | Binary-packed hexagon data (10 bytes per hex) |
| `hexCount` | Number | Number of placed hexagons |
| `epoch` | Number | Current historical epoch of this area (0 = Paleolithic) |
| `createdAt` | Date | Area creation timestamp |

**Indexes**: compound unique on `(worldX, worldY)`.

### Hex Encoding (hexData)
Binary format: **10 bytes per hexagon** (sparse — only placed hexagons stored).
```
Bytes 0-1  uint16 BE  grid index = y × BOARD_WIDTH + x   (0–2499 for 50×50)
Bytes 2-8  7 bytes    18 elements × 3 bits packed         (54 bits + 2 padding)
Byte  9    uint8      rotation in bits 0-2                (0–5)
```
Full 50×50 board → ~24 KB raw. API responses return hexData as **base64-encoded** Buffer.

---

## Player (`players` collection)
Represents a god-player account linked to Keycloak.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | MongoDB document ID |
| `keycloakId` | String | Keycloak `sub` claim. Unique. |
| `currentArea` | Ref\<Area\> | ObjectId ref to the player's active area |
| `score` | Number | Persistent accumulated score (survives Cataclysm) |
| `experience` | Number | Persistent experience points |
| `permanentUpgrades` | Mixed | Purchased upgrades (TBD structure) |
| `pieceHand` | Array | Current 5-piece hand (array of serialized hexagons) |

**Indexes**: unique on `keycloakId`.

### pieceHand
Array of exactly 5 elements. Each element is a serialized hexagon:
```json
{
  "slots": [0,1,2,1,0,2, 1,0,1,2,1,0, 1,1,0,0,1,2],
  "rotation": 0
}
```
When a piece is placed, it is removed from `pieceHand[0..n]` and a new random piece is appended.

---

## Hero (`heroes` collection) — *planned*
Represents a hero controlled by a player.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | MongoDB document ID |
| `playerId` | Ref\<Player\> | Owning player |
| `areaId` | Ref\<Area\> | Current area |
| `name` | String | Generated hero name |
| `level` | Number | Hero level (starts at 1) |
| `strength` | Number | Combat stat |
| `agility` | Number | Movement / dodge stat |
| `intelligence` | Number | Tech / magic stat |
| `xp` | Number | Current XP toward next level |
| `epoch` | Number | Epoch at time of hero creation |

Heroes are **deleted on Cataclysm**. Only `Player.score` and `Player.experience` survive.

---

## Epoch Reference
| ID | Name |
|---|---|
| 0 | Paleolithic |
| 1 | Neolithic |
| 2 | Ancient |
| 3 | Medieval |
| 4 | Renaissance / Industrial |
| 5 | Modern |
| 6 | Futuristic |

---

## Element Reference
| ID | Name |
|---|---|
| 0 | Empty |
| 1 | Forest |
| 2 | Mountain |
| 3 | House |
| 4 | Water |
| 5 | Road |

## Biome Reference
| ID | Name |
|---|---|
| 0 | Grassland |
| 1 | Desert |
| 2 | Frozen |
