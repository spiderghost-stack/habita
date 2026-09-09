import "dotenv/config";
import { createApp } from "./app";

const app = createApp();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`HaBiTa API démarrée sur le port ${PORT} (${process.env.NODE_ENV || "development"})`);
});
