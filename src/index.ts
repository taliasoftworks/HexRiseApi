import { createApp } from "./app.js";

const app = createApp();

app.listen(process.env.PORT, () => {
  console.log("Server running 🚀");
});
