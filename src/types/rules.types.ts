import type { ElementId, GenerationContext } from "./hexagon.types.js";

export interface GenerationRule {
    apply(context: GenerationContext, index: number, options: ElementId[]): ElementId[];
}
