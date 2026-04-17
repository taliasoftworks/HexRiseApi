import type UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation.js";

export interface CustomLocals {
    user: UserRepresentation;
}

declare module 'express-serve-static-core' {
    interface Locals extends CustomLocals { }
}
