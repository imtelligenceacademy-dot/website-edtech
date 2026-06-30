"""Teacher -> super-admin access requests.

A teacher can ask the super-admin to unlock a lesson that the sequential rules
have locked (most commonly one still inside its post-completion waiting period).
The super-admin sees pending requests as notifications and grants or denies them;
granting flips the matching ``Progress.unlocked_override`` so the lesson opens.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_capability, require_roles
from app.models import AccessRequest, Lesson, LessonAssignment, Progress, User
from app.models.enums import Role
from app.schemas.access_request import AccessRequestCreate, AccessRequestOut
from app.services.lesson_access import is_lesson_available
from app.utils import new_id

router = APIRouter(prefix="/api/access-requests", tags=["access-requests"])

PENDING = "pending"
GRANTED = "granted"
DENIED = "denied"


def _to_out(req: AccessRequest, lesson: Lesson | None, teacher: User | None) -> AccessRequestOut:
    return AccessRequestOut(
        id=req.id,
        teacher_id=req.teacher_id,
        teacher_name=teacher.name if teacher else req.teacher_id,
        lesson_id=req.lesson_id,
        lesson_title=lesson.title if lesson else req.lesson_id,
        grade=lesson.grade if lesson else 0,
        language=lesson.language if lesson else None,
        lesson_no=lesson.lesson_no if lesson else None,
        status=req.status,
        note=req.note,
        created_at=req.created_at,
    )


@router.post("", response_model=AccessRequestOut, status_code=status.HTTP_201_CREATED)
def create_request(
    payload: AccessRequestCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_capability("view-assigned-lessons")),
) -> AccessRequestOut:
    """A teacher requests access to one of their locked lessons."""
    lesson = db.get(Lesson, payload.lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    assigned = db.scalar(
        select(LessonAssignment.id).where(
            LessonAssignment.lesson_id == payload.lesson_id,
            LessonAssignment.teacher_id == current.id,
        )
    )
    if not assigned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Lesson not assigned to you")

    if is_lesson_available(db, current, payload.lesson_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This lesson is already available to you.",
        )

    # One pending request per (teacher, lesson) — reuse it if it already exists.
    existing = db.scalar(
        select(AccessRequest).where(
            AccessRequest.teacher_id == current.id,
            AccessRequest.lesson_id == payload.lesson_id,
            AccessRequest.status == PENDING,
        )
    )
    if existing is not None:
        if payload.note:
            existing.note = payload.note
            db.commit()
        return _to_out(existing, lesson, current)

    req = AccessRequest(
        id=new_id("req"),
        teacher_id=current.id,
        lesson_id=payload.lesson_id,
        status=PENDING,
        note=payload.note,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return _to_out(req, lesson, current)


@router.get("/mine", response_model=list[AccessRequestOut])
def my_requests(
    db: Session = Depends(get_db),
    current: User = Depends(require_capability("view-assigned-lessons")),
) -> list[AccessRequestOut]:
    """A teacher's own requests (used to show 'Requested' state in the UI)."""
    reqs = list(
        db.scalars(
            select(AccessRequest)
            .where(AccessRequest.teacher_id == current.id)
            .order_by(AccessRequest.created_at.desc())
        )
    )
    lessons = {l.id: l for l in db.scalars(select(Lesson).where(Lesson.id.in_([r.lesson_id for r in reqs])))} if reqs else {}
    return [_to_out(r, lessons.get(r.lesson_id), current) for r in reqs]


@router.get("", response_model=list[AccessRequestOut])
def list_requests(
    pending_only: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.super_admin)),
) -> list[AccessRequestOut]:
    """Super-admin inbox of access requests (pending by default)."""
    stmt = select(AccessRequest).order_by(AccessRequest.created_at.desc())
    if pending_only:
        stmt = stmt.where(AccessRequest.status == PENDING)
    reqs = list(db.scalars(stmt))
    if not reqs:
        return []
    lessons = {l.id: l for l in db.scalars(select(Lesson).where(Lesson.id.in_([r.lesson_id for r in reqs])))}
    teachers = {u.id: u for u in db.scalars(select(User).where(User.id.in_([r.teacher_id for r in reqs])))}
    return [_to_out(r, lessons.get(r.lesson_id), teachers.get(r.teacher_id)) for r in reqs]


def _resolve(db: Session, request_id: str, admin: User, granted: bool) -> AccessRequest:
    req = db.get(AccessRequest, request_id)
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if req.status != PENDING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request already resolved")

    if granted:
        progress = db.scalar(
            select(Progress).where(
                Progress.teacher_id == req.teacher_id, Progress.lesson_id == req.lesson_id
            )
        )
        if progress is None:
            progress = Progress(id=new_id("p"), teacher_id=req.teacher_id, lesson_id=req.lesson_id)
            db.add(progress)
        progress.unlocked_override = True

    req.status = GRANTED if granted else DENIED
    req.resolved_by = admin.id
    req.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/grant", response_model=AccessRequestOut)
def grant_request(
    request_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(Role.super_admin)),
) -> AccessRequestOut:
    req = _resolve(db, request_id, admin, granted=True)
    return _to_out(req, db.get(Lesson, req.lesson_id), db.get(User, req.teacher_id))


@router.post("/{request_id}/deny", response_model=AccessRequestOut)
def deny_request(
    request_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(Role.super_admin)),
) -> AccessRequestOut:
    req = _resolve(db, request_id, admin, granted=False)
    return _to_out(req, db.get(Lesson, req.lesson_id), db.get(User, req.teacher_id))
