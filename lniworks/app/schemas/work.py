from pydantic import BaseModel, field_validator
from datetime import datetime, date
from app.db.models import WorkCategory, OrderStatus

class WorkBase(BaseModel):
    title: str
    description: str | None = None
    category: WorkCategory
    work_date: date
    shift_id: int

class WorkCreate(WorkBase):
    status: OrderStatus = OrderStatus.COMPLETED

class WorkUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: WorkCategory | None = None
    status: OrderStatus | None = None
    work_date: date | None = None
    user_id: int | None = None
    
    @field_validator('user_id')
    @classmethod
    def validate_user_id(cls, v):
        if v is not None and v <= 0:
            raise ValueError('user_id deve essere maggiore di 0')
        return v

class WorkResponse(WorkBase):
    id: int
    status: OrderStatus
    user_id: int
    created_at: datetime
    updated_at: datetime

    # ← AGGIUNTO campo calcolato created_by
    created_by: str | None = None

    # ← VALIDATOR per popolare created_by dalla relazione user
    @field_validator('created_by', mode='before')
    @classmethod
    def set_created_by(cls, value, info):
        print(f"🔄 Validator chiamato - info.data: {info.data}")
        print(f"🔄 Campo 'user' in info.data: {'user' in info.data}")
        if info.data and 'user' in info.data:
            user = info.data['user']
            print(f"🔄 User trovato: {user}")
            if user and hasattr(user, 'username'):
                print(f"🔄 Username: {user.username}")
                return user.username
        print(f"🔄 Restituisco valore originale: {value}")
        return value

    class Config:
        from_attributes = True