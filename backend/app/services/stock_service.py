from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.product import Product
from app.models.stock_movement import StockMovement

def record_movement(
    db: Session,
    product_id: int,
    movement_type: str,
    quantity_change: int,
    previous_quantity: int,
    new_quantity: int,
    reference_id: str = None,
    reason: str = None,
    user_id: int = None
) -> StockMovement:
    movement = StockMovement(
        product_id=product_id,
        movement_type=movement_type,
        quantity_change=quantity_change,
        previous_quantity=previous_quantity,
        new_quantity=new_quantity,
        reference_id=reference_id,
        reason=reason,
        user_id=user_id
    )
    db.add(movement)
    return movement

def adjust_product_stock(
    db: Session,
    product: Product,
    quantity_change: int,
    movement_type: str,
    reference_id: str = None,
    reason: str = None,
    user_id: int = None
) -> Product:
    prev_qty = product.quantity
    new_qty = prev_qty + quantity_change
    
    if new_qty < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock for '{product.name}'. Available: {prev_qty}, Requested reduction: {abs(quantity_change)}"
        )
    
    product.quantity = new_qty
    record_movement(
        db=db,
        product_id=product.id,
        movement_type=movement_type,
        quantity_change=quantity_change,
        previous_quantity=prev_qty,
        new_quantity=new_qty,
        reference_id=reference_id,
        reason=reason,
        user_id=user_id
    )
    return product
