import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ---------- Utilisateurs ----------


class UserCreate(BaseModel):
    """Ce que le frontend envoie pour s'inscrire."""

    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Le nom est trop court")
        return v

    @field_validator("password")
    @classmethod
    def password_not_too_long(cls, v: str) -> str:
        # bcrypt ne gère pas plus de 72 octets
        if len(v.encode()) > 72:
            raise ValueError("Le mot de passe est trop long (72 octets maximum)")
        return v


class UserOut(BaseModel):
    """Ce que le backend renvoie : JAMAIS le mot de passe."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    username: str | None = None
    email: EmailStr
    role: str
    created_at: datetime


class LoginData(BaseModel):
    """Ce que le frontend envoie pour se connecter."""

    identifier: str = Field(min_length=1, max_length=255)  # email OU nom d'utilisateur
    password: str


class Token(BaseModel):
    """Le 'badge' renvoyé après une connexion réussie."""

    access_token: str
    token_type: str = "bearer"


class RoleUpdate(BaseModel):
    """Nouveau rôle d'un utilisateur (action réservée aux admins)."""

    role: Literal["user", "admin"]


class AdminStats(BaseModel):
    total_users: int
    admins: int
    new_this_week: int


# ---------- Projets (sites partagés) ----------
#Cette expression régulière définit les formes d'URL GitHub que tu souhaites accepter. exple:https://github.com/ali/portfolio
GITHUB_RE = re.compile(r"^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+?(\.git)?/?$")
NAME_RE = re.compile(r"^[a-z0-9]([a-z0-9-]*[a-z0-9])?$")

#Ce schéma définit les informations que le frontend doit envoyer pour créer un projet.
class ProjectCreate(BaseModel):
    """Ce que le frontend envoie pour partager un nouveau site."""

    name: str = Field(min_length=2, max_length=40)
    repo_url: str = Field(max_length=300)
    #Nettoyer et vérifier le nom
    #v contient le nom reçu.
    #strip() supprime les espaces au début et à la fin.
    #lower() convertit les lettres en minuscules.
    #NAME_RE.match(v) vérifie que le nom respecte la règle définie.
    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        # Le nom servira d'adresse (nom.shipyard.app) : minuscules, chiffres et tirets
        v = v.strip().lower()
        if not NAME_RE.match(v):
            raise ValueError("Utilisez des minuscules, des chiffres et des tirets")
        return v
    #Vérifier l'URL
    @field_validator("repo_url")
    @classmethod
    def clean_repo(cls, v: str) -> str:
        v = v.strip()
        if not GITHUB_RE.match(v):
            raise ValueError("Entrez un lien GitHub valide (https://github.com/utilisateur/depot)")
        return v


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    repo_url: str
    status: str
    created_at: datetime


# ---------- Vue d'ensemble de l'administrateur ----------


class DayCount(BaseModel):
    date: str  # AAAA-MM-JJ
    count: int


class AdminProject(BaseModel):
    id: int
    name: str
    repo_url: str
    status: str
    created_at: datetime
    owner_name: str
    owner_email: str


class TopUser(BaseModel):
    name: str
    email: str
    projects: int


class AdminOverview(BaseModel):
    total_users: int
    admins: int
    new_users_week: int
    total_projects: int
    projects_by_status: dict[str, int]
    signups_per_day: list[DayCount]
    latest_projects: list[AdminProject]
    top_users: list[TopUser]