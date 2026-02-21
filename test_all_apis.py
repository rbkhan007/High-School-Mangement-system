import urllib.request
import urllib.error
import urllib.parse
import json
import sys
import time

BASE_URL = "http://localhost:5000"

# 3 Testers: Headmaster, Teacher, Student
TESTERS = [
    {
        "role": "Headmaster / Admin",
        "email": "headmaster@basudevpur.edu.bd",
        "password": "headmaster123"
    },
    {
        "role": "Teacher",
        "email": "teacher@basudevpur.edu.bd",
        "password": "password123"
    },
    {
        "role": "Student",
        "email": "student@basudevpur.edu.bd",
        "password": "password123"
    }
]

# All table endpoints to check for frontend data
ENDPOINTS_TO_TEST = [
    {"name": "Students List", "path": "/api/students"},
    {"name": "Teachers List", "path": "/api/teachers"},
    {"name": "Classes List", "path": "/api/classes"},
    {"name": "Attendance Info", "path": "/api/attendance"},
    {"name": "Exams Info", "path": "/api/exams"},
    {"name": "Notices", "path": "/api/notices"},
    {"name": "Grievances", "path": "/api/grievances"},
    {"name": "Resources/Materials", "path": "/api/resources"},
    {"name": "Feedback", "path": "/api/feedback"},
    {"name": "Library Books", "path": "/api/library"},
    {"name": "Assignments", "path": "/api/assignments"},
    {"name": "Routines", "path": "/api/routines"}
]

def test_endpoint(name, path, method="GET", data=None, headers=None):
    url = BASE_URL + path
    req = urllib.request.Request(url, method=method)
    
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
            
    if data is not None:
        json_data = json.dumps(data).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
        req.data = json_data
        
    try:
        start_time = time.time()
        response = urllib.request.urlopen(req, timeout=10)
        elapsed = (time.time() - start_time) * 1000
        status = response.status
        
        body = response.read().decode('utf-8')
        try:
            parsed_body = json.loads(body)
        except:
            parsed_body = body

        print(f"    [SUCCESS] {name} | Status: {status} ({elapsed:.1f}ms)")
        
        # Check if the response contains data/array
        if isinstance(parsed_body, dict):
            data_field = parsed_body.get('data') or parsed_body
            if isinstance(data_field, list):
                print(f"      -> Retrieved {len(data_field)} records.")
            elif isinstance(data_field, dict):
                print(f"      -> Retrieved Object Data.")
            else:
                 print(f"      -> Retrieved: {str(data_field):.100s}")
        elif isinstance(parsed_body, list):
             print(f"      -> Retrieved {len(parsed_body)} records.")
             
        return parsed_body
        
    except urllib.error.HTTPError as e:
        status = e.code
        body = e.read().decode('utf-8')
        print(f"    [HTTP ERROR] {name} | Status: {status}")
        print(f"      -> Response: {body:.150s}")
        return None
    except urllib.error.URLError as e:
        print(f"    [CONNECTION FAILED] {name} | Reason: {e.reason}")
        return None
    except Exception as e:
        print(f"    [UNEXPECTED ERROR] {name} | Error: {str(e)}")
        return None

def login_tester(tester):
    print(f"\n--- Testing Role: {tester['role']} ---")
    login_payload = {
        "email": tester["email"],
        "password": tester["password"]
    }
    print(f"  Attempting Login for {tester['email']}...")
    login_response = test_endpoint("Login", "/api/auth/login", method="POST", data=login_payload)
    
    if login_response and isinstance(login_response, dict) and login_response.get("success"):
        token = login_response.get("data", {}).get("token") or login_response.get("token")
        if token:
            print("  Login Successful! Proceeding to test frontend data endpoints...")
            return token
    
    print("  Login Failed or Missing Token. Cannot test protected routes for this role.\n")
    return None

def run_tests():
    print("=" * 60)
    print(f"[*] BASUDEBPUR MANAGEMENT SYSTEM - MULTI-ROLE DATA TEST")
    print(f"[*] Target: {BASE_URL}")
    print("=" * 60 + "\n")
    
    # 1. Health Check
    test_endpoint("System Health Check", "/health")
    print("\n" + "=" * 60)
    
    # 2. Test each role
    for tester in TESTERS:
        token = login_tester(tester)
        if token:
            headers = {"Authorization": f"Bearer {token}"}
            print(f"\n  Checking frontend data tables for {tester['role']}:")
            for ep in ENDPOINTS_TO_TEST:
                test_endpoint(ep["name"], ep["path"], headers=headers)
            print("=" * 60)

    print("\n   FRONTEND DATA TEST COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
