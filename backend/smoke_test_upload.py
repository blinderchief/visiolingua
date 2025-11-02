import traceback, sys
print("[smoke] starting")
sys.path.insert(0, r"e:\\VisioLingua")
print("[smoke] sys.path set")
from fastapi.testclient import TestClient
print("[smoke] imported TestClient")
from backend.main import app
print("[smoke] imported app")

client = TestClient(app)
print("[smoke] client created")

headers = {"Authorization": "Bearer demo"}
try:
    f = open(r"e:\\VisioLingua\\smoke.png", "rb")
    print("[smoke] opened image")
except Exception:
    print("[smoke] cannot open image\n" + traceback.format_exc())
    raise
files = {"file": ("smoke.png", f, "image/png")}
data = {"user_id": "test", "lang": "en"}

try:
    resp = client.post("/upload", files=files, data=data, headers=headers)
    print("STATUS:", resp.status_code)
    print("BODY:", resp.text[:2000])

    try:
        q = {"user_id": "test", "query": "what is in the image?", "lang": "en"}
        resp2 = client.post("/query", json=q, headers=headers)
        print("QSTATUS:", resp2.status_code)
        print("QBODY:", resp2.text[:2000])
    except Exception:
        print("QEXC:\n" + traceback.format_exc())
except Exception:
    print("EXC:\n" + traceback.format_exc())
