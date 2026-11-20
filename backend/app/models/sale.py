from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_name = Column(String(100), default="Walk-in Customer", nullable=False)
    customer_phone = Column(String(30), nullable=True)
    subtotal = Column(Numeric(12, 2), default=0.00, nullable=False)
    discount_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    tax_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_cost = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_profit = Column(Numeric(12, 2), default=0.00, nullable=False)
    payment_method = Column(String(50), default="Cash", nullable=False)
    status = Column(String(20), default="completed", nullable=False, index=True)
    notes = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    product_name = Column(String(200), nullable=False)
    sku = Column(String(100), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    purchase_price = Column(Numeric(12, 2), nullable=False)  # Snapshot at time of sale
    unit_price = Column(Numeric(12, 2), nullable=False)      # Snapshot selling price
    total_price = Column(Numeric(12, 2), nullable=False)     # quantity * unit_price
    unit_cost = Column(Numeric(12, 2), nullable=False)       # quantity * purchase_price
    profit = Column(Numeric(12, 2), nullable=False)          # total_price - unit_cost
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")
