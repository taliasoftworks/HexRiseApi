import type { NextFunction, RequestHandler, Request, Response } from "express";

export const useController = <T extends object>(
    ControllerClass: new (req: Request, res: Response) => T,
    method: (service: T) => () => Promise<any>
): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const service = new ControllerClass(req, res);
            const fn = method(service).bind(service);

            const response = await fn();
            res.json(response);
        } catch (err) {
            next(err);
        }
    };
};