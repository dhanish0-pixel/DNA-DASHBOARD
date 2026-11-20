@echo off
echo Starting House of DNA Frontend on local network...
cd /d "%~dp0frontend"
cmd /c npm run dev -- --host 0.0.0.0 --port 5173
