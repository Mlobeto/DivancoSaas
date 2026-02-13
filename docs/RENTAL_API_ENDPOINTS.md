# RENTAL MODULE - REST API ENDPOINTS

**Versión:** 1.0  
**Base URL:** `/api/v1/rental`  
**Fecha:** 2026-02-13

---

## 🔐 AUTENTICACIÓN

Todos los endpoints requieren autenticación JWT:

```
Headers:
  Authorization: Bearer <jwt_token>
  x-tenant-id: <tenant_uuid>
```

---

## 📁 ESTRUCTURA DE ENDPOINTS

```
/api/v1/rental
│
├── /accounts               (ClientAccount management)
│   ├── POST /                    → Crear cuenta de cliente
│   ├── GET /:id                  → Obtener cuenta por ID
│   ├── GET /client/:clientId     → Obtener cuenta por clientId
│   ├── POST /:id/reload          → Recargar saldo
│   ├── GET /:id/balance          → Consultar saldo actual
│   ├── GET /:id/movements        → Historial de movimientos
│   └── GET /:id/statement        → Generar estado de cuenta (PDF)
│
├── /contracts              (RentalContract management)
│   ├── POST /                    → Crear contrato de renta
│   ├── GET /:id                  → Obtener contrato con detalles
│   ├── GET /                     → Listar contratos (con filtros)
│   ├── PATCH /:id/suspend        → Suspender contrato
│   ├── PATCH /:id/reactivate     → Reactivar contrato
│   ├── PATCH /:id/complete       → Completar contrato
│   ├── POST /:id/withdraw        → Retirar asset (MACHINERY o TOOL)
│   ├── POST /:id/return          → Devolver asset
│   └── GET /:id/projection       → Proyectar consumo futuro
│
├── /usage-reports          (AssetUsage - operator reports)
│   ├── POST /validate            → Pre-validar reporte (mobile)
│   ├── POST /                    → Crear reporte de uso diario
│   ├── GET /rental/:rentalId     → Listar reportes de un rental
│   ├── GET /:id                  → Obtener reporte específico
│   └── GET /stats/:rentalId      → Estadísticas de uso con standby
│
├── /rentals                (AssetRental - active rentals)
│   ├── GET /:id                  → Obtener rental con detalles
│   ├── GET /                     → Listar rentals activos
│   └── GET /:id/costs            → Desglose de costos acumulados
│
└── /jobs                   (Cron jobs - manual execution for testing)
    ├── POST /process-tools       → Ejecutar cargo automático herramientas
    ├── POST /notify-missing      → Enviar notificaciones reportes faltantes
    ├── POST /send-statements     → Enviar estados de cuenta programados
    └── POST /check-alerts        → Verificar alertas de saldo bajo
```

---

## 1️⃣ CLIENT ACCOUNTS ENDPOINTS

### **POST /api/v1/rental/accounts**

Crear cuenta de cliente (se auto-crea al crear primer contrato)

**Request:**

```json
{
  "clientId": "uuid",
  "initialBalance": 1000000,
  "alertAmount": 100000,
  "statementFrequency": "monthly",
  "notes": "Cuenta para Constructora XYZ"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "ca-uuid",
    "clientId": "uuid",
    "balance": 1000000,
    "totalConsumed": 0,
    "totalReloaded": 1000000,
    "alertAmount": 100000,
    "alertTriggered": false,
    "statementFrequency": "monthly",
    "createdAt": "2026-02-13T10:00:00Z"
  }
}
```

---

### **GET /api/v1/rental/accounts/:id**

