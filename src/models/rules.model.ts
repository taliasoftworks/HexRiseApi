import { HEX_NEIGHBORS, ElementId, type GenerationContext } from "@/types/hexagon.types.js";
import type { GenerationRule } from "@/types/rules.types.js";


export class RuleEngine {
    constructor(private rules: GenerationRule[] = []) { }

    applyRules(
        context: GenerationContext,
        index: number,
        options: ElementId[]
    ): ElementId[] {
        return this.rules.reduce(
            (opts, rule) => rule.apply(context, index, opts),
            options
        );
    }

    addRule(rule: GenerationRule) {
        this.rules.push(rule);
    }
}

export class MaxThreeElementsRule implements GenerationRule {
    apply(context: GenerationContext, index: number, options: ElementId[]) {
        if (index < 0 || index > 5) return options;

        const data = context.data;

        const used = new Set<ElementId>();

        for (let i = 0; i <= 5; i++) {
            if (i === index) continue;
            const val = data[i];
            if (val !== 0) used.add(val as ElementId);
        }

        // si ya hay 3 tipos → solo permitir esos
        if (used.size >= 3) {
            return options.filter(o => used.has(o));
        }

        return options;
    }
}

export class PriorityConflictRule implements GenerationRule {
    apply(context: GenerationContext, index: number, options: ElementId[]) {
        if (index < 0 || index > 5) return options;

        const data = context.data;
        const defs = context.elementDefs;

        const existingPriority = new Set<ElementId>();

        for (let i = 0; i <= 5; i++) {
            const el = data[i] as ElementId;
            if (defs.get(el)?.priorityExpansion) {
                existingPriority.add(el);
            }
        }

        // si ya hay uno, bloquear otros priority
        if (existingPriority.size > 0) {
            return options.filter(o => {
                const isPriority = defs.get(o)?.priorityExpansion;

                return !isPriority || existingPriority.has(o);
            });
        }

        return options;
    }
}

export class InitialWeightRule implements GenerationRule {
    apply(
        context: GenerationContext,
        index: number,
        options: ElementId[]
    ): ElementId[] {
        // solo exterior
        if (index < 0 || index > 5) return options;

        const data = context.data;
        const defs = context.elementDefs;

        // elementos ya usados en exterior
        const used = new Set<ElementId>();

        for (let i = 0; i <= 5; i++) {
            if (i === index) continue;
            const val = data[i];
            if (val !== 0) used.add(val as ElementId);
        }

        const weighted: ElementId[] = [];

        for (const el of options) {
            const def = defs.get(el);

            const baseWeight = def?.weight ?? 1;

            // 🔥 si ya ha aparecido → peso normal
            const weight = used.has(el) ? 1 : baseWeight;

            for (let i = 0; i < weight; i++) {
                weighted.push(el);
            }
        }

        return weighted;
    }
}

export class OuterRepetitionRule implements GenerationRule {
    apply(context: GenerationContext, index: number, options: ElementId[]) {
        if (index < 0 || index > 5) return options;

        const data = context.data;
        const defs = context.elementDefs;

        const neighbors = HEX_NEIGHBORS[index]
            .filter(i => i >= 0 && i <= 5)
            .map(i => data[i]);

        const boosted: ElementId[] = [...options];

        for (const n of neighbors) {
            if (n === ElementId.Empty) continue; // 🔥 clave

            const def = defs.get(n as ElementId);

            // 🔥 peso influye en repetición
            const repeatWeight = Math.max(1, def?.weight ?? 1);

            for (let i = 0; i < repeatWeight; i++) {
                boosted.push(n as ElementId);
            }
        }

        return boosted;
    }
}