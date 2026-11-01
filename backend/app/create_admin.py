#Le fichier create_admin.py sert à créer un compte administrateur dans ton projet Shipyard ou à transformer un compte existant en compte administrateur.

import getpass
#Vérifier le format du nom d'utilisateur et de l'email à l'aide d'expressions régulières.
import re
import sys

from sqlalchemy import or_, select

from .database import Base, SessionLocal, engine
from .models import User
from .security import hash_password

USERNAME_RE = re.compile(r"^[a-z0-9_.-]{3,30}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def main() -> None:
    Base.metadata.create_all(bind=engine)

    username = input("Nom d'utilisateur (ex : islem) : ").strip().lower()
    if not USERNAME_RE.match(username):
        sys.exit("Nom d'utilisateur invalide : 3 à 30 caractères parmi a-z, 0-9, _ . -")

    email = input("Adresse email : ").strip().lower()
    if not EMAIL_RE.match(email):
        sys.exit("Adresse email invalide.")

    name = input("Nom affiché (Entrée = identique au nom d'utilisateur) : ").strip() or username

    password = getpass.getpass("Mot de passe (8 caractères minimum) : ")
    if len(password) < 8:
        sys.exit("Mot de passe trop court (8 caractères minimum).")
    if len(password.encode()) > 72:
        sys.exit("Mot de passe trop long (72 octets maximum).")
    if getpass.getpass("Confirmez le mot de passe : ") != password:
        sys.exit("Les deux mots de passe ne sont pas identiques.")

    with SessionLocal() as db:
        found = db.scalars(
            select(User).where(or_(User.email == email, User.username == username))
        ).all()
        if len(found) > 1:
            sys.exit("Cet email et ce nom d'utilisateur appartiennent à deux comptes différents.")

        if found:
            user = found[0]
            answer = input(
                f"Un compte existe déjà ({user.email}). Le mettre à jour et en faire un admin ? [o/N] "
            )
            if answer.strip().lower() not in ("o", "oui", "y", "yes"):
                sys.exit("Annulé, rien n'a été modifié.")
            action = "mis à jour"
        else:
            user = User()
            action = "créé"

        user.name = name
        user.email = email
        user.username = username
        user.password_hash = hash_password(password)
        user.role = "admin"
        db.add(user)
        db.commit()

    print(f"Compte administrateur {action} : connectez-vous avec « {username} » ou « {email} ».")


if __name__ == "__main__":
    main()