#Ce fichier contient les routes API qui permettent à un utilisateur connecté de gérer ses propres projets.
#Tu as défini trois opérations : créer, lister et supprimer.
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Project, User
from ..schemas import ProjectCreate, ProjectOut

router = APIRouter(prefix="/projects", tags=["projects"])

#Créer un projet : POST /projects
@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    already = db.scalar(select(Project).where(Project.user_id == user.id, Project.name == data.name))
    if already:
        raise HTTPException(status.HTTP_409_CONFLICT, "Vous avez déjà un projet avec ce nom.")
    project = Project(user_id=user.id, name=data.name, repo_url=data.repo_url)
    db.add(project)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Vous avez déjà un projet avec ce nom.")
    db.refresh(project)
    return project


@router.get("", response_model=list[ProjectOut])
#Lister ses projets
def my_projects(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Les projets de l'utilisateur connecté (et seulement les siens)."""
    return db.scalars(
        select(Project).where(Project.user_id == user.id).order_by(Project.created_at.desc())
    ).all()


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = db.get(Project, project_id)
    # Même message si le projet n'existe pas ou appartient à quelqu'un d'autre
    if project is None or project.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Projet introuvable.")
    db.delete(project)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)