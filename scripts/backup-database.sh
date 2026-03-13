#!/bin/bash
# Script para hacer backup de la base de datos PostgreSQL

set -e

echo "💾 Backup de Base de Datos PostgreSQL..."

# Variables - AJUSTA ESTAS
DB_HOST="pg-divanco-dev.postgres.database.azure.com"
DB_USER="divanco_admin"
DB_NAME="divanco_dev"
DB_PORT="5432"

BACKUP_FILE="divanco_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "Conectando a: $DB_HOST"
echo "Base de datos: $DB_NAME"
echo ""
echo "⚠️  Se te pedirá la contraseña de PostgreSQL"

# Hacer el backup usando pg_dump
PGPASSWORD="$DB_PASSWORD" pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --no-password \
  --format=custom \
  --file="$BACKUP_FILE" \
  --verbose

echo ""
echo "✅ Backup completado: $BACKUP_FILE"
echo "📦 Tamaño: $(du -h $BACKUP_FILE | cut -f1)"
