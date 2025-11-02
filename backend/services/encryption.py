import base64
from cryptography.fernet import Fernet
import os

# Load encryption key from environment variable
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    # Generate a key if not set (for dev only)
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    print(f"[WARNING] ENCRYPTION_KEY not set, generated: {ENCRYPTION_KEY}")
fernet = Fernet(ENCRYPTION_KEY.encode())

def encrypt_data(data: str) -> str:
    if not data:
        return ""
    enc = fernet.encrypt(data.encode())
    return base64.urlsafe_b64encode(enc).decode()

def decrypt_data(enc_data: str) -> str:
    if not enc_data:
        return ""
    try:
        enc = base64.urlsafe_b64decode(enc_data.encode())
        dec = fernet.decrypt(enc)
        return dec.decode()
    except Exception:
        return "[decryption error]"
