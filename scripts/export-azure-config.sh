#!/bin/bash
# Script para exportar configuración actual antes de migrar

set -e

echo "📦 Exportando configuración de Azure..."

# Crear carpeta para backups
mkdir -p azure-backup-$(date +%Y%m%d)
cd azure-backup-$(date +%Y%m%d)

echo "1️⃣ Exportando configuración del Resource Group..."
az group export \
  --name rg-divanco-dev \
  --output json > resource-group-export.json

echo "2️⃣ Exportando configuración de PostgreSQL..."
az postgres flexible-server show \
  --name pg-divanco-dev \
  --resource-group rg-divanco-dev \
  --output json > postgres-config.json 2>/dev/null || echo "PostgreSQL no encontrado"

echo "3️⃣ Exportando configuración del App Service..."
az webapp show \
  --name divancosaas-backend-h4esckd7cwbxhcdx \
  --resource-group rg-divanco-dev \
  --output json > webapp-config.json 2>/dev/null || echo "App Service no encontrado"

echo "4️⃣ Exportando variables de entorno del App Service..."
az webapp config appsettings list \
  --name divancosaas-backend-h4esckd7cwbxhcdx \
  --resource-group rg-divanco-dev \
  --output json > webapp-settings.json 2>/dev/null || echo "Settings no encontrados"

echo "5️⃣ Listando todos los recursos..."
az resource list \
  --resource-group rg-divanco-dev \
  --output table > recursos.txt

echo "✅ Exportación completada en: $(pwd)"
echo ""
echo "📝 Próximo paso: Backup de base de datos"
