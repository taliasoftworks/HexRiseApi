import type { ElementId } from '@/types/hexagon.types.js';
import { DEFAULT_HEXBOARD_WIDTH } from '@/types/hexboard.types.js';

/**
 * Binary layout per hexagon (10 bytes):
 *   [0-1] uint16 BE  grid index = y * BOARD_WIDTH + x   (0-2499)
 *   [2-8] 7 bytes    18 elements × 3 bits packed         (54 bits + 2 padding)
 *   [9]   uint8      rotation in bits 0-2                (0-5)
 *
 * Biome is NOT stored per-hexagon — it lives at area level.
 * Full 50×50 board → 2 500 × 10 = 25 000 bytes raw (~24 KB).
 */

export const HEX_RECORD_BYTES = 10;

export type HexRecord = {
    x: number;
    y: number;
    rotation: number;
    elements: ElementId[];
};

export function encodeHexRecords(records: HexRecord[]): Buffer {
    const buf = Buffer.allocUnsafe(records.length * HEX_RECORD_BYTES);
    for (let i = 0; i < records.length; i++) {
        writeRecord(buf, i * HEX_RECORD_BYTES, records[i]);
    }
    return buf;
}

export function decodeHexRecords(buf: Buffer): HexRecord[] {
    const count = Math.floor(buf.length / HEX_RECORD_BYTES);
    const records: HexRecord[] = new Array(count);
    for (let i = 0; i < count; i++) {
        records[i] = readRecord(buf, i * HEX_RECORD_BYTES);
    }
    return records;
}

function writeRecord(buf: Buffer, offset: number, r: HexRecord): void {
    buf.writeUInt16BE(r.y * DEFAULT_HEXBOARD_WIDTH + r.x, offset);

    // Pack 18 × 3-bit elements into 7 bytes (BigInt for cross-boundary bits)
    let bits = 0n;
    for (let i = 0; i < 18; i++) {
        bits = (bits << 3n) | BigInt(r.elements[i]);
    }
    bits <<= 2n; // pad LSB to align to 56 bits (7 bytes)
    for (let j = 6; j >= 0; j--) {
        buf[offset + 2 + j] = Number(bits & 0xffn);
        bits >>= 8n;
    }

    buf[offset + 9] = r.rotation & 0x7;
}

function readRecord(buf: Buffer, offset: number): HexRecord {
    const gridIndex = buf.readUInt16BE(offset);
    const x = gridIndex % DEFAULT_HEXBOARD_WIDTH;
    const y = Math.floor(gridIndex / DEFAULT_HEXBOARD_WIDTH);

    let bits = 0n;
    for (let j = 0; j < 7; j++) {
        bits = (bits << 8n) | BigInt(buf[offset + 2 + j]);
    }
    bits >>= 2n; // remove 2-bit LSB padding

    const elements: ElementId[] = new Array(18);
    for (let j = 17; j >= 0; j--) {
        elements[j] = Number(bits & 0x7n) as ElementId;
        bits >>= 3n;
    }

    const rotation = buf[offset + 9] & 0x7;

    return { x, y, rotation, elements };
}
