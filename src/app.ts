import express from "express";
import worldRoutes from "@/routes/world.routes.js";

export const createApp = () => {
    const app = express();

    app.use(express.json());
    app.use("/world", worldRoutes);

    return app;
};