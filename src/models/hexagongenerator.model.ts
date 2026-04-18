import {
    ARCHETYPES_BY_BIOME,
    type BiomeId,
    DEFAULT_ARCHETYPES,
    ElementDefs,
    ElementId,
    ELEMENTS,
    type ArchetypeConfig,
    type GenerationContext,
    type HexArchetype
} from "@/types/hexagon.types.js";
import { type RuleEngine } from "./rules.model.js";
import { Hexagon } from "./hexagon.model.js";

// =========================
// UTILS
// =========================

function weightedRandom(options: ElementId[]): ElementId {
    const counts = new Map<ElementId, number>();

    for (const el of options) {
        counts.set(el, (counts.get(el) || 0) + 1);
    }

    const expanded: ElementId[] = [];

    counts.forEach((count, el) => {
        for (let i = 0; i < count; i++) {
            expanded.push(el);
        }
    });

    return expanded[Math.floor(Math.random() * expanded.length)];
}

function weightedPick<T>(entries: [T, number][]): T | undefined {
    const total = entries.reduce((s, [, w]) => s + w, 0);
    if (total === 0) return undefined;

    let r = Math.random() * total;

    for (const [item, weight] of entries) {
        r -= weight;
        if (r <= 0) return item;
    }

    return entries[0][0];
}

export function selectArchetype(biome: BiomeId): {
    type: HexArchetype;
    config: ArchetypeConfig;
} {
    const set = ARCHETYPES_BY_BIOME[biome] ?? DEFAULT_ARCHETYPES;

    const entries = Object.entries(set) as [HexArchetype, ArchetypeConfig][];

    const total = entries.reduce((sum, [, cfg]) => sum + cfg.weight, 0);

    let r = Math.random() * total;

    for (const [type, cfg] of entries) {
        r -= cfg.weight;
        if (r <= 0) {
            return { type, config: cfg };
        }
    }

    // fallback
    const fallback = entries[0];
    return { type: fallback[0], config: fallback[1] };
}

// =========================
// GENERATOR
// =========================

export class HexagonGenerator {
    constructor(
        private ruleEngine: RuleEngine,
    ) { }

    generate(biome: BiomeId): Hexagon {

        const data = new Uint8Array(18);
        const archetypeResult = selectArchetype(biome);

        const context: GenerationContext = {
            data,
            biome,
            elementDefs: ElementDefs,
            archetype: archetypeResult.type,
            archetypeConfig: archetypeResult.config,
        };

        // 🔥 ARQUETIPOS
        if (this.applyArchetype(context)) {
            return new Hexagon(biome, Array.from(data) as ElementId[]);
        }

        this.generateExterior(context);

        const selected = this.selectInteriorElement(context);

        if (selected) {
            context.interiorElement = selected.element;
            context.interiorTargets = selected.positions;
        }

        this.generateInterior(context);
        this.generateCenter(context);

        return new Hexagon(biome, Array.from(data) as ElementId[]);
    }

    private generatePathPositions(): number[] {
        const count = Math.floor(Math.random() * 4) + 2; // 2–5

        const start = Math.floor(Math.random() * 6);

        const positions: number[] = [start];

        let current = start;

        for (let i = 1; i < count; i++) {
            current = (current + 1) % 6;
            positions.push(current);
        }

        return positions;
    }

    private applyPath(context: GenerationContext, el: ElementId, positions: number[]) {
        const data = context.data;

        for (const pos of positions) {
            data[pos] = el;
        }

        // 🔥 opcional: marcar para expansión interior
        context.interiorElement = el;
        context.interiorTargets = positions;
    }

    private getPathableElements(context: GenerationContext): ElementId[] {
        return ELEMENTS.filter(el =>
            context.elementDefs.get(el)?.canPath
        );
    }

    private pickWeightedUniform(context: GenerationContext): ElementId {
        const entries: [ElementId, number][] = ELEMENTS.map(el => [
            el,
            context.elementDefs.get(el)?.uniformWeight ?? 1
        ]);

        return weightedPick(entries)!;
    }

