@echo off
REM Launcher used by the scheduled task (runs outside agent process tree).
cd /d "%~dp0..\.."
"scripts\downloads\bin\mongod.exe" --dbpath ".mongo-data" --port 27017 --logpath logs-mongo.txt
