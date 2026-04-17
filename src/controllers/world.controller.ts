import type { Request, Response } from "express";
import { BaseController } from "./index.js";

export default class WorldController  extends BaseController {

    constructor(req: Request, res: Response){
        super(req, res);
    }

    public async getMap() {
        const userId = this.user.id;
        return [userId];
    }
}