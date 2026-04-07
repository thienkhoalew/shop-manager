@echo off
setlocal

set "TASK_NAME=ShopManager SPX Sync"
set "ROOT_DIR=%~dp0.."
set "RUN_FILE=%ROOT_DIR%\scripts\spx-sync.bat"

if not exist "%RUN_FILE%" (
  echo Sync batch file not found: "%RUN_FILE%"
  exit /b 1
)

schtasks /Create ^
  /TN "%TASK_NAME%" ^
  /SC DAILY ^
  /ST 00:00 ^
  /RI 720 ^
  /DU 24:00 ^
  /RU SYSTEM ^
  /RL HIGHEST ^
  /TR "\"%RUN_FILE%\"" ^
  /F

if errorlevel 1 (
  echo Failed to create scheduled task.
  exit /b 1
)

echo Scheduled task created: %TASK_NAME%
echo It will run every 12 hours.
