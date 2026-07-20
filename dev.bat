@echo off
start "Backend" cmd /k "cd BackEnd && venv\Scripts\python run.py"
start "Expo" cmd /k "npx expo start -c"