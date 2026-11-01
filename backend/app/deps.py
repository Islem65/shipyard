from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .security import decode_access_token

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    """Vérifie le badge envoyé dans 'Authorization: Bearer ...' et
    retourne l'utilisateur correspondant."""
    error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Non connecté ou session expirée.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise error
    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise error
    user = db.get(User, user_id)
    if user is None:
        raise error
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Laisse passer uniquement les administrateurs (sinon erreur 403)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs.",
        )
    return current_user