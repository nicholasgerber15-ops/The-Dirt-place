import os

os.environ.setdefault("DEV_MODE", "1")

from fastapi.testclient import TestClient

from backend.server import app
from backend.services.quickbooks import build_sales_receipt


client = TestClient(app)


def test_health_and_materials():
    assert client.get("/api/health").status_code == 200
    response = client.get("/api/ecommerce/materials")
    assert response.status_code == 200
    assert response.json()["materials"]


def test_calculator_rounds_up_to_orderable_half_yard():
    response = client.post("/api/calculator", json={
        "project_type": "Driveway",
        "length": 20,
        "width": 10,
        "depth": 4,
        "material": "Gravel",
    })
    assert response.status_code == 200
    assert response.json()["recommended_amount"] == 3.0


def test_calculator_preserves_validation_message():
    response = client.post("/api/calculator", json={
        "project_type": "Driveway",
        "length": 0,
        "width": 10,
        "depth": 4,
        "material": "Gravel",
    })
    assert response.status_code == 400
    assert "positive" in response.json()["detail"]


def test_checkout_rejects_unknown_client_pricing_before_stripe():
    response = client.post("/api/ecommerce/create-payment-intent", json={
        "cart_items": [{"id": "NOT-A-REAL-SKU", "name": "Fake", "quantity": 1, "price": 0.01}],
        "customer_name": "Buyer",
        "customer_email": "buyer@example.com",
        "customer_phone": "8305550100",
        "needs_delivery": False,
    })
    assert response.status_code == 400
    assert "no longer available" in response.json()["detail"]


def test_quickbooks_sales_receipt_mapping():
    payload = build_sales_receipt({
        "order_number": "DP-100",
        "stripe_session_id": "pi_100",
        "customer": {"email": "buyer@example.com"},
        "cart_items": [{"sku": "SOIL-4WAY", "name": "4-Way Mix", "quantity": 2, "price": 58}],
        "pricing": {"delivery_fee": 70, "admin_fee": 6.51, "pallet_fee": 0, "total": 208.99},
    }, {"SOIL-4WAY": "11", "delivery": "12", "admin_fee": "13"})
    assert payload["DocNumber"] == "DP-100"
    assert payload["Line"][0]["Amount"] == 116.0
    assert payload["Line"][0]["SalesItemLineDetail"]["ItemRef"]["value"] == "11"
