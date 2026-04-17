export enum BiomeId {
    Grassland = 0,
    Desert = 1,
    Frozen = 2,
}

export enum ElementId {
    Empty = 0,
    Forest = 1,
    Mountain = 2,
    House = 3,
    Water = 4,
    Road = 5
}

// Helper genérico para enums numéricos
function enumToArray<T extends object>(e: T): number[] {
    return Object.values(e)
        .filter(v => typeof v === "number") as number[];
}

export const BIOMES = enumToArray(BiomeId).sort((a, b) => a - b);
export const ELEMENTS = enumToArray(ElementId).sort((a, b) => a - b);

export interface Biome {
    id: BiomeId;
    name: string;
    properties?: Record<string, any>;
}

export interface Element {
    id: ElementId;
    name: string;
    properties?: Record<string, any>;
}

export type ElementDefinition = {
    id: ElementId;
    priorityExpansion?: boolean; // si es true, tiene prioridad para ser el elemento dominante
    weight?: number; // peso para generación normal (si no se da, se asume 1)
    uniformWeight?: number; // peso específico para generación uniforme (si no se da, se usa `weight`)
    canPath?: boolean; // si puede ser parte de un camino (para reglas específicas de path)
    connectsTo: ElementId[]; // con qué otros elementos puede conectar (para reglas de compatibilidad)
    assetDensity?: { //La cantidad de asset que se dibuja en el hexágono (para visualización)
        exterior: number;
        interior: number;
        center: number;
    };
};

export type HexArchetype =
    /**
     * 🟢 NORMAL
     * Arquetipo estándar.
     *
     * Generación:
     * - El exterior (0–5) se genera usando reglas (`ruleEngine`).
     * - Se selecciona un elemento dominante si aparece ≥2 veces.
     * - Ese elemento se expande hacia:
     *    - Interior (6–11) con `interiorExpansionChance`
     *    - Centro (12–17) con `centerExpansionChance`
     *
     * Resultado:
     * - Hexágonos coherentes y orgánicos.
     * - Es el comportamiento más común.
     */
    | "normal"

    /**
     * 🔵 UNIFORM
     * Todo el hexágono tiene el mismo elemento.
     *
     * Generación:
     * - Se elige un elemento usando pesos (`uniformWeight`).
     * - Se rellenan las 18 posiciones con ese elemento.
     *
     * Resultado:
     * - Hexágono completamente homogéneo.
     * - Útil para océanos, llanuras extensas, etc.
     */
    | "uniform"

    /**
     * 🟡 SINGLE_SPIKE
     * Un único elemento aislado en el exterior.
     *
     * Generación:
     * - Todo se rellena con `Vacio`.
     * - Se elige una posición aleatoria del exterior (0–5).
     * - Se coloca ahí un único elemento.
     *
     * Resultado:
     * - Punto aislado.
     * - No hay expansión interior ni central.
     * - Útil para recursos raros o anomalías pequeñas.
     */
    | "single_spike"

    /**
     * 🟫 SPARSE
     * Exterior disperso con alta cantidad de vacío.
     *
     * Generación:
     * - Solo se genera el exterior (0–5).
     * - Cada celda tiene probabilidad (`density`) de tener elemento.
     * - El resto se rellena con `Vacio`.
     * - Luego continúa generación normal (interior/centro).
     *
     * Resultado:
     * - Hexágonos poco densos, fragmentados.
     * - Interior y centro suelen ser débiles o inexistentes.
     * - Ideal para desiertos, zonas muertas, ruinas.
     */
    | "sparse"

    /**
     * 🟢 PATH
     * Hexágonos diseñados para tener caminos conectando el exterior con el centro.
     *
     * Generación:
     * - Se elige un elemento con `canPath` para el exterior.
     * - Se asegura que haya una conexión continua de ese elemento desde el exterior al centro.
     * - El resto se genera como normal o uniforme.
     */
    | "path";

export type GenerationContext = {
    data: Uint8Array;
    biome: BiomeId;
    archetype?: HexArchetype;
    archetypeConfig?: ArchetypeConfig;
    interiorElement?: ElementId;
    interiorTargets?: number[];
    elementDefs: Map<ElementId, ElementDefinition>;
};

export type ArchetypeConfig = {
    weight: number;//Probabilidad de aparicion del arquetipo (0-1)
    interiorExpansionChance?: number; // 0–1 cuánto “penetra” hacia dentro
    centerExpansionChance?: number;   // 0–1 cuánto llega al núcleo
    mutationChance?: number;  // ruido / mutación
    density?: number; //densidad (para sparse, etc.) lo vacío que es el exterior
};

