from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.base import Base
from app.db.session import engine
from app.api.routes import auth, orders, works, boats, problems, seasons, shifts, reports, dashboard

# Create tables
Base.metadata.create_all(bind=engine)

from app.db.session import SessionLocal
from app.db.models import User
from app.core.security import hash_password

# Create test user if not exists
db = SessionLocal()
test_user = db.query(User).filter(User.username == "test").first()
if not test_user:
    hashed_pwd = hash_password("test123")
    new_user = User(username="test", password_hash=hashed_pwd)
    db.add(new_user)
    db.commit()
    print("Test user created: username='test', password='test123'")
db.close()

app = FastAPI(title="LNI Works API", description="Gestione centro nautico", version="1.0.0")

origins = [
    "*",
    "http://localhost:5173",  # L'origine del tuo frontend (Vite/React)
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Deve includere PUT
    allow_headers=["*"],  # Deve includere Authorization
)

# Appena sotto DEVI includere i router
app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(works.router)
app.include_router(boats.router)
app.include_router(problems.router)
app.include_router(seasons.router)
app.include_router(shifts.router)
app.include_router(reports.router)
app.include_router(dashboard.router)

@app.get("/")
def read_root():
    return {"message": "LNI Works API v1.0.0"}