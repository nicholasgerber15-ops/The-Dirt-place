import json
import sys
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000"
API = f"{BASE_URL}/api"

passed = 0
failed = 0

def test(name, method, endpoint, expected_status, data=None):
    global passed, failed
    url = f"{API}/{endpoint}"
    print(f"\n  {name}")
    print(f"    {method} {url}")

    try:
        body = json.dumps(data).encode() if data else None
        req = urllib.request.Request(
            url,
            data=body,
            method=method,
            headers={"Content-Type": "application/json"} if body else {}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.status
            raw = resp.read().decode()
    except urllib.error.HTTPError as e:
        status = e.code
        raw = e.read().decode()
    except Exception as e:
        print(f"    ❌ Connection Error: {e}")
        failed += 1
        return

    try:
        response_data = json.loads(raw)
    except json.JSONDecodeError:
        response_data = raw

    status_ok = status == expected_status
    if status_ok:
        print(f"    ✅ {status}")
        passed += 1
    else:
        print(f"    ❌ Expected {expected_status}, got {status}")
        failed += 1

    if isinstance(response_data, dict):
        keys = list(response_data.keys())
        print(f"    Response keys: {keys}")

def test_materials():
    test("Get all materials", "GET", "ecommerce/materials", 200)
    url = f"{API}/ecommerce/materials"
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            count = len(data.get("materials", []))
            if count == 145:
                print(f"    ✅ Contains all 145 products ({count})")
                passed += 1
            else:
                print(f"    ❌ Expected 145 products, got {count}")
                failed += 1
    except Exception as e:
        print(f"    ❌ Failed to count materials: {e}")
        failed += 1

def test_materials_structure():
    url = f"{API}/ecommerce/materials"
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            materials = data.get("materials", [])
            required_fields = ["material_id", "name", "price_per_unit", "unit_type", "description"]
            missing = []
            for field in required_fields:
                if not all(field in m for m in materials):
                    missing.append(field)
            if not missing:
                print(f"    ✅ All materials have required fields: {required_fields}")
                passed += 1
            else:
                print(f"    ❌ Missing fields: {missing}")
                failed += 1
    except Exception as e:
        print(f"    ❌ Failed: {e}")
        failed += 1

def test_delivery_fee_base():
    test("Get delivery fee (no address)", "GET", "ecommerce/delivery-fee", 200)

def test_delivery_fee_with_address():
    test("Get delivery fee (with address)", "GET", "ecommerce/delivery-fee?address=100+Main+St%2C+Boerne%2C+TX", 200)
    url = f"{API}/ecommerce/delivery-fee?address=100+Main+St%2C+Boerne%2C+TX"
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            if "total_delivery_fee" in data or "note" in data:
                print(f"    ✅ Delivery fee response valid")
                passed += 1
            else:
                print(f"    ❌ Unexpected response format")
                failed += 1
    except Exception as e:
        print(f"    ❌ Failed: {e}")
        failed += 1

def test_create_payment_intent_validation():
    test("Create payment intent (empty cart)", "POST", "ecommerce/create-payment-intent", 422, data={})

def test_create_payment_intent_missing_fields():
    test("Create payment intent (missing customer)", "POST", "ecommerce/create-payment-intent", 422, data={"cart_items": []})

def test_root():
    test("Root health check", "GET", "", 200)

def test_admin_pricing():
    test("Get admin pricing (no auth)", "GET", "admin/pricing", 401)

def main():
    print("=" * 60)
    print("  Ecommerce API Tests")
    print("=" * 60)
    print(f"\n  Server: {BASE_URL}")
    print(f"  Make sure the backend is running at {BASE_URL}")

    print("\n📡 Root")
    test_root()

    print("\n📦 Materials")
    test_materials()
    test_materials_structure()

    print("\n🚚 Delivery Fee")
    test_delivery_fee_base()
    test_delivery_fee_with_address()

    print("\n💳 Payment Intent")
    test_create_payment_intent_validation()
    test_create_payment_intent_missing_fields()

    print("\n🔐 Admin")
    test_admin_pricing()

    print("\n" + "=" * 60)
    total = passed + failed
    print(f"  Results: {passed}/{total} passed")
    if failed == 0:
        print("  🎉 All tests passed!")
        return 0
    else:
        print(f"  ⚠️  {failed} failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
