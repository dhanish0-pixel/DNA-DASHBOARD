from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta, date
from app.database import get_db
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.expense import Expense
from app.models.category import Category
from app.services.calculation_service import compute_kpi_summary, get_date_range
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    RevenueProfitPoint,
    TopProductItem,
    StockDistribution,
    LowStockAlertItem
)
from app.utils.currency import format_inr

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    time_frame: Optional[str] = Query("month", description="today, week, month, year, custom"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return compute_kpi_summary(db, time_frame, start_date, end_date)

@router.get("/revenue", response_model=List[RevenueProfitPoint])
def get_revenue_chart(
    time_frame: Optional[str] = Query("month", description="today, week, month, year"),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    points = []

    if time_frame == "today":
        # Group by 4-hour intervals
        for h in range(0, 24, 4):
            slot_start = datetime(now.year, now.month, now.day, h, 0, 0)
            slot_end = slot_start + timedelta(hours=4) - timedelta(microseconds=1)
            sales = db.query(
                func.coalesce(func.sum(Sale.total_amount), 0.0).label("rev"),
                func.coalesce(func.sum(Sale.total_cost), 0.0).label("cogs"),
                func.coalesce(func.sum(Sale.total_profit), 0.0).label("gross")
            ).filter(and_(Sale.status == "completed", Sale.created_at >= slot_start, Sale.created_at <= slot_end)).first()
            
            rev = float(sales.rev)
            cogs = float(sales.cogs)
            gross = float(sales.gross)
            points.append({
                "label": f"{h:02d}:00 - {h+4:02d}:00",
                "revenue": rev,
                "cogs": cogs,
                "gross_profit": gross,
                "net_profit": gross,
                "expenses": 0.0,
                "formatted_revenue": format_inr(rev),
                "formatted_gross_profit": format_inr(gross),
            })
    elif time_frame == "week":
        # Last 7 days
        for i in range(6, -1, -1):
            day_dt = (now - timedelta(days=i)).date()
            day_start = datetime(day_dt.year, day_dt.month, day_dt.day, 0, 0, 0)
            day_end = datetime(day_dt.year, day_dt.month, day_dt.day, 23, 59, 59)
            sales = db.query(
                func.coalesce(func.sum(Sale.total_amount), 0.0).label("rev"),
                func.coalesce(func.sum(Sale.total_cost), 0.0).label("cogs"),
                func.coalesce(func.sum(Sale.total_profit), 0.0).label("gross")
            ).filter(and_(Sale.status == "completed", Sale.created_at >= day_start, Sale.created_at <= day_end)).first()
            
            exp = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(Expense.date == day_dt).scalar() or 0.0
            rev = float(sales.rev)
            cogs = float(sales.cogs)
            gross = float(sales.gross)
            net = gross - float(exp)
            points.append({
                "label": day_dt.strftime("%a %d"),
                "revenue": rev,
                "cogs": cogs,
                "gross_profit": gross,
                "net_profit": net,
                "expenses": float(exp),
                "formatted_revenue": format_inr(rev),
                "formatted_gross_profit": format_inr(gross),
            })
    elif time_frame == "year":
        # 12 months of current year
        for m in range(1, 13):
            month_start = datetime(now.year, m, 1)
            if m == 12:
                month_end = datetime(now.year + 1, 1, 1) - timedelta(microseconds=1)
            else:
                month_end = datetime(now.year, m + 1, 1) - timedelta(microseconds=1)
            
            sales = db.query(
                func.coalesce(func.sum(Sale.total_amount), 0.0).label("rev"),
                func.coalesce(func.sum(Sale.total_cost), 0.0).label("cogs"),
                func.coalesce(func.sum(Sale.total_profit), 0.0).label("gross")
            ).filter(and_(Sale.status == "completed", Sale.created_at >= month_start, Sale.created_at <= month_end)).first()
            
            exp = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
                and_(Expense.date >= month_start.date(), Expense.date <= month_end.date())
            ).scalar() or 0.0
            
            rev = float(sales.rev)
            cogs = float(sales.cogs)
            gross = float(sales.gross)
            net = gross - float(exp)
            points.append({
                "label": month_start.strftime("%b"),
                "revenue": rev,
                "cogs": cogs,
                "gross_profit": gross,
                "net_profit": net,
                "expenses": float(exp),
                "formatted_revenue": format_inr(rev),
                "formatted_gross_profit": format_inr(gross),
            })
    else:
        # Default: Last 6 months trend
        for i in range(5, -1, -1):
            m_dt = (now.replace(day=1) - timedelta(days=i*28)).replace(day=1)
            month_start = datetime(m_dt.year, m_dt.month, 1)
            if m_dt.month == 12:
                month_end = datetime(m_dt.year + 1, 1, 1) - timedelta(microseconds=1)
            else:
                month_end = datetime(m_dt.year, m_dt.month + 1, 1) - timedelta(microseconds=1)
            
            sales = db.query(
                func.coalesce(func.sum(Sale.total_amount), 0.0).label("rev"),
                func.coalesce(func.sum(Sale.total_cost), 0.0).label("cogs"),
                func.coalesce(func.sum(Sale.total_profit), 0.0).label("gross")
            ).filter(and_(Sale.status == "completed", Sale.created_at >= month_start, Sale.created_at <= month_end)).first()
            
            exp = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
                and_(Expense.date >= month_start.date(), Expense.date <= month_end.date())
            ).scalar() or 0.0
            
            rev = float(sales.rev)
            cogs = float(sales.cogs)
            gross = float(sales.gross)
            net = gross - float(exp)
            points.append({
                "label": month_start.strftime("%b %Y"),
                "revenue": rev,
                "cogs": cogs,
                "gross_profit": gross,
                "net_profit": net,
                "expenses": float(exp),
                "formatted_revenue": format_inr(rev),
                "formatted_gross_profit": format_inr(gross),
            })

    return points

