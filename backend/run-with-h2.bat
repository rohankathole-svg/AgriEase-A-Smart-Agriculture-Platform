@echo off
echo Starting AgriEase Backend with H2 Database...
cd /d "C:\College+Study\BE\BE Projects\demo\NEWPROJCT\Agriease\backend"
set SPRING_PROFILES_ACTIVE=h2
mvnw.cmd spring-boot:run
pause