from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class KPIData(BaseModel):
    value: float
    formatted: str
    trend: Optional[Dict[str, Any]] = None
    previous_value: Optional[float] = None

class DashboardSummaryResponse(BaseModel):
    time_frame: str
    date_range: Dict[str, str]
    kpis: Dict[str, Any]

class RevenueProfitPoint(BaseModel):
    label: str               # e.g., "Jan 2026" or "Mon 12"
    revenue: float
    cogs: float
    gross_profit: float
    net_profit: float
    expenses: float
    formatted_revenue: str
    formatted_gross_profit: str

class TopProductItem(BaseModel):
    product_id: int
    name: str
    sku: str
    category: str
    image_url: Optional[str] = None
    units_sold: int
    total_revenue: float
    total_profit: float
    formatted_revenue: str
    formatted_profit: str

class StockDistribution(BaseModel):
    in_stock: int
    low_stock: int
    out_of_stock: int
    total: int

class LowStockAlertItem(BaseModel):
    id: int
    name: str
    sku: str
    category: str
    image_url: Optional[str] = None
    quantity: int
    min_threshold: int
    status: str
    purchase_price: float
    selling_price: float
