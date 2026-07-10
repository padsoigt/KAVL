// Appel à Ollama. L'URL vient de l'env : localhost en dev,
// tunnel Cloudflare en prod. Le code ne change jamais.

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1";

// Chat conversationnel (persona coach) → texte libre
export async function chat({ system, messages }) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      options: { temperature: 0.7 },
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Ollama a répondu ${res.status}. ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.message?.content ?? "";
}

// Génération structurée (séance) → JSON strict
export async function genererJSON({ system, prompt }) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: "json",
      options: { temperature: 0.6 },
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Ollama a répondu ${res.status}. ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const contenu = data?.message?.content ?? "";
  try {
    return JSON.parse(contenu);
  } catch {
    const match = contenu.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Réponse du modèle non parsable en JSON.");
  }
}

// Vérifie qu'Ollama est joignable
export async function pingOllama() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return { ok: false, message: `Statut ${res.status}` };
    const data = await res.json();
    return {
      ok: true,
      modeles: (data.models || []).map((m) => m.name),
      modeleActif: OLLAMA_MODEL,
      url: OLLAMA_URL,
    };
  } catch (err) {
    return { ok: false, message: err.message, url: OLLAMA_URL };
  }
}