@router.get("/top-products", response_model=dict)
def get_top_products(db: Session = Depends(get_db)):
    """
    Returns:
    1. Top 5 Best-Selling Products by units sold
    2. Most Profitable Products by gross profit generated
    """
    # Best-selling products
    best_selling_query = db.query(
        SaleItem.product_id,
        SaleItem.product_name,
        SaleItem.sku,
        func.sum(SaleItem.quantity).label("units_sold"),
        func.sum(SaleItem.total_price).label("total_revenue"),
        func.sum(SaleItem.profit).label("total_profit")
    ).join(Sale, Sale.id == SaleItem.sale_id).filter(
        Sale.status == "completed"
    ).group_by(
        SaleItem.product_id, SaleItem.product_name, SaleItem.sku
    ).order_by(desc("units_sold")).limit(5).all()

    best_selling = []
    for item in best_selling_query:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        cat_name = prod.category.name if prod and prod.category else "General"
        img = prod.image_url if prod else None
        rev = float(item.total_revenue)
        prof = float(item.total_profit)
        best_selling.append({
            "product_id": item.product_id,
            "name": item.product_name,
            "sku": item.sku,
            "category": cat_name,
            "image_url": img,
            "units_sold": int(item.units_sold),
            "total_revenue": rev,
            "total_profit": prof,
            "formatted_revenue": format_inr(rev),
            "formatted_profit": format_inr(prof),
        })

    # Most profitable products
    most_profitable_query = db.query(
        SaleItem.product_id,
        SaleItem.product_name,
        SaleItem.sku,
        func.sum(SaleItem.quantity).label("units_sold"),
        func.sum(SaleItem.total_price).label("total_revenue"),
        func.sum(SaleItem.profit).label("total_profit")
    ).join(Sale, Sale.id == SaleItem.sale_id).filter(
        Sale.status == "completed"
    ).group_by(
        SaleItem.product_id, SaleItem.product_name, SaleItem.sku
    ).order_by(desc("total_profit")).limit(5).all()

    most_profitable = []
    for item in most_profitable_query:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        cat_name = prod.category.name if prod and prod.category else "General"
        img = prod.image_url if prod else None
        rev = float(item.total_revenue)
        prof = float(item.total_profit)
        most_profitable.append({
            "product_id": item.product_id,
            "name": item.product_name,
            "sku": item.sku,
            "category": cat_name,
            "image_url": img,
            "units_sold": int(item.units_sold),
            "total_revenue": rev,
            "total_profit": prof,
            "formatted_revenue": format_inr(rev),
            "formatted_profit": format_inr(prof),
        })

    return {
        "best_selling": best_selling,
        "most_profitable": most_profitable
    }

@router.get("/stock-status", response_model=dict)
def get_stock_status(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.is_active == True).all()

    in_stock = [p for p in products if p.quantity > p.min_threshold]
    low_stock = [p for p in products if 0 < p.quantity <= p.min_threshold]
    out_of_stock = [p for p in products if p.quantity <= 0]

    alerts: List[dict] = []
    for p in low_stock + out_of_stock:
        alerts.append({
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "category": p.category.name if p.category else "General",
            "image_url": p.image_url,
            "quantity": p.quantity,
            "min_threshold": p.min_threshold,
            "status": p.stock_status,
            "purchase_price": float(p.purchase_price),
            "selling_price": float(p.selling_price)
        })

    return {
        "distribution": {
            "in_stock": len(in_stock),
            "low_stock": len(low_stock),
            "out_of_stock": len(out_of_stock),
            "total": len(products)
        },
        "alerts": alerts
    }