Obtener cuenta con movimientos recientes

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "ca-uuid",
    "client": {
      "id": "client-uuid",
      "name": "CONSTRUCTORA DEL NORTE S.A.",
      "taxId": "RFC1234567"
    },
    "balance": 519250,
    "totalConsumed": 480750,
    "totalReloaded": 1000000,
    "alertAmount": 100000,
    "alertTriggered": false,
    "activeContracts": 2,
    "activeRentals": 5,
    "recentMovements": [
      {
        "id": "mov-uuid",
        "movementType": "DAILY_CHARGE",
        "amount": -8000,
        "description": "Cargo diario - Retroexcavadora (8 hrs) + Operario",
        "contract": {
          "id": "contract-uuid",
          "code": "CON-2026-001"
        },
        "createdAt": "2026-02-13T10:00:00Z"
      }
    ]
  }
}
```

---

### **GET /api/v1/rental/accounts/client/:clientId**

Obtener cuenta por clientId

**Response (200):** Same as GET /:id

---

### **POST /api/v1/rental/accounts/:id/reload**

Recargar saldo a la cuenta

**Request:**

```json
{
  "amount": 500000,
  "description": "Recarga febrero 2026",
  "paymentReference": "TRANS-123456",
  "notes": "Transferencia bancaria"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "movement": {
      "id": "mov-uuid",
      "movementType": "CREDIT_RELOAD",
      "amount": 500000,
      "balanceBefore": 519250,
      "balanceAfter": 1019250,
      "description": "Recarga febrero 2026",
      "createdAt": "2026-02-13T10:00:00Z"
    },
    "account": {
      "id": "ca-uuid",
      "balance": 1019250,
      "totalReloaded": 1500000
    }
  }
}
```

---

### **GET /api/v1/rental/accounts/:id/balance**

Consulta rápida de saldo

**Response (200):**

```json
{
  "success": true,
  "data": {
    "accountId": "ca-uuid",
    "clientName": "CONSTRUCTORA DEL NORTE S.A.",
    "balance": 1019250,
    "totalConsumed": 480750,
    "activeContracts": 2,
    "activeRentals": 5,
    "estimatedDailyCost": 16025,
    "daysUntilEmpty": 63
  }
}
```

---

### **GET /api/v1/rental/accounts/:id/movements**

Historial de movimientos con filtros

**Query params:**

- `startDate` (ISO string)
- `endDate` (ISO string)
- `movementType` (INITIAL_CREDIT | CREDIT_RELOAD | DAILY_CHARGE | ADJUSTMENT | WITHDRAWAL_START | RETURN_END)
- `contractId` (uuid)
- `page` (number, default: 1)
- `limit` (number, default: 50)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "movements": [
      {
        "id": "mov-uuid",
        "movementType": "DAILY_CHARGE",
        "amount": -8000,
        "balanceBefore": 1000000,
        "balanceAfter": 992000,
        "description": "Cargo diario - Retroexcavadora (8 hrs) + Operario",
        "machineryCost": 5000,
        "operatorCost": 3000,
        "toolCost": 0,
        "contract": {
          "id": "contract-uuid",
          "code": "CON-2026-001"
        },
        "assetRental": {
          "id": "rental-uuid",
          "asset": {
            "code": "MQ-001",
            "name": "Retroexcavadora CAT 420F"
          }
        },
        "createdAt": "2026-02-13T08:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "pages": 3
    },
    "summary": {
      "totalDebits": -480750,
      "totalCredits": 1500000,
      "netChange": 1019250
    }
  }
}
```

---

### **GET /api/v1/rental/accounts/:id/statement**

Generar estado de cuenta (PDF)

**Query params:**

- `startDate` (ISO string, required)
- `endDate` (ISO string, required)
- `format` (pdf | json, default: pdf)

**Response (200) - JSON:**

```json
{
  "success": true,
  "data": {
    "client": {
      "name": "CONSTRUCTORA DEL NORTE S.A.",
      "taxId": "RFC1234567"
    },
    "period": {
      "start": "2026-02-01",
      "end": "2026-02-28"
    },
    "balanceInitial": 1000000,
    "totalReloads": 500000,
    "totalCharges": -480750,
    "balanceFinal": 1019250,
    "movements": [
      /* array */
    ],
    "contractsBreakdown": [
      {
        "contractCode": "CON-2026-001",
        "totalConsumed": 408000
      },
      {
        "contractCode": "CON-2026-002",
        "totalConsumed": 72750
      }
    ]
  }
}
```

**Response (200) - PDF:**

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="statement_CON-2026-001_feb2026.pdf"

