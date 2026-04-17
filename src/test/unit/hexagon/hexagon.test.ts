import { Hexagon } from "@/models/hexagon.model.js";
import { BiomeId, ElementDefs, ElementId } from "@/types/hexagon.types.js";
import { describe, expect, it } from "vitest";

describe("Hexgon unit tests", () => {
    it("Should apply rotation correctly", () => {
        //Generate new hexagon with forest in postion 0
        const hexagon = new Hexagon(BiomeId.Grassland, [
            ElementId.Forest, ElementId.House, 0, 0, 0, 0, 
            ElementId.Forest, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0
        ]);

        hexagon.rotate(1);

        expect(hexagon.getElement(0)).toBe(0);
        expect(hexagon.getElement(1)).toBe(ElementId.Forest);
        expect(hexagon.getElement(2)).toBe(ElementId.House)
        expect(hexagon.getElement(6)).toBe(0);
        expect(hexagon.getElement(7)).toBe(ElementId.Forest);

        hexagon.rotate(2);

        expect(hexagon.getElement(0)).toBe(0);
        expect(hexagon.getElement(2)).toBe(ElementId.Forest);
        expect(hexagon.getElement(3)).toBe(ElementId.House)
        expect(hexagon.getElement(6)).toBe(0);
        expect(hexagon.getElement(8)).toBe(ElementId.Forest);

        hexagon.rotate(5);

        expect(hexagon.getElement(0)).toBe(ElementId.House);
        expect(hexagon.getElement(5)).toBe(ElementId.Forest);
        expect(hexagon.getElement(6)).toBe(0);
        expect(hexagon.getElement(11)).toBe(ElementId.Forest);
    });

    it("Should retrieve assets correcty from index", () => {
        //Generate new hexagon with forest in postion 0
        const hexagon = new Hexagon(BiomeId.Grassland, [
            ElementId.Forest, ElementId.House, 0, 0, 0, 0, 
            ElementId.Forest, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0
        ]);

        hexagon.rotate(1);
        const forestDef = ElementDefs.get(ElementId.Forest)
        expect(hexagon.getAssetsAt(1)).toBe(forestDef?.assetDensity?.exterior);
        expect(hexagon.getAssetsAt(7)).toBe(forestDef?.assetDensity?.interior);
    });
});