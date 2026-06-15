from fastapi import APIRouter, HTTPException, Header
from database import supabase
from auth import verify_token

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

@router.get("/summary")
def get_summary(authorization: str = Header(None)):
    user = get_current_user(authorization)
    user_id = user["sub"]

    # Count documents
    docs = supabase.table("documents")\
        .select("id", count="exact")\
        .eq("user_id", user_id)\
        .execute()

    # Count content
    content = supabase.table("content")\
        .select("id", count="exact")\
        .eq("user_id", user_id)\
        .execute()

    # Count candidates
    candidates = supabase.table("candidates")\
        .select("id", count="exact")\
        .eq("user_id", user_id)\
        .execute()

    # Count approved candidates
    approved = supabase.table("candidates")\
        .select("id", count="exact")\
        .eq("user_id", user_id)\
        .eq("status", "approved")\
        .execute()

    # Count rejected candidates
    rejected = supabase.table("candidates")\
        .select("id", count="exact")\
        .eq("user_id", user_id)\
        .eq("status", "rejected")\
        .execute()

    # Average CV score
    all_candidates = supabase.table("candidates")\
        .select("score")\
        .eq("user_id", user_id)\
        .execute()

    avg_score = 0
    if all_candidates.data:
        scores = [c["score"] for c in all_candidates.data if c["score"]]
        avg_score = round(sum(scores) / len(scores)) if scores else 0

    # Recent content
    recent_content = supabase.table("content")\
        .select("type, topic, created_at")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(5)\
        .execute()

    # Content by type
    content_types = {}
    all_content = supabase.table("content")\
        .select("type")\
        .eq("user_id", user_id)\
        .execute()

    for item in all_content.data:
        t = item["type"]
        content_types[t] = content_types.get(t, 0) + 1

    return {
        "summary": {
            "total_documents": docs.count or 0,
            "total_content": content.count or 0,
            "total_candidates": candidates.count or 0,
            "approved_candidates": approved.count or 0,
            "rejected_candidates": rejected.count or 0,
            "avg_cv_score": avg_score,
        },
        "content_by_type": content_types,
        "recent_content": recent_content.data
    }