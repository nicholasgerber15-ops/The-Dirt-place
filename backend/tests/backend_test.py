"""Backend tests: Admin Portal + Ecommerce flow for The Dirt Place."""
import os
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://earth-supply-1.preview.emergentagent.com").rstrip("/")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "dirtplace2024")


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ======= Admin Auth =======
class TestAdminAuth:
    def test_login_success(self):
        r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD}, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        assert data["token"] == ADMIN_PASSWORD

    def test_login_fail(self):
        r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "wrong"}, timeout=30)
        assert r.status_code == 401

    def test_protected_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/stats", timeout=30)
        assert r.status_code == 401


# ======= Admin Stats =======
class TestAdminStats:
    def test_get_stats(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers=admin_headers, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "total_orders" in d
        assert "orders_by_status" in d
        assert "total_revenue" in d
        assert "recent_orders" in d
        assert isinstance(d["total_orders"], int)


# ======= Admin Orders =======
class TestAdminOrders:
    def test_list_orders(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/orders", headers=admin_headers, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "orders" in d and "total" in d

    def test_list_with_status_filter(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/orders?status=processing", headers=admin_headers, timeout=30)
        assert r.status_code == 200

    def test_search(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/search?q=DP", headers=admin_headers, timeout=30)
        assert r.status_code == 200
        assert "results" in r.json()


# ======= Admin Pricing =======
class TestAdminPricing:
    def test_get_pricing(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/pricing", headers=admin_headers, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "pricing" in d
        assert len(d["pricing"]) >= 6
        item = d["pricing"][0]
        assert "material_id" in item and "price_per_cubic_yard" in item

    def test_update_pricing_persists(self, admin_headers):
        # Get current
        r = requests.get(f"{BASE_URL}/api/admin/pricing", headers=admin_headers, timeout=30)
        original = next((p for p in r.json()["pricing"] if p["material_id"] == "1"), None)
        assert original
        new_price = 47.50
        payload = {"material_id": "1", "name": original["name"], "price_per_cubic_yard": new_price, "min_order": original["min_order"]}
        u = requests.put(f"{BASE_URL}/api/admin/pricing/1", headers=admin_headers, json=payload, timeout=30)
        assert u.status_code == 200
        # Verify persisted
        r2 = requests.get(f"{BASE_URL}/api/admin/pricing", headers=admin_headers, timeout=30)
        updated = next(p for p in r2.json()["pricing"] if p["material_id"] == "1")
        assert updated["price_per_cubic_yard"] == new_price
        # Restore
        payload["price_per_cubic_yard"] = original["price_per_cubic_yard"]
        requests.put(f"{BASE_URL}/api/admin/pricing/1", headers=admin_headers, json=payload, timeout=30)


# ======= Admin Delivery Fees =======
class TestDeliveryFees:
    def test_get_fees(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/delivery-fees", headers=admin_headers, timeout=30)
        assert r.status_code == 200
        assert "delivery_fees" in r.json()

    def test_update_fee(self, admin_headers):
        payload = {"zip_code": "78006", "fee": 0.00, "area": "Boerne"}
        r = requests.put(f"{BASE_URL}/api/admin/delivery-fees/78006", headers=admin_headers, json=payload, timeout=30)
        assert r.status_code == 200


# ======= Ecommerce =======
class TestEcommerce:
    def test_delivery_fee_public(self):
        r = requests.get(f"{BASE_URL}/api/ecommerce/delivery-fee/78006", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["zip_code"] == "78006"
        assert "delivery_fee" in d

    def test_create_checkout_session(self):
        """Creates Stripe session - also seeds an order visible in admin."""
        payload = {
            "cart_items": [{"id": "1", "name": "Topsoil", "quantity": 2.0, "price": 45.0}],
            "customer_name": "TEST Customer",
            "customer_email": "test@example.com",
            "customer_phone": "555-0100",
            "delivery_address": "123 Main St",
            "delivery_zip": "78006",
            "delivery_date": "2026-01-20",
            "delivery_time": "morning",
            "notes": "test",
            "origin_url": BASE_URL
        }
        r = requests.post(f"{BASE_URL}/api/ecommerce/checkout/create-session", json=payload, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "url" in d and "session_id" in d and "order_number" in d
        assert d["order_number"].startswith("DP-")

    def test_order_appears_in_admin(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/orders", headers=admin_headers, timeout=30)
        assert r.status_code == 200
        orders = r.json()["orders"]
        # At least one test order should exist
        assert any(o.get("customer", {}).get("name") == "TEST Customer" for o in orders)

    def test_invalid_material_rejected(self):
        payload = {
            "cart_items": [{"id": "99999", "name": "Fake", "quantity": 1.0, "price": 10.0}],
            "customer_name": "TEST",
            "customer_email": "test@example.com",
            "customer_phone": "555-0100",
            "delivery_address": "123 Main",
            "delivery_zip": "78006",
            "delivery_date": "2026-01-20",
            "delivery_time": "morning",
            "origin_url": BASE_URL
        }
        r = requests.post(f"{BASE_URL}/api/ecommerce/checkout/create-session", json=payload, timeout=30)
        assert r.status_code in [400, 500]
