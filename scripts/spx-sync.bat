@echo off
setlocal

set "ROOT_DIR=%~dp0.."
cd /d "%ROOT_DIR%"

if not exist ".logs" mkdir ".logs"

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "TSX_CLI=%ROOT_DIR%\node_modules\tsx\dist\cli.mjs"
set "TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%-%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "LOG_FILE=%ROOT_DIR%\.logs\spx-sync-%TIMESTAMP%.log"

if not exist "%NODE_EXE%" (
  echo Node.js not found at "%NODE_EXE%"
  exit /b 1
)

if not exist "%TSX_CLI%" (
  echo tsx CLI not found. Run npm install first.
  exit /b 1
)

echo Running SPX sync...
"%NODE_EXE%" "%TSX_CLI%" --tsconfig "%ROOT_DIR%\tsconfig.json" "%ROOT_DIR%\scripts\spx-sync.ts" >> "%LOG_FILE%" 2>&1
set "EXIT_CODE=%ERRORLEVEL%"

echo Log written to: "%LOG_FILE%"
exit /b %EXIT_CODE%
