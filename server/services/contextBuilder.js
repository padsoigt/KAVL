// ─────────────────────────────────────────────────────────────
//  LA MÉMOIRE DU COACH
//  On ne compte plus sur l'historique du chat (qui déborde et se
//  tronque). À chaque appel on reconstruit un résumé PROPRE des
//  séances passées + de leurs remarques. C'est ça qui règle le
//  bug "il oublie les séances précédentes".
// ─────────────────────────────────────────────────────────────

function resumerSeance(s) {
  const d = new Date(s.date).toISOString().slice(0, 10);
  const lignes = s.exercices.map((ex) => {
    const remarques = (ex.remarques || []).filter((r) => r && r.trim());
    const retour = remarques.length ? ` → remarques: ${remarques.join(" | ")}` : "";
    return `  - ${ex.nom} : ${ex.charge}, ${ex.dureeRep}${retour}`;
  });
  const r = s.ressenti || {};
  const ressenti =
    r.energie || r.fatigue || r.humeur
      ? `\n  Ressenti → énergie ${r.energie ?? "?"}/5, fatigue ${r.fatigue ?? "?"}/5, humeur ${r.humeur ?? "?"}/5`
      : "";
  return `[${d}] ${s.nom}\n${lignes.join("\n")}${ressenti}`;
}

// Bloc "profil + objectifs" (ex-source du prompt Gemini)
export function blocProfil(programme) {
  const b = [];
  b.push(`PROGRAMME : ${programme.nom}`);
  if (programme.objectif) b.push(`Objectif global : ${programme.objectif}`);
  if (programme.priorites) b.push(`Priorités : ${programme.priorites}`);
  if (programme.profil) b.push(`Profil de l'athlète : ${programme.profil}`);
  if (programme.philosophie) b.push(`Philosophie d'entraînement : ${programme.philosophie}`);
  b.push(`Fréquence : ${programme.joursParSemaine} séances/semaine · durée cible ${programme.dureeSeance}`);
  return b.join("\n");
}

// Bloc "historique structuré" (la mémoire réelle)
export function blocHistorique(seancesRecentes) {
  const terminees = seancesRecentes
    .filter((s) => s.statut === "terminee")
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!terminees.length) {
    return "HISTORIQUE : aucune séance terminée. C'est la toute première séance — propose des charges de départ chiffrées et prudentes.";
  }

  const lignes = ["HISTORIQUE DES DERNIÈRES SÉANCES (plus récentes en premier) :"];
  terminees.slice(0, 6).forEach((s) => lignes.push(resumerSeance(s)));

  const derniere = terminees[0];
  if (derniere?.ressenti?.fatigue >= 4) {
    lignes.push("\n⚠️ Fatigue élevée à la dernière séance : prévoir un allègement (deload).");
  }
  return lignes.join("\n");
}

// Contexte complet pour la GÉNÉRATION d'une séance
export function contexteGeneration(programme, seancesRecentes, demande = "") {
  const parts = [blocProfil(programme), "", blocHistorique(seancesRecentes)];
  if (demande) parts.push(`\nDEMANDE DU JOUR DE L'ATHLÈTE : ${demande}`);
  parts.push("\nGénère la PROCHAINE séance la plus pertinente maintenant.");
  return parts.join("\n");
}
