import { ElementId } from "@/types/hexagon.types.js";
import path from "path";

export function getColor(el: ElementId) {
    switch (el) {
        case ElementId.Forest: return "#4caf50";
        case ElementId.Mountain: return "#8b5100";
        case ElementId.House: return "#ff9800";
        case ElementId.Water: return "#2196f3";
        case ElementId.Road: return "#838b91";
        default: return "#ffffff";
    }
}

export function getEmoji(el: ElementId) {
    switch (el) {
        case ElementId.Forest: return "🌲";
        case ElementId.Mountain: return "🏔️";
        case ElementId.House: return "🏠";
        case ElementId.Water: return "🌊";
        default: return "";
    }
}
export function getContrastColor(bg: string) {
    // simple luminancia
    const c = bg.substring(1);
    const rgb = parseInt(c, 16);

    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);

    return luminance > 150 ? "#000" : "#fff";
}

export const TEST_OUTPUT_DIR = path.join(process.cwd(), "tests/output");
