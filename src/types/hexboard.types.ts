import type { ElementId } from "./hexagon.types.js";

export type Coord = { x: number; y: number };

export type NodeRef = {
    x: number;
    y: number;
    index: number;
};

export type ConnectedGroup = {
    element: ElementId;
    nodes: NodeRef[];
    assets: number;
};

export const DEFAULT_HEXBOARD_WIDTH = 50;
export const DEFAULT_HEXBOARD_HEIGHT = 50;