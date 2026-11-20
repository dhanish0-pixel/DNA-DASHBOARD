from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Optional[float] = Field(None, ge=0)

class SaleCreate(BaseModel):
    customer_name: Optional[str] = "Walk-in Customer"
    customer_phone: Optional[str] = None
    items: List[SaleItemCreate] = Field(..., min_length=1)
    discount_amount: float = Field(0.0, ge=0)
    tax_amount: float = Field(0.0, ge=0)
    payment_method: str = Field("Cash")  # Cash, Credit Card, Debit Card, UPI, Net Banking
    notes: Optional[str] = None

class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    sku: str
    quantity: int
    purchase_price: float
    unit_price: float
    total_price: float
    unit_cost: float
    profit: float
    formatted_unit_price: Optional[str] = None
    formatted_total_price: Optional[str] = None

    class Config:
        from_attributes = True

class SaleResponse(BaseModel):
    id: int
    invoice_number: str
    customer_name: str
    customer_phone: Optional[str] = None
    subtotal: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    total_cost: float
    total_profit: float
    payment_method: str
    status: str
    notes: Optional[str] = None
    user_id: Optional[int] = None
    created_at: datetime
    formatted_total: Optional[str] = None
    formatted_profit: Optional[str] = None
    items: List[SaleItemResponse] = []

    class Config:
        from_attributes = True

class SaleListResponse(BaseModel):
    total: int
    items: List[SaleResponse]
