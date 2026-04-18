import type { BiomeId } from '@/types/hexagon.types.js';
import { BIOMES } from '@/types/hexagon.types.js';
import { DEFAULT_HEXBOARD_WIDTH, DEFAULT_HEXBOARD_HEIGHT } from '@/types/hexboard.types.js';
import { AreaModel } from '@/models/db/area.db.model.js';
import { PlayerModel } from '@/models/db/player.db.model.js';
import { HexBoard } from '@/models/hexboard.model.js';
import { encodeHexRecords, type HexRecord } from '@/utils/hex.encoding.js';
import type { DocumentType } from '@typegoose/typegoose';
import type { Area } from '@/models/db/area.db.model.js';

const MIN_AREA_DISTANCE = 5;

export type AreaResponse = {
    areaX: number;
    areaY: number;
    biome: number;
    width: number;
    height: number;
    hexagons: string; // base64-encoded binary (see hex.encoding.ts)
};

export class AreaService {
    async getOrCreatePlayerArea(keycloakSub: string): Promise<AreaResponse> {
        let player = await PlayerModel.findOne({ keycloakId: keycloakSub })
            .populate<{ currentArea: DocumentType<Area> | null }>('currentArea')
            .lean();

        if (!player) {
            player = await PlayerModel.create({ keycloakId: keycloakSub }) as any;
        }

        const populated = (player as any).currentArea as DocumentType<Area> | null | undefined;
        if (populated) return toResponse(populated);

        return this.createAreaForPlayer(keycloakSub);
    }

    private async createAreaForPlayer(keycloakSub: string): Promise<AreaResponse> {
        const existingCoords = await AreaModel.find({}, { worldX: 1, worldY: 1, _id: 0 }).lean();

        const coords = findAvailableCoords(existingCoords as { worldX: number; worldY: number }[]);
        const biome = pickBiome();
        const board = new HexBoard(biome);
        const { hexData, hexCount } = encodeBoard(board);

        const area = await AreaModel.create({
            worldX: coords.x,
            worldY: coords.y,
            biome,
            hexData,
            hexCount,
        });

        await PlayerModel.updateOne(
            { keycloakId: keycloakSub },
            { currentArea: area._id },
        );

        return toResponse(area);
    }
}

// =========================
// HELPERS
// =========================

function toResponse(area: { worldX: number; worldY: number; biome: number; hexData?: Buffer | null; hexCount: number }): AreaResponse {
    return {
        areaX: area.worldX,
        areaY: area.worldY,
        biome: area.biome,
        width: DEFAULT_HEXBOARD_WIDTH,
        height: DEFAULT_HEXBOARD_HEIGHT,
        hexagons: area.hexData ? area.hexData.toString('base64') : '',
    };
}

function encodeBoard(board: HexBoard): { hexData: Buffer; hexCount: number } {
    const records: HexRecord[] = [];

    for (let y = 0; y < DEFAULT_HEXBOARD_HEIGHT; y++) {
        for (let x = 0; x < DEFAULT_HEXBOARD_WIDTH; x++) {
            const hex = board.getHex(x, y);
            if (!hex) continue;
            records.push({
                x,
                y,
                rotation: hex.getRotation(),
                elements: hex.elements,
            });
        }
    }

    return { hexData: encodeHexRecords(records), hexCount: records.length };
}

function findAvailableCoords(existing: { worldX: number; worldY: number }[]): { x: number; y: number } {
    if (existing.length === 0) return { x: 0, y: 0 };

    // Chebyshev spiral search — checks border ring by ring from origin
    for (let radius = 0; radius <= 100_000; radius++) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
                if (isFarEnough({ x: dx, y: dy }, existing)) return { x: dx, y: dy };
            }
        }
    }

    throw new Error('No available area coordinates found');
}

function isFarEnough(
    candidate: { x: number; y: number },
    areas: { worldX: number; worldY: number }[],
): boolean {
    return areas.every(
        a => Math.max(Math.abs(candidate.x - a.worldX), Math.abs(candidate.y - a.worldY)) >= MIN_AREA_DISTANCE,
    );
}

function pickBiome(): BiomeId {
    return BIOMES[Math.floor(Math.random() * BIOMES.length)] as BiomeId;
}
