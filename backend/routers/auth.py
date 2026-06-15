from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from database import supabase
from auth import hash_password, verify_password, create_access_token
import uuid

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup")
def signup(data: SignupRequest):
    # Check if user already exists
    existing = supabase.table("users").select("*").eq("email", data.email).execute()
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = {
        "id": str(uuid.uuid4()),
        "full_name": data.full_name,
        "email": data.email,
        "password": hash_password(data.password),
        "is_active": True
    }
    
    result = supabase.table("users").insert(new_user).execute()
    user = result.data[0]
    
    token = create_access_token({"sub": user["id"], "email": user["email"]})
    
    return {
        "message": "Account created successfully",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"]
        }
    }

@router.post("/login")
def login(data: LoginRequest):
    # Find user
    result = supabase.table("users").select("*").eq("email", data.email).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    user = result.data[0]
    
    # Verify password
    if not verify_password(data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token({"sub": user["id"], "email": user["email"]})
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"]
        }
    }