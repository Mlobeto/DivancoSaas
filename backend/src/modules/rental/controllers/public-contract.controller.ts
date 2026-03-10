/**
 * PUBLIC CONTRACT CONTROLLER
 * Endpoints sin autenticación orientados al cliente:
 * - Subir comprobante de pago del contrato (link en email de contrato)
 */

import { Request, Response } from "express";
import multer from "multer";
import prisma from "@config/database";
import { azureBlobStorageService } from "@shared/storage/azure-blob-storage.service";
import { notificationService } from "@core/services/notification.service";

export const contractReceiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes (JPG, PNG, WEBP) o PDF"));
    }
  },
});

const STYLES = `
  body { font-family: 'Segoe UI', Arial, sans-serif; display: flex; align-items: center;
    justify-content: center; min-height: 100vh; margin: 0; background: #f0f4f8; }
  .card { background: white; padding: 40px; border-radius: 16px; text-align: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12); max-width: 480px; width: 90%; }
  h2 { margin-top: 0; }
  .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px;
    font-weight: bold; margin-bottom: 16px; }
  .badge-blue { background: #e3f2fd; color: #1565c0; }
  .drop-zone { display: block; border: 2px dashed #90caf9; border-radius: 12px;
    padding: 36px 20px; cursor: pointer; margin: 20px 0; background: #f8fbff;
    text-decoration: none; color: inherit; }
  .drop-zone:hover { border-color: #1976d2; background: #e3f2fd; }
  .drop-zone p { margin: 8px 0; color: #555; font-size: 14px; }
  input[type=file] { display: block; width: 100%; margin: 0 auto 8px;
    font-size: 14px; box-sizing: border-box; }
  .btn { background: #1976d2; color: white; border: none; padding: 14px 32px;
    border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;
    width: 100%; margin-top: 12px; }
  .btn:hover { background: #1565c0; }
  .success { color: #2e7d32; } .error { color: #c62828; }
`;

