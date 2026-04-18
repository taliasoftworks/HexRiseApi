import type { ErrorCode } from '@/types/errors.types.js';
import { AppError } from './AppError.js';

export class DomainError extends AppError {
    constructor(code: ErrorCode, message: string) {
        super(code, message, 400);
    }
}
