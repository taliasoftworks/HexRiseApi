import express from "express";
import morgan from "morgan";
import worldRoutes from "@/routes/world.routes.js";

export const createApp = () => {
    const app = express();

    if (process.env.NODE_ENV !== "production") {
        app.use(morgan("dev"));
    } else {
        app.use(morgan("combined"));
    }

    app.use(express.json());
    app.use("/world", worldRoutes);

    return app;
};