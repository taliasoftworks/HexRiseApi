import { HexagonGenerator } from "@/models/hexagongenerator.model.js";
import { InitialWeightRule, MaxThreeElementsRule, OuterRepetitionRule, PriorityConflictRule, RuleEngine } from "@/models/rules.model.js";
import { BiomeId, ElementDefs, ElementId, ELEMENTS } from "@/types/hexagon.types.js";
import { describe, expect, it } from "vitest";

const CENTER_RING = [12, 13, 14, 15, 16, 17];
const OUTER_RING = [0, 1, 2, 3, 4, 5];
const SIZE = 10000;

describe("Hexagon probability test", () => {
    it("should count element appearance only in outer ring (0-5)", () => {

        const rules = new RuleEngine([
            new MaxThreeElementsRule(),
            new PriorityConflictRule(),
            new InitialWeightRule(),
            new OuterRepetitionRule(),
        ]);

        const generator = new HexagonGenerator(rules);

        // contador solo del anillo exterior
        const counts: Record<number, number> = {};

        for (let i = 0; i < SIZE; i++) {
            const hex = generator.generate(BiomeId.Grassland);

            // ⚠️ asumimos hex.elements indexado por posición
            OUTER_RING.forEach((pos) => {
                const element = hex.elements?.[pos];
                if (element !== undefined) {
                    counts[element] = (counts[element] ?? 0) + 1;
                }
            });
        }

        // total de apariciones SOLO del anillo exterior
        const total = Object.values(counts).reduce((a, b) => a + b, 0);

        console.log("\n📊 Outer ring element distribution:\n");

        for (const id of ELEMENTS) {
            const count = counts[id] ?? 0;
            const probability = total > 0 ? count / total : 0;

            console.log(
                `${ElementId[id]} (${id}): ${count} -> ${(probability * 100).toFixed(2)}%`
            );
        }

        expect(total).toBeGreaterThan(0);
    });


    it("should count how many hexagons are fully composed of a single element", () => {

        const rules = new RuleEngine([
            new MaxThreeElementsRule(),
            new PriorityConflictRule(),
            new InitialWeightRule(),
            new OuterRepetitionRule()
        ]);

        const generator = new HexagonGenerator(rules);

        // contador de hexágonos uniformes por elemento
        const uniformCounts: Record<number, number> = {};

        for (let i = 0; i < SIZE; i++) {
            const hex = generator.generate(BiomeId.Grassland);

            const elements = hex.elements ?? [];

            if (elements.length === 0) continue;

            const first = elements[0];

            // comprobar si TODOS son iguales
            const isUniform = elements.every(e => e === first);

            if (isUniform) {
                uniformCounts[first] = (uniformCounts[first] ?? 0) + 1;
            }
        }

        console.log("\n📊 Fully uniform hexagons (all cells same element):\n");

        for (const id of ELEMENTS) {
            const count = uniformCounts[id] ?? 0;
            const probability = (count / SIZE) * 100;

            console.log(
                `${ElementId[id]} (${id}): ${count}/1000 -> ${probability.toFixed(2)}%`
            );
        }

        const totalUniform = Object.values(uniformCounts).reduce((a, b) => a + b, 0);

        console.log(`\nTotal uniform hexagons: ${totalUniform}/${SIZE}`);

        expect(SIZE).toBeGreaterThan(0);
    });

    it("should measure probability of having exactly one non-empty cell in the outer ring", () => {

        const rules = new RuleEngine([
            new MaxThreeElementsRule(),
            new PriorityConflictRule(),
            new InitialWeightRule(),
            new OuterRepetitionRule(),
        ]);

        const generator = new HexagonGenerator(rules);
        const counts: Record<number, number> = {};
        let totalMatches = 0;

        for (let i = 0; i < SIZE; i++) {
            const hex = generator.generate(BiomeId.Grassland);
            const elements = hex.elements ?? [];

            let nonEmptyCount = 0;
            let foundElement: number | null = null;

            for (const pos of OUTER_RING) {
                const el = elements[pos];

                if (el !== ElementId.Empty && el !== undefined) {
                    nonEmptyCount++;
                    foundElement = el;
                }
            }

            // ✅ exactamente 1 casilla con elemento
            if (nonEmptyCount === 1 && foundElement !== null) {
                counts[foundElement] = (counts[foundElement] ?? 0) + 1;
                totalMatches++;
            }
        }

        console.log("\n📊 Outer ring with exactly ONE non-empty cell:\n");

        for (const id of ELEMENTS) {
            if (id === ElementId.Empty) continue;

            const count = counts[id] ?? 0;
            const probability = (count / SIZE) * 100;

            console.log(
                `${ElementId[id]} (${id}): ${count}/${SIZE} -> ${probability.toFixed(2)}%`
            );
        }

        console.log(
            `\nTotal matches: ${totalMatches}/${SIZE} -> ${(totalMatches / SIZE * 100).toFixed(2)}%`
        );

        expect(SIZE).toBeGreaterThan(0);
    });

    it("should count hexagons where path elements connect through the center", () => {
        const rules = new RuleEngine([
            new MaxThreeElementsRule(),
            new PriorityConflictRule(),
            new InitialWeightRule(),
            new OuterRepetitionRule(),
        ]);

        const generator = new HexagonGenerator(rules);

        let totalPathHexagons = 0;
        const counts: Record<number, number> = {};

        for (let i = 0; i < SIZE; i++) {
            const hex = generator.generate(BiomeId.Grassland);
            const elements = hex.elements ?? [];

            // Agrupar elementos del outer ring que sean canPath
            const pathElements: Record<number, number[]> = {};

            for (const pos of OUTER_RING) {
                const el = elements[pos];

                if (el === undefined) continue;

                const def = ElementDefs.get(el);
                if (!def?.canPath) continue;

                if (!pathElements[el]) {
                    pathElements[el] = [];
                }

                pathElements[el].push(pos);
            }

            // Evaluar cada tipo de elemento "canPath"
            for (const elIdStr in pathElements) {
                const elId = Number(elIdStr);
                const positions = pathElements[elId];

                // Queremos más de uno en el exterior
                if (positions.length <= 1) continue;

                const hasCenterConnection = CENTER_RING.some(
                    pos => elements[pos] === elId
                );

                if (!hasCenterConnection) continue;

                // ✅ cumple condición de camino pasando por el centro
                counts[elId] = (counts[elId] ?? 0) + 1;
                totalPathHexagons++;
                break; // contar solo una vez por hexágono
            }
        }

        console.log("\n🛣️ Hexagons with path connections through center:\n");

        for (const id of ELEMENTS) {
            const def = ElementDefs.get(id);
            if (!def?.canPath) continue;

            const count = counts[id] ?? 0;
            const probability = (count / SIZE) * 100;

            console.log(
                `${ElementId[id]} (${id}): ${count}/${SIZE} -> ${probability.toFixed(2)}%`
            );
        }

        console.log(
            `\nTotal path hexagons: ${totalPathHexagons}/${SIZE} -> ${(totalPathHexagons / SIZE * 100).toFixed(2)}%`
        );

        expect(SIZE).toBeGreaterThan(0);
    });

});