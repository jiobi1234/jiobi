import requests
import json

url = "http://localhost:8000/api/v1/gemini/places/select"
headers = {"Content-Type": "application/json"}
data = {
    "region": "강원도 강릉",
    "duration": "1박 2일",
    "themes": ["힐링", "바다", "식도락"],
    "companions": "연인"
}

print(f"Testing Module 1: Place Selection...")
print(f"Request: {json.dumps(data, ensure_ascii=False)}")

try:
    response = requests.post(url, json=data)
    response.raise_for_status()
    result = response.json()
    
    print("\n[SUCCESS] Response received:")
    print(f"Region: {result['region']}")
    print(f"Candidates Found: {len(result['candidates'])}")
    
    for i, place in enumerate(result['candidates'], 1):
        print(f"{i}. [{place['type']}] {place['name']} - {place['reason']}")
        
except Exception as e:
    print(f"\n[ERROR] Request failed: {e}")
    if 'response' in locals() and response:
        print(f"Server response: {response.text}")
