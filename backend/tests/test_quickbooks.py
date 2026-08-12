# UNIVERSAL NRG-CO HEADER BLOCK
# Use this exact banner at the top of source files. License/covenant terms still apply.
#
################################################################
#                                                              #
#                ⚡  N R G - C O  ⚡                          #
#                                                              #
#    CRITICAL ASSET — CLOSED SOURCE / CONFIDENTIAL              #
#    PROPRIETARY / UNDER DEVELOPMENT / SECRET                   #
#                                                              #
################################################################
import os
import asyncio
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from unittest.mock import patch, AsyncMock

os.environ.setdefault("DEV_MODE", "1")

from fastapi.testclient import TestClient

from backend.server import app
from backend.services import quickbooks_sync
from backend.models.material import Pricing, PriceHistoryEntry

client = TestClient(app)


def test_quickbooks_sync_updates_mapped_material_prices():
    patched_items = [
        {"Id": "123", "Name": "Screened Topsoil", "UnitPrice": 50.00, "Unit": "cubic yard", "SalesTaxCodeRef": {"value": "tax"}, "ItemCategoryType": "Soil", "TrackQtyOnHand": True, "QuantityOnHand": 120, "Active": True},
    ]

    with patch.object(quickbooks_sync, 'QUICKBOOKS_CLIENT_ID', 'test'), \
         patch.object(quickbooks_sync, 'QUICKBOOKS_CLIENT_SECRET', 'test'), \
         patch.object(quickbooks_sync, 'QUICKBOOKS_REFRESH_TOKEN', 'test'), \
         patch.object(quickbooks_sync, 'QUICKBOOKS_COMPANY_ID', 'test'), \
         patch.object(quickbooks_sync, 'QUICKBOOKS_ENVIRONMENT', 'sandbox'), \
         patch.object(quickbooks_sync, 'QUICKBOOKS_MINOR_VERSION', '75'), \
         patch('backend.services.quickbooks_sync._refresh_access_token', new_callable=AsyncMock, return_value='fake-token'), \
         patch('backend.services.quickbooks_sync.fetch_qbo_items', new_callable=AsyncMock, return_value=patched_items), \
         patch('backend.services.quickbooks_sync._db', return_value=AsyncMock()):
        mock_db = quickbooks_sync._db.return_value
        mock_db.materials.find_one = AsyncMock(return_value={"_id": "mat1", "name": "Screened Topsoil", "pricing": {"retail_price_cents": 4500}})
        mock_db.materials.update_one = AsyncMock()
        mock_db.price_history.insert_one = AsyncMock()
        mock_db.integration_sync_reports.insert_one = AsyncMock()
        mock_db.integration_connections.update_one = AsyncMock()

        report = asyncio.run(quickbooks_sync.sync_materials())
        assert report.status == "success"
        assert report.updated == 1
        assert mock_db.materials.update_one.called


def test_quickbooks_sync_creates_new_material_for_unmapped_qbo_item():
    patched_items = [
        {"Id": "999", "Name": "New Mulch", "UnitPrice": 25.00, "Unit": "cubic yard", "SalesTaxCodeRef": {"value": "tax"}, "ItemCategoryType": "Mulch", "TrackQtyOnHand": False, "QuantityOnHand": 0, "Active": True},
    ]

    with patch.object(quickbooks_sync, 'QUICKBOOKS_CLIENT_ID', 'test'), \
         patch.object(quickbooks_sync, 'QUICKBOOKS_CLIENT_SECRET', 'test'), \
         patch.object(quickbooks_sync, 'QUICKBOOKS_REFRESH_TOKEN', 'test'), \
         patch.object(quickbooks_sync, 'QUICKBOOKS_COMPANY_ID', 'test'), \
         patch.object(quickbooks_sync, 'QUICKBOOKS_ENVIRONMENT', 'sandbox'), \
         patch.object(quickbooks_sync, 'QUICKBOOKS_MINOR_VERSION', '75'), \
         patch('backend.services.quickbooks_sync._refresh_access_token', new_callable=AsyncMock, return_value='fake-token'), \
         patch('backend.services.quickbooks_sync.fetch_qbo_items', new_callable=AsyncMock, return_value=patched_items), \
         patch('backend.services.quickbooks_sync._db', return_value=AsyncMock()):
        mock_db = quickbooks_sync._db.return_value
        mock_db.materials.find_one = AsyncMock(return_value=None)
        mock_db.materials.insert_one = AsyncMock()

        report = asyncio.run(quickbooks_sync.sync_materials())
        assert report.status == "success"
        assert report.created == 1
        assert mock_db.materials.insert_one.called


