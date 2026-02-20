# 📧 Guía Completa: Azure Communication Services Email

## 🎯 Objetivo

Configurar Azure Communication Services Email para enviar cotizaciones por email con PDFs adjuntos.

---

## 📋 Paso 1: Crear Communication Service en Azure Portal

### 1.1 Acceder al Portal de Azure

1. Ve a [https://portal.azure.com](https://portal.azure.com)
2. Busca **"Communication Services"** en la barra de búsqueda
3. Click en **"Create"** / **"Crear"**

### 1.2 Configuración Básica

**Suscripción y Grupo de Recursos:**

```
Subscription: Tu suscripción de Azure
Resource Group: rg-divanco-dev (o crear uno nuevo)
```

**Detalles del Recurso:**

```
Name: comm-divanco-email
Data Location: United States (o tu región preferida)
```

**Tags (Opcional):**

```
Environment: Development
Project: DivancoSaas
```

4. Click **"Review + Create"** → **"Create"**
5. Espera 1-2 minutos para que se complete el deployment

---

## 📋 Paso 2: Configurar Email Communication Service

### 2.1 Agregar Dominio de Email

1. En el recurso recién creado, ve a **"Email"** → **"Domains"**
2. Click **"+ Add domain"**

**Opción A: Usar dominio de Azure (gratuito, ideal para testing)**

```
Domain type: Azure Managed Domain
Mail From: DoNotReply@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net
Display Name: DivancoSaas
```

✅ **Recomendado para desarrollo** - Listo para usar inmediatamente

**Opción B: Usar dominio propio (producción)**

```
Domain type: Custom Domain
Domain name: divancosaas.com
Display Name: DivancoSaas
```

⚠️ Requiere configurar registros DNS (MX, SPF, DKIM)

3. Click **"Add"**
4. Espera a que el status sea **"Verified"** (Azure Managed es instantáneo)

### 2.2 Obtener Connection String

1. Ve a **"Settings"** → **"Keys"**
2. Copia el **"Primary connection string"**
3. Guárdalo de forma segura - lo necesitarás para el `.env`

**Ejemplo de Connection String:**

```
endpoint=https://comm-divanco-email.unitedstates.communication.azure.com/;accesskey=XXXXXXXXX
```

---

## 📋 Paso 3: Obteber el Sender Address (FROM)

### 3.1 Configurar "From Address"

1. Ve a **"Email"** → **"Provision Domains"**
2. Click en tu dominio (el que agregaste en Paso 2.1)
3. Ve a **"MailFrom addresses"**
4. Anota la dirección completa, por ejemplo:

**Azure Managed Domain:**

```
DoNotReply@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net
```

**Custom Domain:**

```
noreply@divancosaas.com
```

---

## 📋 Paso 4: Configurar el Backend (.env)

### 4.1 Actualizar el archivo `.env`

Abre `backend/.env` y actualiza:

```bash
# Azure Communication Services (Email)
AZURE_COMMUNICATION_CONNECTION_STRING="endpoint=https://comm-divanco-email.unitedstates.communication.azure.com/;accesskey=TU_ACCESS_KEY_AQUI"

# Dirección FROM para emails
AZURE_EMAIL_FROM="DoNotReply@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net"
AZURE_EMAIL_FROM_NAME="DivancoSaas"
```

### 4.2 Agregar la variable FROM al .env

Agrega esta nueva variable después de `AZURE_COMMUNICATION_CONNECTION_STRING`:

```bash
AZURE_EMAIL_FROM="TU_MAIL_FROM_ADDRESS_AQUI"
AZURE_EMAIL_FROM_NAME="DivancoSaas"
```

---

## 📋 Paso 5: Configurar BusinessUnit Integration (Base de Datos)

### 5.1 Crear Integración de Email para tu BusinessUnit

Ejecuta este script SQL en tu base de datos o usa Prisma Studio:

```sql
-- Reemplaza 'YOUR_BUSINESS_UNIT_ID' con tu ID real
-- Reemplaza 'YOUR_TENANT_ID' con tu tenant ID
-- Reemplaza 'DoNotReply@...' con tu dirección from

INSERT INTO business_unit_integrations (
  id,
  tenant_id,
  business_unit_id,
  type,
  provider,
  credentials,
  config,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'YOUR_TENANT_ID',
  'YOUR_BUSINESS_UNIT_ID',
  'email',
  'azure-communication-services',
  '{"connectionString": "endpoint=https://comm-divanco-email.unitedstates.communication.azure.com/;accesskey=TU_ACCESS_KEY"}'::jsonb,
  '{"defaultFrom": "DoNotReply@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net", "defaultFromName": "DivancoSaas"}'::jsonb,
  true,
  NOW(),
  NOW()
);
```

---

## 📋 Paso 6: Crear Servicio para Enviar Cotizaciones

### 6.1 Crear `quotation-email.service.ts`

Vamos a crear un servicio dedicado para enviar cotizaciones por email:

```typescript
// backend/src/modules/rental/services/quotation-email.service.ts

import { emailService } from "@core/services/email.service";
import { quotationService } from "./quotation.service";
import prisma from "@config/database";

export class QuotationEmailService {
  /**
   * Enviar cotización por email al cliente
   */
  async sendQuotationEmail(
    quotationId: string,
    options?: {
      customMessage?: string;
      cc?: string[];
    },
  ): Promise<void> {
    // 1. Obtener cotización completa
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        client: true,
        businessUnit: true,
        items: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!quotation) {
      throw new Error("Quotation not found");
    }

    if (!quotation.pdfUrl) {
      throw new Error("PDF must be generated before sending email");
    }

    // 2. Descargar PDF desde Azure Blob Storage
    const pdfResponse = await fetch(quotation.pdfUrl);
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    // 3. Preparar email
    const subject = `Cotización ${quotation.code} - ${quotation.businessUnit.name}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
            .button { 
              background: #0066cc; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px;
              display: inline-block;
              margin: 20px 0;
            }
            .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
            .item-list { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Nueva Cotización</h1>
              <h2>${quotation.code}</h2>
            </div>
            
            <div class="content">
              <p>Estimado/a <strong>${quotation.client.name}</strong>,</p>
              
              <p>Es un placer enviarle nuestra cotización para los servicios solicitados.</p>
              
              ${
                options?.customMessage
                  ? `
                <div class="highlight">
                  <strong>Mensaje personalizado:</strong><br>
                  ${options.customMessage}
                </div>
              `
                  : ""
              }
              
              <div class="item-list">
                <h3>📊 Resumen de la Cotización</h3>
                <ul>
                  <li><strong>Código:</strong> ${quotation.code}</li>
                  <li><strong>Tipo:</strong> ${quotation.quotationType === "time_based" ? "Alquiler por Tiempo" : "Servicio/Proyecto"}</li>
                  <li><strong>Fecha:</strong> ${new Date(quotation.quotationDate).toLocaleDateString()}</li>
                  <li><strong>Válida hasta:</strong> ${new Date(quotation.validUntil).toLocaleDateString()}</li>
                  <li><strong>Total:</strong> ${quotation.currency} ${quotation.totalAmount.toLocaleString()}</li>
                </ul>
                
                ${
                  quotation.quotationType === "time_based" &&
                  quotation.estimatedDays
                    ? `
                  <p style="margin-top: 15px;">
                    <strong>📅 Período Estimado:</strong> ${quotation.estimatedDays} días
                    <br>
                    <small>Del ${new Date(quotation.estimatedStartDate!).toLocaleDateString()} al ${new Date(quotation.estimatedEndDate!).toLocaleDateString()}</small>
                  </p>
                `
                    : ""
                }
                
                ${
                  quotation.quotationType === "service_based" &&
                  quotation.serviceDescription
                    ? `
                  <p style="margin-top: 15px;">
                    <strong>🔧 Descripción del Servicio:</strong><br>
                    ${quotation.serviceDescription}
                  </p>
                `
                    : ""
                }
              </div>
              
              <p>📎 <strong>Adjunto encontrará el PDF con los detalles completos de la cotización.</strong></p>
              
              <p>Si tiene alguna pregunta o requiere modificaciones, no dude en contactarnos.</p>
              
              <p>Quedamos atentos a su respuesta.</p>
              
              <p style="margin-top: 30px;">
                Atentamente,<br>
                <strong>${quotation.businessUnit.name}</strong>
              </p>
            </div>
            
            <div class="footer">
              <p>Este es un email automático generado por DivancoSaas</p>
              <p>© ${new Date().getFullYear()} ${quotation.businessUnit.name} - Todos los derechos reservados</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // 4. Enviar email con PDF adjunto
    const provider = await (emailService as any).getEmailProvider(
      quotation.businessUnitId,
    );

    const result = await provider.sendEmail({
      to: quotation.client.email,
      cc: options?.cc,
      subject: subject,
      html: html,
      text: `Cotización ${quotation.code} adjunta. Total: ${quotation.currency} ${quotation.totalAmount}`,
      attachments: [
        {
          filename: `${quotation.code}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    if (!result.success) {
      throw new Error(`Failed to send email: ${result.error}`);
    }

    // 5. Actualizar status de la cotización
    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        status: "sent",
        updatedAt: new Date(),
      },
    });

    console.log(
      `✅ Quotation ${quotation.code} sent to ${quotation.client.email}`,
    );
  }
}

export const quotationEmailService = new QuotationEmailService();
```

---

## 📋 Paso 7: Agregar Endpoint para Enviar Email

### 7.1 Actualizar `quotation.controller.ts`

Agrega este método al controlador:

```typescript
/**
 * Enviar cotización por email
 * POST /api/v1/rental/quotations/:id/send-email
 */
async sendEmail(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const quotationId = Array.isArray(id) ? id[0] : id;
    const { customMessage, cc } = req.body;

    await quotationEmailService.sendQuotationEmail(quotationId, {
      customMessage,
      cc,
    });

    res.json({
      success: true,
      message: "Quotation sent successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}
```

### 7.2 Agregar ruta en `rental.routes.ts`

```typescript
// Enviar cotización por email
router.post(
  "/quotations/:id/send-email",
  authorize("quotations:read"),
  quotationController.sendEmail.bind(quotationController),
);
```

---

## 📋 Paso 8: Implementar Frontend (Botón Enviar Email)

### 8.1 Crear componente `QuotationDetailPage.tsx`

```typescript
// web/src/modules/rental/pages/QuotationDetailPage.tsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import { quotationService } from "../services/quotation.service";
import { FileText, Download, Mail, FileSignature, Check } from "lucide-react";
import toast from "react-hot-toast";

export function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  const { data: quotation, isLoading } = useQuery({
    queryKey: ["quotation", id],
    queryFn: () => quotationService.getById(id!),
    enabled: !!id,
  });

  const generatePDFMutation = useMutation({
    mutationFn: () => quotationService.generatePDF(id!),
    onSuccess: () => {
      toast.success("PDF generado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al generar PDF");
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: ({ customMessage }: { customMessage?: string }) =>
      quotationService.sendEmail(id!, { customMessage }),
    onSuccess: () => {
      toast.success("Cotización enviada por email");
      setShowEmailModal(false);
      setCustomMessage("");
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al enviar email");
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">Cargando cotización...</div>
      </Layout>
    );
  }

  if (!quotation) {
    return (
      <Layout>
        <div className="p-8">Cotización no encontrada</div>
      </Layout>
    );
  }

  const hasPDF = !!quotation.pdfUrl;

  return (
    <Layout
      title={`Cotización ${quotation.code}`}
      subtitle={`Cliente: ${quotation.client?.name || "N/A"}`}
      actions={
        <>
          <button onClick={() => navigate("/quotations")} className="btn-ghost">
            ← Volver
          </button>
        </>
      }
    >
      {/* Action Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Generar PDF */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Paso 1: Generar PDF</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Crea el PDF profesional con los detalles completos
          </p>
          {hasPDF ? (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">PDF Generado</span>
              <a
                href={quotation.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost btn-sm ml-auto"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <button
              onClick={() => generatePDFMutation.mutate()}
              disabled={generatePDFMutation.isPending}
              className="btn-primary w-full"
            >
              {generatePDFMutation.isPending ? "Generando..." : "Generar PDF"}
            </button>
          )}
        </div>

        {/* Enviar Email */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold">Paso 2: Enviar Email</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Envía la cotización al cliente con el PDF adjunto
          </p>
          <button
            onClick={() => setShowEmailModal(true)}
            disabled={!hasPDF || quotation.status === "sent"}
            className="btn-secondary w-full"
          >
            {quotation.status === "sent" ? "Ya Enviado" : "Enviar Email"}
          </button>
        </div>

        {/* Solicitar Firma */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <FileSignature className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold">Paso 3: Firma Digital</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Solicita firma digital con SignNow
          </p>
          <button disabled className="btn-ghost w-full">
            Próximamente
          </button>
        </div>
      </div>

      {/* Quotation Details */}
      <div className="card">
        <pre className="text-sm overflow-auto">
          {JSON.stringify(quotation, null, 2)}
        </pre>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-900 border border-dark-700 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Enviar Cotización por Email</h2>
            <p className="text-sm text-gray-400 mb-4">
              Se enviará a: <strong>{quotation.client?.email}</strong>
            </p>

            <label className="block mb-2 text-sm font-medium">
              Mensaje personalizado (opcional):
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="form-input w-full h-32 mb-4"
              placeholder="Ej: Estimado cliente, adjunto encontrará nuestra mejor oferta..."
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowEmailModal(false)}
                className="btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={() => sendEmailMutation.mutate({ customMessage: customMessage || undefined })}
                disabled={sendEmailMutation.isPending}
                className="btn-primary"
              >
                {sendEmailMutation.isPending ? "Enviando..." : "Enviar Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
```

### 8.2 Agregar método al `quotation.service.ts`

```typescript
async sendEmail(
  id: string,
  options?: { customMessage?: string; cc?: string[] }
): Promise<void> {
  const response = await api.post(`/rental/quotations/${id}/send-email`, options);
  return response.data;
}
```

---

## 📋 Paso 9: Probar el Flujo Completo

### 9.1 Desde el Frontend

1. **Crear cotización** → `/quotations/new`
2. **Ver detalle** → `/quotations/:id`
3. **Generar PDF** → Click en botón "Generar PDF"
4. **Enviar Email** → Click en botón "Enviar Email"
5. **Revisar inbox** del cliente

### 9.2 Logs Esperados en el Backend

```
✅ PDF generado: QUO-2026-001.pdf
✅ Email sent to cliente@example.com (Message ID: xxxxx)
✅ Quotation QUO-2026-001 sent to cliente@example.com
```

---

## 🔍 Troubleshooting

### Error: "No email integration configured"

**Solución:** Ejecuta el INSERT del Paso 5.1 para crear la integración en la base de datos.

### Error: "Email send failed with status: Failed"

**Solución:** Verifica que el `defaultFrom` en el config sea exactamente el MailFrom address de Azure.

### Email no llega

1. Verifica que el dominio esté "Verified" en Azure Portal
2. Revisa la carpeta de SPAM del destinatario
3. Ve a Azure Portal → Communication Services → Email → "Email Logs" para ver el status

### Error: "From address is required"

**Solución:** Agrega `AZURE_EMAIL_FROM` al `.env` como se indica en el Paso 4.2

---

## 💡 Tips y Mejores Prácticas

### 1. Testing en Desarrollo

Usa Azure Managed Domain para testing:

- ✅ Gratis
- ✅ Sin configuración DNS
- ✅ Listo en segundos

### 2. Producción

Usa Custom Domain:

- ✅ Profesional (tus emails vienen de @tudominio.com)
- ✅ Mejor deliverability
- ⚠️ Requiere configurar DNS

### 3. Rate Limits

Azure Communication Email tiene límites:

- **Free Tier:** 100 emails/mes
- **Paid:** Consulta pricing de Azure

### 4. Monitoreo

Revisa logs en Azure Portal regularmente:

- Communication Services → Email → Email Logs
- Filtra por status: Succeeded, Failed, etc.

---

## 📚 Documentación Oficial

- [Azure Communication Services - Email Overview](https://learn.microsoft.com/en-us/azure/communication-services/concepts/email/email-overview)
- [Send Email Quickstart](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/email/send-email)
- [Email Domains](https://learn.microsoft.com/en-us/azure/communication-services/concepts/email/email-domain-and-sender-authentication)

---

**Fecha de creación:** 2026-02-20  
**Versión:** 1.0.0  
**Autor:** DivancoSaas Team
