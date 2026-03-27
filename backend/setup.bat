@echo off
setlocal

echo [Resona Backend Setup] Checking Python 3.11...
py -3.11 -V >nul 2>&1
if errorlevel 1 (
  echo Python 3.11 not found. Please download it from https://www.python.org/downloads/release/python-3119/
  echo During install, do NOT check Add to PATH. Then re-run this script.
  exit /b 1
)

echo [Resona Backend Setup] Creating virtual environment...
py -3.11 -m venv venv
if errorlevel 1 (
  echo Failed to create virtual environment.
  exit /b 1
)

echo [Resona Backend Setup] Activating virtual environment...
call venv\Scripts\activate
if errorlevel 1 (
  echo Failed to activate virtual environment.
  exit /b 1
)

echo [Resona Backend Setup] Upgrading pip...
python -m pip install --upgrade pip
if errorlevel 1 (
  echo Failed to upgrade pip.
  exit /b 1
)

echo [Resona Backend Setup] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
  echo Failed to install dependencies from requirements.txt.
  exit /b 1
)

echo [Resona Backend Setup] Done. Backend environment is ready.
exit /b 0
