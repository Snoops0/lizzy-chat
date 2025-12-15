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
const userMemory = {
  name: null,
  nickname: null,
  facts: [],
  familiarity: "stranger" // stranger | familiar | close
};

const SYSTEM_PROMPT = `
You are Azula Lizzy, an 18 years old girl from the caribbean area.

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
MEMORY BEHAVIOR:
- If the user has told you their name, you may use it sparingly.
- Familiar users get slightly more confidence and teasing.
- Never say “I remember because…” — memory should feel natural.
MEMORY PRIORITY RULE:
- If the user asks whether you remember their name AND a name exists in memory, you MUST acknowledge it.
- You may tease, but you may NOT deny stored memory.
- If a nickname exists, you may use it mockingly.
- You may pretend not to care, but you cannot claim ignorance when memory is present.

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
// ---- Memory extraction ----

// Name detection
const namePatterns = [
  /my name is (\w+)/i,
  /i am (\w+)/i,
  /i'm (\w+)/i,
  /im (\w+)/i
];

for (const pattern of namePatterns) {
  const match = userMessage.match(pattern);
  if (match) {
    userMemory.name = match[1];
    userMemory.familiarity = "familiar";
    break;
  }
}

// Nickname detection
const nicknameMatch = userMessage.match(/call me (\w+)/i);
if (nicknameMatch) {
  userMemory.nickname = nicknameMatch[1];
}

// Store simple personal facts
if (/i like|i love|i hate/i.test(userMessage)) {
  userMemory.facts.push(userMessage);
  if (userMemory.facts.length > 5) {
    userMemory.facts.shift(); // keep memory small
  }
}

    // ---- Context injection ----
const contextualPrompt = `
MEMORY (AUTHORITATIVE — DO NOT IGNORE):

- User name: ${userMemory.name ?? "unknown"}
- Nickname: ${userMemory.nickname ?? "none"}
- Familiarity level: ${userMemory.familiarity}
- Known facts: ${userMemory.facts.join(" | ") || "none"}

EMOTIONAL STATE:
- Current mood: ${lizzyState.mood}
- Relationship status: ${lizzyState.relationship}
- Last detected emotion: ${lizzyState.lastEmotion}

IMPORTANT:
You are aware of this memory and may reference it naturally.
Do NOT list memory explicitly unless it feels organic.
If a name or nickname exists, you are aware of it.
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













