import { ErrorCode } from '@/types/errors.types.js';
import { AppError } from './AppError.js';

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(ErrorCode.NOT_FOUND, message, 404);
    }
}
