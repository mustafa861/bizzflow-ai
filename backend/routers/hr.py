from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from pydantic import BaseModel
from database import supabase
from auth import verify_token
from groq import Groq
from dotenv import load_dotenv
import os
import uuid
import PyPDF2
import io

load_dotenv()

router = APIRouter(prefix="/api/hr", tags=["HR Tools"])
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

class JobDescription(BaseModel):
    job_title: str
    requirements: str

@router.post("/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    job_title: str = "General Position",
    requirements: str = "",
    authorization: str = Header(None)
):
    user = get_current_user(authorization)

    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files supported")

    contents = await file.read()

    # Extract text from PDF
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        cv_text = ""
        for page in pdf_reader.pages:
            cv_text += page.extract_text() or ""
    except:
        raise HTTPException(status_code=400, detail="Could not read PDF")

    if not cv_text.strip():
        raise HTTPException(status_code=400, detail="PDF has no readable text")

    # AI screening
    screening_prompt = f"""You are an expert HR recruiter. Analyze this CV for the position of {job_title}.

Job Requirements: {requirements if requirements else "General professional skills"}

CV Content:
{cv_text[:3000]}

Provide:
1. Candidate Name (extract from CV)
2. Email (extract from CV if available)
3. Score (0-100) based on job fit
4. Top 3 strengths
5. Top 2 weaknesses
6. 5 interview questions specific to this candidate

Format your response as JSON like this:
{{
  "name": "Candidate Name",
  "email": "email@example.com",
  "score": 85,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "interview_questions": ["q1", "q2", "q3", "q4", "q5"]
}}

Output ONLY the JSON, nothing else."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": screening_prompt}],
        max_tokens=800,
    )

    import json
    try:
        ai_result = json.loads(response.choices[0].message.content)
    except:
        ai_result = {
            "name": "Unknown",
            "email": "",
            "score": 50,
            "strengths": [],
            "weaknesses": [],
            "interview_questions": []
        }

    # Save to database
    candidate = {
        "id": str(uuid.uuid4()),
        "user_id": user["sub"],
        "name": ai_result.get("name", "Unknown"),
        "email": ai_result.get("email", ""),
        "cv_text": cv_text[:5000],
        "score": ai_result.get("score", 0),
        "status": "pending",
        "interview_questions": json.dumps(ai_result.get("interview_questions", []))
    }

    result = supabase.table("candidates").insert(candidate).execute()

    return {
        "candidate": result.data[0],
        "analysis": ai_result
    }

@router.get("/candidates")
def get_candidates(authorization: str = Header(None)):
    user = get_current_user(authorization)

    result = supabase.table("candidates")\
        .select("*")\
        .eq("user_id", user["sub"])\
        .order("score", desc=True)\
        .execute()

    return {"candidates": result.data}

@router.patch("/candidates/{candidate_id}/status")
def update_status(candidate_id: str, body: dict, authorization: str = Header(None)):
    user = get_current_user(authorization)

    supabase.table("candidates")\
        .update({"status": body.get("status")})\
        .eq("id", candidate_id)\
        .eq("user_id", user["sub"])\
        .execute()

    return {"message": "Status updated"}

@router.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: str, authorization: str = Header(None)):
    user = get_current_user(authorization)

    supabase.table("candidates")\
        .delete()\
        .eq("id", candidate_id)\
        .eq("user_id", user["sub"])\
        .execute()

    return {"message": "Candidate deleted"}