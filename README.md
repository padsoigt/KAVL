# 🏋️ Coach IA

Web app (PWA installable) de suivi d'entraînement avec un **coach IA branché sur Ollama**.
Elle règle le défaut du chat Gemini : le coach **se souvient vraiment** de tes séances, parce que
l'historique est stocké en base et réinjecté proprement dans le contexte à chaque appel.

## Fonctionnement

- **Coach (chat)** : tu discutes avec ton coach (persona *ROAD TO CAVILL*). Il connaît ton profil,
  tes objectifs et l'historique réel de tes séances.
- **Séance** : le coach génère une séance au format de ton Google Sheet (Exercice, Charge, Cible,
  Durée/Rép, Matériel, Focus/Posture + 4 colonnes Remarque). Tu remplis les remarques en salle.
- **Progression** : régularité et séances passées.
- **Réglages** : profil et objectifs du coach — l'ancien "prompt source" devenu éditable.

> La mémoire ne vient pas du modèle mais de la base : voir `server/services/contextBuilder.js`.

## Stack

Node.js / Express · MongoDB (Mongoose) · Ollama · front vanilla (PWA, sans build).

```
server/
  index.js            point d'entrée (sert le front + API)
  db.js               connexion MongoDB
  models/             Programme, Seance, Message
  routes/             seances (CRUD + stats), coach (chat + génération)
  services/           ollama (appels), contextBuilder (la mémoire)
public/               PWA (index.html, app.js, style.css, sw.js, manifest)
```

## Lancer en local

1. `npm install`
2. Copie `.env.example` → `.env` et remplis-le.
3. Installe un modèle Ollama : `ollama pull llama3.1` (ou qwen2.5, mistral…).
   Vérifie qu'Ollama tourne : `ollama serve` (écoute sur `http://localhost:11434`).
4. `npm run dev` → http://localhost:3000

## Le point clé : Ollama + mise en ligne

Une fois l'app hébergée sur Render, **son serveur ne peut pas atteindre ton Ollama local**.
Le code lit une variable `OLLAMA_URL` : `localhost` en dev, une URL publique en prod.

### Exposer Ollama via un tunnel Cloudflare (gratuit)

```bash
# une fois installé cloudflared
cloudflared tunnel --url http://localhost:11434
```

Cela donne une URL HTTPS stable (ex. `https://xxxx.trycloudflare.com`).
Mets-la dans `OLLAMA_URL` côté Render. Ton PC doit être allumé **uniquement** au moment de
générer une séance ou de chatter — le tableau de bord et le log des séances marchent toujours.

> Pour une URL fixe (pas régénérée à chaque lancement), configure un tunnel nommé Cloudflare
> relié à un domaine à toi.

## Déployer sur Render (via GitHub)

1. Pousse le repo sur GitHub.
2. Sur Render → **New Web Service** → connecte le repo.
3. Build Command : `npm install` · Start Command : `npm start`
4. Variables d'environnement : `MONGODB_URI`, `OLLAMA_URL`, `OLLAMA_MODEL`.
   (`PORT` est injecté par Render, déjà géré via `process.env.PORT`.)

## Roadmap possible

- Authentification (aujourd'hui mono-utilisateur).
- Graphes de progression de charge par exercice.
- Import de l'historique depuis ton ancien Google Sheet.
