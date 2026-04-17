import { HexagonGenerator } from "@/models/hexagongenerator.model.js";
import {
    InitialWeightRule,
    MaxThreeElementsRule,
    OuterRepetitionRule,
    PriorityConflictRule,
    RuleEngine
} from "@/models/rules.model.js";

import {
    BiomeId,
    ElementDefs,
    ElementId
} from "@/types/hexagon.types.js";

import { createCanvas } from "canvas";
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { HexBoard } from "@/models/hexboard.model.js";
import { getColor, getContrastColor, getEmoji, TEST_OUTPUT_DIR } from "../utils/index.js";
import { DEFAULT_HEXBOARD_HEIGHT, DEFAULT_HEXBOARD_WIDTH } from "@/types/hexboard.types.js";

const HEX_SIZE = 40;
const DELAY = 1000; // ⏱️ ms entre piezas
const HEX_WIDTH = HEX_SIZE * 2;
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;
const canvasWidth = Math.sqrt(3) * HEX_SIZE * DEFAULT_HEXBOARD_WIDTH + 200;
const canvasHeight = 1.5 * HEX_SIZE * DEFAULT_HEXBOARD_HEIGHT + 200;
const offsetX = canvasWidth / 2 - (DEFAULT_HEXBOARD_WIDTH * HEX_SIZE);
const offsetY = canvasHeight / 2 - (DEFAULT_HEXBOARD_HEIGHT * HEX_SIZE * 0.7);
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getHexCenter(x: number, y: number) {
    const cx = HEX_SIZE * Math.sqrt(3) * (x + 0.5 * (y % 2)) + offsetX;
    const cy = HEX_SIZE * 1.5 * y + offsetY;

    return { cx, cy };
}

function getHexPoints(cx: number, cy: number, size: number) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i - Math.PI / 2;
        pts.push({
            x: cx + size * Math.cos(angle),
            y: cy + size * Math.sin(angle)
        });
    }
    return pts;
}

// =========================
// DRAW ASSETS
// =========================

function drawAsset(
    ctx: any,
    hex: any,
    index: number,
    x: number,
    y: number
) {
    const el = hex.getElement(index);
    const emoji = getEmoji(el);
    const bg = getColor(el);

    ctx.fillStyle = getContrastColor(bg);
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(emoji, x, y);
}

function getTriangleCenter(p1: any, p2: any, p3: any) {
    return {
        x: (p1.x + p2.x + p3.x) / 3,
        y: (p1.y + p2.y + p3.y) / 3
    };
}

describe("Board Simulation Test", () => {

    it("should simulate board progressively", async () => {
        const rules = new RuleEngine([
            new MaxThreeElementsRule(),
            new PriorityConflictRule(),
            new InitialWeightRule(),
            new OuterRepetitionRule(),
        ]);

        const generator = new HexagonGenerator(rules);
        const board = new HexBoard(BiomeId.Grassland);

        if (!fs.existsSync(TEST_OUTPUT_DIR)) {
            fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
        }

        const filePath = path.join(TEST_OUTPUT_DIR, "board.png");

        // 🔥 SIMULACIÓN PROGRESIVA
        for (let i = 0; i < 150; i++) {

            const x = Math.floor(Math.random() * DEFAULT_HEXBOARD_WIDTH);
            const y = Math.floor(Math.random() * DEFAULT_HEXBOARD_HEIGHT);

            const hex = generator.generate(BiomeId.Grassland);

            try {
                board.placeHex(x, y, hex);
            } catch (e) {
                // si no se pudo colocar, reintentar
                i--;
                continue;
            }

            // =========================
            // RENDER FRAME
            // =========================

            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext("2d");

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let y = 0; y < DEFAULT_HEXBOARD_HEIGHT; y++) {
                for (let x = 0; x < DEFAULT_HEXBOARD_WIDTH; x++) {

                    const hex = board.getHex(x, y);
                    if (!hex) continue;

                    const { cx, cy } = getHexCenter(x, y);

                    const outer = getHexPoints(cx, cy, HEX_SIZE);
                    const inner = getHexPoints(cx, cy, HEX_SIZE * 0.6);
                    const center = getHexPoints(cx, cy, HEX_SIZE * 0.3);

                    // EXTERIOR
                    for (let i = 0; i < 6; i++) {
                        const next = (i + 1) % 6;

                        ctx.beginPath();
                        ctx.moveTo(outer[i].x, outer[i].y);
                        ctx.lineTo(outer[next].x, outer[next].y);
                        ctx.lineTo(inner[next].x, inner[next].y);
                        ctx.lineTo(inner[i].x, inner[i].y);
                        ctx.closePath();

                        const el = hex.getElement(i);
                        ctx.fillStyle = getColor(el);
                        ctx.fill();
                        ctx.stroke();

                        const centerPoint = getTriangleCenter(
                            outer[i],
                            outer[next],
                            inner[i]
                        );

                        drawAsset(ctx, hex, i, centerPoint.x, centerPoint.y);
                    }

                    // INTERIOR
                    for (let i = 0; i < 6; i++) {
                        const next = (i + 1) % 6;

                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        ctx.lineTo(inner[i].x, inner[i].y);
                        ctx.lineTo(inner[next].x, inner[next].y);
                        ctx.closePath();

                        const el = hex.getElement(6 + i);
                        ctx.fillStyle = getColor(el);
                        ctx.fill();
                        ctx.stroke();
                        const centerPoint = getTriangleCenter(
                            inner[i],
                            inner[next],
                            { x: cx, y: cy }
                        );

                        drawAsset(ctx, hex, 6 + i, centerPoint.x, centerPoint.y);
                    }

                    // CENTRO
                    for (let i = 0; i < 6; i++) {
                        const next = (i + 1) % 6;

                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        ctx.lineTo(center[i].x, center[i].y);
                        ctx.lineTo(center[next].x, center[next].y);
                        ctx.closePath();

                        const el = hex.getElement(12 + i);
                        ctx.fillStyle = getColor(el);
                        ctx.fill();
                        ctx.stroke();

                        const centerPoint = getTriangleCenter(
                            center[i],
                            center[next],
                            { x: cx, y: cy }
                        );

                        drawAsset(ctx, hex, 12 + i, centerPoint.x, centerPoint.y);
                    }
                    //Pinta la posicion encima del hexagono
                    ctx.font = "18px Arial";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = "rgba(255,255,255,0.7)";
                    ctx.fillRect(cx - 18, cy - 8, 36, 16);
                    ctx.fillStyle = "black";
                    ctx.fillText(`(${x},${y})`, cx, cy);
                }
            }

            // =========================
            // RENDER GROUPS
            // =========================

            const groups = board.getGroups();

            let legendY = 20;

            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.font = "14px Arial";

            for (const group of groups) {
                const first = group.nodes[0];

                const elementName = ElementId[group.element];

                ctx.fillStyle = "black";

                ctx.fillText(`Element: ${elementName}`, 10, legendY);
                legendY += 16;

                ctx.fillText(
                    `First hexagon: {x: ${first.x}, y: ${first.y}}`,
                    10,
                    legendY
                );
                legendY += 16;

                ctx.fillText(`Total assets: ${group.assets}`, 10, legendY);
                legendY += 24; // espacio entre grupos
            }

            // 🔥 OVERWRITE SIEMPRE MISMA IMAGEN
            fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

            console.log(`Frame ${i + 1} renderizado`);

            // ⏱️ esperar antes del siguiente
            await sleep(DELAY);
        }

        console.log("Simulación completada:", filePath);

        expect(true).toBe(true);
    }, 320000);
});