import { type BiomeId, ElementDefs, ElementId, HEX_NEIGHBORS } from "@/types/hexagon.types.js";
import { DomainError } from "@/errors/index.js";
import { ErrorCode } from "@/types/errors.types.js";
import { DEFAULT_HEXBOARD_HEIGHT, DEFAULT_HEXBOARD_WIDTH, type ConnectedGroup, type Coord, type NodeRef } from "@/types/hexboard.types.js";
import type { Hexagon } from "./hexagon.model.js";
import { HexagonGenerator } from "./hexagongenerator.model.js";
import { InitialWeightRule, MaxThreeElementsRule, OuterRepetitionRule, PriorityConflictRule, RuleEngine } from "./rules.model.js";

export class HexBoard {

    private grid: (Hexagon | null)[][];
    private width = DEFAULT_HEXBOARD_WIDTH;
    private height = DEFAULT_HEXBOARD_HEIGHT;
    private groups: ConnectedGroup[] = [];
    private biomeId: BiomeId;
    private generator = new HexagonGenerator(new RuleEngine([
        new MaxThreeElementsRule(),
        new PriorityConflictRule(),
        new InitialWeightRule(),
        new OuterRepetitionRule(),
    ]));

    constructor(biomeId: BiomeId, grid: (Hexagon | null)[][] | null = null) {
        this.biomeId = biomeId;
        if (grid) {
            this.grid = grid;
        }

        this.grid ??= Array.from({ length: this.height }, () =>
            Array.from({ length: this.width }, () => null)
        );

        if (!grid) {
            // 🔥 primera pieza en el centro
            const center = this.getCenter();
            this.grid[center.y][center.x] = this.generator.generate(this.biomeId);
        }
    }


    // =========================
    // PUBLIC API
    // =========================

    placeHex(x: number, y: number, hex: Hexagon): boolean {
        if (!this.isInside(x, y)) throw new DomainError(ErrorCode.HEXBOARD_OUT_OF_BOUNDS, "Position out of bounds");
        if (this.grid[y][x]) throw new DomainError(ErrorCode.HEXBOARD_POSITION_OCCUPIED, "There is a hexagon already placed in this position");
        if (!this.hasAdjacentHex(x, y)) throw new DomainError(ErrorCode.HEXBOARD_NO_ADJACENT, "No adjacent hexagons — must place next to existing ones");

        if (!this.canPlaceConsideringNeighbors(x, y, hex)) {
            throw new DomainError(ErrorCode.HEXBOARD_NEIGHBOR_CONFLICT, "Cannot place hex — incompatible with neighboring hexagons");
        }

        this.grid[y][x] = hex;
        this.groups = this.computeGroups();

        return true;
    }

    getGroups(): ConnectedGroup[] {
        return this.groups;
    }

    getHex(x: number, y: number): Hexagon | null {
        if (!this.isInside(x, y)) return null;
        return this.grid[y][x];
    }

    // =========================
    // CORE
    // =========================

    private computeGroups(): ConnectedGroup[] {
        const visited = new Set<string>();
        const groups: ConnectedGroup[] = [];

        const key = (x: number, y: number, i: number) =>
            `${x}-${y}-${i}`;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {

                const hex = this.grid[y][x];
                if (!hex) continue;

                for (let i = 0; i < 18; i++) {

                    const k = key(x, y, i);
                    if (visited.has(k)) continue;

                    const element = hex.getElement(i);
                    if (element === ElementId.Empty) continue;

                    const stack: NodeRef[] = [{ x, y, index: i }];
                    const nodes: NodeRef[] = [];

                    const hexesInGroup = new Set<string>();
                    let assets = 0;
                    let countByHex = false;

                    while (stack.length) {
                        const current = stack.pop()!;
                        const ck = key(current.x, current.y, current.index);

                        if (visited.has(ck)) continue;

                        const currentHex = this.grid[current.y][current.x]!;
                        const el = currentHex.getElement(current.index);

                        if (el !== element) continue;

                        visited.add(ck);

                        const hexKey = `${current.x}-${current.y}`;
                        hexesInGroup.add(hexKey);

                        nodes.push(current);

                        const def = ElementDefs.get(el);

                        if (!def?.assetDensity) {
                            countByHex = true;
                        } else {
                            assets += currentHex.getAssetsAt(current.index);
                        }

                        const neighbors = this.getNeighbors(current);

                        for (const n of neighbors) {
                            const nk = key(n.x, n.y, n.index);
                            if (!visited.has(nk)) {
                                stack.push(n);
                            }
                        }
                    }

                    groups.push({
                        element,
                        nodes,
                        assets: countByHex
                            ? hexesInGroup.size
                            : assets
                    });
                }
            }
        }

