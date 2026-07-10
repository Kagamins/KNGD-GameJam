@echo off
REM Double-click me (Windows) to play your game.
REM I start a tiny local server and open your browser — then just play.
REM Close this window to stop.
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py play.py
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  python play.py
  goto :eof
)
REM No Python found - fall back to PowerShell, which is built into Windows.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0play.ps1"
