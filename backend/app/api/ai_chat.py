# UNIVERSAL NRG-CO HEADER BLOCK
# Use this exact banner at the top of source files. License/covenant terms still apply.
# 
################################################################
#                                                              #
#                ⚡  N R G - C O  ⚡                          #
#                                                              #
#    CRITICAL ASSET — CLOSED SOURCE / CONFIDENTIAL              #
#    PROPRIETARY / UNDER DEVELOPMENT / SECRET                   #
#                                                              #
################################################################
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.api.schemas import ChatMessage, ChatResponse
from app.services.ai_assistant import ai_assistant

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post("/chat", response_model=ChatResponse)
async def chat(data: ChatMessage, db: AsyncSession = Depends(get_db), user: Optional[User] = Depends(get_current_user_optional)):
    session_id = data.session_id or str(uuid.uuid4())
    response = await ai_assistant.chat(session_id, data.message, db, user_id=user.id if user else None)
    return ChatResponse(response=response, session_id=session_id)


@router.post("/command")
async def execute_command(
    command: str,
    params: dict = {},
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await ai_assistant.execute_command(user.id, command, params, db)
    return result


@router.get("/history/{session_id}")
async def get_chat_history(session_id: str, limit: int = 50):
    from app.services.mongodb import mongodb
    history = await mongodb.get_chat_history(session_id, limit)
    return history


@router.get("/suggestions")
async def get_suggestions(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    from sqlalchemy import select
    from app.models.site import Site
    from app.models.ticket import Ticket, TicketStatus

    suggestions = []

    # Check for sites that need attention
    result = await db.execute(select(Site))
    sites = result.scalars().all()
    offline = [s for s in sites if s.status.value == "offline"]
    if offline:
        suggestions.append(f"You have {len(offline)} offline site(s): {', '.join(s.name for s in offline)}")

    # Check for open tickets
    result = await db.execute(select(Ticket).where(Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])))
    tickets = result.scalars().all()
    if len(tickets) > 5:
        suggestions.append(f"You have {len(tickets)} open tickets. Consider prioritizing critical ones.")

    # Check for unassigned tickets
    result = await db.execute(select(Ticket).where(Ticket.assigned_to_id == None, Ticket.status == TicketStatus.OPEN))
    unassigned = result.scalars().all()
    if unassigned:
        suggestions.append(f"{len(unassigned)} ticket(s) are unassigned.")

    if not suggestions:
        suggestions.append("All systems look healthy! No immediate actions needed.")

    return {"suggestions": suggestions}
