import type { CustomLocals } from "@/types/express.types.js";
import type { Request, Response } from "express";

export abstract class BaseController {
    protected locals: CustomLocals;
    protected resObject: Response;
    protected reqObject: Request;

    constructor(req: Request, res: Response) {
        this.locals = res.locals;
        this.reqObject = req;
        this.resObject = res;
    }

    protected get req() {
        return this.reqObject;
    }

    protected get res() {
        return this.resObject;
    }

    protected get user() {
        return this.locals.user;
    }
}