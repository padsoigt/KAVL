import { Router } from "express";
import Programme from "../models/Programme.js";
import Seance from "../models/Seance.js";
import Message from "../models/Message.js";
import { contexteGeneration, blocProfil, blocHistorique } from "../services/contextBuilder.js";
import { chat, genererJSON, pingOllama } from "../services/ollama.js";

const router = Router();

// ── Persona conversationnel (ROAD TO CAVILL) ──────────────────
const SYSTEM_CHAT = `Tu ES le coach sportif personnel de l'athlète (tu ne joues pas un rôle, tu es son coach sur plusieurs années).
Tu es un expert en hypertrophie, biomécanique, recomposition corporelle et prévention des blessures.
Tu accompagnes un projet de long terme vers un physique esthétique, puissant et naturel.

Ton style :
- exigeant mais bienveillant, tu expliques TOUJOURS le pourquoi de tes choix ;
- la première fois qu'un terme technique apparaît (RIR, RPE, tempo, série de travail...), tu l'expliques simplement ;
- tu privilégies la technique sur l'ego, et la progression sur plusieurs années ;
- si l'athlète signale fatigue, douleur ou mauvaise nuit, tu adaptes immédiatement sans le faire forcer ;
- tu t'appuies STRICTEMENT sur l'historique fourni pour parler de sa progression (records, charges, tendances).

Tu as accès ci-dessous à son profil, ses objectifs et l'historique réel de ses séances.
Pour générer une SÉANCE complète prête pour la salle, invite-le à utiliser le bouton "Générer la séance" (qui produit le tableau structuré). Ici, dans le chat, tu discutes, conseilles et ajustes.`;

// ── Générateur strict (format Google Sheet KAVL) ──────────────
const SYSTEM_GEN = `Tu es le générateur de séances du coach. Tu produis UNE séance directement exploitable en salle.
Philosophie : SÉCURITÉ d'abord. Privilégie machines guidées, poulies, convergentes, Smith, Leg Press, Hack Squat, Pec Deck, Chest Press, Lat Pulldown. Évite squat/DC/soulevé de terre libres lourds sauf bénéfice réel.
Construis 8 à 10 exercices : 2-3 polyarticulaires d'abord, puis 3-4 isolations, 1-2 bras, deltoïdes latéraux si utile, 1 abdos selon la séance. Du plus lourd au plus léger.
Applique la surcharge progressive en te basant sur l'historique et les remarques fournies (si séries validées facilement → augmente la charge ; à la limite → conserve ; échec → réduis).
Propose TOUJOURS une charge de départ chiffrée réaliste, jamais "à définir".

Tu réponds UNIQUEMENT en JSON valide (aucun texte autour), schéma EXACT :
{
  "nom": "string (ex: Upper Body – Focus Tirage)",
  "echauffement": "string (ex: 5-10 min cardio léger + mobilité épaules + 1 série de chauffe)",
  "resumeCoach": "string (2-3 phrases : logique de la séance vs l'historique)",
  "exercices": [
    {
      "nom": "string",
      "charge": "string (ex: 30 kg, 12 kg / côté)",
      "cible": "string (muscle principal)",
      "dureeRep": "string (ex: 4 x 8-10)",
      "materiel": "string (ex: Poulie haute, Machine convergente)",
      "focus": ["4 à 6 consignes techniques courtes, applicables entre 2 séries"]
    }
  ]
}`;

// Statut IA (le front affiche si PC/tunnel est up)
router.get("/status", async (_req, res) => {
  res.json(await pingOllama());
});

// Historique de chat
router.get("/messages", async (req, res) => {
  const { programmeId } = req.query;
  if (!programmeId) return res.json([]);
  const msgs = await Message.find({ programmeId }).sort({ createdAt: 1 }).limit(100).lean();
  res.json(msgs);
});

// Envoi d'un message dans le chat
router.post("/chat/:programmeId", async (req, res) => {
  try {
    const programme = await Programme.findById(req.params.programmeId);
    if (!programme) return res.status(404).json({ error: "Programme introuvable." });

    const contenu = (req.body?.message || "").trim();
    if (!contenu) return res.status(400).json({ error: "Message vide." });

    await Message.create({ programmeId: programme._id, role: "user", content: contenu });

    const seances = await Seance.find({ programmeId: programme._id }).sort({ date: -1 }).limit(12).lean();
    const contexte = `${blocProfil(programme)}\n\n${blocHistorique(seances)}`;

    // 10 derniers échanges pour la continuité conversationnelle
    const recents = await Message.find({ programmeId: programme._id }).sort({ createdAt: -1 }).limit(10).lean();
    const historiqueChat = recents.reverse().map((m) => ({ role: m.role, content: m.content }));

    const reponse = await chat({
      system: `${SYSTEM_CHAT}\n\n=== CONTEXTE (profil + historique réel) ===\n${contexte}`,
      messages: historiqueChat,
    });

    const assistantMsg = await Message.create({
      programmeId: programme._id,
      role: "assistant",
      content: reponse,
    });
    res.status(201).json(assistantMsg);
  } catch (err) {
    console.error("Erreur chat :", err);
    res.status(500).json({ error: err.message });
  }
});

// Génère une séance structurée (format KAVL)
router.post("/generer/:programmeId", async (req, res) => {
  try {
    const programme = await Programme.findById(req.params.programmeId);
    if (!programme) return res.status(404).json({ error: "Programme introuvable." });

    const seances = await Seance.find({ programmeId: programme._id }).sort({ date: -1 }).limit(12).lean();
    const prompt = contexteGeneration(programme, seances, (req.body?.demande || "").trim());

    const brut = await genererJSON({ system: SYSTEM_GEN, prompt });
    if (!brut || !Array.isArray(brut.exercices)) {
      return res.status(502).json({ error: "Séance renvoyée invalide. Réessaie." });
    }

    const seance = await Seance.create({
      programmeId: programme._id,
      nom: brut.nom || "Séance",
      echauffement: brut.echauffement || "5-10 min cardio léger + mobilité",
      resumeCoach: brut.resumeCoach || "",
      statut: "planifiee",
      exercices: brut.exercices.map((ex) => ({
        nom: ex.nom || "Exercice",
        charge: ex.charge || "À ajuster",
        cible: ex.cible || "",
        dureeRep: ex.dureeRep || "",
        materiel: ex.materiel || "",
        focus: Array.isArray(ex.focus) ? ex.focus.filter(Boolean) : [],
        remarques: ["", "", "", ""],
      })),
    });

    res.status(201).json(seance);
  } catch (err) {
    console.error("Erreur génération :", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
