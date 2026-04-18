import { Hexagon } from "@/models/hexagon.model.js";
import { HexBoard } from "@/models/hexboard.model.js";
import { BiomeId, ElementDefs, ElementId } from "@/types/hexagon.types.js";
import { DEFAULT_HEXBOARD_HEIGHT, DEFAULT_HEXBOARD_WIDTH } from "@/types/hexboard.types.js";
import { DomainError } from "@/errors/index.js";
import { ErrorCode } from "@/types/errors.types.js";
import { describe, expect, it } from "vitest";

function expectDomainError(fn: () => unknown, code: ErrorCode): void {
    let caught: unknown;
    try { fn(); } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe(code);
}

describe("Hexboard connections tests", () => {
    it("Only should allow place hexagons compatible with neightbours)", () => {

        const grid: (Hexagon | null)[][] = Array.from({ length: DEFAULT_HEXBOARD_HEIGHT }, () =>
            Array.from({ length: DEFAULT_HEXBOARD_WIDTH }, () => null)
        );
        const hexagon1 = new Hexagon(BiomeId.Grassland, [
            0, ElementId.Road, 0, 0, 0, 0, 
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0
        ]);
        const hexagon2 = new Hexagon(BiomeId.Grassland, [
            0, 0, 0, 0, ElementId.Road, 0, 
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0
        ]);
        grid[0][0] = hexagon1;
        const board = new HexBoard(BiomeId.Grassland, grid);
        expectDomainError(() => board.placeHex(0, 0, hexagon2), ErrorCode.HEXBOARD_POSITION_OCCUPIED);
        hexagon2.rotate(1)
        expectDomainError(() => board.placeHex(1, 0, hexagon2), ErrorCode.HEXBOARD_NEIGHBOR_CONFLICT);
        expectDomainError(() => board.placeHex(2, 0, hexagon2), ErrorCode.HEXBOARD_NO_ADJACENT);
        hexagon2.rotate(0)
        expect(board.placeHex(1, 0, hexagon2)).toBe(true);
        
    });

    it("Should place multiple hexagons and count assets groups correctly (ROADS)", () => {
        const grid: (Hexagon | null)[][] = Array.from({ length: DEFAULT_HEXBOARD_HEIGHT }, () =>
            Array.from({ length: DEFAULT_HEXBOARD_WIDTH }, () => null)
        );
        const hexagon1 = new Hexagon(BiomeId.Grassland, [
            0, ElementId.Road, 0, 0, ElementId.Road, 0, 
            0, ElementId.Road, 0, 0, ElementId.Road, 0,
            0, ElementId.Road, 0, 0, ElementId.Road, 0
        ]);
        
        const hexagon2 = new Hexagon(BiomeId.Grassland, [
            0, ElementId.Road, 0, 0, ElementId.Road, 0, 
            0, ElementId.Road, 0, 0, ElementId.Road, 0,
            0, ElementId.Road, 0, 0, ElementId.Road, 0
        ]);
        grid[5][5] = hexagon1;
        const board = new HexBoard(BiomeId.Grassland, grid);
        board.placeHex(6, 5, hexagon2);

        const groups = board.getGroups();
        expect(groups.length).toBe(1);
        expect(groups[0].element).toBe(ElementId.Road);
        expect(groups[0].assets).toBe(2);
    })

    it("Should place multiple hexagons and count assets groups correctly (FOREST)", () => {
        const grid2: (Hexagon | null)[][] = Array.from({ length: DEFAULT_HEXBOARD_HEIGHT }, () =>
            Array.from({ length: DEFAULT_HEXBOARD_WIDTH }, () => null)
        );
        const hexagon3 = new Hexagon(BiomeId.Grassland, [
            0, ElementId.Forest, ElementId.Forest, ElementId.Forest, ElementId.Forest, ElementId.Forest, 
            0, ElementId.Forest, ElementId.Forest, ElementId.Forest, ElementId.Forest, ElementId.Forest,
            0, ElementId.Forest, ElementId.Forest, ElementId.Forest, ElementId.Forest, ElementId.Forest
        ]);
        
        const hexagon4 = new Hexagon(BiomeId.Grassland, [
            0, ElementId.Forest, ElementId.Forest, ElementId.Forest, ElementId.Forest, ElementId.Forest, 
            0, ElementId.Forest, ElementId.Forest, ElementId.Forest, ElementId.Forest, ElementId.Forest,
            0, ElementId.Forest, ElementId.Forest, ElementId.Forest, ElementId.Forest, ElementId.Forest
        ]);
        grid2[5][5] = hexagon3;
        const board2 = new HexBoard(BiomeId.Grassland, grid2);
        board2.placeHex(6, 5, hexagon4);
        const groups2 = board2.getGroups();
        expect(groups2.length).toBe(1);
        expect(groups2[0].element).toBe(ElementId.Forest);
        const forestDefs = ElementDefs.get(ElementId.Forest)
        let assetsCount = (forestDefs?.assetDensity?.exterior ?? 1) * 10;
        assetsCount += (forestDefs?.assetDensity?.interior ?? 1) * 10;
        assetsCount += (forestDefs?.assetDensity?.center ?? 1) * 10;
        expect(groups2[0].assets).toBe(assetsCount);
    })

    
    it("Should place multiple hexagons and count assets groups correctly (FOREST)", () => {
        const grid2: (Hexagon | null)[][] = Array.from({ length: DEFAULT_HEXBOARD_HEIGHT }, () =>
            Array.from({ length: DEFAULT_HEXBOARD_WIDTH }, () => null)
        );
        const hexagon3 = new Hexagon(BiomeId.Grassland, [
            ElementId.Forest, ElementId.House, ElementId.House, ElementId.Empty, ElementId.Empty, ElementId.Forest, 
            ElementId.Empty, ElementId.House, ElementId.House, ElementId.Empty, ElementId.Empty, ElementId.Empty,
            ElementId.Empty, ElementId.House, ElementId.House, ElementId.Empty, ElementId.Empty, ElementId.Empty
        ]);
        const hexagon4 = new Hexagon(BiomeId.Grassland, [
            ElementId.Empty, ElementId.Empty, ElementId.Empty, ElementId.Empty, ElementId.Empty, ElementId.Empty, 
            ElementId.Empty, ElementId.Empty, ElementId.Empty, ElementId.Empty, ElementId.Empty, ElementId.Empty,
            ElementId.Empty, ElementId.Empty, ElementId.Empty, ElementId.Empty, ElementId.Empty, ElementId.Empty
        ]);
        grid2[25][25] = hexagon3;
        grid2[26][25] = hexagon4;
        const board2 = new HexBoard(BiomeId.Grassland, grid2);
        
        const hexagon5 = new Hexagon(BiomeId.Grassland, [
            ElementId.House, ElementId.Water, ElementId.Forest, ElementId.Forest, ElementId.House, ElementId.House, 
            ElementId.House, ElementId.Water, ElementId.Forest, ElementId.Forest, ElementId.House, ElementId.House, 
            ElementId.House, ElementId.Empty, ElementId.Empty, ElementId.Empty, ElementId.House, ElementId.House
        ]);
        board2.placeHex(26, 26, hexagon5);

        const groups2 = board2.getGroups();
        //expect(groups2.length).toBe(1);
        const findHouseGroup = groups2.find(g => g.element === ElementId.House);
        expect(findHouseGroup?.element).toBe(ElementId.House);

        const houseDefs = ElementDefs.get(ElementId.House)
        let assetsCount = (houseDefs?.assetDensity?.exterior ?? 1) * 5;
        assetsCount += (houseDefs?.assetDensity?.interior ?? 1) * 5;
        assetsCount += (houseDefs?.assetDensity?.center ?? 1) * 5;
        expect(findHouseGroup?.assets).toBe(assetsCount);
    })
});