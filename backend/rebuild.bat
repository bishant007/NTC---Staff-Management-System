@echo off
echo === Building Backend JAR ===
cd /d D:\Bishant\NTC\NTC-Staff-System\backend
call "C:\Program Files\JetBrains\IntelliJ IDEA 2025.2.4\plugins\maven\lib\maven3\bin\mvn.cmd" clean package -DskipTests
echo.
echo === JAR built at target\backend-0.0.1-SNAPSHOT.jar ===
pause