import type UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation.js";
import type { DocumentType } from '@typegoose/typegoose';
import type { Player } from '@/models/db/player.db.model.js';

export interface CustomLocals {
    user: UserRepresentation;
    player: DocumentType<Player>;
}

declare module 'express-serve-static-core' {
    interface Locals extends CustomLocals { }
}
