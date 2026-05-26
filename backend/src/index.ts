import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Placeholder route for appointments
app.get("/api/appointments", (_req, res) => {
  res.json({ appointments: [], total: 0 });
});

// Start server
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`TraPac TAS Backend running on port ${PORT}`);
  });
}

export default app;
