import mongoose from "mongoose";

// Le programme porte le PROFIL et les OBJECTIFS (ce qui était dans le
// prompt source Gemini). Tout est éditable — rien n'est codé en dur.
const programmeSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true }, // "ROAD TO CAVILL"
    objectif: { type: String, default: "" }, // objectif global
    priorites: { type: String, default: "" }, // "épaules larges, dos en V, pecs..."
    profil: { type: String, default: "" }, // "26 ans, 176cm, 75kg, salle équipée..."
    philosophie: { type: String, default: "" }, // "machines guidées, sécurité, hypertrophie"
    joursParSemaine: { type: Number, default: 4, min: 1, max: 7 },
    dureeSeance: { type: String, default: "1h45 à 2h10" },
    actif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Programme", programmeSchema);
