#le fichier security.py regroupe les fonctions liées à la sécurité des utilisateurs : la protection des mots de passe et la gestion des tokens JWT.
import bcrypt
import jwt
import os
from datetime import datetime, timedelta, timezone
# Clé secrète qui "signe" les jetons. Elle vient de l'environnement (.env),
# jamais écrite dans le code.
#La configuration de JWT
SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"
TOKEN_DURATION_MINUTES = 60


def hash_password(password: str) -> str:
    """Transforme un mot de passe en 'empreinte' impossible à inverser."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    """Compare un mot de passe saisi avec l'empreinte enregistrée."""
    return bcrypt.checkpw(password.encode(), password_hash.encode())

# Empreinte factice : sert à garder le même temps de réponse quand l'email
# n'existe pas (pour ne pas révéler quels emails ont un compte).
DUMMY_HASH = hash_password("mot-de-passe-factice")

#Générer un token après une connexion réussie.
def create_access_token(user_id: int) -> str:
    """Crée le 'badge' (JWT) signé, valable 60 minutes."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_DURATION_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> int | None:
    """Retourne l'id de l'utilisateur si le badge est valide, sinon None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        return None