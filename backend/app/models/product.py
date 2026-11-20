from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), index=True, nullable=False)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    barcode = Column(String(100), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    image_url = Column(String(500), nullable=True)
    purchase_price = Column(Numeric(12, 2), nullable=False, default=0.00)
    selling_price = Column(Numeric(12, 2), nullable=False, default=0.00)
    quantity = Column(Integer, default=0, nullable=False, index=True)
    min_threshold = Column(Integer, default=5, nullable=False)
    brand = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    category = relationship("Category", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")
    sale_items = relationship("SaleItem", back_populates="product")
    stock_movements = relationship("StockMovement", back_populates="product", cascade="all, delete-orphan")

    @property
    def stock_status(self) -> str:
        if self.quantity <= 0:
            return "OUT_OF_STOCK"
        elif self.quantity <= self.min_threshold:
            return "LOW_STOCK"
        return "IN_STOCK"

    @property
    def profit_per_unit(self) -> float:
        return float(self.selling_price) - float(self.purchase_price)

    @property
    def profit_margin_percent(self) -> float:
        sp = float(self.selling_price)
        pp = float(self.purchase_price)
        if sp <= 0:
            return 0.0
        return round(((sp - pp) / sp) * 100, 2)

    @property
    def stock_valuation(self) -> float:
        return float(self.purchase_price) * self.quantity
