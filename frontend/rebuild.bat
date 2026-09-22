@echo off
echo === Building Frontend ===
cd /d D:\Bishant\NTC\NTC-Staff-System\frontend
call npm run build
echo.
echo === Frontend build complete. Files are in the 'build' folder ===
pause