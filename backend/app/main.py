#Point d'entrée et de configuration du backend FastAPI
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from . import models  # noqa: F401  (nécessaire pour que la table soit connue)
from .database import Base, engine, get_db
from .routers import admin, auth, projects


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Au démarrage : crée les tables qui n'existent pas encore
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Shipyard", lifespan=lifespan)

# Autorise le frontend (port 5173) à appeler le backend (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(projects.router)


@app.get("/")
def root():
    return {"message": "La plateforme fonctionne"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"database": "ok"}