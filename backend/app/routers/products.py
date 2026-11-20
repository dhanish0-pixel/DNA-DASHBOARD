from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.database import get_db
from app.models.product import Product
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.sale import SaleItem
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    StockAdjustmentRequest
)
from app.schemas.category import CategoryResponse, CategoryCreate
from app.schemas.supplier import SupplierResponse, SupplierCreate
from app.services.auth_service import get_current_user
from app.services.stock_service import record_movement, adjust_product_stock
from app.utils.file_storage import save_product_image, delete_product_image
from app.utils.currency import format_inr

router = APIRouter(prefix="", tags=["Products & Inventory"])

def format_product_response(p: Product) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "sku": p.sku,
        "barcode": p.barcode,
        "category_id": p.category_id,
        "supplier_id": p.supplier_id,
        "image_url": p.image_url,
        "purchase_price": float(p.purchase_price),
        "selling_price": float(p.selling_price),
        "quantity": p.quantity,
        "min_threshold": p.min_threshold,
        "brand": p.brand,
        "description": p.description,
        "is_active": p.is_active,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
        "stock_status": p.stock_status,
        "profit_per_unit": round(p.profit_per_unit, 2),
        "profit_margin_percent": p.profit_margin_percent,
        "stock_valuation": round(p.stock_valuation, 2),
        "formatted_purchase_price": format_inr(float(p.purchase_price)),
        "formatted_selling_price": format_inr(float(p.selling_price)),
        "category": p.category,
        "supplier": p.supplier,
    }

@router.get("/products", response_model=ProductListResponse)
def list_products(
    search: Optional[str] = Query(None, description="Search by name, SKU, or brand"),
    category_id: Optional[int] = Query(None),
    stock_status: Optional[str] = Query("all", description="all, in_stock, low_stock, out_of_stock"),
    sort_by: Optional[str] = Query("created_at", description="name, purchase_price, selling_price, quantity, created_at"),
    sort_order: Optional[str] = Query("desc", description="asc or desc"),
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    
    if not include_inactive:
        query = query.filter(Product.is_active == True)

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_pattern),
                Product.sku.ilike(search_pattern),
                Product.barcode.ilike(search_pattern),
                Product.brand.ilike(search_pattern)
            )
        )

    # Filter stock status
    if stock_status == "in_stock":
        query = query.filter(Product.quantity > Product.min_threshold)
    elif stock_status == "low_stock":
        query = query.filter(Product.quantity > 0, Product.quantity <= Product.min_threshold)
    elif stock_status == "out_of_stock":
        query = query.filter(Product.quantity <= 0)

    # Sorting
    sort_col = getattr(Product, sort_by, Product.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    products = query.all()
    formatted = [format_product_response(p) for p in products]
    return {
        "total": len(formatted),
        "items": formatted
    }

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product_in.sku}' already exists"
        )

    # Verify category exists
    category = db.query(Category).filter(Category.id == product_in.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Specified category does not exist")

    product = Product(
        name=product_in.name,
        sku=product_in.sku,
        barcode=product_in.barcode,
        category_id=product_in.category_id,
        supplier_id=product_in.supplier_id,
        image_url=product_in.image_url,
        purchase_price=product_in.purchase_price,
        selling_price=product_in.selling_price,
        quantity=product_in.quantity,
        min_threshold=product_in.min_threshold,
        brand=product_in.brand,
        description=product_in.description,
        is_active=product_in.is_active
    )
    db.add(product)
    db.flush()  # get product.id

    # Record initial stock movement if quantity > 0
    if product.quantity > 0:
        record_movement(
            db=db,
            product_id=product.id,
            movement_type="INITIAL",
            quantity_change=product.quantity,
            previous_quantity=0,
            new_quantity=product.quantity,
            reference_id=f"INIT-{product.sku}",
            reason="Initial stock entry",
            user_id=current_user.id if current_user else None
        )

    db.commit()
    db.refresh(product)
    return format_product_response(product)

@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return format_product_response(product)

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_update.model_dump(exclude_unset=True)

    # Check SKU uniqueness if updated
    if "sku" in update_data and update_data["sku"] != product.sku:
        existing = db.query(Product).filter(Product.sku == update_data["sku"]).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"SKU '{update_data['sku']}' is already in use")

    # If quantity is explicitly modified
    if "quantity" in update_data and update_data["quantity"] != product.quantity:
        new_q = update_data["quantity"]
        diff = new_q - product.quantity
        record_movement(
            db=db,
            product_id=product.id,
            movement_type="ADJUSTMENT",
            quantity_change=diff,
            previous_quantity=product.quantity,
            new_quantity=new_q,
            reference_id=f"ADJ-{product.sku}",
            reason="Manual inventory quantity update in product settings",
            user_id=current_user.id if current_user else None
        )

    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return format_product_response(product)

@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if linked to sales
    sales_count = db.query(SaleItem).filter(SaleItem.product_id == product_id).count()
    if sales_count > 0:
        # Soft-delete to preserve accounting integrity
        product.is_active = False
        db.commit()
        return {
            "message": f"Product '{product.name}' has historical sales and was archived (soft-deleted) to protect financial data.",
            "archived": True
        }

    # Delete local image if any
    if product.image_url:
        delete_product_image(product.image_url)

    db.delete(product)
    db.commit()
    return {"message": f"Product '{product.name}' successfully deleted.", "archived": False}

@router.post("/products/{product_id}/adjust-stock", response_model=ProductResponse)
def adjust_stock(
    product_id: int,
    request: StockAdjustmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    adjust_product_stock(
        db=db,
        product=product,
        quantity_change=request.quantity_change,
        movement_type=request.movement_type or "ADJUSTMENT",
        reference_id=f"STK-ADJ-{product.id}",
        reason=request.reason,
        user_id=current_user.id if current_user else None
    )
    db.commit()
    db.refresh(product)
    return format_product_response(product)

@router.post("/products/upload-image")
async def upload_image(file: UploadFile = File(...)):
    url = await save_product_image(file)
    return {"image_url": url, "filename": file.filename}

# Category and Supplier helper endpoints
@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.name.asc()).all()

@router.post("/categories", response_model=CategoryResponse)
def create_category(category_in: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter(
        or_(Category.name == category_in.name, Category.slug == category_in.slug)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name or slug already exists")
    cat = Category(**category_in.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.get("/suppliers", response_model=List[SupplierResponse])
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).order_by(Supplier.name.asc()).all()

@router.post("/suppliers", response_model=SupplierResponse)
def create_supplier(supplier_in: SupplierCreate, db: Session = Depends(get_db)):
    sup = Supplier(**supplier_in.model_dump())
    db.add(sup)
    db.commit()
    db.refresh(sup)
    return sup