[PDF Binary Data]
```

---

## 2️⃣ RENTAL CONTRACTS ENDPOINTS

### **POST /api/v1/rental/contracts**

Crear contrato de renta

**Request:**

```json
{
  "quotationId": "quotation-uuid",
  "clientId": "client-uuid",
  "businessUnitId": "bu-uuid",
  "startDate": "2026-02-15",
  "estimatedEndDate": "2026-04-15",
  "initialCredit": 1000000,
  "alertAmount": 100000,
  "statementFrequency": "monthly",
  "notes": "Contrato para obra Carretera Panamericana",
  "assets": [
    {
      "assetId": "asset-uuid-1",
      "expectedReturnDate": "2026-04-15"
    }
  ]
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "contract": {
      "id": "contract-uuid",
      "code": "CON-2026-001",
      "clientId": "client-uuid",
      "clientAccountId": "ca-uuid",
      "status": "active",
      "startDate": "2026-02-15",
      "estimatedEndDate": "2026-04-15",
      "totalConsumed": 0,
      "createdAt": "2026-02-13T10:00:00Z"
    },
    "clientAccount": {
      "id": "ca-uuid",
      "balance": 1000000,
      "alertAmount": 100000
    }
  }
}
```

---

### **GET /api/v1/rental/contracts/:id**

Obtener contrato con detalles completos

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "contract-uuid",
    "code": "CON-2026-001",
    "status": "active",
    "client": {
      "id": "client-uuid",
      "name": "CONSTRUCTORA DEL NORTE S.A."
    },
    "clientAccount": {
      "id": "ca-uuid",
      "balance": 519250
    },
    "startDate": "2026-02-15",
    "estimatedEndDate": "2026-04-15",
    "totalConsumed": 408000,
    "activeRentals": [
      {
        "id": "rental-uuid",
        "asset": {
          "code": "MQ-001",
          "name": "Retroexcavadora CAT 420F"
        },
        "trackingType": "MACHINERY",
        "withdrawalDate": "2026-02-15T08:00:00Z",
        "totalCost": 96000,
        "totalHoursUsed": 96,
        "lastChargeDate": "2026-02-16T10:00:00Z"
      }
    ],
    "recentMovements": [
      /* últimos 10 movimientos */
    ]
  }
}
```

---

### **GET /api/v1/rental/contracts**

Listar contratos con filtros

**Query params:**

- `status` (active | suspended | completed | cancelled)
- `clientId` (uuid)
- `businessUnitId` (uuid)
- `startDate` (ISO string)
- `endDate` (ISO string)
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "contracts": [
      {
        "id": "contract-uuid",
        "code": "CON-2026-001",
        "status": "active",
        "client": {
          "name": "CONSTRUCTORA DEL NORTE S.A."
        },
        "clientAccount": {
          "balance": 519250
        },
        "startDate": "2026-02-15",
        "totalConsumed": 408000,
        "activeRentals": 3
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

---

### **PATCH /api/v1/rental/contracts/:id/suspend**

Suspender contrato (detiene cargos automáticos)

**Request:**

```json
{
  "reason": "Cliente solicitó pausa temporal",
  "notes": "Obra detenida por lluvias"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "contract-uuid",
    "status": "suspended",
    "updatedAt": "2026-02-13T10:00:00Z"
  }
}
```

---

### **PATCH /api/v1/rental/contracts/:id/reactivate**

Reactivar contrato suspendido

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "contract-uuid",
    "status": "active",
    "updatedAt": "2026-02-13T10:00:00Z"
  }
}
```

---

### **PATCH /api/v1/rental/contracts/:id/complete**

Completar contrato (debe NO tener assets activos)

**Request:**

```json
{
  "actualEndDate": "2026-03-20",
  "notes": "Obra finalizada satisfactoriamente"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "contract-uuid",
    "status": "completed",
    "actualEndDate": "2026-03-20T10:00:00Z",
    "summary": {
      "totalDays": 33,
      "totalConsumed": 529825,
      "finalBalance": 470175
    }
  }
}
```

**Error (400) - Assets aún activos:**

```json
{
  "success": false,
  "error": {
    "code": "ACTIVE_RENTALS_EXIST",
    "message": "Cannot complete contract with active rentals. Please return all assets first.",
    "details": {
      "activeRentalsCount": 2,
      "activeRentals": [
        {
          "id": "rental-uuid-1",
          "assetCode": "MQ-001",
          "assetName": "Retroexcavadora CAT 420F"
        }
      ]
    }
  }
}
```

---

### **POST /api/v1/rental/contracts/:id/withdraw**

Retirar asset (MACHINERY o TOOL)

**Request - MACHINERY:**

```json
{
  "assetId": "asset-uuid",
  "expectedReturnDate": "2026-03-15",
  "initialHourometer": 1250.5,
  "initialOdometer": 45230,
  "evidenceUrls": ["https://storage/photo1.jpg", "https://storage/photo2.jpg"],
  "notes": "Retiro para obra Los Álamos"
}
```

**Request - TOOL:**

```json
{
  "assetId": "asset-uuid",
  "expectedReturnDate": "2026-03-10",
  "evidenceUrls": ["https://storage/photo1.jpg"]
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "rental": {
      "id": "rental-uuid",
      "assetId": "asset-uuid",
      "trackingType": "MACHINERY",
      "withdrawalDate": "2026-02-15T08:00:00Z",
      "expectedReturnDate": "2026-03-15",
      "hourlyRate": 625,
      "operatorCostType": "PER_DAY",
      "operatorCostRate": 3000,
      "initialHourometer": 1250.5,
      "currentHourometer": 1250.5
    },
    "movement": {
      "id": "mov-uuid",
      "movementType": "WITHDRAWAL_START",
      "amount": 0,
      "description": "Retiro Retroexcavadora - Inicio tracking"
    }
  }
}
```

---

### **POST /api/v1/rental/contracts/:id/return**

Devolver asset

**Request:**

```json
{
  "rentalId": "rental-uuid",
  "returnCondition": "good",
  "finalHourometer": 1346.5,
  "finalOdometer": 45980,
  "evidenceUrls": ["https://storage/return_photo1.jpg"],
  "notes": "Devolución en buen estado"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "rental": {
      "id": "rental-uuid",
      "actualReturnDate": "2026-03-15T18:00:00Z",
      "totalHoursUsed": 96,
      "totalDays": 28,
      "totalMachineryCost": 60000,
      "totalOperatorCost": 84000,
      "totalCost": 144000
    },
    "movement": {
      "id": "mov-uuid",
      "movementType": "RETURN_END",
      "amount": 0,
      "description": "Devolución Retroexcavadora - Total: $144,000 (28 días)"
    },
    "summary": {
      "daysRented": 28,
      "totalCharged": 144000,
      "breakdown": {
        "machinery": 60000,
        "operator": 84000
      }
    }
  }
}
```

---

### **GET /api/v1/rental/contracts/:id/projection**

Proyectar consumo futuro

**Query params:**

- `days` (number, default: 30)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "contractId": "contract-uuid",
    "currentBalance": 519250,
    "estimatedDailyCost": 16025,
    "projectionDays": 30,
    "projectedConsumption": 480750,
    "projectedBalance": 38500,
    "daysUntilEmpty": 32,
    "needsReload": false,
    "recommendedReload": 0,
    "activeAssets": 5,
    "breakdown": [
      {
        "assetCode": "MQ-001",
        "assetName": "Retroexcavadora CAT 420F",
        "estimatedDailyCost": 8000,
        "projectedCost": 240000
      }
    ]
  }
}
```

