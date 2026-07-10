from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.ticket import Ticket, TicketComment, TicketStatus
from app.models.user import User
from app.api.schemas import TicketCreate, TicketUpdate, TicketCommentCreate, TicketResponse

router = APIRouter(prefix="/tickets", tags=["Tickets"])


@router.get("/", response_model=list[TicketResponse])
async def list_tickets(
    status: str = None,
    priority: str = None,
    category: str = None,
    site_id: int = None,
    assigned_to_id: int = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Ticket)
    if status:
        query = query.where(Ticket.status == status)
    if priority:
        query = query.where(Ticket.priority == priority)
    if category:
        query = query.where(Ticket.category == category)
    if site_id:
        query = query.where(Ticket.site_id == site_id)
    if assigned_to_id:
        query = query.where(Ticket.assigned_to_id == assigned_to_id)
    query = query.order_by(Ticket.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=TicketResponse)
async def create_ticket(data: TicketCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    ticket = Ticket(
        **data.model_dump(),
        created_by_id=user.id,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.get("/{ticket_id}")
async def get_ticket(ticket_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    comments = await db.execute(
        select(TicketComment).where(TicketComment.ticket_id == ticket_id).order_by(TicketComment.created_at)
    )
    return {
        "ticket": TicketResponse.model_validate(ticket),
        "comments": [
            {
                "id": c.id,
                "content": c.content,
                "user_id": c.user_id,
                "is_internal": c.is_internal,
                "created_at": c.created_at,
            }
            for c in comments.scalars().all()
        ],
    }


@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(ticket_id: int, data: TicketUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(ticket, field, value)

    if data.status == "resolved":
        ticket.resolved_at = datetime.utcnow()
    elif data.status == "closed":
        ticket.closed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.post("/{ticket_id}/comments")
async def add_comment(ticket_id: int, data: TicketCommentCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    comment = TicketComment(
        ticket_id=ticket_id,
        user_id=user.id,
        content=data.content,
        is_internal=int(data.is_internal),
    )
    db.add(comment)
    await db.commit()
    return {"message": "Comment added", "id": comment.id}


@router.delete("/{ticket_id}")
async def delete_ticket(ticket_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    await db.delete(ticket)
    await db.commit()
    return {"message": "Ticket deleted"}
