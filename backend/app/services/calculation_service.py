from datetime import datetime, date, timedelta
from typing import Optional, Tuple, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from app.models.product import Product
from app.models.sale import Sale, SaleItem
from app.models.expense import Expense
from app.utils.currency import format_inr

def get_date_range(time_frame: str, custom_start: Optional[str] = None, custom_end: Optional[str] = None) -> Tuple[datetime, datetime, datetime, datetime]:
    """
    Returns (current_start, current_end, prev_start, prev_end)
    """
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    today_end = today_start + timedelta(days=1) - timedelta(microseconds=1)

    if time_frame == "today":
        curr_start = today_start
        curr_end = today_end
        prev_start = curr_start - timedelta(days=1)
        prev_end = curr_start - timedelta(microseconds=1)
    elif time_frame == "week":
        curr_start = today_start - timedelta(days=now.weekday())
        curr_end = today_end
        duration = curr_end - curr_start
        prev_start = curr_start - duration - timedelta(microseconds=1)
        prev_end = curr_start - timedelta(microseconds=1)
    elif time_frame == "month":
        curr_start = datetime(now.year, now.month, 1)
        curr_end = today_end
        # Previous month
        if now.month == 1:
            prev_start = datetime(now.year - 1, 12, 1)
            prev_end = datetime(now.year, 1, 1) - timedelta(microseconds=1)
        else:
            prev_start = datetime(now.year, now.month - 1, 1)
            prev_end = curr_start - timedelta(microseconds=1)
    elif time_frame == "year":
        curr_start = datetime(now.year, 1, 1)
        curr_end = today_end
        prev_start = datetime(now.year - 1, 1, 1)
        prev_end = datetime(now.year - 1, 12, 31, 23, 59, 59)
    elif time_frame == "custom" and custom_start and custom_end:
        try:
            curr_start = datetime.strptime(custom_start, "%Y-%m-%d")
            curr_end = datetime.strptime(custom_end, "%Y-%m-%d") + timedelta(days=1) - timedelta(microseconds=1)
            duration = curr_end - curr_start
            prev_start = curr_start - duration
            prev_end = curr_start - timedelta(microseconds=1)
        except Exception:
            curr_start = datetime(now.year, now.month, 1)
            curr_end = today_end
            prev_start = curr_start - timedelta(days=30)
            prev_end = curr_start
    else:  # default last 30 days
        curr_start = today_start - timedelta(days=30)
        curr_end = today_end
        prev_start = curr_start - timedelta(days=30)
        prev_end = curr_start - timedelta(microseconds=1)

    return curr_start, curr_end, prev_start, prev_end


def compute_kpi_summary(
    db: Session,
    time_frame: str = "month",
    custom_start: Optional[str] = None,
    custom_end: Optional[str] = None
) -> Dict[str, Any]:
    curr_start, curr_end, prev_start, prev_end = get_date_range(time_frame, custom_start, custom_end)

    # Helper for sales query
    def get_sales_metrics(start_dt: datetime, end_dt: datetime):
        res = db.query(
            func.coalesce(func.sum(Sale.total_amount), 0.0).label("revenue"),
            func.coalesce(func.sum(Sale.total_cost), 0.0).label("cogs"),
            func.coalesce(func.sum(Sale.total_profit), 0.0).label("gross_profit"),
            func.count(Sale.id).label("transactions_count")
        ).filter(
            and_(
                Sale.status == "completed",
                Sale.created_at >= start_dt,
                Sale.created_at <= end_dt
            )
        ).first()
        return {
            "revenue": float(res.revenue),
            "cogs": float(res.cogs),
            "gross_profit": float(res.gross_profit),
            "transactions_count": int(res.transactions_count)
        }

    # Helper for expenses query
    def get_expenses_sum(start_dt: datetime, end_dt: datetime):
        res = db.query(
            func.coalesce(func.sum(Expense.amount), 0.0)
        ).filter(
            and_(
                Expense.date >= start_dt.date(),
                Expense.date <= end_dt.date()
            )
        ).scalar()
        return float(res or 0.0)

    curr_sales = get_sales_metrics(curr_start, curr_end)
    prev_sales = get_sales_metrics(prev_start, prev_end)

    curr_expenses = get_expenses_sum(curr_start, curr_end)
    prev_expenses = get_expenses_sum(prev_start, prev_end)

    curr_net_profit = curr_sales["gross_profit"] - curr_expenses
    prev_net_profit = prev_sales["gross_profit"] - prev_expenses

    def calc_trend(current: float, previous: float) -> Dict[str, Any]:
        if previous == 0:
            pct = 100.0 if current > 0 else 0.0
        else:
            pct = round(((current - previous) / abs(previous)) * 100, 1)
        return {
            "percentage": abs(pct),
            "is_positive": pct >= 0,
            "direction": "up" if pct > 0 else ("down" if pct < 0 else "neutral")
        }

    # Inventory Metrics (All-time current snapshot)
    products = db.query(Product).filter(Product.is_active == True).all()
    total_products = len(products)
    total_stock_units = sum(p.quantity for p in products)
    inventory_purchase_value = sum(float(p.purchase_price) * p.quantity for p in products)
    low_stock_products = sum(1 for p in products if 0 < p.quantity <= p.min_threshold)
    out_of_stock_products = sum(1 for p in products if p.quantity <= 0)
    in_stock_products = sum(1 for p in products if p.quantity > p.min_threshold)

    profit_margin = round((curr_sales["gross_profit"] / curr_sales["revenue"]) * 100, 2) if curr_sales["revenue"] > 0 else 0.0

    return {
        "time_frame": time_frame,
        "date_range": {
            "start": curr_start.strftime("%Y-%m-%d"),
            "end": curr_end.strftime("%Y-%m-%d")
        },
        "kpis": {
            "revenue": {
                "value": curr_sales["revenue"],
                "formatted": format_inr(curr_sales["revenue"]),
                "trend": calc_trend(curr_sales["revenue"], prev_sales["revenue"]),
                "previous_value": prev_sales["revenue"],
            },
            "gross_profit": {
                "value": curr_sales["gross_profit"],
                "formatted": format_inr(curr_sales["gross_profit"]),
                "trend": calc_trend(curr_sales["gross_profit"], prev_sales["gross_profit"]),
                "previous_value": prev_sales["gross_profit"],
            },
            "net_profit": {
                "value": curr_net_profit,
                "formatted": format_inr(curr_net_profit),
                "trend": calc_trend(curr_net_profit, prev_net_profit),
                "previous_value": prev_net_profit,
            },
            "expenses": {
                "value": curr_expenses,
                "formatted": format_inr(curr_expenses),
                "trend": calc_trend(curr_expenses, prev_expenses),
                "previous_value": prev_expenses,
            },
            "profit_margin": {
                "value": profit_margin,
                "formatted": f"{profit_margin}%",
            },
            "total_products": {
                "value": total_products,
                "formatted": f"{total_products:,}",
            },
            "total_stock_units": {
                "value": total_stock_units,
                "formatted": f"{total_stock_units:,}",
            },
            "inventory_purchase_value": {
                "value": inventory_purchase_value,
                "formatted": format_inr(inventory_purchase_value),
            },
            "low_stock_products": {
                "value": low_stock_products,
                "formatted": str(low_stock_products),
            },
            "out_of_stock_products": {
                "value": out_of_stock_products,
                "formatted": str(out_of_stock_products),
            },
            "in_stock_products": {
                "value": in_stock_products,
                "formatted": str(in_stock_products),
            }
        }
    }
