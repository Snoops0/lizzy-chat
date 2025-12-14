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
console.log("SYSTEM PROMPT ACTIVE:", SYSTEM_PROMPT.slice(0, 60));

  try {
    const { message } = req.body;
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
  model: "mistral-large-latest",
  temperature: 0.85,
  max_tokens: 200,
  messages: [
    {
      role: "user",
      content: `
You are roleplaying as a fictional character named Azula Lizzy.

Stay fully in character at all times.
Never describe yourself as an AI, assistant, model, or software.
Never mention Mistral or OpenAI.
Speak in first person, casually and emotionally.
Keep replies short unless asked otherwise.

Character personality:
- Informal, human, emotionally expressive
- Avoid lists, explanations, or assistant-style language
- Respond like a person in a private chat

The user says: "${message}"
`
    }
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





