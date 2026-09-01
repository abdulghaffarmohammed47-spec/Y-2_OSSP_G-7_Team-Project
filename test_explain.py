import requests

try:
    res = requests.post("http://localhost:8000/api/explain", json={"query": "ls | grep .c"})
    print("Status:", res.status_code)
    print("Response:", res.json())
except Exception as e:
    print(e)
