from __future__ import annotations

from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_capability
from app.models import Lesson, LessonAssignment, Progress, User
from app.models.enums import LessonStatus, Role, WatchdogStatus
from app.schemas.progress import ProgressOut, ProgressUpdate
from app.services.lesson_access import get_access_status
from app.utils import new_id

router = APIRouter(prefix="/api/progress", tags=["progress"])


def _compute_watchdog(
    percent: int, due: date | None, last_opened: datetime | None
) -> tuple[WatchdogStatus, str | None]:
    if percent >= 100:
        return WatchdogStatus.completed, None
    if last_opened is None and percent == 0:
        return WatchdogStatus.not_opened, "Not opened yet"
    if due is not None and due < date.today():
        return WatchdogStatus.late, f"Overdue (due {due.isoformat()}), {percent}% done"
    return WatchdogStatus.on_track, f"In progress — {percent}%"


@router.get("", response_model=list[ProgressOut])
def list_progress(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> list[Progress]:
    stmt = select(Progress)
    if current.role == Role.teacher:
        stmt = stmt.where(Progress.teacher_id == current.id)
    elif current.role == Role.school_admin:
        # Progress for teachers in the admin's school (lessons are now global).
        school_teachers = select(User.id).where(User.school_id == current.school_id)
        stmt = stmt.where(Progress.teacher_id.in_(school_teachers))
    return list(db.scalars(stmt.order_by(Progress.updated_at.desc())))


@router.post("/{lesson_id}", response_model=ProgressOut)
def update_progress(
    lesson_id: str,
    payload: ProgressUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(require_capability("view-assigned-lessons")),
) -> Progress:
    """A teacher records the slide they stopped at (or marks the lesson complete)."""
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    assigned = db.scalar(
        select(LessonAssignment.id).where(
            LessonAssignment.lesson_id == lesson_id,
            LessonAssignment.teacher_id == current.id,
        )
    )
    if not assigned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Lesson not assigned to you")

    # Sequential unlocking: block writes to a lesson the teacher hasn't reached
    # yet (locked / still in its waiting period). A lesson they've already
    # completed is left untouched — re-saving it is a harmless no-op, never a 403.
    access_status = get_access_status(db, current, lesson_id)
    if access_status in ("locked", "waiting"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This lesson isn't available yet — ask your admin for access.",
        )
    if access_status == "completed":
        completed = db.scalar(
            select(Progress).where(
                Progress.lesson_id == lesson_id, Progress.teacher_id == current.id
            )
        )
        if completed is not None:
            return completed  # already done; don't downgrade or error

    # Resolve total slides: prefer the viewer's count, else the stored one.
    total = payload.total or lesson.slide_count or 0
    if payload.total and payload.total != lesson.slide_count:
        lesson.slide_count = payload.total  # keep the lesson's count in sync

    if payload.complete:
        percent = 100
    elif payload.slide is not None and total > 0:
        percent = max(0, min(100, round(payload.slide / total * 100)))
    elif payload.slide is not None:
        percent = 0  # no total known yet; at least mark as opened
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide a slide number or set complete=true",
        )

    now = datetime.now(timezone.utc)
    progress = db.scalar(
        select(Progress).where(
            Progress.lesson_id == lesson_id, Progress.teacher_id == current.id
        )
    )
    if progress is None:
        progress = Progress(id=new_id("p"), teacher_id=current.id, lesson_id=lesson_id)
        db.add(progress)

    progress.percent_complete = percent
    progress.last_opened_at = now
    progress.status = (
        LessonStatus.completed
        if percent >= 100
        else LessonStatus.in_progress
        if percent > 0
        else LessonStatus.not_started
    )
    # Stamp the completion time once, so the next lesson's wait can be measured.
    if percent >= 100:
        if progress.completed_at is None:
            progress.completed_at = now
    else:
        progress.completed_at = None
    watchdog, message = _compute_watchdog(percent, lesson.due_date, now)
    progress.watchdog = watchdog
    progress.watchdog_message = message

    db.commit()
    db.refresh(progress)
    return progress
