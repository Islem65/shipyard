#La route /auth/register reçoit les données envoyées par React et orchestre le traitement de l'inscription.
from sqlalchemy import or_, select
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import LoginData, Token, UserCreate, UserOut
from ..security import (
    DUMMY_HASH,
    create_access_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

#Elle indique à FastAPI que la fonction register() doit être exécutée lorsqu'une requête POST est envoyée à /auth/register
#la partie de signup
@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
#data: UserCreate data contient les données reçues du formulaire React.
def register(data: UserCreate, db: Session = Depends(get_db)):
    #Cette instruction convertit l'adresse e-mail en minuscules.Pour éviter que ton application traite différemment des adresses qui ne diffèrent que par les majuscules et les minuscules.
    email = data.email.lower()

    # 1. L'email est-il déjà pris ?
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un compte existe déjà avec cet email.",
        )

    # 2. On enregistre avec le mot de passe haché
    user = User(name=data.name, email=email, password_hash=hash_password(data.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:  # deux inscriptions simultanées avec le même email
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un compte existe déjà avec cet email.",
        )
    db.refresh(user)
    return user 


#partie login
@router.post("/login", response_model=Token)
def login(data: LoginData, db: Session = Depends(get_db)):
    # On accepte l'email OU le nom d'utilisateur (un nom d'utilisateur ne contient jamais "@")
    identifier = data.identifier.strip().lower()
    user = db.scalar(select(User).where(or_(User.email == identifier, User.username == identifier)))

    # Même si l'identifiant n'existe pas, on fait une vérification factice :
    # le temps de réponse reste le même.
    password_ok = verify_password(
        data.password, user.password_hash if user else DUMMY_HASH
    )

    # Un seul message pour les deux cas : on ne révèle pas si l'identifiant existe.
    if user is None or not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant ou mot de passe incorrect.",
        )

    return Token(access_token=create_access_token(user.id))
@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    """Route protégée : renvoie l'utilisateur connecté."""
    return current_user