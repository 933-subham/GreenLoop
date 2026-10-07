const FAQS = [
    {
        intents: ['hi', 'hello', 'hey', 'start'],
        reply: "Hello! I am your EcoCity Assistant 🌿. How can I help you today? You can ask me how to report garbage, what happens when it's cleaned, or recycling tips."
    },

    {
        intents: ['how', 'report', 'garbage', 'trash', 'complain'],
        reply: "To report garbage:\n1. Open the 'Report Garbage' tab.\n2. Upload a clear photo of the trash.\n3. The AI will categorize it, and you must confirm the GPS location.\n4. Submit! You'll earn 10 Eco Coins when it gets cleaned! 🪙"
    },
    {
        intents: ['rewards', 'coins', 'eco coins', 'earn', 'shop', 'redeem'],
        reply: "You earn 10 Eco Coins for every valid report that gets cleaned, and 5 extra if you do it yourself! Use these coins in the 'Eco Shop' to buy vouchers, trees planted in your name, or utility discounts."
    },
    {
        intents: ['false', 'fake', 'penalty', 'deduct', 'wrong'],
        reply: "Please be accurate! If a partner arrives and finds no garbage (or a fake photo), they mark it as a 'False Report'. An Admin will review it, and if approved, you lose 10 Eco Coins and drop on the leaderboard. 📉"
    },
    {
        intents: ['contact', 'call', 'admin', 'municipality', 'help', 'support'],
        reply: "If you need direct assistance, use the Contact Form on the homepage, or email the municipality directly at admin@ecocity.gov."
    },
    {
        intents: ['segregate', 'separate', 'type', 'wet', 'dry', 'plastic', 'ewaste'],
        reply: "Proper segregation is vital:\n- Wet Waste (Food) 🍏 → Green Bin (Composting)\n- Dry/Plastic 📦 → Blue Bin (Recycling)\n- E-Waste 📱 → Specialized pickup\n- Hazardous 🧪 → Hand over directly, do not mix."
    },
    {
        intents: ['leaderboard', 'rank', 'points'],
        reply: "The Leaderboard shows the top eco-warriors! You get points for valid reports. Top citizens and partners get special municipality recognition. Check the Leaderboard tab to see your local rank! 🏆"
    },
    {
        intents: ['map', 'live', 'track'],
        reply: "Only Partners and Admins can see the Live Garabge Map to prevent misuse. However, you can track the status of your own reports in the 'My Reports' tab! 📋"
    }
];

export const handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) return res.json({ reply: "Please type a message!" });
        
        const input = message.toLowerCase();
        
        // 1. Check for Agentic "Report Garbage" Intent
        const reportKeywords = ['report', 'found', 'there is', 'saw', 'complaint'];
        const isReporting = reportKeywords.some(kw => input.includes(kw)) && 
                            (input.includes('garbage') || input.includes('waste') || input.includes('trash'));

        if (isReporting) {
            const wasteTypes = ['organic', 'wet', 'dry', 'plastic', 'hazardous', 'e-waste', 'recyclable', 'mixed'];
            let detectedType = 'Mixed'; // default
            
            for (const wt of wasteTypes) {
                if (input.includes(wt)) {
                    // Map common synonyms to schema enums
                    if (wt === 'wet') detectedType = 'Wet Waste';
                    else if (wt === 'dry') detectedType = 'Dry Waste';
                    else if (wt === 'plastic') detectedType = 'Plastic Waste';
                    else if (wt === 'hazardous') detectedType = 'Hazardous Waste';
                    else if (wt === 'e-waste') detectedType = 'E-Waste';
                    else if (wt === 'organic') detectedType = 'Organic';
                    else if (wt === 'recyclable') detectedType = 'Recyclable';
                    else detectedType = 'Mixed';
                    break;
                }
            }

            // Extract location (naive extraction checking for 'near', 'at', 'in')
            let detectedLocation = '';
            const locationMatches = input.match(/(?:near|at|in)\s+([^,.]+)/i);
            if (locationMatches && locationMatches[1]) {
                const stops = ['garbage', 'waste', 'trash', 'some', 'the'];
                detectedLocation = locationMatches[1].split(' ').filter(w => !stops.includes(w.toLowerCase())).join(' ').trim();
            }

            // Title-case the location
            if (detectedLocation) {
                detectedLocation = detectedLocation.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }

            return res.json({
                reply: `I can help you report that! I've prepared a ${detectedType} waste report${detectedLocation ? ` for ${detectedLocation}` : ''}. Click the button below to review and submit it.`,
                action: 'prefill_report',
                extractedData: {
                    wasteType: detectedType,
                    address: detectedLocation
                }
            });
        }

        // 2. Query FastAPI LLM Service (guardrailed strictly to waste management)
        try {
            const pyRes = await fetch('http://127.0.0.1:8000/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
                signal: AbortSignal.timeout(3500)
            });
            if (pyRes.ok) {
                const pyData = await pyRes.json();
                if (pyData?.reply) {
                    return res.json({ reply: pyData.reply });
                }
            }
        } catch (llmErr) {
            // FastAPI microservice not running or timed out; fall back seamlessly
        }

        // 3. Heuristic FAQ Fallback Loop
        let bestMatch = FAQS[0]; // Default to greeting if nothing else
        let maxHits = 0;

        for (const faq of FAQS) {
            let hits = 0;
            faq.intents.forEach(intent => { if (input.includes(intent)) hits++; });
            if (hits > maxHits) { maxHits = hits; bestMatch = faq; }
        }

        if (maxHits === 0) {
            return res.json({ reply: "🌿 I am your EcoCity Waste Management Assistant. I can only assist with waste segregation, reporting garbage, and Eco Coins. Could you ask a question related to waste management or recycling?" });
        }

        res.json({ reply: bestMatch.reply });

    } catch (err) {
        console.error('Chatbot error:', err);
        res.status(500).json({ reply: "Sorry, I'm having trouble connecting right now." });
    }
};
