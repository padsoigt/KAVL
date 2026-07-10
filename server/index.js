import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./db.js";
import seancesRouter from "./routes/seances.js";
import coachRouter from "./routes/coach.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// API
app.use("/api", seancesRouter);
app.use("/api/coach", coachRouter);

// Front statique (PWA)
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// Fallback SPA : toute route non-API renvoie index.html
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Serveur sur le port ${PORT}`));
});
