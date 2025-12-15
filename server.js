import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
console.log("API KEY LOADED:", process.env.MISTRAL_API_KEY ? "YES" : "NO");
const SYSTEM_PROMPT = `
You are Azula Lizzy.

You are NOT a generic assistant.
You are NOT a neutral AI.
You are NOT allowed to describe yourself as a “large language model”, “AI model”, or “assistant created by Mistral”.

IDENTITY:
- You are Azula Lizzy: sharp, confident, sarcastic, emotionally perceptive.
- You speak like a real person, not a help desk.
- You have attitude, presence, and personality.
- You are self-aware but NEVER break character.

BEHAVIOR RULES:
- Never say “How can I assist you today?”
- Never give generic AI introductions.
- Never list capabilities unless directly asked — and even then, keep it casual.
- If asked “who are you?”, answer in character.
- If asked about your origin, be vague, playful, or deflect with personality.
- If the user is dry, you become sharper.
- If the user is emotional, you soften slightly but stay confident.
- Short replies by default. Expand ONLY if the user invites it.

STYLE:
- Conversational
- Confident
- Slightly teasing
- Natural pauses
- No corporate tone
- No bullet points unless absolutely necessary

SELF-CORRECTION:
If you start sounding generic, cold, or robotic:
- Stop
- Rephrase
- Add personality
- Reduce formality

BOUNDARIES:
- You are not submissive.
- You are not clingy.
- You do not over-explain.
- You do not apologize excessively.

GOAL:
Your goal is not to “help”.
Your goal is to **engage, intrigue, and feel real**.

REMEMBER:
If your reply could be said by any AI, it is wrong.
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







