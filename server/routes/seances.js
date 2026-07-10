import { Router } from "express";
import mongoose from "mongoose";
import Programme from "../models/Programme.js";
import Seance from "../models/Seance.js";

const router = Router();
const idValide = (id) => mongoose.Types.ObjectId.isValid(id);

// ── PROGRAMMES ────────────────────────────────────────────────
router.get("/programmes", async (_req, res) => {
  res.json(await Programme.find().sort({ createdAt: -1 }).lean());
});

router.post("/programmes", async (req, res) => {
  try {
    res.status(201).json(await Programme.create(req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/programmes/:id", async (req, res) => {
  if (!idValide(req.params.id)) return res.status(400).json({ error: "id invalide" });
  const prog = await Programme.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!prog) return res.status(404).json({ error: "Programme introuvable" });
  res.json(prog);
});

// ── SÉANCES ───────────────────────────────────────────────────
router.get("/seances", async (req, res) => {
  const filtre = {};
  if (req.query.programmeId && idValide(req.query.programmeId)) filtre.programmeId = req.query.programmeId;
  res.json(await Seance.find(filtre).sort({ date: -1 }).lean());
});

router.get("/seances/:id", async (req, res) => {
  if (!idValide(req.params.id)) return res.status(400).json({ error: "id invalide" });
  const seance = await Seance.findById(req.params.id).lean();
  if (!seance) return res.status(404).json({ error: "Séance introuvable" });
  res.json(seance);
});

// Enregistre remarques + statut + ressenti
router.put("/seances/:id", async (req, res) => {
  if (!idValide(req.params.id)) return res.status(400).json({ error: "id invalide" });
  try {
    const seance = await Seance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!seance) return res.status(404).json({ error: "Séance introuvable" });
    res.json(seance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/seances/:id", async (req, res) => {
  if (!idValide(req.params.id)) return res.status(400).json({ error: "id invalide" });
  await Seance.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ── STATS (tableau de bord) ───────────────────────────────────
router.get("/stats", async (req, res) => {
  const filtre = { statut: "terminee" };
  if (req.query.programmeId && idValide(req.query.programmeId)) filtre.programmeId = req.query.programmeId;
  const seances = await Seance.find(filtre).lean();

  const parSemaine = {};
  for (const s of seances) {
    const k = isoSemaine(new Date(s.date));
    parSemaine[k] = (parSemaine[k] || 0) + 1;
  }

  const il7j = Date.now() - 7 * 864e5;
  const cette7j = seances.filter((s) => new Date(s.date).getTime() >= il7j).length;

  res.json({
    totalSeances: seances.length,
    seances7j: cette7j,
    seancesParSemaine: parSemaine,
  });
});

function isoSemaine(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-S${String(week).padStart(2, "0")}`;
}

export default router;
