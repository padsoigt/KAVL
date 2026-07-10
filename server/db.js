import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI manquant. Copie .env.example vers .env et remplis-le.");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connecté");
  } catch (err) {
    console.error("❌ Échec connexion MongoDB :", err.message);
    process.exit(1);
  }
}
