from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class SalesReportResponse(BaseModel):
    generated_at: str
    period: str
    total_sales_count: int
    total_items_sold: int
    total_revenue: float
    total_discount: float
    total_tax: float
    formatted_total_revenue: str
    daily_breakdown: List[Dict[str, Any]]
    payment_method_breakdown: List[Dict[str, Any]]

class ProfitReportResponse(BaseModel):
    generated_at: str
    period: str
    total_revenue: float
    total_cogs: float
    gross_profit: float
    operating_expenses: float
    net_profit: float
    gross_margin_percent: float
    net_margin_percent: float
    formatted_revenue: str
    formatted_cogs: str
    formatted_gross_profit: str
    formatted_expenses: str
    formatted_net_profit: str
    category_profitability: List[Dict[str, Any]]

class InventoryReportResponse(BaseModel):
    generated_at: str
    total_products: int
    total_stock_units: int
    total_purchase_value: float
    total_potential_revenue: float
    potential_gross_profit: float
    formatted_purchase_value: str
    formatted_potential_revenue: str
    formatted_potential_profit: str
    stock_status_breakdown: Dict[str, int]
    slow_moving_products: List[Dict[str, Any]]
    out_of_stock_products: List[Dict[str, Any]]
