#!/bin/bash

# Script de instalación automatizada para DivancoSaaS
# Ejecutar desde la raíz del proyecto: ./scripts/install.sh

set -e  # Salir si hay algún error

echo "🚀 DivancoSaaS - Instalación Automatizada"
echo "========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Verificar Node.js
print_info "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Instalar Node.js 18+ primero."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js versión debe ser 18 o superior. Versión actual: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) instalado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi
print_success "npm $(npm -v) instalado"

# Verificar PostgreSQL
print_info "Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL no encontrado en PATH. Asegúrate de tenerlo instalado."
else
    print_success "PostgreSQL encontrado"
fi

echo ""
echo "📦 Instalando dependencias..."
echo ""

# Backend
print_info "Instalando backend..."
cd backend
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_warning "Archivo .env creado desde .env.example"
    print_warning "⚠️  IMPORTANTE: Editar backend/.env con tus configuraciones"
fi
npm install
print_success "Backend instalado"
cd ..

# Web
print_info "Instalando web..."
cd web
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_info "Archivo .env creado para web"
fi
npm install
print_success "Web instalado"
cd ..

# Mobile
print_info "Instalando mobile..."
cd mobile
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_info "Archivo .env creado para mobile"
fi
npm install
print_success "Mobile instalado"
cd ..

# Shared (opcional)
print_info "Instalando shared..."
cd shared
npm install
npm run build
print_success "Shared instalado y compilado"
cd ..

echo ""
echo "========================================="
print_success "Instalación completada!"
echo "========================================="
echo ""

print_warning "Próximos pasos:"
echo ""
echo "1. Configurar PostgreSQL:"
echo "   createdb divancosaas"
echo ""
echo "2. Editar backend/.env con tus credenciales de PostgreSQL"
echo ""
echo "3. Ejecutar migraciones de Prisma:"
echo "   cd backend"
echo "   npm run prisma:migrate"
echo "   npm run prisma:generate"
echo ""
echo "4. Iniciar el backend:"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "5. En otra terminal, iniciar el web:"
echo "   cd web"
echo "   npm run dev"
echo ""
echo "6. Visitar http://localhost:5173 y registrar un tenant"
echo ""
print_info "Ver guía completa: QUICKSTART.md"
print_warning "Leer ARQUITECTURA.md antes de hacer cambios"
echo ""
