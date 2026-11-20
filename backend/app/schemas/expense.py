from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class ExpenseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    category: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    date: date
    description: Optional[str] = None
    payment_method: Optional[str] = "Bank Transfer"
    reference_no: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    date: Optional[date] = None
    description: Optional[str] = None
    payment_method: Optional[str] = None
    reference_no: Optional[str] = None

class ExpenseResponse(ExpenseBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    formatted_amount: Optional[str] = None

    class Config:
        from_attributes = True

class ExpenseListResponse(BaseModel):
    total: int
    total_amount: float
    formatted_total_amount: str
    items: List[ExpenseResponse]
