import requests
import json
import time

url = "http://localhost:8000/api/v1/gemini/places/optimize"
headers = {"Content-Type": "application/json"}

# 1. Mock Module 1 Output (Place Candidates)
mock_candidates = {
    "region": "강원도 강릉",
    "candidates": [
        {"name": "초당순두부마을", "type": "음식점", "reason": "강릉 대표 향토 음식"},
        {"name": "안목해변 카페거리", "type": "카페", "reason": "동해안 최고의 커피 명소"},
        {"name": "오죽헌", "type": "관광지", "reason": "율곡 이이의 생가와 역사적 명소"},
        {"name": "경포해변", "type": "관광지", "reason": "강릉 대표 해수욕장"},
        {"name": "하슬라아트월드", "type": "관광지", "reason": "바다를 배경으로 한 복합 예술 공간"},
        {"name": "중앙시장", "type": "관광지", "reason": "다양한 먹거리 탐방"},
        {"name": "테라로사 커피공장", "type": "카페", "reason": "국내 유명 스페셜티 커피"},
        {"name": "동화가든", "type": "음식점", "reason": "짬뽕순두부 원조"},
        {"name": "엄지네포장마차", "type": "음식점", "reason": "꼬막비빔밥 명소"},
        {"name": "스카이베이 호텔", "type": "숙소", "reason": "인피니티 풀이 유명한 호텔"}
    ]
}

print(f"Testing Module 3: Logistics (Time & Distance)...")
print("Sending request to optimize endpoint (enriched with logistics)...")

try:
    response = requests.post(url, json=mock_candidates, params={"duration": "1박 2일"})
    response.raise_for_status()
    result = response.json()
    
    print("\n[SUCCESS] Logistics Plan Received:")
    print(f"Title: {result['title']}")
    
    for day in result['days']:
        print(f"\n[Day {day['day']}]")
        for item in day['schedule']:
            # Check for new fields
            coords = f"({item.get('mapy', 'N/A')}, {item.get('mapx', 'N/A')})"
            stay = item.get('stay_duration', 'N/A')
            travel = item.get('travel_time_next', 'End of day')
            distance = item.get('distance_next', '')
            
            print(f"  {item['time']} - {item['place']} [{item['type']}]")
            print(f"    - Coord: {coords}")
            print(f"    - Stay: {stay}")
            if travel != 'End of day':
                print(f"    - Travel to next: {travel} ({distance})")
        
except Exception as e:
    print(f"\n[ERROR] Request failed: {e}")
    if 'response' in locals() and response:
        print(f"Server response: {response.text}")
