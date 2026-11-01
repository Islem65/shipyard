from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_admin
from ..models import Project, User
from ..schemas import (
    AdminOverview,
    AdminProject,
    DayCount,
    RoleUpdate,
    TopUser,
    UserOut,
)

# Toutes les routes de ce fichier exigent un administrateur
router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable.")
    return user


@router.get("/overview", response_model=AdminOverview)
def overview(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    def count(query) -> int:
        return db.scalar(query) or 0

    # Inscriptions des 7 derniers jours (aujourd'hui compris), jour par jour
    start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
    per_day = {(start + timedelta(days=i)).date().isoformat(): 0 for i in range(7)}
    for created in db.scalars(select(User.created_at).where(User.created_at >= start)):
        key = created.astimezone(timezone.utc).date().isoformat()
        if key in per_day:
            per_day[key] += 1

    # Nombre de projets par statut (0 si aucun)
    by_status = {s: 0 for s in ("pending", "building", "online", "failed")}
    for st, n in db.execute(select(Project.status, func.count()).group_by(Project.status)):
        by_status[st] = n

    latest = db.execute(
        select(Project, User).join(User, Project.user_id == User.id).order_by(Project.created_at.desc()).limit(8)
    ).all()

    top = db.execute(
        select(User.name, User.email, func.count(Project.id).label("n"))
        .join(Project, Project.user_id == User.id)
        .group_by(User.id)
        .order_by(func.count(Project.id).desc(), User.name)
        .limit(5)
    ).all()

    return AdminOverview(
        total_users=count(select(func.count()).select_from(User)),
        admins=count(select(func.count()).select_from(User).where(User.role == "admin")),
        new_users_week=count(select(func.count()).select_from(User).where(User.created_at >= week_ago)),
        total_projects=count(select(func.count()).select_from(Project)),
        projects_by_status=by_status,
        signups_per_day=[DayCount(date=d, count=n) for d, n in per_day.items()],
        latest_projects=[
            AdminProject(
                id=p.id, name=p.name, repo_url=p.repo_url, status=p.status,
                created_at=p.created_at, owner_name=u.name, owner_email=u.email,
            )
            for p, u in latest
        ],
        top_users=[TopUser(name=n, email=e, projects=c) for n, e, c in top],
    )


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.scalars(select(User).order_by(User.created_at.desc())).all()


@router.patch("/users/{user_id}/role", response_model=UserOut)
def change_role(
    user_id: int,
    data: RoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    # Un admin ne peut pas se retirer ses propres droits (sinon plus personne ne gère le site)
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas modifier votre propre rôle.",
        )
    user = get_user_or_404(db, user_id)
    user.role = data.role
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas supprimer votre propre compte.",
        )
    user = get_user_or_404(db, user_id)
    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)