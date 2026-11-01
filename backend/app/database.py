#L'objectif de ce fichier est de préparer la connexion entre ton backend Python (FastAPI) et ta base de données PostgreSQL.
#permet de récupérer des informations depuis les variables d'environnement.
import os
#prépare le moteur de connexion à la base de données.
from sqlalchemy import create_engine
#DeclarativeBase : permet de définir des classes Python qui représentent les tables de la base de données
#sessionmaker : permet de créer des sessions pour travailler avec la base de données.
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Docker Compose fournit "postgresql://...". SQLAlchemy a besoin de savoir
# quel "pilote" utiliser : ici psycopg (version 3).
DATABASE_URL = os.environ["DATABASE_URL"].replace(
    #remplace postgresql:// par postgresql+psycopg://.
    #Pourquoi ? Pour indiquer à SQLAlchemy qu'il doit utiliser le pilote Psycopg pour communiquer avec PostgreSQL.
    "postgresql://", "postgresql+psycopg://", 1
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()