    private applyArchetype(context: GenerationContext): boolean {
        const data = context.data;
        const cfg = context.archetypeConfig;

        switch (context.archetype) {

            case "uniform": {
                const el = this.pickWeightedUniform(context);
                for (let i = 0; i < 18; i++) {
                    data[i] = el;
                }
                return true;
            }

            case "single_spike": {
                for (let i = 0; i < 18; i++) {
                    data[i] = ElementId.Empty;
                }

                const pos = Math.floor(Math.random() * 6);
                const el = this.pickWeightedUniform(context);

                data[pos] = el;
                return true;
            }

            case "sparse": {
                const density = cfg?.density ?? 0.3;

                for (let i = 0; i < 6; i++) {
                    const options =
                        Math.random() < density
                            ? ELEMENTS
                            : [ElementId.Empty];

                    data[i] = weightedRandom(options);
                }

                return false;
            }

            case "path": {
                const pathable = this.getPathableElements(context);

                if (pathable.length === 0) {
                    return false; // fallback a generación normal
                }

                const el = pathable[Math.floor(Math.random() * pathable.length)];

                // 🔥 limpiar exterior primero
                for (let i = 0; i < 6; i++) {
                    context.data[i] = ElementId.Empty;
                }

                const positions = this.generatePathPositions();

                this.applyPath(context, el, positions);

                // 🔥 rellenar el resto del exterior con ruido normal
                for (let i = 0; i < 6; i++) {
                    if (positions.includes(i)) continue;

                    let options = [...ELEMENTS];
                    options = this.ruleEngine.applyRules(context, i, options);

                    context.data[i] = weightedRandom(options);
                }

                return false;
            }

            default:
                return false;
        }
    }

    private generateExterior(context: GenerationContext) {
        for (let i = 0; i < 6; i++) {
            let options = [...ELEMENTS];

            options = this.ruleEngine.applyRules(context, i, options);

            context.data[i] = weightedRandom(options);
        }
    }

    private selectInteriorElement(context: GenerationContext): {
        element: ElementId;
        positions: number[];
    } | undefined {

        const counts = new Map<ElementId, number>();
        const positions = new Map<ElementId, number[]>();

        for (let i = 0; i < 6; i++) {
            const el = context.data[i] as ElementId;

            counts.set(el, (counts.get(el) || 0) + 1);

            if (!positions.has(el)) positions.set(el, []);
            positions.get(el)!.push(i);
        }

        const valid = Array.from(counts.entries())
            .filter(([el, count]) =>
                el !== ElementId.Empty && count >= 2
            );

        if (valid.length === 0) return undefined;

        const priority = valid.filter(([el]) =>
            context.elementDefs.get(el)?.priorityExpansion
        );

        const pool = priority.length > 0 ? priority : valid;

        const maxCount = Math.max(...pool.map(([_, c]) => c));

        const top = pool
            .filter(([_, c]) => c === maxCount)
            .map(([el]) => el);

        const chosen = top[Math.floor(Math.random() * top.length)];

        return {
            element: chosen,
            positions: positions.get(chosen)!
        };
    }

    // =========================
    // INTERIOR (🔥 con probabilidad)
    // =========================
    private generateInterior(context: GenerationContext) {
        const data = context.data;
        const el = context.interiorElement;
        const chance = context.archetypeConfig?.interiorExpansionChance ?? 1;

        // limpiar interior
        for (let i = 6; i < 12; i++) {
            data[i] = ElementId.Empty;
        }

        if (!el) return;

        // 🔥 NUEVA REGLA: exterior completamente ocupado
        const isFullyOccupied = data
            .slice(0, 6)
            .every(e => e !== ElementId.Empty);

        for (let outer = 0; outer < 6; outer++) {
            const outerEl = data[outer];

            if (outerEl === ElementId.Empty) continue;

            // 🔥 CASO ESPECIAL: anillo completo → expansión garantizada
            if (isFullyOccupied) {
                data[outer + 6] = outerEl;
                continue;
            }

            // 🔸 comportamiento normal
            if (outerEl !== el) continue;

            if (Math.random() < chance) {
                data[outer + 6] = el;
            }
        }
    }

    // =========================
    // CENTRO (🔥 con probabilidad)
    // =========================
    private generateCenter(context: GenerationContext) {
        const data = context.data;
        const el = context.interiorElement;
        const chance = context.archetypeConfig?.centerExpansionChance ?? 1;

        for (let i = 12; i < 18; i++) {
            data[i] = ElementId.Empty;
        }

        if (!el) return;

        for (let inner = 6; inner < 12; inner++) {
            if (data[inner] !== el) continue;

            if (Math.random() < chance) {
                data[inner + 6] = el;
            }
        }
    }
}