import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    programmeId: { type: mongoose.Schema.Types.ObjectId, ref: "Programme", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
