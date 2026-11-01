#models.py contient les modèles qui décrivent les données que ton application souhaite stocker dans la base de données.
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    # Nom d'utilisateur optionnel (en minuscules), utilisable à la place de l'email pour se connecter
    username: Mapped[str | None] = mapped_column(String(30), unique=True, index=True, default=None)
    password_hash: Mapped[str] = mapped_column(String(255))
    # "user" (par défaut) ou "admin". Jamais choisi par le visiteur à l'inscription.
    role: Mapped[str] = mapped_column(String(20), default="user", server_default="user")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class Project(Base):
    """Un site partagé (déployé) par un utilisateur."""
        #définit un modèle SQLAlchemy correspondant à une table de la base de données.
    __tablename__ = "projects"
    #Cette contrainte interdit à un même utilisateur de créer deux projets portant le même nom.
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_project_user_name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    # Si l'utilisateur est supprimé, ses projets le sont aussi (ON DELETE CASCADE)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(40))
    #adresse du dépôt GitHub, limitée à 300 caractères.
    repo_url: Mapped[str] = mapped_column(String(300))
    # pending (en attente) | building (build en cours) | online (en ligne) | failed (échec)
    status: Mapped[str] = mapped_column(String(20), default="pending", server_default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )