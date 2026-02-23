@echo off
echo Starting AgriEase Backend with Local PostgreSQL...
cd /d "C:\College+Study\BE\BE Projects\demo\NEWPROJCT\Agriease\backend"
set SPRING_PROFILES_ACTIVE=local
mvnw.cmd spring-boot:run
pause