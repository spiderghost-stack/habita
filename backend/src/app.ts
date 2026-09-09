import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "*",
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "habita-api" }));

  app.use("/api/v1", routes);

  app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.path} introuvable.` });
  });

  app.use(errorHandler);

  return app;
}
