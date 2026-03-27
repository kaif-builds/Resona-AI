@echo off
setlocal

if not exist "venv\Scripts\python.exe" (
  echo Virtual environment not found.
  echo Run setup.bat first to create and install backend dependencies.
  exit /b 1
)

call venv\Scripts\activate
if errorlevel 1 (
  echo Failed to activate virtual environment.
  exit /b 1
)

python -m uvicorn main:app --reload --port 8000
exit /b %errorlevel%
