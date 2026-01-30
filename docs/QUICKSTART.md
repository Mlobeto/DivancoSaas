# 🚀 Guía de Inicio Rápido - DivancoSaaS

## 📋 Requisitos Previos

- **Node.js** 18+
- **PostgreSQL** 14+
- **npm** o **yarn**
- **Expo CLI** (para mobile): `npm install -g expo-cli`

---

## 🔧 Instalación

### 1. Clonar el proyecto (si aplica)

```bash
git clone <repository-url>
cd DivancoSaas
```

### 2. Instalar dependencias

#### Backend

```bash
cd backend
npm install
```

#### Web

```bash
cd web
npm install
```

#### Mobile

```bash
cd mobile
npm install
```

#### Shared (opcional)

```bash
cd shared
npm install
npm run build
```

---

## ⚙️ Configuración

### Backend

1. Crear archivo `.env` desde `.env.example`:

```bash
cd backend
cp .env.example .env
```

2. Editar `.env` con tus valores:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/divancosaas?schema=public"
JWT_SECRET="tu-clave-secreta-super-segura"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

3. Crear la base de datos:

```bash
# Usando psql
createdb divancosaas

# O con PostgreSQL GUI (pgAdmin, DBeaver, etc.)
```

4. Ejecutar migraciones de Prisma:

```bash
npm run prisma:migrate
npm run prisma:generate
```

### Web

1. Crear archivo `.env`:

```bash
cd web
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3000
```

### Mobile

1. Crear archivo `.env`:

```bash
cd mobile
cp .env.example .env
```

```env
API_URL=http://localhost:3000
```

---

## ▶️ Ejecutar el Proyecto

### Backend

```bash
cd backend
npm run dev
```

El servidor estará disponible en: `http://localhost:3000`

### Web

```bash
cd web
npm run dev
```

La aplicación web estará disponible en: `http://localhost:5173`

### Mobile

```bash
cd mobile
npm start
```

Escanea el QR con Expo Go (iOS/Android) o presiona `w` para web.

---

## 🧪 Probar el Sistema

### 1. Registrar un nuevo tenant

**Web**: Ir a `http://localhost:5173/register`

**API**:

```bash
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "tenantName": "Mi Empresa",
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "admin@miempresa.com",
  "password": "password123"
}
```

### 2. Login

**Web**: Ir a `http://localhost:5173/login`

**API**:

```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@miempresa.com",
  "password": "password123"
}
```

### 3. Health Check

```bash
GET http://localhost:3000/health
```

---

## 📁 Estructura del Proyecto

```
DivancoSaas/
├── backend/          # API Node.js + PostgreSQL
│   ├── src/
│   │   ├── core/     # Funcionalidad transversal
│   │   ├── modules/  # Módulos de negocio
│   │   ├── adapters/ # Integraciones externas
│   │   └── config/   # Configuración
│   └── prisma/       # Schema de base de datos
├── web/              # App React (Vite)
│   └── src/
│       ├── pages/    # Páginas
│       ├── services/ # API calls
│       └── store/    # Estado (Zustand)
├── mobile/           # App React Native (Expo)
│   └── app/          # Screens (Expo Router)
└── shared/           # Tipos compartidos
    └── src/
```

---

## 🛠️ Comandos Útiles

### Backend

```bash
npm run dev              # Modo desarrollo con hot reload
npm run build            # Compilar TypeScript
npm run start            # Ejecutar producción
npm run prisma:studio    # Abrir Prisma Studio (GUI DB)
npm run prisma:migrate   # Crear migración
npm run lint             # Lint código
```

### Web

```bash
npm run dev              # Desarrollo
npm run build            # Build producción
npm run preview          # Preview build
npm run lint             # Lint código
npm run type-check       # Verificar tipos
```

### Mobile

```bash
npm start                # Iniciar Expo
npm run android          # Ejecutar en Android
npm run ios              # Ejecutar en iOS
npm run web              # Ejecutar en navegador
```

---

## 🐛 Solución de Problemas

### Error de conexión a la base de datos

1. Verificar que PostgreSQL esté corriendo
2. Verificar credenciales en `.env`
3. Verificar que la base de datos existe

```bash
psql -U postgres -l  # Listar bases de datos
```

### Error "Module not found" en backend

```bash
cd backend
npm run prisma:generate  # Regenerar Prisma Client
```

### Error CORS en web

Verificar que `CORS_ORIGIN` en backend `.env` coincida con la URL de web.

### Expo no se conecta al backend (mobile)

En mobile, usar la IP local en lugar de `localhost`:

```env
API_URL=http://192.168.1.X:3000
```

---

## 📚 Próximos Pasos

1. **Leer [ARQUITECTURA.md](./ARQUITECTURA.md)** - Principios fundamentales
2. **Explorar el código del core** - `backend/src/core/`
3. **Crear tu primer módulo** - Ver ejemplo en `backend/src/modules/projects/`
4. **Implementar un adapter** - Ver `backend/src/adapters/README.md`

---

## 🆘 Ayuda

- **Documentación completa**: Ver carpeta `docs/`
- **Arquitectura**: [ARQUITECTURA.md](./ARQUITECTURA.md)
- **Ejemplos de módulos**: `backend/src/modules/`
- **Ejemplos de adapters**: `backend/src/adapters/`

---

**⚠️ IMPORTANTE**: Este proyecto sigue principios arquitectónicos estrictos.
**SIEMPRE consultar [ARQUITECTURA.md](./ARQUITECTURA.md) antes de hacer cambios.**
