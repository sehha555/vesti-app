@echo off
rem Started hidden at Windows logon by Startup\vesti-tryon.vbs (ASCII only: cmd reads cp950)
rem Restart worker 30s after it exits, e.g. network not ready at boot
cd /d %~dp0..\..
:loop
node services\tryon-worker\worker.mjs >> services\tryon-worker\worker.log 2>&1
ping -n 31 127.0.0.1 >nul
goto loop
