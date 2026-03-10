/**
 * QUOTATION APPROVAL SERVICE
 * Gestiona la aprobación de cotizaciones (por admin o por el cliente)
 * y la creación automática del contrato resultante.
 */

import prisma from "@config/database";
import { v4 as uuidv4 } from "uuid";
import { contractService } from "./contract.service";
import { emailService } from "@core/services/email.service";
import { notificationService } from "@core/services/notification.service";
import { azureBlobStorageService } from "@shared/storage/azure-blob-storage.service";

const backendUrl =
  process.env.BACKEND_URL ||
  (process.env.WEBSITE_HOSTNAME
    ? `https://${process.env.WEBSITE_HOSTNAME}`
    : "http://localhost:3001");

// ─── APROBACIÓN ADMIN (o VIP sin revisión de cliente) ─────────────────────────

/**
 * Un admin aprueba la cotización directamente.
 * Crea el contrato, envía el email con comprobante y firma.
 */
export async function approveQuotationAsAdmin(
  quotationId: string,
  approvedBy: string,
): Promise<{ contractId: string }> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { client: true, items: true, businessUnit: true },
  });

  if (!quotation) throw new Error("Cotización no encontrada");
  if (quotation.status === "approved")
    throw new Error("La cotización ya fue aprobada");

  // Marcar como aprobada
  await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      status: "approved",
      clientResponse: "approved",
      clientRespondedAt: new Date(),
    },
  });

  // Crear contrato
  const contract = await _createContractFromQuotation(quotation, approvedBy);

  // Generar token de comprobante y enviar email
  await _sendContractEmail(contract.id, quotation);

  // Notificar al equipo
  await notificationService.create({
    tenantId: quotation.tenantId,
    businessUnitId: quotation.businessUnitId,
    type: "quotation_approved",
    title: "✅ Cotización aprobada",
    body: `${quotation.code} fue aprobada por el administrador. Contrato ${contract.code} creado.`,
    data: { quotationId, contractId: contract.id },
  });

  return { contractId: contract.id };
}

// ─── APROBACIÓN CLIENTE (desde el link de revisión) ───────────────────────────

/**
 * El cliente aprueba la cotización desde su link de revisión pública.
 * Crea el contrato, envía el email del contrato.
 */
export async function approveQuotationAsClient(
  clientReviewToken: string,
  selectedPeriodType?: string,
): Promise<{ contractId: string; contractCode: string; receiptToken: string }> {
  const quotation = await prisma.quotation.findUnique({
    where: { clientReviewToken },
    include: { client: true, items: true, businessUnit: true },
  });

  if (!quotation) throw new Error("Token de revisión inválido o expirado");
  if (quotation.status === "approved")
    throw new Error("Esta cotización ya fue aprobada");
  if (quotation.clientResponse === "approved")
    throw new Error("Ya aprobaste esta cotización");

  // Determinar si la cotización tiene precios multi-período
  const hasMultiPeriod = quotation.items.some((item) => {
    if (!item.selectedPeriods) return false;
    try {
      const periods = JSON.parse(item.selectedPeriods as string);
      const count = [periods.daily, periods.weekly, periods.monthly].filter(
        Boolean,
      ).length;
      return count > 1;
    } catch {
      return false;
    }
  });

  if (hasMultiPeriod && !selectedPeriodType) {
    throw new Error(
      "Debe seleccionar una modalidad de precio (diario, semanal o mensual)",
    );
  }

  // Marcar cotización como aprobada
  await prisma.quotation.update({
    where: { id: quotation.id },
    data: {
      status: "approved",
      clientResponse: "approved",
      clientRespondedAt: new Date(),
      ...(selectedPeriodType ? { selectedPeriodType } : {}),
    },
  });

  // Crear contrato
  const contract = await _createContractFromQuotation(
    quotation,
    quotation.createdBy, // usar el creador original de la cotización
  );

  // Enviar email del contrato al cliente y obtener receiptToken
  const receiptToken = await _sendContractEmail(contract.id, quotation);

  // Notificar al equipo
  await notificationService.create({
    tenantId: quotation.tenantId,
    businessUnitId: quotation.businessUnitId,
    type: "quotation_approved_by_client",
    title: "🎉 Cliente aprobó la cotización",
    body: `${quotation.client.name} aprobó ${quotation.code}. Contrato ${contract.code} creado automáticamente.`,
    data: { quotationId: quotation.id, contractId: contract.id },
  });

  return { contractId: contract.id, contractCode: contract.code, receiptToken };
}