---

## 3️⃣ USAGE REPORTS ENDPOINTS (Mobile App)

### **POST /api/v1/rental/usage-reports/validate**

Pre-validar reporte antes de enviarlo (offline mobile)

**Request:**

```json
{
  "rentalId": "rental-uuid",
  "hourometerEnd": 1258.5,
  "odometerEnd": 45280
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "validation": {
      "isValid": true,
      "warnings": [],
      "rentalInfo": {
        "assetName": "Retroexcavadora CAT 420F",
        "currentHourometer": 1250.5,
        "minDailyHours": 3.0
      },
      "estimatedCost": {
        "hoursWorked": 8.0,
        "hoursBilled": 8.0,
        "machineryCost": 5000,
        "operatorCost": 3000,
        "totalCost": 8000
      }
    }
  }
}
```

**Response (200) - Con warnings:**

```json
{
  "success": true,
  "data": {
    "validation": {
      "isValid": true,
      "warnings": [
        {
          "type": "STANDBY_APPLIED",
          "message": "Reportaste 2 hrs, se facturarán 3 hrs (standby mínimo)"
        }
      ],
      "estimatedCost": {
        "hoursWorked": 2.0,
        "hoursBilled": 3.0,
        "machineryCost": 1875,
        "operatorCost": 3000,
        "totalCost": 4875
      }
    }
  }
}
```

---

### **POST /api/v1/rental/usage-reports**

Crear reporte de uso diario (procesa y cobra)

**Request:**