export type ArchetypeSet = Record<HexArchetype, ArchetypeConfig>;

export const DEFAULT_ARCHETYPES: ArchetypeSet = {
    uniform: {
        weight: 0.05,
    },

    single_spike: {
        weight: 0.05,
    },

    sparse: {
        weight: 0.15,
        density: 0.3,
    },

    normal: {
        weight: 0.70,
        interiorExpansionChance: 1,
        centerExpansionChance: 1,
    },
    path: {
        weight: 0.05
    }
};

export const ARCHETYPES_BY_BIOME: Partial<Record<BiomeId, ArchetypeSet>> = {
    [BiomeId.Desert]: {
        ...DEFAULT_ARCHETYPES,
        sparse: {
            weight: 0.4,
            density: 0.15,
        },
        normal: {
            weight: 0.5,
            interiorExpansionChance: 0.8,
            centerExpansionChance: 0.6,
        },
    },

    [BiomeId.Grassland]: {
        ...DEFAULT_ARCHETYPES,
        normal: {
            weight: 0.85,
            interiorExpansionChance: 1,
            centerExpansionChance: 1,
        },
    },

    [BiomeId.Frozen]: {
        ...DEFAULT_ARCHETYPES,
        normal: {
            weight: 0.4,
            density: 0.15,
            interiorExpansionChance: 0.4,
            centerExpansionChance: 0.4,
        },
        sparse: {
            weight: 0.4,
            density: 0.15,
        },
    },
};

export const ElementDefs = new Map<ElementId, ElementDefinition>([
    [
        ElementId.Empty, 
        { 
            id: ElementId.Empty, 
            weight: 5,
            uniformWeight: 4,
            connectsTo: [
                ElementId.Empty,
                ElementId.Forest,
                ElementId.Mountain,
                ElementId.House,
                ElementId.Water
            ]
        }
    ],
    [
        ElementId.Forest, 
        { 
            id: ElementId.Forest,
            weight: 6, 
            uniformWeight: 6,
            assetDensity: {
                exterior: 30,
                interior: 20,
                center: 10
            },
            connectsTo: [
                ElementId.Empty,
                ElementId.Forest,
                ElementId.Mountain,
                ElementId.House,
                ElementId.Water
            ]
        }
    ],
    [
        ElementId.Mountain, 
        { 
            id: ElementId.Mountain,
            weight: 6, 
            uniformWeight: 6,
            connectsTo: [
                ElementId.Empty,
                ElementId.Forest,
                ElementId.Mountain,
                ElementId.House,
                ElementId.Water
            ]
        }
    ],
    [
        ElementId.House, 
        { 
            id: ElementId.House, 
            weight: 6, 
            uniformWeight: 6,
            assetDensity: {
                exterior: 3,
                interior: 2,
                center: 1
            },
            connectsTo: [
                ElementId.Empty,
                ElementId.Forest,
                ElementId.Mountain,
                ElementId.House,
                ElementId.Water
            ]
        }
    ],
    [
        ElementId.Water,
        {
            id: ElementId.Water,
            weight: 1,
            priorityExpansion: true,
            uniformWeight: 6,
            canPath: true,
            connectsTo: [
                ElementId.Empty,
                ElementId.Forest,
                ElementId.Mountain,
                ElementId.House,
                ElementId.Water
            ]
        }
    ],
    [
        ElementId.Road,
        {
            id: ElementId.Road,
            weight: 1,
            priorityExpansion: true,
            uniformWeight: 0,
            canPath: true,
            connectsTo: [
                ElementId.Road,
            ]
        }
    ]
]);

export const HEX_NEIGHBORS: number[][] = [
    // =========================
    // EXTERIOR (0–5)
    // =========================
    [1, 5, 6],      // 0
    [0, 2, 7],      // 1
    [1, 3, 8],      // 2
    [2, 4, 9],      // 3
    [3, 5, 10],     // 4
    [4, 0, 11],     // 5

    // =========================
    // INTERIOR (6–11)
    // =========================
    [7, 11, 0, 12], // 6
    [6, 8, 1, 13],  // 7
    [7, 9, 2, 14],  // 8
    [8, 10, 3, 15], // 9
    [9, 11, 4, 16], // 10
    [10, 6, 5, 17], // 11

    // =========================
    // CENTRO (12–17)
    // =========================
    [13, 17, 6],    // 12
    [12, 14, 7],    // 13
    [13, 15, 8],    // 14
    [14, 16, 9],    // 15
    [15, 17, 10],   // 16
    [16, 12, 11],   // 17
];