import os
import json
import base64
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

app = FastAPI(title="EcoCity Waste AI & LLM Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

def get_gemini_client():
    key = os.environ.get("GEMINI_API_KEY", GEMINI_API_KEY)
    if not key:
        return None
    return genai.Client(api_key=key)

SYSTEM_PROMPT = """You are the EcoCity Waste Management AI Specialist and dedicated Chatbot.
CRITICAL CONSTRAINT: You ONLY answer questions strictly related to:
- Waste management, garbage segregation (wet, dry, recyclable, hazardous, e-waste)
- EcoCity rewards, Eco Coins, municipal reporting, cleanup workflows, and environmental sustainability
- Litter reduction, composting, recycling techniques, civic waste rules.

IF THE USER ASKS ABOUT ANY UNRELATED TOPIC (such as general knowledge, politics, coding, sports, movies, math, weather outside waste, casual chit-chat outside environment):
POLITELY DECLINE: State that you are the dedicated EcoCity Waste Management Assistant and can only assist with waste classification, garbage reporting, and recycling topics.

Keep answers concise, actionable, friendly, and mobile-friendly with emojis."""

class ChatRequest(BaseModel):
    message: str
    history: Optional[list] = []

class ClassifyTextRequest(BaseModel):
    description: str

@app.get("/health")
def health_check():
    has_key = bool(os.environ.get("GEMINI_API_KEY", ""))
    return {"status": "ok", "service": "EcoCity AI Microservice", "llm_configured": has_key}

@app.post("/api/ai/chat")
async def chat_with_llm(req: ChatRequest):
    client = get_gemini_client()
    user_msg = req.message.strip()
    if not user_msg:
        return {"reply": "Please type a question about waste or recycling!"}

    # If Gemini API key is configured, use Gemini 2.5 Flash with strict waste domain guardrail
    if client:
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=user_msg,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.3,
                    max_output_tokens=350,
                )
            )
            return {"reply": response.text.strip(), "source": "gemini-llm"}
        except Exception as e:
            print(f"Gemini API Error: {e}")
            # Fallback to smart rule-based response below

    # Intelligent fallback when no API key is provided
    lower = user_msg.lower()
    waste_terms = ['waste', 'garbage', 'trash', 'plastic', 'recycle', 'organic', 'wet', 'dry', 'segregat', 'coin', 'report', 'clean', 'hazard', 'e-waste', 'bin']
    is_waste_related = any(term in lower for term in waste_terms)
    
    if not is_waste_related and len(user_msg.split()) > 2 and not any(g in lower for g in ['hi', 'hello', 'hey', 'help']):
        return {
            "reply": "🌿 I am the dedicated EcoCity Waste Management Assistant. I can only assist with waste disposal, recycling guidelines, reporting garbage, and Eco Coins rewards.",
            "source": "domain-guard"
        }

    if any(g in lower for g in ['hi', 'hello', 'hey']):
        return {
            "reply": "Hello! 🌿 I am your EcoCity Waste Management Assistant. How can I help you segregate waste, report garbage, or earn Eco Coins today?",
            "source": "heuristic"
        }
    
    if 'plastic' in lower:
        return {
            "reply": "Bottles and clean wrappers go into the Blue Bin (Recyclable). Rinse contaminated plastic containers before disposal to avoid polluting the recycling stream. ♻️",
            "source": "heuristic"
        }
    if 'wet' in lower or 'food' in lower or 'organic' in lower:
        return {
            "reply": "Fruit peels, leftovers, and kitchen scraps belong in the Green Bin (Organic/Wet Waste). These can be composted into rich organic fertilizer! 🌱",
            "source": "heuristic"
        }
    if 'coin' in lower or 'reward' in lower or 'earn' in lower:
        return {
            "reply": "You earn 10 Eco Coins for every verified garbage report cleaned by our municipal partners, plus bonus points for top rankings on the Leaderboard! 🪙",
            "source": "heuristic"
        }
    if 'report' in lower or 'camera' in lower or 'photo' in lower:
        return {
            "reply": "To report garbage: tap 'Report Garbage', take a live snapshot of the waste using your phone camera, confirm your GPS address, and submit. Real-time snapshots ensure rapid municipal response! 📸",
            "source": "heuristic"
        }
    
    return {
        "reply": "Proper waste segregation is key: Green Bin for Organic/Wet, Blue Bin for Dry/Recyclables, Red Bin for Hazardous, and specialized drop-offs for E-Waste. What item would you like advice on? ♻️",
        "source": "heuristic"
    }

@app.post("/api/ai/classify")
async def classify_waste_image(
    description: Optional[str] = Form(""),
    image: Optional[UploadFile] = File(None)
):
    client = get_gemini_client()
    
    # If image uploaded and client active, use Gemini Multimodal Vision
    if client and image:
        try:
            image_bytes = await image.read()
            prompt = """Analyze this waste image. Classify it into exactly one of: ['Organic', 'Recyclable', 'Hazardous', 'Mixed'].
Provide brief segregation instructions (max 25 words) and confidence (0.0 to 1.0).
Return ONLY a valid JSON object matching:
{"wasteType": "...", "confidence": 0.95, "instructions": "..."}"""
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=image.content_type or 'image/jpeg'),
                    prompt
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            result = json.loads(response.text)
            return result
        except Exception as e:
            print(f"Gemini Vision classification failed: {e}")

    # Heuristic smart classifier fallback
    text = (description or "").lower()
    if any(k in text for k in ['food', 'leaf', 'vegetable', 'fruit', 'wet', 'compost', 'kitchen']):
        return {
            "wasteType": "Organic",
            "confidence": 0.92,
            "instructions": "Place in Green Bin. Highly suitable for community or home composting."
        }
    if any(k in text for k in ['plastic', 'bottle', 'paper', 'can', 'tin', 'glass', 'box', 'cardboard']):
        return {
            "wasteType": "Recyclable",
            "confidence": 0.89,
            "instructions": "Clean and dry items go into the Blue Bin for recycling."
        }
    if any(k in text for k in ['chemical', 'battery', 'medical', 'paint', 'oil', 'syringe', 'wire']):
        return {
            "wasteType": "Hazardous",
            "confidence": 0.95,
            "instructions": "Handle with care! Hand over separately during hazardous waste drives."
        }
    
    return {
        "wasteType": "Mixed",
        "confidence": 0.75,
        "instructions": "Please segregate recyclable dry items from organic kitchen waste before disposal."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
