from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import date
from app.database import get_db
from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseListResponse
from app.services.auth_service import get_current_user
from app.utils.currency import format_inr

router = APIRouter(prefix="/expenses", tags=["Expenses"])

DEFAULT_EXPENSE_CATEGORIES = [
    "Rent & Lease",
    "Staff Salaries",
    "Utilities & Electricity",
    "Marketing & Advertising",
    "Logistics & Shipping",
    "Maintenance & Repairs",
    "Store Supplies",
    "Taxes & Licenses",
    "Software & Subscriptions",
    "Miscellaneous"
]

def format_expense_response(e: Expense) -> dict:
    return {
        "id": e.id,
        "title": e.title,
        "category": e.category,
        "amount": float(e.amount),
        "date": e.date,
        "description": e.description,
        "payment_method": e.payment_method,
        "reference_no": e.reference_no,
        "user_id": e.user_id,
        "created_at": e.created_at,
        "formatted_amount": format_inr(float(e.amount))
    }

@router.get("", response_model=ExpenseListResponse)
def list_expenses(
    category: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Expense)
    if category:
        query = query.filter(Expense.category == category)
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)

    total_count = query.count()
    total_sum = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
        query.whereclause if query.whereclause is not None else True
    ).scalar() or 0.0

    expenses = query.order_by(desc(Expense.date), desc(Expense.id)).offset(offset).limit(limit).all()

    return {
        "total": total_count,
        "total_amount": float(total_sum),
        "formatted_total_amount": format_inr(float(total_sum)),
        "items": [format_expense_response(e) for e in expenses]
    }

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = Expense(
        title=expense_in.title,
        category=expense_in.category,
        amount=expense_in.amount,
        date=expense_in.date,
        description=expense_in.description,
        payment_method=expense_in.payment_method or "Bank Transfer",
        reference_no=expense_in.reference_no,
        user_id=current_user.id if current_user else None
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return format_expense_response(expense)

@router.get("/categories", response_model=List[str])
def get_expense_categories(db: Session = Depends(get_db)):
    db_cats = [c[0] for c in db.query(Expense.category).distinct().all() if c[0]]
    combined = sorted(list(set(DEFAULT_EXPENSE_CATEGORIES + db_cats)))
    return combined

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    exp = db.query(Expense).filter(Expense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    return format_expense_response(exp)

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    expense_update: ExpenseUpdate,
    db: Session = Depends(get_db)
):
    exp = db.query(Expense).filter(Expense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")

    for field, value in expense_update.model_dump(exclude_unset=True).items():
        setattr(exp, field, value)

    db.commit()
    db.refresh(exp)
    return format_expense_response(exp)

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    exp = db.query(Expense).filter(Expense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(exp)
    db.commit()
    return {"message": "Expense successfully deleted"}
