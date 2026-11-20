import io
import csv
from datetime import datetime, timedelta, date
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from app.database import get_db
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.expense import Expense
from app.models.category import Category
from app.schemas.report import SalesReportResponse, ProfitReportResponse, InventoryReportResponse
from app.utils.currency import format_inr
from app.services.calculation_service import get_date_range

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/sales", response_model=SalesReportResponse)
def get_sales_report(
    time_frame: Optional[str] = Query("month", description="today, week, month, year, custom"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    curr_start, curr_end, _, _ = get_date_range(time_frame, start_date, end_date)

    sales = db.query(Sale).filter(
        and_(
            Sale.status == "completed",
            Sale.created_at >= curr_start,
            Sale.created_at <= curr_end
        )
    ).all()

    total_sales_count = len(sales)
    total_rev = sum(float(s.total_amount) for s in sales)
    total_disc = sum(float(s.discount_amount) for s in sales)
    total_tax = sum(float(s.tax_amount) for s in sales)
    total_items = sum(sum(item.quantity for item in s.items) for s in sales)

    # Payment methods breakdown
    pm_counts = {}
    for s in sales:
        pm = s.payment_method or "Cash"
        pm_counts[pm] = pm_counts.get(pm, 0.0) + float(s.total_amount)

    pm_breakdown = [
        {"method": k, "amount": v, "formatted_amount": format_inr(v)}
        for k, v in pm_counts.items()
    ]

    # Daily breakdown
    daily_map = {}
    for s in sales:
        d_str = s.created_at.strftime("%Y-%m-%d")
        if d_str not in daily_map:
            daily_map[d_str] = {"date": d_str, "revenue": 0.0, "profit": 0.0, "orders": 0}
        daily_map[d_str]["revenue"] += float(s.total_amount)
        daily_map[d_str]["profit"] += float(s.total_profit)
        daily_map[d_str]["orders"] += 1

    daily_breakdown = sorted(list(daily_map.values()), key=lambda x: x["date"])
    for d in daily_breakdown:
        d["formatted_revenue"] = format_inr(d["revenue"])
        d["formatted_profit"] = format_inr(d["profit"])

    return {
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "period": f"{curr_start.strftime('%Y-%m-%d')} to {curr_end.strftime('%Y-%m-%d')}",
        "total_sales_count": total_sales_count,
        "total_items_sold": total_items,
        "total_revenue": total_rev,
        "total_discount": total_disc,
        "total_tax": total_tax,
        "formatted_total_revenue": format_inr(total_rev),
        "daily_breakdown": daily_breakdown,
        "payment_method_breakdown": pm_breakdown
    }

@router.get("/profit", response_model=ProfitReportResponse)
def get_profit_report(
    time_frame: Optional[str] = Query("month"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    curr_start, curr_end, _, _ = get_date_range(time_frame, start_date, end_date)

    sales = db.query(Sale).filter(
        and_(
            Sale.status == "completed",
            Sale.created_at >= curr_start,
            Sale.created_at <= curr_end
        )
    ).all()

    total_rev = sum(float(s.total_amount) for s in sales)
    total_cogs = sum(float(s.total_cost) for s in sales)
    gross_profit = total_rev - total_cogs

    expenses = db.query(Expense).filter(
        and_(
            Expense.date >= curr_start.date(),
            Expense.date <= curr_end.date()
        )
    ).all()

    total_expenses = sum(float(e.amount) for e in expenses)
    net_profit = gross_profit - total_expenses

    gross_margin = round((gross_profit / total_rev) * 100, 2) if total_rev > 0 else 0.0
    net_margin = round((net_profit / total_rev) * 100, 2) if total_rev > 0 else 0.0

    # Category profitability
    cat_stats = {}
    for s in sales:
        for it in s.items:
            cat_name = it.product.category.name if it.product and it.product.category else "Other"
            if cat_name not in cat_stats:
                cat_stats[cat_name] = {"category": cat_name, "revenue": 0.0, "cogs": 0.0, "profit": 0.0}
            cat_stats[cat_name]["revenue"] += float(it.total_price)
            cat_stats[cat_name]["cogs"] += float(it.unit_cost)
            cat_stats[cat_name]["profit"] += float(it.profit)

    cat_list = []
    for c in cat_stats.values():
        c_rev = c["revenue"]
        c_prof = c["profit"]
        margin = round((c_prof / c_rev) * 100, 2) if c_rev > 0 else 0.0
        cat_list.append({
            "category": c["category"],
            "revenue": c_rev,
            "gross_profit": c_prof,
            "margin_percent": margin,
            "formatted_revenue": format_inr(c_rev),
            "formatted_profit": format_inr(c_prof)
        })

    return {
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "period": f"{curr_start.strftime('%Y-%m-%d')} to {curr_end.strftime('%Y-%m-%d')}",
        "total_revenue": total_rev,
        "total_cogs": total_cogs,
        "gross_profit": gross_profit,
        "operating_expenses": total_expenses,
        "net_profit": net_profit,
        "gross_margin_percent": gross_margin,
        "net_margin_percent": net_margin,
        "formatted_revenue": format_inr(total_rev),
        "formatted_cogs": format_inr(total_cogs),
        "formatted_gross_profit": format_inr(gross_profit),
        "formatted_expenses": format_inr(total_expenses),
        "formatted_net_profit": format_inr(net_profit),
        "category_profitability": cat_list
    }

@router.get("/inventory", response_model=InventoryReportResponse)
def get_inventory_report(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.is_active == True).all()

    total_units = sum(p.quantity for p in products)
    purchase_val = sum(float(p.purchase_price) * p.quantity for p in products)
    potential_rev = sum(float(p.selling_price) * p.quantity for p in products)
    potential_profit = potential_rev - purchase_val

    in_stock = sum(1 for p in products if p.quantity > p.min_threshold)
    low_stock = sum(1 for p in products if 0 < p.quantity <= p.min_threshold)
    out_of_stock = sum(1 for p in products if p.quantity <= 0)

    # Find products with sales count in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    sales_recent = db.query(
        SaleItem.product_id,
        func.sum(SaleItem.quantity).label("sold")
    ).join(Sale, Sale.id == SaleItem.sale_id).filter(
        and_(Sale.status == "completed", Sale.created_at >= thirty_days_ago)
    ).group_by(SaleItem.product_id).all()

    sold_dict = {item.product_id: item.sold for item in sales_recent}

    slow_moving = []
    out_of_stock_list = []

    for p in products:
        qty_sold = sold_dict.get(p.id, 0)
        if p.quantity <= 0:
            out_of_stock_list.append({
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "category": p.category.name if p.category else "N/A",
                "purchase_price": float(p.purchase_price),
                "selling_price": float(p.selling_price),
                "formatted_price": format_inr(float(p.selling_price)),
                "min_threshold": p.min_threshold
            })
        elif qty_sold < 3 and p.quantity > 5:
            slow_moving.append({
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "category": p.category.name if p.category else "N/A",
                "quantity": p.quantity,
                "sold_last_30_days": qty_sold,
                "tied_up_capital": float(p.purchase_price) * p.quantity,
                "formatted_capital": format_inr(float(p.purchase_price) * p.quantity)
            })

    return {
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "total_products": len(products),
        "total_stock_units": total_units,
        "total_purchase_value": purchase_val,
        "total_potential_revenue": potential_rev,
        "potential_gross_profit": potential_profit,
        "formatted_purchase_value": format_inr(purchase_val),
        "formatted_potential_revenue": format_inr(potential_rev),
        "formatted_potential_profit": format_inr(potential_profit),
        "stock_status_breakdown": {
            "in_stock": in_stock,
            "low_stock": low_stock,
            "out_of_stock": out_of_stock
        },
        "slow_moving_products": slow_moving,
        "out_of_stock_products": out_of_stock_list
    }

@router.get("/export/csv")
def export_csv(
    report_type: str = Query("sales", description="sales, products, expenses"),
    db: Session = Depends(get_db)
):
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "products":
        writer.writerow(["ID", "Name", "SKU", "Category", "Quantity", "Purchase Price (INR)", "Selling Price (INR)", "Margin (%)", "Status"])
        products = db.query(Product).filter(Product.is_active == True).all()
        for p in products:
            cat = p.category.name if p.category else ""
            writer.writerow([p.id, p.name, p.sku, cat, p.quantity, p.purchase_price, p.selling_price, p.profit_margin_percent, p.stock_status])
        filename = f"products_export_{date.today()}.csv"

    elif report_type == "expenses":
        writer.writerow(["ID", "Title", "Category", "Amount (INR)", "Date", "Payment Method", "Reference No", "Description"])
        expenses = db.query(Expense).order_by(Expense.date.desc()).all()
        for e in expenses:
            writer.writerow([e.id, e.title, e.category, e.amount, e.date, e.payment_method, e.reference_no, e.description])
        filename = f"expenses_export_{date.today()}.csv"

    else:  # sales
        writer.writerow(["Invoice Number", "Date", "Customer", "Subtotal (INR)", "Discount (INR)", "Total (INR)", "COGS (INR)", "Profit (INR)", "Payment Method", "Status"])
        sales = db.query(Sale).order_by(Sale.created_at.desc()).all()
        for s in sales:
            writer.writerow([s.invoice_number, s.created_at.strftime("%Y-%m-%d %H:%M"), s.customer_name, s.subtotal, s.discount_amount, s.total_amount, s.total_cost, s.total_profit, s.payment_method, s.status])
        filename = f"sales_export_{date.today()}.csv"

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