// ─── SOLICITUD DE CAMBIOS (CLIENTE) ───────────────────────────────────────────

/**
 * El cliente pide modificaciones desde su link de revisión.
 */
export async function requestChangesAsClient(
  clientReviewToken: string,
  message: string,
): Promise<void> {
  const quotation = await prisma.quotation.findUnique({
    where: { clientReviewToken },
    include: { client: true, businessUnit: true },
  });

  if (!quotation) throw new Error("Token de revisión inválido o expirado");
  if (quotation.clientResponse === "approved")
    throw new Error("Esta cotización ya fue aprobada y no puede modificarse");

  await prisma.quotation.update({
    where: { id: quotation.id },
    data: {
      status: "changes_requested",
      clientResponse: "changes_requested",
      clientMessage: message,
      clientRespondedAt: new Date(),
    },
  });

  // Notificar al equipo con el mensaje del cliente
  await notificationService.create({
    tenantId: quotation.tenantId,
    businessUnitId: quotation.businessUnitId,
    type: "quotation_changes_requested",
    title: "✏️ Cliente pide modificaciones",
    body: `${quotation.client.name} solicitó cambios en ${quotation.code}: "${message.substring(0, 120)}${message.length > 120 ? "…" : ""}"`,
    data: {
      quotationId: quotation.id,
      clientMessage: message,
    },
  });
}

// ─── GENERAR LINK DE REVISIÓN ─────────────────────────────────────────────────

/**
 * Genera (o recupera) el token de revisión para enviar al cliente.
 */
export async function ensureClientReviewToken(
  quotationId: string,
): Promise<string> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: { clientReviewToken: true },
  });
  if (!quotation) throw new Error("Cotización no encontrada");

  if (quotation.clientReviewToken) return quotation.clientReviewToken;

  const token = uuidv4();
  await prisma.quotation.update({
    where: { id: quotationId },
    data: { clientReviewToken: token, clientResponse: "pending_review" },
  });
  return token;
}

// ─── INTERNOS ─────────────────────────────────────────────────────────────────

async function _createContractFromQuotation(quotation: any, createdBy: string) {
  // Si ya existe un contrato vinculado, devolver el existente
  const existing = await prisma.rentalContract.findUnique({
    where: { quotationId: quotation.id },
  });
  if (existing) return existing;

  const startDate = quotation.estimatedStartDate ?? new Date();
  const estimatedEndDate = quotation.estimatedEndDate ?? undefined;

  const contract = await contractService.createContract({
    tenantId: quotation.tenantId,
    businessUnitId: quotation.businessUnitId,
    clientId: quotation.clientId,
    quotationId: quotation.id,
    startDate,
    estimatedEndDate,
    estimatedTotal: Number(quotation.totalAmount),
    notes: quotation.notes ?? undefined,
    createdBy: createdBy,
    metadata: {
      generatedFromQuotation: quotation.code,
      currency: quotation.currency,
    },
  });

  return contract;
}

