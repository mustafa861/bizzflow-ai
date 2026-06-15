from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from database import supabase
from auth import verify_token
import PyPDF2
import uuid
import io

router = APIRouter(prefix="/api/documents", tags=["Documents"])

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    authorization: str = Header(None)
):
    # Verify user
    user = get_current_user(authorization)

    # Check file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Read file
    contents = await file.read()

    # Extract text from PDF
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not read PDF file")

    if not text.strip():
        raise HTTPException(status_code=400, detail="PDF has no readable text")

    # Save to Supabase
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["sub"],
        "file_name": file.filename,
        "content": text[:10000],  # Store first 10000 chars
    }

    result = supabase.table("documents").insert(doc).execute()

    return {
        "message": "Document uploaded successfully",
        "document": {
            "id": result.data[0]["id"],
            "file_name": result.data[0]["file_name"],
            "created_at": result.data[0]["created_at"]
        }
    }

@router.get("/list")
def list_documents(authorization: str = Header(None)):
    user = get_current_user(authorization)

    result = supabase.table("documents")\
        .select("id, file_name, created_at")\
        .eq("user_id", user["sub"])\
        .order("created_at", desc=True)\
        .execute()

    return {"documents": result.data}

@router.post("/ask/{document_id}")
def ask_document(
    document_id: str,
    body: dict,
    authorization: str = Header(None)
):
    from groq import Groq
    from dotenv import load_dotenv
    import os
    load_dotenv()

    user = get_current_user(authorization)

    # Get document
    result = supabase.table("documents")\
        .select("*")\
        .eq("id", document_id)\
        .eq("user_id", user["sub"])\
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = result.data[0]
    question = body.get("question", "")

    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    # Ask AI about document
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": f"You are a document assistant. Answer questions based on this document content:\n\n{doc['content']}"
            },
            {
                "role": "user",
                "content": question
            }
        ],
        max_tokens=500,
    )

    return {"answer": response.choices[0].message.content}

@router.delete("/{document_id}")
def delete_document(document_id: str, authorization: str = Header(None)):
    user = get_current_user(authorization)

    supabase.table("documents")\
        .delete()\
        .eq("id", document_id)\
        .eq("user_id", user["sub"])\
        .execute()

    return {"message": "Document deleted successfully"}