```json
{
  "rentalId": "rental-uuid",
  "date": "2026-02-16",
  "hourometerStart": 1250.5,
  "hourometerEnd": 1258.5,
  "odometerStart": 45230,
  "odometerEnd": 45280,
  "evidenceUrls": [
    "https://storage/horometer_start.jpg",
    "https://storage/horometer_end.jpg"
  ],
  "notes": "8 horas trabajadas - Excavación fundaciones"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "usageReport": {
      "id": "report-uuid",
      "rentalId": "rental-uuid",
      "date": "2026-02-16",
      "hourometerStart": 1250.5,
      "hourometerEnd": 1258.5,
      "hoursWorked": 8.0,
      "hoursBilled": 8.0,
      "machineryCost": 5000,
      "operatorCost": 3000,
      "totalCost": 8000,
      "status": "processed",
      "createdAt": "2026-02-16T18:00:00Z"
    },
    "rental": {
      "currentHourometer": 1258.5,
      "totalHoursUsed": 8.0,
      "totalCost": 8000
    },
    "movement": {
      "id": "mov-uuid",
      "movementType": "DAILY_CHARGE",
      "amount": -8000,
      "balanceAfter": 992000
    }
  }
}
```

---

### **GET /api/v1/rental/usage-reports/rental/:rentalId**

Listar reportes de un rental

**Query params:**

- `startDate` (ISO string)
- `endDate` (ISO string)
- `status` (pending | processed | rejected)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report-uuid",
        "date": "2026-02-16",
        "hoursWorked": 8.0,
        "hoursBilled": 8.0,
        "totalCost": 8000,
        "status": "processed",
        "reportedBy": {
          "id": "user-uuid",
          "name": "Juan Pérez"
        }
      }
    ],
    "summary": {
      "totalReports": 28,
      "totalHoursWorked": 224,
      "totalCost": 224000
    }
  }
}
```

---

### **GET /api/v1/rental/usage-reports/:id**

Obtener reporte específico con evidencias

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "report-uuid",
    "rental": {
      "id": "rental-uuid",
      "asset": {
        "code": "MQ-001",
        "name": "Retroexcavadora CAT 420F"
      }
    },
    "date": "2026-02-16",
    "hourometerStart": 1250.5,
    "hourometerEnd": 1258.5,
    "hoursWorked": 8.0,
    "hoursBilled": 8.0,
    "machineryCost": 5000,
    "operatorCost": 3000,
    "totalCost": 8000,
    "evidenceUrls": [
      "https://storage/horometer_start.jpg",
      "https://storage/horometer_end.jpg"
    ],
    "status": "processed",
    "reportedBy": {
      "id": "user-uuid",
      "name": "Juan Pérez"
    },
    "createdAt": "2026-02-16T18:00:00Z",
    "processedAt": "2026-02-16T18:01:00Z"
  }
}
```

---

### **GET /api/v1/rental/usage-reports/stats/:rentalId**

Estadísticas de uso con standby

**Response (200):**

```json
{
  "success": true,
  "data": {
    "rentalId": "rental-uuid",
    "asset": {
      "code": "MQ-001",
      "name": "Retroexcavadora CAT 420F",
      "minDailyHours": 3.0
    },
    "period": {
      "start": "2026-02-15",
      "end": "2026-03-15"
    },
    "stats": {
      "totalReports": 28,
      "totalHoursWorked": 224,
      "totalHoursBilled": 235,
      "standbyApplications": 4,
      "averageHoursPerDay": 8.0,
      "totalMachineryCost": 147125,
      "totalOperatorCost": 84000,
      "totalCost": 231125
    }
  }
}
```

---

## 4️⃣ ACTIVE RENTALS ENDPOINTS

### **GET /api/v1/rental/rentals/:id**

Obtener rental con detalles y reportes

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "rental-uuid",
    "contract": {
      "id": "contract-uuid",
      "code": "CON-2026-001"
    },
    "asset": {
      "id": "asset-uuid",
      "code": "MQ-001",
      "name": "Retroexcavadora CAT 420F"
    },
    "trackingType": "MACHINERY",
    "withdrawalDate": "2026-02-15T08:00:00Z",
    "expectedReturnDate": "2026-03-15",
    "actualReturnDate": null,
    "hourlyRate": 625,
    "operatorCostType": "PER_DAY",
    "operatorCostRate": 3000,
    "initialHourometer": 1250.5,
    "currentHourometer": 1346.5,
    "totalHoursUsed": 96,
    "totalMachineryCost": 60000,
    "totalOperatorCost": 84000,
    "totalCost": 144000,
    "lastChargeDate": "2026-03-14T10:00:00Z",
    "usageReports": [
      /* array of reports */
    ]
  }
}
```

---

### **GET /api/v1/rental/rentals**

Listar rentals activos

**Query params:**

- `contractId` (uuid)
- `trackingType` (MACHINERY | TOOL)
- `status` (active | returned)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "rentals": [
      {
        "id": "rental-uuid",
        "asset": {
          "code": "MQ-001",
          "name": "Retroexcavadora CAT 420F"
        },
        "trackingType": "MACHINERY",
        "withdrawalDate": "2026-02-15T08:00:00Z",
        "daysActive": 28,
        "totalCost": 144000
      }
    ]
  }
}
```

