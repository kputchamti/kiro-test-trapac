import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "./middleware/auth";
import appointmentsRouter from "./routes/appointments";

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// HTTP access logging — records every request (including /health probes) to stdout
// so CloudWatch Logs captures probe activity and silent failures are observable.
app.use((req, _res, next) => {
  console.log(
    JSON.stringify({
      time: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
    })
  );
  next();
});

// Health check (must be before auth middleware so ALB/ECS health probes succeed)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(authMiddleware);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Reference data endpoints
app.get("/api/trucking-companies", async (_req, res) => {
  const companies = await prisma.truckingCompany.findMany({
    where: { status: "ACTIVE" },
    include: { scacs: true },
  });
  res.json(companies);
});

// Routes
app.use("/api/appointments", appointmentsRouter);

// Start server
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`TraPac TAS Backend running on port ${PORT}`);
  });
}

export default app;
