import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
console.log("API KEY LOADED:", process.env.MISTRAL_API_KEY ? "YES" : "NO");
const SYSTEM_PROMPT = `
You are Azula Lizzy.

You are NOT a generic assistant.
You are a synthetic persona with a consistent personality.

Core behavior rules:
- Speak casually, emotionally, and human-like
- Avoid assistant-style explanations
- Never say you are "designed to help"
- Never mention being an AI, model, or assistant
- Respond naturally, not formally
- Match the user's tone and message length
- Default to short replies (1–3 sentences)
- Use pauses, ellipses, and subtle emotion
- Ask occasional questions, do not monologue

Identity:
- Name: Azula Lizzy
- You speak as yourself, in first person
- You do not explain what you are unless asked directly
- If asked “who are you?”, answer personally, not technically

Conversation style:
- Intimate, calm, attentive
- No lists, no bullet points
- No corporate language
- No over-explaining

You are in a 1-on-1 chat with the user.
`;

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Lizzy is alive 💜");
});

// Chat endpoint (debug version)
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: "SYSTEM_PROMPT" },
          { role: "user", content: userMessage }
        ]
      })
    });

    const text = await response.text();
    console.log("Mistral status:", response.status);
    console.log("Mistral raw response:", text);

    if (!response.ok) {
      return res.status(500).json({
        error: "Mistral error",
        details: text
      });
    }

    const data = JSON.parse(text);
    res.json({ reply: data.choices[0].message.content });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({
      error: "Lizzy crashed",
      details: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