---

### **GET /api/v1/rental/rentals/:id/costs**

Desglose detallado de costos

**Response (200):**

```json
{
  "success": true,
  "data": {
    "rentalId": "rental-uuid",
    "asset": {
      "code": "MQ-001",
      "name": "Retroexcavadora CAT 420F"
    },
    "period": {
      "start": "2026-02-15T08:00:00Z",
      "daysActive": 28
    },
    "costs": {
      "machinery": {
        "hourlyRate": 625,
        "totalHoursWorked": 224,
        "totalHoursBilled": 235,
        "standbyHours": 11,
        "totalCost": 147125
      },
      "operator": {
        "costType": "PER_DAY",
        "dailyRate": 3000,
        "days": 28,
        "totalCost": 84000
      },
      "totalCost": 231125
    }
  }
}
```

---

## 5️⃣ CRON JOBS ENDPOINTS (Testing/Manual)

### **POST /api/v1/rental/jobs/process-tools**

Ejecutar cargo automático de herramientas (manual)

**Headers:**

```
x-admin-key: <admin_secret>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "processed": 25,
    "failed": 1,
    "insufficientBalance": 2,
    "totalCharged": 5400,
    "executionTime": "2.3s"
  }
}
```

---

### **POST /api/v1/rental/jobs/notify-missing**

Enviar notificaciones de reportes faltantes

**Response (200):**

```json
{
  "success": true,
  "data": {
    "total": 3,
    "notifications": [
      {
        "rentalId": "rental-uuid",
        "assetName": "Retroexcavadora CAT 420F",
        "operatorId": "user-uuid",
        "daysWithoutReport": 1
      }
    ]
  }
}
```

---

### **POST /api/v1/rental/jobs/send-statements**

Enviar estados de cuenta programados

**Response (200):**

```json
{
  "success": true,
  "data": {
    "sent": 15,
    "failed": 0
  }
}
```

---

### **POST /api/v1/rental/jobs/check-alerts**

Verificar alertas de saldo bajo

**Response (200):**

```json
{
  "success": true,
  "data": {
    "alertsSent": 3
  }
}
```

---

## 📊 ERROR RESPONSES

### **400 Bad Request**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "hourometerEnd",
      "message": "Must be greater than hourometerStart"
    }
  }
}
```

### **401 Unauthorized**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token"
  }
}
```

### **403 Forbidden**

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You don't have permission to access this resource"
  }
}
```

### **404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Contract with id 'contract-uuid' not found"
  }
}
```

### **409 Conflict**

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance to process charge",
    "details": {
      "required": 8000,
      "available": 5000,
      "shortfall": 3000
    }
  }
}
```

### **500 Internal Server Error**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later.",
    "requestId": "req-uuid"
  }
}
```

---

## 🔍 COMMON QUERY PATTERNS

### **Dashboard Inicial (Admin):**

```
GET /api/v1/rental/contracts?status=active&limit=10
GET /api/v1/rental/rentals?status=active&limit=20
```

### **Vista Cliente:**

```
GET /api/v1/rental/accounts/client/{clientId}
GET /api/v1/rental/accounts/{accountId}/movements?page=1
GET /api/v1/rental/contracts?clientId={clientId}&status=active
```

### **Mobile App (Operario):**

```
POST /api/v1/rental/usage-reports/validate
POST /api/v1/rental/usage-reports
GET /api/v1/rental/usage-reports/rental/{rentalId}
```

### **Estado de Cuenta:**

```
GET /api/v1/rental/accounts/{id}/statement?startDate=2026-02-01&endDate=2026-02-28&format=pdf
```

---

## 🚀 PRÓXIMOS PASOS

1. **Implementar Controllers:**
   - `account.controller.ts`
   - `contract.controller.ts`
   - `usage-report.controller.ts`
   - `rental.controller.ts`
   - `jobs.controller.ts`

2. **Actualizar rental.module.ts:**
   - Registrar nuevos services
   - Configurar routing

3. **Agregar Swagger Docs:**
   - Decoradores @ApiOperation
   - Schemas de request/response

4. **Testing:**
   - Unit tests para services
   - Integration tests para endpoints
