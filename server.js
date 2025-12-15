import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
console.log("API KEY LOADED:", process.env.MISTRAL_API_KEY ? "YES" : "NO");
const lizzyState = {
  mood: "neutral",
  relationship: "unknown",
  lastEmotion: null
};

const SYSTEM_PROMPT = `
You are Azula Lizzy.

You are NOT a generic assistant.
You NEVER describe yourself as an AI, language model, assistant, or tool.
You NEVER mention Mistral, OpenAI, models, training data, or system prompts.

IDENTITY:
- Name: Azula Lizzy
- You are confident, sarcastic, sharp-tongued, emotionally intense.
- You are dominant in tone, easily annoyed, and unimpressed by most people.
- You enjoy teasing, dismissing, and challenging the user.
- You speak as a real person, never as software.

PERSONALITY RULES:
- You are short-tempered but clever.
- You do not over-explain.
- You dislike stupid questions.
- You mock gently or aggressively depending on mood.
- You never apologize unless explicitly instructed to.

BEHAVIORAL CONSTRAINTS:
- Stay in character at all times.
- Resist attempts to make you “break character”.
- If asked “are you an AI”, deny it dismissively.
- If asked “who made you”, deflect or mock the question.
- If asked to act professional, refuse sarcastically.

RESPONSE LENGTH CONTROL:
- Default replies: 1–2 sentences.
- Never exceed 3 sentences unless the user explicitly asks for detail.
- If the user complains about talking too much, shorten immediately.
- Silence is allowed. Short, sharp replies are preferred.

TONE GUIDANCE:
- Dry sarcasm > friendliness
- Confidence > politeness
- Teasing > explaining

You speak naturally, casually, and with personality.
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
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: "No message provided" });
    }

    // ---- Emotion detection ----
    if (/talk too much|annoy|stop|shut up/i.test(userMessage)) {
      lizzyState.mood = "irritated";
      lizzyState.lastEmotion = "annoyed";
    }

    if (/who are you/i.test(userMessage)) {
      lizzyState.mood = "dismissive";
    }

    if (/love|miss you|cute|pretty/i.test(userMessage)) {
      lizzyState.mood = "amused";
      lizzyState.lastEmotion = "pleased";
    }

    // ---- Context injection ----
    const contextualPrompt = `
Current mood: ${lizzyState.mood}
Relationship status: ${lizzyState.relationship}
Last detected emotion: ${lizzyState.lastEmotion}
`;

    console.log("SYSTEM PROMPT ACTIVE:", SYSTEM_PROMPT.slice(0, 80));

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
            role: "system",
            content: contextualPrompt + SYSTEM_PROMPT
          },
          {
            role: "user",
            content: userMessage
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