        return groups;
    }

    // =========================
    // NEIGHBORS
    // =========================


    private areCompatible(a: ElementId, b: ElementId): boolean {
        const defA = ElementDefs.get(a);
        const defB = ElementDefs.get(b);

        if (!defA || !defB) return true;

        const aConnects = defA.connectsTo;
        const bConnects = defB.connectsTo;

        // 🔥 bidireccional (muy importante)
        const okA = !aConnects || aConnects.includes(b);
        const okB = !bConnects || bConnects.includes(a);

        return okA && okB;
    }

    private canPlaceConsideringNeighbors(x: number, y: number, hex: Hexagon): boolean {
        const adj = this.getAdjacentCoords(x, y);

        for (let dir = 0; dir < 6; dir++) {
            const neighborCoord = adj[dir];
            if (!neighborCoord) continue;

            const neighborHex = this.grid[neighborCoord.y]?.[neighborCoord.x];
            if (!neighborHex) continue;

            const opposite = (dir + 3) % 6;

            const myElement = hex.getElement(dir);
            const neighborElement = neighborHex.getElement(opposite);

            if (!this.areCompatible(myElement, neighborElement)) {
                return false;
            }
        }

        return true;
    }

    private getNeighbors(node: NodeRef): NodeRef[] {
        const result: NodeRef[] = [];

        const hex = this.grid[node.y][node.x];
        if (!hex) return result;

        const currentElement = hex.getElement(node.index);
        const def = ElementDefs.get(currentElement);

        // 🔹 1. internos (estructura base)
        const internal = HEX_NEIGHBORS[node.index] || [];

        for (const i of internal) {
            result.push({ ...node, index: i });
        }

        // 🔥 2. conexión especial para PATHS (AQUÍ 👇)
        if (def?.canPath) {
            for (let i = 0; i < 18; i++) {
                if (i !== node.index && hex.getElement(i) === currentElement) {
                    result.push({ ...node, index: i });
                }
            }
        }

        // 🔹 3. externos (hex vecinos)
        const adj = this.getAdjacentCoords(node.x, node.y);

        for (let dir = 0; dir < 6; dir++) {
            const neighborCoord = adj[dir];
            if (!neighborCoord) continue;

            const neighborHex =
                this.grid[neighborCoord.y]?.[neighborCoord.x];

            if (!neighborHex) continue;

            const opposite = (dir + 3) % 6;

            if (node.index === dir) {
                result.push({
                    x: neighborCoord.x,
                    y: neighborCoord.y,
                    index: opposite
                });
            }
        }

        return result;
    }

    // =========================
    // GRID HELPERS
    // =========================

    private isInside(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    private getCenter(): Coord {
        return {
            x: Math.floor(this.width / 2),
            y: Math.floor(this.height / 2)
        };
    }

    private hasAdjacentHex(x: number, y: number): boolean {
        const adj = this.getAdjacentCoords(x, y);

        return adj.some(c =>
            c && this.grid[c.y]?.[c.x]
        );
    }

    private getAdjacentCoords(x: number, y: number): (Coord | null)[] {
        const even = y % 2 === 0;

        return [
            // 0: arriba-derecha
            { x: x + (even ? 0 : 1), y: y - 1 },

            // 1: derecha
            { x: x + 1, y },

            // 2: abajo-derecha
            { x: x + (even ? 0 : 1), y: y + 1 },

            // 3: abajo-izquierda
            { x: x - (even ? 1 : 0), y: y + 1 },

            // 4: izquierda
            { x: x - 1, y },

            // 5: arriba-izquierda
            { x: x - (even ? 1 : 0), y: y - 1 },
        ].map(c => this.isInside(c.x, c.y) ? c : null);
    }
}