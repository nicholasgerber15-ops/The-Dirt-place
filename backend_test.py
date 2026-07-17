UNIVERSAL NRG-CO HEADER BLOCK
Use this exact banner at the top of source files. License/covenant terms still apply.

################################################################
#                                                              #
#                ⚡  N R G - C O  ⚡                          #
#                                                              #
#    CRITICAL ASSET — CLOSED SOURCE / CONFIDENTIAL              #
#    PROPRIETARY / UNDER DEVELOPMENT / SECRET                   #
#                                                              #
################################################################
import requests
import sys
import json
from datetime import datetime

class DirtPlaceAPITester:
    def __init__(self, base_url="https://earth-supply-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)}")
                    return True, response_data
                except:
                    print(f"   Response: {response.text}")
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error Response: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )

    def test_contact_form_valid(self):
        """Test contact form with valid data"""
        test_data = {
            "name": "John Doe",
            "phone": "(830) 555-1234",
            "email": "rngt3@outlook.com",  # Using verified email for testing
            "material": "Gravel",
            "message": "I need 5 cubic yards of gravel for my driveway project. Please contact me with pricing and delivery options."
        }
        
        return self.run_test(
            "Contact Form - Valid Submission",
            "POST",
            "contact",
            200,
            data=test_data
        )

    def test_contact_form_missing_fields(self):
        """Test contact form with missing required fields"""
        test_data = {
            "name": "Jane Smith",
            "email": "rngt3@outlook.com"
            # Missing phone and message
        }
        
        return self.run_test(
            "Contact Form - Missing Required Fields",
            "POST",
            "contact",
            422,  # Validation error
            data=test_data
        )

    def test_contact_form_invalid_email(self):
        """Test contact form with invalid email"""
        test_data = {
            "name": "Bob Wilson",
            "phone": "(830) 555-5678",
            "email": "invalid-email",
            "material": "Topsoil",
            "message": "Test message"
        }
        
        return self.run_test(
            "Contact Form - Invalid Email",
            "POST",
            "contact",
            422,  # Validation error
            data=test_data
        )

    def test_calculator_valid_driveway(self):
        """Test calculator with valid driveway project"""
        test_data = {
            "project_type": "Driveway",
            "length": 50.0,
            "width": 12.0,
            "depth": 4.0,
            "material": "Gravel"
        }
        
        return self.run_test(
            "Calculator - Valid Driveway Project",
            "POST",
            "calculator",
            200,
            data=test_data
        )

    def test_calculator_valid_garden(self):
        """Test calculator with valid garden bed project"""
        test_data = {
            "project_type": "Garden Bed",
            "length": 20.0,
            "width": 8.0,
            "depth": 3.0,
            "material": "Topsoil"
        }
        
        return self.run_test(
            "Calculator - Valid Garden Bed Project",
            "POST",
            "calculator",
            200,
            data=test_data
        )

    def test_calculator_invalid_dimensions(self):
        """Test calculator with invalid dimensions"""
        test_data = {
            "project_type": "Pathway",
            "length": -10.0,  # Invalid negative length
            "width": 5.0,
            "depth": 2.0,
            "material": "Sand"
        }
        
        return self.run_test(
            "Calculator - Invalid Dimensions",
            "POST",
            "calculator",
            400,  # Bad request
            data=test_data
        )

    def test_calculator_missing_fields(self):
        """Test calculator with missing required fields"""
        test_data = {
            "project_type": "Patio",
            "length": 15.0
            # Missing width, depth, material
        }
        
        return self.run_test(
            "Calculator - Missing Required Fields",
            "POST",
            "calculator",
            422,  # Validation error
            data=test_data
        )

    def test_calculator_large_project(self):
        """Test calculator with large project dimensions"""
        test_data = {
            "project_type": "Commercial",
            "length": 200.0,
            "width": 100.0,
            "depth": 6.0,
            "material": "Road Base"
        }
        
        return self.run_test(
            "Calculator - Large Commercial Project",
            "POST",
            "calculator",
            200,
            data=test_data
        )

def main():
    print("🚀 Starting The Dirt Place API Testing...")
    print("=" * 60)
    
    # Setup
    tester = DirtPlaceAPITester()
    
    # Test API endpoints
    print("\n📡 Testing API Endpoints...")
    tester.test_root_endpoint()
    
    print("\n📧 Testing Contact Form...")
    tester.test_contact_form_valid()
    tester.test_contact_form_missing_fields()
    tester.test_contact_form_invalid_email()
    
    print("\n🧮 Testing Material Calculator...")
    tester.test_calculator_valid_driveway()
    tester.test_calculator_valid_garden()
    tester.test_calculator_invalid_dimensions()
    tester.test_calculator_missing_fields()
    tester.test_calculator_large_project()
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())