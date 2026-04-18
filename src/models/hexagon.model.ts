import {
    type BiomeId,
    ElementDefs,
    type ElementId
} from "@/types/hexagon.types.js";
import { DomainError } from "@/errors/index.js";
import { ErrorCode } from "@/types/errors.types.js";

export class Hexagon {
    private data: Uint8Array;
    private biomeId: BiomeId;
    private rotation: number = 0; // 0..5

    constructor(biome: BiomeId, elements: ElementId[]) {
        if (elements.length !== 18) {
            throw new DomainError(ErrorCode.HEXAGON_INVALID_SIZE, `Must have 18 elements, got ${elements.length}`);
        }

        this.biomeId = biome;
        this.data = new Uint8Array(elements);
    }

    // =========================
    // ROTATION
    // =========================

    rotate(times: number = 1): void {
        if (times < 0 || times > 5) {
            throw new DomainError(ErrorCode.HEXAGON_ROTATION_OUT_OF_RANGE, "Rotation index out of range");
        }
        this.rotation = times % 6;
    }

    getRotation(): number {
        return this.rotation;
    }

    // =========================
    // DATA ACCESS
    // =========================

    get biome(): BiomeId {
        return this.biomeId;
    }

    get elements(): ElementId[] {
        return Array.from(this.data) as ElementId[];
    }

    getElement(index: number): ElementId {
        if (index < 0 || index >= 18) {
            throw new DomainError(ErrorCode.HEXAGON_INDEX_OUT_OF_RANGE, "Index out of range");
        }

        const rotatedIndex = this.applyRotation(index);
        return this.data[rotatedIndex];
    }

    private applyRotation(index: number): number {
        const ringStart = Math.floor(index / 6) * 6;
        const localIndex = index % 6;

        const rotated = (localIndex - this.rotation + 6) % 6;

        return ringStart + rotated;
    }

    *[Symbol.iterator](): IterableIterator<ElementId> {
        for (let i = 0; i < 18; i++) {
            yield this.getElement(i); // 🔥 importante: usar rotación
        }
    }

    toIndexedElements(): { index: number; element: ElementId }[] {
        const result = [];
        for (let i = 0; i < 18; i++) {
            result.push({
                index: i,
                element: this.getElement(i) // 🔥 rotado
            });
        }
        return result;
    }

    getKey(): string {
        // 🔥 clave basada en estado visible (rotado)
        return this.toIndexedElements()
            .map(e => e.element)
            .join(",");
    }

    // =========================
    // META
    // =========================

    getSectionType(index: number): "exterior" | "interior" | "center" {
        if (index < 6) return "exterior";
        if (index < 12) return "interior";
        return "center";
    }

    getAssetsAt(index: number): number {
        const el = this.getElement(index);
        const def = ElementDefs.get(el);

        if (!def?.assetDensity) return 1;

        const type = this.getSectionType(index);

        return def.assetDensity[type] ?? 1;
    }
}