import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_
from app.database import get_db
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleResponse, SaleListResponse, SaleItemResponse
from app.services.auth_service import get_current_user
from app.services.stock_service import adjust_product_stock
from app.utils.currency import format_inr

router = APIRouter(prefix="/sales", tags=["Sales Management"])

def generate_invoice_number() -> str:
    now = datetime.utcnow()
    rand_suffix = uuid.uuid4().hex[:6].upper()
    return f"INV-{now.strftime('%Y%m%d')}-{rand_suffix}"

def format_sale_response(sale: Sale) -> dict:
    formatted_items = []
    for item in sale.items:
        formatted_items.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product_name,
            "sku": item.sku,
            "quantity": item.quantity,
            "purchase_price": float(item.purchase_price),
            "unit_price": float(item.unit_price),
            "total_price": float(item.total_price),
            "unit_cost": float(item.unit_cost),
            "profit": float(item.profit),
            "formatted_unit_price": format_inr(float(item.unit_price)),
            "formatted_total_price": format_inr(float(item.total_price)),
        })

    return {
        "id": sale.id,
        "invoice_number": sale.invoice_number,
        "customer_name": sale.customer_name,
        "customer_phone": sale.customer_phone,
        "subtotal": float(sale.subtotal),
        "discount_amount": float(sale.discount_amount),
        "tax_amount": float(sale.tax_amount),
        "total_amount": float(sale.total_amount),
        "total_cost": float(sale.total_cost),
        "total_profit": float(sale.total_profit),
        "payment_method": sale.payment_method,
        "status": sale.status,
        "notes": sale.notes,
        "user_id": sale.user_id,
        "created_at": sale.created_at,
        "formatted_total": format_inr(float(sale.total_amount)),
        "formatted_profit": format_inr(float(sale.total_profit)),
        "items": formatted_items
    }

@router.get("", response_model=SaleListResponse)
def list_sales(
    search: Optional[str] = Query(None, description="Search by invoice number or customer name"),
    payment_method: Optional[str] = Query(None),
    status_filter: Optional[str] = Query("completed"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Sale)
    if status_filter:
        query = query.filter(Sale.status == status_filter)
    if payment_method:
        query = query.filter(Sale.payment_method == payment_method)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Sale.invoice_number.ilike(pattern),
                Sale.customer_name.ilike(pattern),
                Sale.customer_phone.ilike(pattern)
            )
        )

    total_count = query.count()
    sales = query.order_by(desc(Sale.created_at)).offset(offset).limit(limit).all()

    return {
        "total": total_count,
        "items": [format_sale_response(s) for s in sales]
    }

@router.post("", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def record_sale(
    sale_in: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Transaction-safe sale processing:
    1. Validates all requested products exist and have sufficient stock.
    2. Decrements product inventory with stock movement audit trail.
    3. Snapshots purchase_price and selling_price per item to preserve historical margins.
    4. Calculates subtotal, discount, tax, total, cost of goods sold, and gross profit.
    5. Commits atomically in one transaction; rolls back on any violation.
    """
    if not sale_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sale must contain at least one product"
        )

    invoice_no = generate_invoice_number()

    try:
        subtotal = 0.0
        total_cost = 0.0
        sale_items = []

        # Validate stock & prepare items
        for item_in in sale_in.items:
            product = db.query(Product).filter(Product.id == item_in.product_id).with_for_update().first()
            if not product or not product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product ID {item_in.product_id} not found or inactive"
                )

            if product.quantity < item_in.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}, Requested: {item_in.quantity}"
                )

            if item_in.unit_price is not None and item_in.unit_price >= 0:
                unit_selling_price = float(item_in.unit_price)
            else:
                unit_selling_price = float(product.selling_price)
            unit_purchase_price = float(product.purchase_price)
            item_total_price = unit_selling_price * item_in.quantity
            item_total_cost = unit_purchase_price * item_in.quantity
            item_profit = item_total_price - item_total_cost

            subtotal += item_total_price
            total_cost += item_total_cost

            # Deduct stock and record movement
            adjust_product_stock(
                db=db,
                product=product,
                quantity_change=-item_in.quantity,
                movement_type="SALE",
                reference_id=invoice_no,
                reason=f"Sale to {sale_in.customer_name or 'Walk-in'}",
                user_id=current_user.id if current_user else None
            )

            sale_item = SaleItem(
                product_id=product.id,
                product_name=product.name,
                sku=product.sku,
                quantity=item_in.quantity,
                purchase_price=unit_purchase_price,
                unit_price=unit_selling_price,
                total_price=item_total_price,
                unit_cost=item_total_cost,
                profit=item_profit
            )
            sale_items.append(sale_item)

        final_total = max(0.0, (subtotal - sale_in.discount_amount) + sale_in.tax_amount)
        # Gross Profit = Revenue - COGS
        # Note: If discount was applied to the sale, profit is reduced accordingly
        total_profit = final_total - total_cost

        sale = Sale(
            invoice_number=invoice_no,
            customer_name=sale_in.customer_name or "Walk-in Customer",
            customer_phone=sale_in.customer_phone,
            subtotal=subtotal,
            discount_amount=sale_in.discount_amount,
            tax_amount=sale_in.tax_amount,
            total_amount=final_total,
            total_cost=total_cost,
            total_profit=total_profit,
            payment_method=sale_in.payment_method,
            status="completed",
            notes=sale_in.notes,
            user_id=current_user.id if current_user else None,
            items=sale_items
        )

        db.add(sale)
        db.commit()
        db.refresh(sale)
        return format_sale_response(sale)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process sales transaction: {str(e)}"
        )

@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale invoice not found")
    return format_sale_response(sale)


@router.delete("/{sale_id}")
def delete_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes an accidental transaction:
    1. Reverses/restores stock quantity for each sold item.
    2. Logs a compensating StockMovement ('RETURN' / 'VOID').
    3. Deletes sale items and the sale record from database.
    """
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale transaction not found")

    invoice_no = sale.invoice_number

    try:
        # 1. Restore stock for each item
        for item in sale.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                adjust_product_stock(
                    db=db,
                    product=product,
                    quantity_change=item.quantity,
                    movement_type="RETURN",
                    reference_id=f"VOID-{invoice_no}",
                    reason=f"Restored stock from deleted transaction {invoice_no}",
                    user_id=current_user.id if current_user else None
                )

        # 2. Delete sale items and sale
        db.query(SaleItem).filter(SaleItem.sale_id == sale.id).delete()
        db.delete(sale)
        db.commit()

        return {
            "message": f"Transaction {invoice_no} deleted successfully and stock restored.",
            "invoice_number": invoice_no
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete transaction: {str(e)}"
        )