def test_checkout_rejects_manipulated_browser_prices():
    response = client.post("/api/ecommerce/create-payment-intent", json={
        "cart_items": [{"id": "NOT-A-REAL-SKU", "name": "Fake", "quantity": 1, "price": 0.01}],
        "customer_name": "Buyer",
        "customer_email": "buyer@example.com",
        "customer_phone": "8305550100",
        "needs_delivery": False,
    })
    assert response.status_code == 400
    assert "no longer available" in response.json()["detail"]


def test_zero_or_malformed_qbo_prices_safe():
    patched_items = [
        {"Id": "1", "Name": "Bad Price", "UnitPrice": None, "Unit": "each", "SalesTaxCodeRef": {"value": "tax"}, "ItemCategoryType": "Service", "TrackQtyOnHand": False, "QuantityOnHand": 0, "Active": True},
    ]

    with patch.object(quickbooks_sync, 'QUICKBOOKS_CLIENT_ID', 'test'), \
         patch.object(quickbooks_sync, 'QUICKBOOKS_CLIENT_SECRET', 'test'), \
         patch.object(quickbooks_sync, 'QUICKBOOKS_REFRESH_TOKEN', 'test'), \
         patch.object(quickbooks_sync, 'QUICKBOOKS_COMPANY_ID', 'test'), \
         patch.object(quickbooks_sync, 'QUICKBOOKS_ENVIRONMENT', 'sandbox'), \
         patch.object(quickbooks_sync, 'QUICKBOOKS_MINOR_VERSION', '75'), \
         patch('backend.services.quickbooks_sync._refresh_access_token', new_callable=AsyncMock, return_value='fake-token'), \
         patch('backend.services.quickbooks_sync.fetch_qbo_items', new_callable=AsyncMock, return_value=patched_items), \
         patch('backend.services.quickbooks_sync._db', return_value=AsyncMock()):
        mock_db = quickbooks_sync._db.return_value
        mock_db.materials.find_one = AsyncMock(return_value=None)
        mock_db.materials.insert_one = AsyncMock()

        report = asyncio.run(quickbooks_sync.sync_materials())
        assert report.status == "success"
        call = mock_db.materials.insert_one.call_args[0][0]
        assert call["pricing"]["retail_price_cents"] == 0


def test_emergency_override_expires_correctly():
    pricing = Pricing(
        retail_price_cents=4500,
        override_price_cents=4700,
        override_expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
    )
    assert pricing.override_price_cents == 4700
    assert pricing.override_expires_at < datetime.now(timezone.utc)


def test_price_history_append_only():
    existing = []
    entry = PriceHistoryEntry(
        material_id="mat1",
        quickbooks_item_id="123",
        previous_price_cents=4200,
        new_price_cents=4500,
        source="quickbooks_sync",
        sync_id="sync-1",
        changed_by="quickbooks_sync",
        changed_at=datetime.now(timezone.utc),
        reason="test",
    )
    existing.append(entry)
    assert len(existing) == 1

    entry2 = PriceHistoryEntry(
        material_id="mat1",
        quickbooks_item_id="123",
        previous_price_cents=4500,
        new_price_cents=4600,
        source="quickbooks_sync",
        sync_id="sync-2",
        changed_by="quickbooks_sync",
        changed_at=datetime.now(timezone.utc),
        reason="test2",
    )
    existing.append(entry2)
    assert len(existing) == 2
    assert existing[0].new_price_cents == 4500
    assert existing[1].previous_price_cents == 4500


def test_quickbooks_unit_normalization():
    assert quickbooks_sync._normalize_unit("cubic yard") == "cubic_yard"
    assert quickbooks_sync._normalize_unit("cubic yards") == "cubic_yard"
    assert quickbooks_sync._normalize_unit("yard") == "cubic_yard"
    assert quickbooks_sync._normalize_unit("ton") == "ton"
    assert quickbooks_sync._normalize_unit("pallet") == "pallet"
    assert quickbooks_sync._normalize_unit("each") == "each"
    assert quickbooks_sync._normalize_unit("") == "each"


def test_money_quantizes_correctly():
    assert quickbooks_sync._money("4.50") == 450
    assert quickbooks_sync._money(4.005) == 401
    assert quickbooks_sync._money(None) == 0


def test_admin_quickbooks_status_when_not_connected():
    response = client.get("/api/admin/quickbooks/status")
    assert response.status_code == 200
    assert response.json()["connected"] is False
