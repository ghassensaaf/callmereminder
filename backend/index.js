import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import prisma from "./lib/prisma.js";
import { auth } from "./auth.js";
import { startScheduler, stopScheduler } from "./services/scheduler.js";
import apiRoutes from "./routes/index.js";

const app = express();
const PORT = process.env.PORT || 8000;

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins, credentials: true }));

// Better Auth - must be before express.json()
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

// Root & health
app.get("/", (_, res) => {
  res.json({ message: "CallMe Reminder API", version: "1.0.0" });
});

app.get("/health", (_, res) => {
  res.json({ status: "healthy" });
});

// API routes
app.use("/api", apiRoutes);

async function main() {
  try {
    await prisma.$connect();
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }

  startScheduler();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  const shutdown = () => {
    stopScheduler();
    server.close(() => {
      prisma.$disconnect();
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
