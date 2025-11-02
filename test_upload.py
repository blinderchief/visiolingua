import requests

# Test the upload endpoint
url = "http://localhost:8000/upload"
headers = {"Authorization": "Bearer demo_token"}

# Test with text
data = {"text": "Hello world test"}
response = requests.post(url, headers=headers, data=data)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")