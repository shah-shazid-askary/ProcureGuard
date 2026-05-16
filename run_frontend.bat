@echo off
setlocal enabledelayedexpansion
set "FRONTEND_DIR=c:\Users\darks\Data & Intelligence\ProcureGuard\frontend"
cd /D "!FRONTEND_DIR!"
node node_modules/vite/bin/vite.js --host
pause
