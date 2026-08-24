@echo off
REM WanderSync backend bootstrap: create venv (if missing) and install dependencies.
cd /d "%~dp0..\backend"
if not exist .venv (
  C:\Users\COMPLU~1\AppData\Local\Programs\Python\Python312\python.exe -m venv .venv
)
".venv\Scripts\python.exe" -m pip install --upgrade pip
".venv\Scripts\pip.exe" install -r requirements.txt
echo BACKEND_SETUP_DONE exitcode=%ERRORLEVEL%