class PublicContractController {
  /**
   * GET /api/v1/public/contracts/:token/upload
   * Formulario HTML para subir comprobante de pago del contrato
   */
  async uploadForm(req: Request, res: Response): Promise<void> {
    const { token } = req.params;

    const contract = await prisma.rentalContract.findUnique({
      where: { receiptToken: token },
      include: { client: true, businessUnit: true },
    });

    if (!contract) {
      res.status(404).send(this._errorPage("Enlace no válido o expirado"));
      return;
    }

    const meta = (contract.metadata as any) || {};
    if (meta.receiptUrl || contract.receiptUploadedAt) {
      res.send(this._alreadyUploadedPage(contract.code));
      return;
    }

    const uploadUrl = `${req.protocol}://${req.get("host")}/api/v1/public/contracts/${token}/upload`;
    const total = Number(contract.estimatedTotal ?? 0).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
    });

    res.send(`<!DOCTYPE html><html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subir Comprobante - Contrato ${contract.code}</title>
  <style>${STYLES}</style>
</head>
<body>
  <div class="card">
    <div class="badge badge-blue">${contract.businessUnit.name}</div>
    <h2>💳 Comprobante de Pago</h2>
    <p>Contrato: <strong>${contract.code}</strong></p>
    <p>Monto: <strong>${contract.currency ?? "USD"} $${total}</strong></p>
    <p>Suba su comprobante de pago para activar el contrato.</p>

    <form method="POST" enctype="multipart/form-data" action="${uploadUrl}">
      <label for="fileInput" class="drop-zone">
        <p style="font-size:32px">📎</p>
        <p><strong>Toca aquí para seleccionar el archivo</strong></p>
        <p style="font-size:12px;color:#999">JPG, PNG, WEBP o PDF · máx. 10 MB</p>
      </label>
      <input type="file" id="fileInput" name="receipt"
        accept="image/jpeg,image/png,image/webp,application/pdf" required>
      <button type="submit" class="btn">📤 Subir Comprobante</button>
    </form>
  </div>
</body></html>`);
  }

  /**
   * POST /api/v1/public/contracts/:token/upload
   * Recibe el comprobante, lo sube a Azure y actualiza el contrato
   */
  async uploadReceipt(req: Request, res: Response): Promise<void> {
    const { token } = req.params;

    const contract = await prisma.rentalContract.findUnique({
      where: { receiptToken: token },
      include: { client: true },
    });

    if (!contract) {
      res.status(404).json({ message: "Enlace no válido o expirado" });
      return;
    }

    const meta = (contract.metadata as any) || {};
    if (meta.receiptUrl || contract.receiptUploadedAt) {
      res
        .status(409)
        .json({ message: "Ya se recibió un comprobante para este contrato" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "No se recibió ningún archivo" });
      return;
    }

    const ext = file.originalname.split(".").pop();
    const uploaded = await azureBlobStorageService.uploadFile({
      file: file.buffer,
      fileName: `comprobante-${contract.code}-${Date.now()}.${ext}`,
      contentType: file.mimetype,
      folder: "payment-receipts",
      tenantId: contract.tenantId,
      businessUnitId: contract.businessUnitId,
    });

    await prisma.rentalContract.update({
      where: { id: contract.id },
      data: {
        receiptUploadedAt: new Date(),
        metadata: {
          ...meta,
          receiptUrl: uploaded.url,
          receiptBlobName: uploaded.blobName,
          receiptFileName: file.originalname,
          receiptFileMime: file.mimetype,
        },
      },
    });

    console.log(
      `✅ [PublicContract] Comprobante recibido: ${contract.code} → ${uploaded.url}`,
    );

    // Notificar al equipo
    try {
      await notificationService.create({
        tenantId: contract.tenantId,
        businessUnitId: contract.businessUnitId,
        type: "payment_receipt_received",
        title: "🧾 Comprobante de pago recibido",
        body: `${contract.client?.name ?? "Cliente"} subió el comprobante para el contrato ${contract.code}`,
        data: {
          contractId: contract.id,
          contractCode: contract.code,
          receiptUrl: uploaded.url,
        },
      });
    } catch (err) {
      console.warn("[PublicContract] Error enviando notificación:", err);
    }

    res.send(this._successPage(contract.code));
  }

  /**
   * GET /api/v1/public/contracts/:token/mark-local-payment
   * El cliente elige pagar en el local (sin subir comprobante)
   */
  async markLocalPayment(req: Request, res: Response): Promise<void> {
    const { token } = req.params;

    const contract = await prisma.rentalContract.findUnique({
      where: { receiptToken: token },
      include: { client: true, businessUnit: true },
    });

    if (!contract) {
      res.status(404).send(this._errorPage("Enlace no válido o expirado"));
      return;
    }

    const meta = (contract.metadata as any) || {};
    if (meta.receiptUrl || contract.receiptUploadedAt) {
      res.send(this._alreadyProcessedPage(contract.code));
      return;
    }

    // Marcar como pago local
    await prisma.rentalContract.update({
      where: { id: contract.id },
      data: {
        metadata: {
          ...meta,
          paymentMethod: "local",
          localPaymentRequestedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`✅ [PublicContract] Pago local solicitado: ${contract.code}`);

    // Notificar al equipo
    try {
      await notificationService.create({
        tenantId: contract.tenantId,
        businessUnitId: contract.businessUnitId,
        type: "local_payment_requested",
        title: "🏪 Pago local solicitado",
        body: `${contract.client?.name ?? "Cliente"} eligió pagar en el local para el contrato ${contract.code}`,
        data: {
          contractId: contract.id,
          contractCode: contract.code,
        },
      });
    } catch (err) {
      console.warn("[PublicContract] Error enviando notificación:", err);
    }

    res.send(this._localPaymentSuccessPage(contract.code));
  }

  private _successPage(code: string) {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Comprobante recibido</title><style>${STYLES}</style></head><body>
      <div class="card"><div style="font-size:64px;margin-bottom:16px">✅</div>
      <h2 style="color:#2e7d32">¡Comprobante recibido!</h2>
      <p>Gracias por subir su comprobante para el contrato <strong>${code}</strong>.</p>
      <p>Nuestro equipo lo verificará y le contactará a la brevedad.</p></div></body></html>`;
  }

  private _errorPage(msg: string) {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Enlace no válido</title><style>${STYLES}</style></head><body>
      <div class="card"><h2 style="color:#c62828">⚠️ ${msg}</h2>
      <p>Por favor contacte a su proveedor para obtener un nuevo enlace.</p></div></body></html>`;
  }

  private _alreadyUploadedPage(code: string) {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Comprobante recibido</title><style>${STYLES}</style></head><body>
      <div class="card"><h2 style="color:#2e7d32">✅ Comprobante ya recibido</h2>
      <p>Ya recibimos tu comprobante para el contrato <strong>${code}</strong>.</p>
      <p>Nuestro equipo lo verificará y te contactará a la brevedad.</p></div></body></html>`;
  }

  private _alreadyProcessedPage(code: string) {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ya procesado</title><style>${STYLES}</style></head><body>
      <div class="card"><h2 style="color:#2e7d32">✅ Pago ya registrado</h2>
      <p>El pago para el contrato <strong>${code}</strong> ya fue procesado.</p>
      <p>Nuestro equipo te contactará a la brevedad.</p></div></body></html>`;
  }

  private _localPaymentSuccessPage(code: string) {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pago en local confirmado</title><style>${STYLES}</style></head><body>
      <div class="card"><div style="font-size:64px;margin-bottom:16px">🏪</div>
      <h2 style="color:#2e7d32">¡Pago en local confirmado!</h2>
      <p>Gracias por elegir pagar en el local para el contrato <strong>${code}</strong>.</p>
      <p style="margin-top:20px">Nuestro equipo se pondrá en contacto con usted para coordinar el pago presencial y la entrega.</p>
      <p style="margin-top:20px;font-size:14px;color:#718096">Recibirá un email con los detalles de contacto.</p></div></body></html>`;
  }
}

export const publicContractController = new PublicContractController();
