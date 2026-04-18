import type { NextFunction, Request, Response } from 'express';
import { AppError } from '@/errors/index.js';
import { ErrorCode } from '@/types/errors.types.js';

export const errorMiddleware = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: { code: err.code, message: err.message },
        });
        return;
    }

    console.error('[UnhandledError]', err);
    res.status(500).json({
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
    });
};
