import mongoose from "mongoose";

// Un exercice au format Google Sheet KAVL (10 colonnes)
const exerciceSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },
    charge: { type: String, default: "À ajuster" }, // "30 kg", "12 kg / côté"...
    cible: { type: String, default: "" }, // muscle principal
    dureeRep: { type: String, default: "" }, // "4 x 8-10"
    materiel: { type: String, default: "" },
    focus: { type: [String], default: [] }, // 4-6 consignes techniques
    // Remarques remplies PENDANT la séance (rep 1 à 4) — c'est le retour
    // que le coach relira pour ajuster la prochaine fois.
    remarques: {
      type: [String],
      default: ["", "", "", ""],
      validate: (v) => v.length === 4,
    },
  },
  { _id: false }
);

const seanceSchema = new mongoose.Schema(
  {
    programmeId: { type: mongoose.Schema.Types.ObjectId, ref: "Programme", required: true },
    nom: { type: String, default: "Séance" }, // "Upper Body – Focus Tirage"
    date: { type: Date, default: Date.now },
    statut: { type: String, enum: ["planifiee", "terminee", "sautee"], default: "planifiee" },
    echauffement: { type: String, default: "5-10 min cardio léger + mobilité ciblée" },
    exercices: { type: [exerciceSchema], default: [] },
    // Résumé de fin de séance rédigé par le coach
    resumeCoach: { type: String, default: "" },
    ressenti: {
      energie: { type: Number, default: null }, // 1-5
      fatigue: { type: Number, default: null },
      humeur: { type: Number, default: null },
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Seance", seanceSchema);
