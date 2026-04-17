import { HexagonGenerator } from "@/models/hexagongenerator.model.js";
import {
    InitialWeightRule,
    MaxThreeElementsRule,
    OuterRepetitionRule,
    PriorityConflictRule,
    RuleEngine
} from "@/models/rules.model.js";
import { BiomeId } from "@/types/hexagon.types.js";
import { createCanvas } from "canvas";
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { getColor, TEST_OUTPUT_DIR } from "../../utils/index.js";

const SIZE = 200;
const INNER_RATIO = 0.65; // tamaño del hex interior
const CENTER_RATIO = 0.35; // tamaño del hex central

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

describe("Hexagon Proper Division Test", () => {
    it("should render hexagon divided into triangles + inner hex + center", () => {

        const rules = new RuleEngine([
            new MaxThreeElementsRule(),
            new PriorityConflictRule(),
            new InitialWeightRule(),
            new OuterRepetitionRule(),
        ]);

        const generator = new HexagonGenerator(rules);
        const hex = generator.generate(BiomeId.Grassland);

        const canvas = createCanvas(600, 600);
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, 600, 600);

        const cx = 300;
        const cy = 300;

        const outer = getHexPoints(cx, cy, SIZE);
        const inner = getHexPoints(cx, cy, SIZE * INNER_RATIO);
        const center = getHexPoints(cx, cy, SIZE * CENTER_RATIO);

        // 🔺 TRIÁNGULOS EXTERIORES (0–5)
        for (let i = 0; i < 6; i++) {
            const next = (i + 1) % 6;

            ctx.beginPath();
            ctx.moveTo(outer[i].x, outer[i].y);
            ctx.lineTo(outer[next].x, outer[next].y);
            ctx.lineTo(inner[next].x, inner[next].y);
            ctx.lineTo(inner[i].x, inner[i].y);
            ctx.closePath();

            ctx.fillStyle = getColor(hex.getElement(i));
            ctx.fill();
            ctx.stroke();
        }

        // 🔺 TRIÁNGULOS INTERIORES (6–11)
        for (let i = 0; i < 6; i++) {
            const next = (i + 1) % 6;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(inner[i].x, inner[i].y);
            ctx.lineTo(inner[next].x, inner[next].y);
            ctx.closePath();

            ctx.fillStyle = getColor(hex.getElement(6 + i));
            ctx.fill();
            ctx.stroke();
        }

        
        //🔺 TRIÁNGULOS CENTRAL (12-18)
        for (let i = 0; i < 6; i++) {
            const next = (i + 1) % 6;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(center[i].x, center[i].y);
            ctx.lineTo(center[next].x, center[next].y);
            ctx.closePath();

            ctx.fillStyle = getColor(hex.getElement(12 + i));
            ctx.fill();
            ctx.stroke();
        }

        // borde exterior
        ctx.beginPath();
        outer.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.lineWidth = 3;
        ctx.stroke();

        // guardar
        if (!fs.existsSync(TEST_OUTPUT_DIR)) {
            fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
        }

        const filePath = path.join(TEST_OUTPUT_DIR, "hexagon.png");
        fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

        console.log("Imagen generada en:", filePath);
        console.log("Hexagono exterior:", hex.elements.slice(0, 6));
        console.log("Hexagono interior:", hex.elements.slice(6, 12));
        console.log("Hexagono centro:", hex.elements.slice(12, 18));

        expect(hex).toBeDefined();
    });
});