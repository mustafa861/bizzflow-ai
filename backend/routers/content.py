from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from database import supabase
from auth import verify_token
from groq import Groq
from dotenv import load_dotenv
import os
import uuid

load_dotenv()

router = APIRouter(prefix="/api/content", tags=["Content"])

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

class ContentRequest(BaseModel):
    type: str  # instagram, facebook, blog, email, whatsapp
    topic: str
    tone: str  # professional, casual, funny
    language: str  # english, urdu, roman_urdu

@router.post("/generate")
def generate_content(data: ContentRequest, authorization: str = Header(None)):
    user = get_current_user(authorization)

    type_prompts = {
        "instagram": "Write an Instagram caption with relevant emojis and hashtags.",
        "facebook": "Write a Facebook post that encourages engagement and shares.",
        "blog": "Write a short blog article intro (200 words) with a hook and key points.",
        "email": "Write a professional email newsletter with subject line and body.",
        "whatsapp": "Write a short WhatsApp broadcast message that feels personal and direct."
    }

    tone_prompts = {
        "professional": "Use a professional and authoritative tone.",
        "casual": "Use a friendly and conversational tone.",
        "funny": "Use humor and wit to make it entertaining."
    }

    lang_prompts = {
        "english": "Write in English.",
        "urdu": "Write in Urdu (Roman script).",
        "roman_urdu": "Write in Roman Urdu (Urdu words in English letters)."
    }

    type_instruction = type_prompts.get(data.type, "Write marketing content.")
    tone_instruction = tone_prompts.get(data.tone, "Use a professional tone.")
    lang_instruction = lang_prompts.get(data.language, "Write in English.")

    prompt = f"""You are a content marketing expert for Pakistani businesses.

Topic: {data.topic}

Instructions:
- {type_instruction}
- {tone_instruction}
- {lang_instruction}
- Make it relevant to Pakistani culture and market.
- Keep it concise and impactful.
- Output ONLY the content, no explanation."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "user", "content": prompt}
        ],
        max_tokens=600,
    )

    output = response.choices[0].message.content

    # Save to database
    result = supabase.table("content").insert({
        "id": str(uuid.uuid4()),
        "user_id": user["sub"],
        "type": data.type,
        "topic": data.topic,
        "output": output
    }).execute()

    return {
        "content": output,
        "id": result.data[0]["id"]
    }

@router.get("/history")
def get_history(authorization: str = Header(None)):
    user = get_current_user(authorization)

    result = supabase.table("content")\
        .select("*")\
        .eq("user_id", user["sub"])\
        .order("created_at", desc=True)\
        .limit(20)\
        .execute()

    return {"history": result.data}

@router.delete("/{content_id}")
def delete_content(content_id: str, authorization: str = Header(None)):
    user = get_current_user(authorization)

    supabase.table("content")\
        .delete()\
        .eq("id", content_id)\
        .eq("user_id", user["sub"])\
        .execute()

    return {"message": "Content deleted successfully"}