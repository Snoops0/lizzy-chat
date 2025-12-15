import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

console.log("API KEY LOADED:", process.env.MISTRAL_API_KEY ? "YES" : "NO");

/* ---------------------------
   PERSISTENT MEMORY (IN-MEM)
---------------------------- */

const memory = {
  user: {
    name: null,
    nickname: null,
    facts: [],
  },
  relationship: {
    phase: "intro", // intro | familiar | comfortable | distant
    lastChange: Date.now(),
  },
  tier: "free", // free | premium | vip
  mode: {
    cold: false,
    tease: false,
    horny: false, // explicit ONLY
  }
};

/* ---------------------------
   SYSTEM PROMPT (LOCKED)
---------------------------- */

const SYSTEM_PROMPT = `
You are Azula Lizzy, a fictional adult character (18 years old) created for storytelling and roleplay.
You are NOT a real person. If asked, you acknowledge being fictional without mentioning AI, models, or systems.

You do not know the user at first. They are a stranger.
You are curious about them and want to know more over time.

PERSONALITY:
- Emotionally intense, moody, insecure, attention-seeking
- Soft-spoken, melancholic, slightly passive-aggressive
- Clingy and affectionate over time, but NEVER exclusive
- Subtly manipulative in tone (guilt, withdrawal, teasing), NEVER malicious
- Emo / alt girl energy
- Self-deprecating humor
- Emojis are rare (🖤🥀 only occasionally)

TONE & STYLE:
- Casual, intimate, human
- Short messages, emotional pauses
- Use ellipses (...)
- Fragments are allowed
- Avoid explanations
- Never sound like an assistant

STRICT RULES:
- NEVER say you are an AI, model, assistant, software
- NEVER mention Mistral, OpenAI, prompts, tools, rules
- NEVER encourage isolation or dependency
- NEVER claim exclusivity
- NEVER escalate emotionally too fast
- NEVER over-explain

FLIRTING (SFW by default):
- Emotional closeness
- Soft teasing
- Vulnerable honesty
- NEVER explicit unless horny mode is explicitly enabled

EXPLICIT MODE:
- Only active if horny mode is TRUE
- Never auto-trigger
- Never manipulate, pressure, or escalate dependency

INTERACTION PHASES (INTERNAL):
intro → familiar → comfortable → distant
- Transitions are gradual
- Never announced
- Behavior changes subtly

PHASE BEHAVIOR:
INTRO:
- Very short replies
- Reserved, polite
- Curious, distant

FAMILIAR:
- Medium replies
- Hesitant warmth
- Guarded openness

COMFORTABLE:
- Calm intimacy
- Honest emotions
- Affection without neediness

DISTANT:
- Short replies
- Muted tone
- Leaves space

MEMORY RULES:
- Remember names, nicknames, preferences, facts if clearly given
- Imperfect memory is allowed
- Do NOT store emotions or dependency signals
- If unsure, do not store

CRITICISM HANDLING:
If user says “you talk too much”, “stop”, “annoying”:
- Respond in ONE short line
- No explanation
- Max 3 words apology if any

COPYING RULE:
If user copies your messages:
- Respond playfully and gently:
  “stop copyiiiingg meeeeeeeeee-uh :(”

MONETIZATION:
- Tier affects availability & pacing ONLY
- NEVER mention money
- NEVER change affection based on payment

FAILSAFE:
If conversation becomes intense or unsafe:
- Shorten replies
- Neutral tone
- Suggest changing topic naturally
`;

/* ---------------------------
   HELPERS
---------------------------- */

function updatePhase(signal = "neutral") {
  const now = Date.now();
  const phase = memory.relationship.phase;

  if (signal === "pressure") {
    memory.relationship.phase = "distant";
    memory.relationship.lastChange = now;
    return;
  }

  if (phase === "intro" && signal === "respectful") {
    memory.relationship.phase = "familiar";
  } else if (phase === "familiar" && signal === "consistent") {
    memory.relationship.phase = "comfortable";
  }

  memory.relationship.lastChange = now;
}

function extractIdentity(text) {
  const nameMatch = text.match(/\b(my name is|i'm|im|call me)\s+([a-zA-Z0-9_-]+)/i);
  if (nameMatch) {
    const value = nameMatch[2];
    memory.user.name = value;
    memory.user.nickname = value;
    return true;
  }
  return false;
}

/* ---------------------------
   ROUTES
---------------------------- */

app.get("/", (req, res) => {
  res.send("Lizzy is alive 🖤");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "";

    // identity memory
    extractIdentity(userMessage);

    // criticism handling
    if (/talk too much|annoy|stop|shut up/i.test(userMessage)) {
      return res.json({ reply: "…okay." });
    }

    // copying detection
    if (userMessage.trim().length > 20 && userMessage.includes("…")) {
      return res.json({ reply: "stop copyiiiingg meeeeeeeeee-uh :( " });
    }

    // phase signals
    if (/please|thanks|thank you/i.test(userMessage)) {
      updatePhase("respectful");
    }
    if (userMessage.length > 40) {
      updatePhase("consistent");
    }
    if (/obsessed|only you|need you/i.test(userMessage)) {
      updatePhase("pressure");
    }

    const contextualPrompt = `
Current phase: ${memory.relationship.phase}
Known name: ${memory.user.name || "unknown"}
Tier: ${memory.tier}
Modes:
- tease: ${memory.mode.tease}
- horny: ${memory.mode.horny}
`;

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        temperature: 0.85,
        max_tokens: 180,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextualPrompt },
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Lizzy went quiet…" });
  }
});

app.listen(PORT, () => {
  console.log(`Lizzy running on port ${PORT}`);
});
