@echo off
REM Script de instalación para Windows
REM Ejecutar desde la raíz del proyecto: scripts\install.bat

echo ========================================
echo  DivancoSaaS - Instalacion Automatizada
echo ========================================
echo.

REM Verificar Node.js
echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instalar Node.js 18+ desde https://nodejs.org
    pause
    exit /b 1
)
echo OK: Node.js instalado

REM Verificar npm
echo Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm no esta instalado
    pause
    exit /b 1
)
echo OK: npm instalado
echo.

echo ========================================
echo  Instalando dependencias...
echo ========================================
echo.

REM Backend
echo Instalando backend...
cd backend
if not exist .env (
    copy .env.example .env
    echo IMPORTANTE: Editar backend\.env con tu configuracion
)
call npm install
if errorlevel 1 (
    echo ERROR: Fallo instalacion de backend
    pause
    exit /b 1
)
echo OK: Backend instalado
cd ..

REM Web
echo Instalando web...
cd web
if not exist .env (
    copy .env.example .env
)
call npm install
if errorlevel 1 (
    echo ERROR: Fallo instalacion de web
    pause
    exit /b 1
)
echo OK: Web instalado
cd ..

REM Mobile
echo Instalando mobile...
cd mobile
if not exist .env (
    copy .env.example .env
)
call npm install
if errorlevel 1 (
    echo ERROR: Fallo instalacion de mobile
    pause
    exit /b 1
)
echo OK: Mobile instalado
cd ..

REM Shared
echo Instalando shared...
cd shared
call npm install
call npm run build
if errorlevel 1 (
    echo ERROR: Fallo compilacion de shared
    pause
    exit /b 1
)
echo OK: Shared instalado y compilado
cd ..

echo.
echo ========================================
echo  Instalacion completada!
echo ========================================
echo.
echo Proximos pasos:
echo.
echo 1. Configurar PostgreSQL (crear base de datos):
echo    createdb divancosaas
echo.
echo 2. Editar backend\.env con tus credenciales de PostgreSQL
echo.
echo 3. Ejecutar migraciones de Prisma:
echo    cd backend
echo    npm run prisma:migrate
echo    npm run prisma:generate
echo.
echo 4. Iniciar el backend:
echo    cd backend
echo    npm run dev
echo.
echo 5. En otra terminal, iniciar el web:
echo    cd web
echo    npm run dev
echo.
echo 6. Visitar http://localhost:5173 y registrar un tenant
echo.
echo Ver guia completa: QUICKSTART.md
echo IMPORTANTE: Leer ARQUITECTURA.md antes de hacer cambios
echo.
pause
