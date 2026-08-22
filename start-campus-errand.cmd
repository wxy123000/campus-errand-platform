@echo off
cd /d "%~dp0"
java -jar target\campus-errand-0.0.1-SNAPSHOT.jar > app-start.log 2>&1
