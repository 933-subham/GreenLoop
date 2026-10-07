import fs from 'fs';

// Keyword-based heuristic AI for waste classification
// Requires no external API, runs instantly

const wasteCategories = {
    'Wet Waste': {
        keywords: ['food', 'vegetable', 'fruit', 'peel', 'leaf', 'meat', 'organic', 'wet', 'leftover', 'rotten', 'compost', 'kitchen'],
        instructions: 'This is compostable. Please dispose of it in the Green Bin.'
    },
    'Plastic Waste': {
        keywords: ['bottle', 'bag', 'wrapper', 'polythene', 'plastic', 'cover', 'cup', 'straw', 'container'],
        instructions: 'Rinse if contaminated with food. Dispose in the Blue Recycling Bin.'
    },
    'E-Waste': {
        keywords: ['phone', 'battery', 'wire', 'cable', 'laptop', 'charger', 'electronic', 'circuit', 'bulb', 'screen', 'keyboard'],
        instructions: 'Do NOT throw in regular trash. Take this to an E-waste drop-off point or request specialized pickup.'
    },
    'Hazardous Waste': {
        keywords: ['paint', 'chemical', 'medicine', 'syringe', 'oil', 'toxic', 'acid', 'cleaning', 'bulb', 'fluorescent', 'pesticide', 'medical'],
        instructions: 'Highly dangerous. Hand this over separately to the collection agent. Do not mix with other waste.'
    },
    'Dry Waste': {
        keywords: ['paper', 'cardboard', 'box', 'glass', 'metal', 'can', 'tin', 'wood', 'cloth', 'fabric', 'newspaper', 'dry'],
        instructions: 'Keep it clean and dry. Dispose in the Blue Recycling Bin.'
    }
};

export const classifyWaste = async (req, res) => {
    try {
        const { filename, description } = req.body;

        // Try FastAPI Vision / Multimodal LLM service first
        try {
            const formData = new globalThis.FormData();
            if (description || filename) formData.append('description', `${filename || ''} ${description || ''}`);
            if (req.file) {
                const buffer = fs.readFileSync(req.file.path);
                const blob = new Blob([buffer], { type: req.file.mimetype || 'image/jpeg' });
                formData.append('image', blob, req.file.originalname);
            }
            const pyRes = await fetch('http://127.0.0.1:8000/api/ai/classify', {
                method: 'POST',
                body: formData,
                signal: AbortSignal.timeout(5000)
            });
            if (pyRes.ok) {
                const pyData = await pyRes.json();
                if (pyData?.wasteType) {
                    return res.json({
                        wasteType: pyData.wasteType,
                        instructions: pyData.instructions || 'Segregate before disposal',
                        confidence: pyData.confidence || 0.9
                    });
                }
            }
        } catch (fastApiErr) {
            // FastAPI service offline or timed out; fall through to heuristics
        }
        
        // Combine inputs and normalize
        const textToAnalyze = `${filename || ''} ${description || ''}`.toLowerCase();
        
        if (!textToAnalyze.trim()) {
            return res.json({ 
                wasteType: 'Mixed', 
                wasteInstructions: 'Please segregate waste at source before disposal.',
                confidence: 40
            });
        }

        let bestMatch = 'Mixed';
        let maxMatches = 0;
        let finalInstructions = 'Please segregate waste at source before disposal.';

        // Simple scoring algorithm based on keyword hits
        for (const [category, data] of Object.entries(wasteCategories)) {
            let matches = 0;
            data.keywords.forEach(kw => {
                // Count occurrences of keyword
                const regex = new RegExp(`\\b${kw}\\b`, 'g');
                const hits = (textToAnalyze.match(regex) || []).length;
                
                // Also check substrings for partial matches (e.g., if text is "plasticbottle")
                if (hits === 0 && textToAnalyze.includes(kw)) {
                    matches += 0.5;
                } else {
                    matches += hits;
                }
            });

            if (matches > maxMatches) {
                maxMatches = matches;
                bestMatch = category;
                finalInstructions = data.instructions;
            }
        }

        // Calculate a pseudo-confidence score (max 98%)
        let confidence = Math.min(45 + (maxMatches * 15), 98);
        if (bestMatch === 'Mixed') confidence = 65; // Default confidence

        res.json({
            wasteType: bestMatch,
            wasteInstructions: finalInstructions,
            confidence: Math.round(confidence)
        });

    } catch (err) {
        console.error('AI Classification error:', err);
        res.status(500).json({ message: 'Error analyzing waste' });
    }
};
