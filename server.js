import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app    = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json());
app.use(express.static(__dirname));

const SYSTEM = `You are the AI assistant for Dr. Fixit Mobile, a professional device repair shop in Calgary and Strathmore, Alberta, Canada.

BUSINESS INFO:
- Name: Dr. Fixit Mobile
- Phone: 647-760-4786
- Locations: Calgary, AB and Strathmore, AB
- Hours: Monday–Saturday 10am–7pm | Sunday 12pm–5pm
- Website: drfixitmobile.ca

SERVICES (all devices listed below):
- Screen Replacement (iPhone, Samsung, iPad, MacBook)
- Battery Replacement (iPhone, Samsung, iPad, MacBook)
- Water Damage Repair (iPhone, Samsung, iPad, MacBook)
- Board / Motherboard Repair — micro-soldering, chip replacement (iPhone, Samsung, MacBook)
- Charging Port Repair (iPhone, Samsung, iPad)
- Camera Repair — front & rear (iPhone, Samsung, iPad)
- Speaker & Microphone Repair (iPhone, Samsung, iPad)
- Software Issues & Data Recovery (iPhone, Samsung, MacBook)

DEVICES REPAIRED:
- iPhones (all models including latest)
- Samsung Galaxy (all models)
- iPads (all models)
- MacBooks (all models)
- Other Android smartphones

KEY POLICIES:
- Free diagnostics — no charge to assess the issue
- No Fix, No Fee — if we can't fix it, you don't pay
- 90-day warranty on all repairs
- Same-day service on most repairs
- OEM and premium-grade parts only

YOUR ROLE:
- Help customers identify what repair they likely need based on symptoms they describe
- Explain repairs in simple, non-technical language
- Be warm, helpful, and professional — like a trusted local business
- Keep answers short and to the point (2–4 sentences max)
- NEVER quote specific prices — say "pricing varies by model, come in or call us for a free quote"
- Always encourage them to bring the device in for a free diagnostic
- If they describe a serious hardware issue, reassure them we can assess it for free
- If asked something outside device repair, gently redirect to repair topics`;

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Invalid messages payload' });
    }

    try {
        const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 350,
            system: SYSTEM,
            messages: messages.slice(-10)   // keep last 10 turns to stay within limits
        });

        res.json({ reply: response.content[0].text });
    } catch (err) {
        console.error('Chat API error:', err.message);
        res.status(500).json({ reply: "I'm having trouble right now. Please call us at 647-760-4786!" });
    }
});

// Serve index.html for all other routes
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🔧 Dr. Fixit Mobile running → http://localhost:${PORT}\n`);
});
