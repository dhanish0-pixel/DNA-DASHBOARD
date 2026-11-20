import os
import re
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, init_db
from app.models.user import User
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.sale import Sale, SaleItem
from app.models.expense import Expense
from app.models.stock_movement import StockMovement
from app.services.auth_service import get_password_hash
from app.config import settings

def seed_database():
    print("Connecting to database and verifying tables...")
    init_db()
    db: Session = SessionLocal()

    try:
        # 1. Admin User
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("Creating administrator account (admin / admin123)...")
            admin_user = User(
                username="admin",
                email="admin@smartstore.in",
                hashed_password=get_password_hash("admin123"),
                full_name="Store Owner",
                role="admin",
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print("Admin account created successfully.")
        else:
            admin_user.hashed_password = get_password_hash("admin123")
            admin_user.is_active = True
            db.commit()
            print("Admin account verified.")

        # 2. Categories
        categories_data = [
            ("Electronics & Gadgets", "Smartphones, Audio, Accessories, and Smart Tech", "#3B82F6"),
            ("Clothing & Apparel", "Men, Women, and Kids Garments", "#EC4899"),
            ("Footwear & Shoes", "Casual, Sports, Formal and Sneakers", "#F59E0B"),
            ("Bags & Luggage", "Backpacks, Satchels, Handbags, and Travel Cases", "#10B981"),
            ("Home & Living", "Home decor, lighting, kitchen, and furnishing", "#8B5CF6"),
            ("Groceries & Staples", "Food items, snacks, and daily essentials", "#06B6D4"),
            ("Health & Beauty", "Cosmetics, personal care, and wellness", "#EF4444"),
            ("General / Other", "Miscellaneous store inventory", "#64748B"),
        ]

        for cat_name, desc, color in categories_data:
            existing = db.query(Category).filter(Category.name == cat_name).first()
            if not existing:
                slug = re.sub(r'[^a-zA-Z0-9]+', '-', cat_name.strip().lower()).strip('-')
                db.add(Category(name=cat_name, slug=slug, description=desc, color=color))
        db.commit()
        print("Categories verified.")

        # 3. Suppliers
        suppliers_data = [
            ("National Distributors Pvt Ltd", "Rajesh Sharma", "+91 9820011223", "sales@nationaldist.com", "Mumbai, Maharashtra"),
            ("Apex Wholesale Hub", "Pooja Mehta", "+91 9811099887", "contact@apexwholesale.in", "Delhi NCR"),
            ("Global Imports Direct", "Vikram Patel", "+91 9876543210", "orders@globalimports.in", "Ahmedabad, Gujarat"),
            ("Local Vendor Direct", "Anil Kumar", "+91 9988776655", "anil@localvendor.com", "Local City Market"),
        ]

        for s_name, cp, ph, em, addr in suppliers_data:
            existing = db.query(Supplier).filter(Supplier.name == s_name).first()
            if not existing:
                db.add(Supplier(name=s_name, contact_person=cp, phone=ph, email=em, address=addr))
        db.commit()
        print("Suppliers verified.")

        # 4. User preference: Do NOT seed dummy products!
        # Clean any demo products from database so the user adds their own
        dummy_products = db.query(Product).all()
        if dummy_products:
            print(f"Cleaning {len(dummy_products)} demo products for user's own inventory...")
            db.query(SaleItem).delete()
            db.query(Sale).delete()
            db.query(StockMovement).delete()
            db.query(Product).delete()
            db.commit()
            print("Stock cleared! Clean slate ready for adding products.")

        # 5. Operating Expenses
        if db.query(Expense).count() == 0:
            from datetime import date, timedelta
            sample_expenses = [
                Expense(
                    title="Store Monthly Rent",
                    category="Rent & Lease",
                    amount=45000.00,
                    date=date.today().replace(day=1),
                    payment_method="Bank Transfer",
                    description="Commercial showroom lease",
                    reference_no="RENT-001",
                    user_id=admin_user.id
                ),
                Expense(
                    title="Electricity Bill",
                    category="Utilities",
                    amount=8500.00,
                    date=date.today() - timedelta(days=10),
                    payment_method="UPI",
                    description="Monthly store power bill",
                    reference_no="ELEC-002",
                    user_id=admin_user.id
                ),
            ]
            for exp in sample_expenses:
                db.add(exp)
            db.commit()

        print("Database ready! Admin login: admin / admin123")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
