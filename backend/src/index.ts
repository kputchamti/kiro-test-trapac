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
