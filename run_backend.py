#!/usr/bin/env python3
"""
Simple script to run the VisioLingua backend server.
This handles the Python path setup automatically.
"""

import os
import subprocess
import sys
import signal

# Get the paths
project_root = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(project_root, 'backend')
venv_python = os.path.join(project_root, '.venv', 'Scripts', 'python.exe')

print(f"Project root: {project_root}")
print(f"Backend dir: {backend_dir}")
print(f"Python: {venv_python}")
print(f"\nStarting backend server...\n")
print(f"Press Ctrl+C to stop the server\n")

# Run uvicorn from the backend directory as a module
try:
    result = subprocess.run([
        venv_python, '-m', 'uvicorn', 'main:app',
        '--host', '0.0.0.0', '--port', '8000', '--reload'
    ], cwd=backend_dir)
    sys.exit(result.returncode)
except KeyboardInterrupt:
    print("\n\nShutting down server gracefully...")
    sys.exit(0)