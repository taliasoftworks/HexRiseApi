import { createApp } from "./app.js";
import { connectDB } from "./db/connection.js";

const app = createApp();

connectDB()
    .then(() => {
        app.listen(process.env.SERVER_PORT ?? 3000, () => {
            console.log("Server running on port", process.env.SERVER_PORT ?? 3000);
        });
    })
    .catch(err => {
        console.error('[Fatal] DB connection failed:', err);
        process.exit(1);
    });
