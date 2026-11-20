from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.category import CategoryResponse
from app.schemas.supplier import SupplierResponse

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    sku: str = Field(..., min_length=1, max_length=100)
    barcode: Optional[str] = None
    category_id: int
    supplier_id: Optional[int] = None
    image_url: Optional[str] = None
    purchase_price: float = Field(..., ge=0)
    selling_price: float = Field(..., ge=0)
    quantity: int = Field(0, ge=0)
    min_threshold: int = Field(5, ge=0)
    brand: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    image_url: Optional[str] = None
    purchase_price: Optional[float] = Field(None, ge=0)
    selling_price: Optional[float] = Field(None, ge=0)
    quantity: Optional[int] = Field(None, ge=0)
    min_threshold: Optional[int] = Field(None, ge=0)
    brand: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    stock_status: str
    profit_per_unit: float
    profit_margin_percent: float
    stock_valuation: float
    formatted_purchase_price: Optional[str] = None
    formatted_selling_price: Optional[str] = None
    category: Optional[CategoryResponse] = None
    supplier: Optional[SupplierResponse] = None

    class Config:
        from_attributes = True

class StockAdjustmentRequest(BaseModel):
    quantity_change: int  # can be positive or negative
    reason: str
    movement_type: Optional[str] = "ADJUSTMENT"

class ProductListResponse(BaseModel):
    total: int
    items: List[ProductResponse]