async function _sendContractEmail(
  contractId: string,
  quotation: any,
): Promise<string> {
  // Generar token de subida de comprobante para el contrato
  const receiptToken = uuidv4();
  await prisma.rentalContract.update({
    where: { id: contractId },
    data: { receiptToken },
  });

  const contract = await prisma.rentalContract.findUnique({
    where: { id: contractId },
    include: { client: true, businessUnit: true, template: true },
  });
  if (!contract) return receiptToken;

  const clientEmail = contract.client?.email;
  if (!clientEmail) {
    console.warn(
      `[QuotationApproval] Cliente sin email, no se envía contrato ${contractId}`,
    );
    return receiptToken;
  }

  const receiptUploadUrl = `${backendUrl}/api/v1/public/contracts/${receiptToken}/upload`;
  const total = Number(quotation.totalAmount).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
  });

  const html = `
    <!DOCTYPE html><html>
    <head><style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 30px; }
      .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
      .button { background: #0066cc; color: white; padding: 14px 32px; text-decoration: none;
        border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; }
      .highlight { background: #e8f4fd; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0; border-radius: 4px; }
      .amount { font-size: 24px; font-weight: bold; color: #0066cc; }
    </style></head>
    <body><div class="container">
      <div class="header">
        <h1>📋 Contrato de Alquiler</h1>
        <p>${contract.businessUnit.name}</p>
      </div>
      <div class="content">
        <p>Estimado/a <strong>${contract.client.name ?? clientEmail}</strong>,</p>
        <p>Su cotización <strong>${quotation.code}</strong> fue aprobada y se ha generado el siguiente contrato de alquiler:</p>

        <div class="highlight">
          <p><strong>Contrato:</strong> ${contract.code}</p>
          <p><strong>Fecha de inicio:</strong> ${contract.startDate.toLocaleDateString("es-MX")}</p>
          ${contract.estimatedEndDate ? `<p><strong>Fecha estimada de fin:</strong> ${contract.estimatedEndDate.toLocaleDateString("es-MX")}</p>` : ""}
          <p><strong>Monto estimado:</strong> <span class="amount">${quotation.currency} $${total}</span></p>
        </div>

        ${contract.pdfUrl ? `<p>Adjuntamos el contrato en PDF para su revisión.</p>` : ""}

        <h3>💳 Paso siguiente: Subir comprobante de pago</h3>
        <p>Para activar su contrato, por favor suba el comprobante de pago haciendo clic en el siguiente botón:</p>
        <div style="text-align: center;">
          <a href="${receiptUploadUrl}" class="button">📤 Subir Comprobante de Pago</a>
        </div>
        <p style="font-size:12px;color:#666;">
          O copie este enlace en su navegador:<br>
          <a href="${receiptUploadUrl}">${receiptUploadUrl}</a>
        </p>

        <h3>✍️ Firma del contrato</h3>
        <p>Nuestro equipo se pondrá en contacto con usted para coordinar la firma certificada del contrato.</p>

        <p>Si tiene alguna consulta, comuníquese con nosotros respondiendo este correo.</p>
      </div>
      <div class="footer">
        <p>${contract.businessUnit.name} &mdash; Todos los derechos reservados</p>
      </div>
    </div></body></html>
  `;

  // Adjuntar PDF del contrato si existe
  const attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }> = [];
  if (contract.pdfUrl) {
    try {
      const url = new URL(contract.pdfUrl);
      const parts = url.pathname.split("/").filter(Boolean);
      const sasUrl = await azureBlobStorageService.generateSasUrl(
        parts[0],
        parts.slice(1).join("/"),
        60,
      );
      const resp = await fetch(sasUrl);
      if (resp.ok) {
        attachments.push({
          filename: `Contrato-${contract.code}.pdf`,
          content: Buffer.from(await resp.arrayBuffer()),
          contentType: "application/pdf",
        });
      }
    } catch (err) {
      console.warn("[QuotationApproval] No se pudo adjuntar PDF:", err);
    }
  }

  await emailService.sendGenericEmail(contract.businessUnitId, {
    to: clientEmail,
    subject: `Contrato ${contract.code} - ${contract.businessUnit.name}`,
    html,
    attachments,
  });

  return receiptToken;
}
