import type { NextFunction, Request, Response } from 'express';
import { PlayerModel } from '@/models/db/player.db.model.js';
import { AppError } from '@/errors/index.js';
import { ErrorCode } from '@/types/errors.types.js';

export async function playerMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const player = await PlayerModel.findOne({ keycloakId: res.locals.user.id });

    if (!player) {
        next(new AppError(ErrorCode.PLAYER_NOT_FOUND, 'Player not found', 404));
        return;
    }

    res.locals.player = player;
    next();
}
