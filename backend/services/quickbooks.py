"""QuickBooks Online payload mapping for paid Dirt Place orders."""
from decimal import Decimal, ROUND_HALF_UP
from typing import Mapping


def money(value) -> float:
    return float(Decimal(str(value or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def build_sales_receipt(order: dict, item_refs: Mapping[str, str]) -> dict:
    """Map a stored order to a QuickBooks Online SalesReceipt payload."""
    customer = order.get("customer", {})
    pricing = order.get("pricing", {})
    lines = []

    for item in order.get("cart_items", []):
        sku = str(item.get("sku") or item.get("id") or "")
        qbo_item_id = item_refs.get(sku) or item_refs.get("default")
        if not qbo_item_id:
            raise ValueError(f"No QuickBooks Item mapping for SKU {sku}")
        quantity = float(item.get("quantity", 0))
        unit_price = money(item.get("price", 0))
        lines.append({
            "Amount": money(quantity * unit_price),
            "Description": f"{item.get('name', sku)} [{sku}]",
            "DetailType": "SalesItemLineDetail",
            "SalesItemLineDetail": {
                "ItemRef": {"value": str(qbo_item_id)},
                "Qty": quantity,
                "UnitPrice": unit_price,
            },
        })

    for key, label, pricing_key in (
        ("delivery", "Delivery fee", "delivery_fee"),
        ("pallet_fee", "Pallet fee", "pallet_fee"),
        ("admin_fee", "Card administration fee", "admin_fee"),
    ):
        amount = money(pricing.get(pricing_key, 0))
        if amount <= 0:
            continue
        if not item_refs.get(key):
            raise ValueError(f"No QuickBooks Item mapping for {key}")
        lines.append({
            "Amount": amount,
            "Description": label,
            "DetailType": "SalesItemLineDetail",
            "SalesItemLineDetail": {
                "ItemRef": {"value": str(item_refs[key])},
                "Qty": 1,
                "UnitPrice": amount,
            },
        })

    payload = {
        "DocNumber": order.get("order_number"),
        "PrivateNote": f"Stripe payment {order.get('stripe_session_id', '')}",
        "Line": lines,
        "BillEmail": {"Address": customer.get("email", "")},
        "TotalAmt": money(pricing.get("total", 0)),
    }
    if order.get("quickbooks_customer_id"):
        payload["CustomerRef"] = {"value": str(order["quickbooks_customer_id"])}
    return payload
