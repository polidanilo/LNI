from fastapi import APIRouter, Header, HTTPException, Depends
from typing import Optional
import os

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.post("/seed")
async def seed_database(x_admin_secret: Optional[str] = Header(None)):
    """
    Popola il database con dati iniziali.
    Richiede header: X-Admin-Secret
    """
    # Verifica chiave segreta
    admin_secret = os.getenv("ADMIN_SECRET")
    
    if not admin_secret or x_admin_secret != admin_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Import dinamico per evitare problemi circolari
        from renderseed import seed_database as seed_func
        seed_func()
        return {"message": "Database seeded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))