import { Router } from "express";
import { useController } from "./index.js";
import WorldController from "@/controllers/world.controller.js";


const router = Router();

router.get("/map", useController(WorldController, service => service.getMap));

export default router;