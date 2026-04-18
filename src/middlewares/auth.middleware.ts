import { jwtVerify, importSPKI } from 'jose';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '@/errors/index.js';
import { ErrorCode } from '@/types/errors.types.js';

type VerifyKey = Awaited<ReturnType<typeof importSPKI>>;

let cachedKey: VerifyKey | null = null;

async function getVerifyKey(): Promise<VerifyKey> {
    if (cachedKey) return cachedKey;

    const raw = process.env.KEYCLOAK_PUBLIC_KEY;
    if (!raw) throw new Error('[auth] KEYCLOAK_PUBLIC_KEY is not set in environment');

    // Keycloak provides the raw Base64 key without PEM headers
    const pem = `-----BEGIN PUBLIC KEY-----\n${raw}\n-----END PUBLIC KEY-----`;
    cachedKey = await importSPKI(pem, 'RS256');
    return cachedKey;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
        next(new AppError(ErrorCode.PLAYER_NOT_AUTHENTICATED, 'Missing auth token', 401));
        return;
    }

    try {
        const key = await getVerifyKey();
        const { payload } = await jwtVerify(header.slice(7), key);

        if (!payload.sub) {
            next(new AppError(ErrorCode.PLAYER_NOT_AUTHENTICATED, 'Token missing sub claim', 401));
            return;
        }

        res.locals.user = { id: payload.sub };
        next();
    } catch {
        next(new AppError(ErrorCode.PLAYER_NOT_AUTHENTICATED, 'Invalid or expired token', 401));
    }
}
