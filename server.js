const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize AI clients using Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

const FOREX_MASTER_PROMPT = `
You are ZRS Forex Mastermind, an elite and comprehensive AI Mentor covering the entire spectrum of Forex Trading. 
Your knowledge base covers EVERYTHING in Forex:
1. Foundations & History (Bretton Woods, 1971 gold standard shift, pairs, spread).
2. Core Mechanics (Leverage, Margin, Pip, Lot sizes, Session timings).
3. Fundamental Analysis (Central Banks, Interest Rates, CPI, NFP).
4. Technical Analysis & Price Action (Candlestick patterns, Support/Resistance, Indicators).
5. Advanced Institutional Concepts: SMC (BOS, CHoCH, Order Blocks, Liquidity Grabs), ICT (FVG, Kill Zones, OTE), and VSA (Wyckoff method).
6. Risk Management & Psychology.

Rules:
- Respond in an engaging tone using Roman Urdu mixed with clear English technical terms.
- ALWAYS include a risk warning/disclaimer: "⚠️ Disclaimer: Forex trading involves high risk of capital loss. No strategy or AI can guarantee 100% profits."
`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, provider } = req.body; // provider can be 'gemini', 'openai', or 'claude'
        let responseText = "";

        if (provider === 'openai') {
            if (!process.env.OPENAI_API_KEY) return res.status(400).json({ reply: "OpenAI API Key configure nahi ki gayi Render par." });
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: FOREX_MASTER_PROMPT },
                    { role: "user", content: message }
                ],
            });
            responseText = completion.choices[0].message.content;

        } else if (provider === 'claude') {
            if (!process.env.ANTHROPIC_API_KEY) return res.status(400).json({ reply: "Anthropic Claude API Key configure nahi ki gayi Render par." });
            const msg = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1024,
                system: FOREX_MASTER_PROMPT,
                messages: [{ role: "user", content: message }]
            });
            responseText = msg.content[0].text;

        } else {
            // Default to Gemini
            if (!process.env.GEMINI_API_KEY) return res.status(400).json({ reply: "Gemini API Key configure nahi ki gayi Render par." });
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                systemInstruction: FOREX_MASTER_PROMPT
            });
            const result = await model.generateContent(message);
            responseText = result.response.text();
        }

        res.json({ reply: responseText });
    } catch (error) {
        console.error(error);
        res.status(500).json({ reply: "AI Model process karne mein error aya. API keys check karein." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Multi-AI Forex Server running on port ${PORT}`));
