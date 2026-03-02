/**
 * PUBLIC QUOTATION CONTROLLER
 * Endpoints sin autenticación para flujo de clientes:
 * - Subir comprobante de pago (enlace en email de cotización)
 */

import { Request, Response } from "express";
import multer from "multer";
import prisma from "@config/database";
import { azureBlobStorageService } from "@shared/storage/azure-blob-storage.service";
import { notificationService } from "@core/services/notification.service";

// Multer en memoria (max 10MB)
export const receiptUpload = multer({
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

export class PublicQuotationController {
  /**
   * GET /api/v1/public/quotations/:token/upload
   * Página HTML pública para que el cliente suba su comprobante de pago
   */
  async uploadForm(req: Request, res: Response): Promise<void> {
    const { token } = req.params;

    const quotation = await prisma.quotation.findFirst({
      where: {
        metadata: { path: ["paymentReceiptToken"], equals: token },
      },
      include: { client: true, businessUnit: true },
    });

    if (!quotation) {
      res.status(404).send(`
        <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Enlace no válido</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; align-items: center;
            justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
          .card { background: white; padding: 40px; border-radius: 12px; text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px; }
          h2 { color: #e53e3e; }
        </style>
        </head><body>
          <div class="card">
            <h2>⚠️ Enlace no válido</h2>
            <p>Este enlace ha expirado o no es válido.<br>
            Por favor contacte a su proveedor para obtener un nuevo enlace.</p>
          </div>
        </body></html>
      `);
      return;
    }

    // Verificar si ya fue subido
    const meta = (quotation.metadata as any) || {};
    if (meta.paymentReceiptUrl) {
      res.send(`
        <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comprobante recibido</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; align-items: center;
            justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
          .card { background: white; padding: 40px; border-radius: 12px; text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 420px; }
          h2 { color: #38a169; }
        </style>
        </head><body>
          <div class="card">
            <h2>✅ Comprobante ya recibido</h2>
            <p>Ya recibimos tu comprobante de pago para la cotización
            <strong>${quotation.code}</strong>.</p>
            <p>Nuestro equipo lo verificará y te contactará a la brevedad.</p>
          </div>
        </body></html>
      `);
      return;
    }

    const uploadUrl = `${req.protocol}://${req.get("host")}/api/v1/public/quotations/${token}/upload`;
    const total = Number(quotation.totalAmount).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
    });

    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comprobante de Pago – ${quotation.code}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #f0f4f8; min-height: 100vh; display: flex;
            align-items: center; justify-content: center; padding: 20px;
          }
          .card {
            background: white; border-radius: 16px; padding: 40px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12); max-width: 480px; width: 100%;
          }
          .header {
            text-align: center; margin-bottom: 32px;
            padding-bottom: 24px; border-bottom: 2px solid #e2e8f0;
          }
          .logo-area { margin-bottom: 12px; font-size: 36px; }
          h1 { color: #1a202c; font-size: 22px; margin-bottom: 8px; }
          .subtitle { color: #718096; font-size: 14px; }
          .info-box {
            background: #ebf8ff; border-left: 4px solid #3182ce;
            padding: 16px; border-radius: 8px; margin-bottom: 24px;
          }
          .info-box p { color: #2c5282; font-size: 14px; line-height: 1.6; margin: 4px 0; }
          .info-box strong { color: #1a365d; }
          .drop-zone {
            border: 2px dashed #cbd5e0; border-radius: 12px; padding: 36px 20px;
            text-align: center; cursor: pointer; transition: all 0.2s;
            margin-bottom: 20px; background: #f7fafc;
          }
          .drop-zone:hover, .drop-zone.dragover {
            border-color: #3182ce; background: #ebf8ff;
          }
          .drop-zone svg { margin-bottom: 12px; }
          .drop-zone p { color: #4a5568; font-size: 15px; margin-bottom: 4px; }
          .drop-zone .hint { color: #a0aec0; font-size: 12px; }
          #fileInput { display: none; }
          #fileName {
            display: none; background: #f0fff4; border: 1px solid #9ae6b4;
            border-radius: 8px; padding: 10px 14px; margin-bottom: 16px;
            color: #276749; font-size: 13px; align-items: center; gap: 8px;
          }
          .btn-submit {
            width: 100%; padding: 14px; background: #3182ce; color: white;
            border: none; border-radius: 10px; font-size: 16px; font-weight: 600;
            cursor: pointer; transition: background 0.2s;
          }
          .btn-submit:hover:not(:disabled) { background: #2b6cb0; }
          .btn-submit:disabled { background: #a0aec0; cursor: not-allowed; }
          .progress { display: none; margin-top: 16px; }
          .progress-bar {
            height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;
          }
          .progress-fill {
            height: 100%; background: #3182ce; width: 0%;
            transition: width 0.3s; border-radius: 4px;
          }
          .progress p { text-align: center; color: #4a5568; font-size: 13px; margin-top: 8px; }
          .success { display: none; text-align: center; padding: 20px 0; }
          .success h2 { color: #38a169; font-size: 24px; margin-bottom: 12px; }
          .success p { color: #4a5568; font-size: 15px; line-height: 1.6; }
          .footer { text-align: center; margin-top: 28px; color: #a0aec0; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo-area">🧾</div>
            <h1>Comprobante de Pago</h1>
            <p class="subtitle">${quotation.businessUnit.name}</p>
          </div>

          <div class="info-box">
            <p>📋 <strong>Cotización:</strong> ${quotation.code}</p>
            <p>👤 <strong>Cliente:</strong> ${quotation.client.name}</p>
            <p>💰 <strong>Total:</strong> ${quotation.currency} ${total}</p>
          </div>

          <form id="uploadForm">
            <div class="drop-zone" id="dropZone" onclick="document.getElementById('fileInput').click()">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#3182ce" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p>Haz clic o arrastra tu comprobante aquí</p>
              <span class="hint">JPG, PNG, WEBP o PDF – Máx. 10 MB</span>
            </div>
            <input type="file" id="fileInput" accept="image/jpeg,image/png,image/webp,application/pdf" style="display:none; position:absolute; pointer-events:none;">

            <div id="fileName">📎 <span id="fileNameText"></span></div>

            <button type="submit" class="btn-submit" id="submitBtn" disabled>
              Subir comprobante
            </button>
          </form>

          <div class="progress" id="progress">
            <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
            <p>Subiendo comprobante...</p>
          </div>

          <div class="success" id="success">
            <h2>✅ ¡Comprobante recibido!</h2>
            <p>Hemos recibido tu comprobante para la cotización<br>
            <strong>${quotation.code}</strong>.</p>
            <p style="margin-top:12px;">Nuestro equipo verificará el pago y<br>
            te contactará a la brevedad.</p>
          </div>

          <p class="footer">© ${new Date().getFullYear()} ${quotation.businessUnit.name} — Proceso seguro</p>
        </div>

        <script>
          const fileInput = document.getElementById('fileInput');
          const dropZone = document.getElementById('dropZone');
          const fileName = document.getElementById('fileName');
          const fileNameText = document.getElementById('fileNameText');
          const submitBtn = document.getElementById('submitBtn');
          const form = document.getElementById('uploadForm');
          const progress = document.getElementById('progress');
          const progressFill = document.getElementById('progressFill');
          const success = document.getElementById('success');

          fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
              fileNameText.textContent = fileInput.files[0].name;
              fileName.style.display = 'flex';
              submitBtn.disabled = false;
            }
          });

          dropZone.addEventListener('dragover', (e) => {
            e.preventDefault(); dropZone.classList.add('dragover');
          });
          dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
          dropZone.addEventListener('drop', (e) => {
            e.preventDefault(); dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length) {
              fileInput.files = files;
              fileNameText.textContent = files[0].name;
              fileName.style.display = 'flex';
              submitBtn.disabled = false;
            }
          });

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!fileInput.files.length) return;

            form.style.display = 'none';
            progress.style.display = 'block';

            // Animación de progreso simulada
            let pct = 0;
            const interval = setInterval(() => {
              pct = Math.min(pct + 10, 85);
              progressFill.style.width = pct + '%';
            }, 200);

            const data = new FormData();
            data.append('receipt', fileInput.files[0]);

            try {
              const res = await fetch('${uploadUrl}', { method: 'POST', body: data });
              clearInterval(interval);
              if (res.ok) {
                progressFill.style.width = '100%';
                setTimeout(() => {
                  progress.style.display = 'none';
                  success.style.display = 'block';
                }, 400);
              } else {
                const err = await res.json();
                alert(err.message || 'Error al subir el archivo. Intente nuevamente.');
                form.style.display = 'block';
                progress.style.display = 'none';
              }
            } catch (err) {
              clearInterval(interval);
              alert('Error de conexión. Intente nuevamente.');
              form.style.display = 'block';
              progress.style.display = 'none';
            }
          });
        </script>
      </body>
      </html>
    `);
  }

  /**
   * POST /api/v1/public/quotations/:token/upload
   * Recibe el comprobante de pago (multipart), lo sube a Azure Blob y actualiza la cotización
   */
  async uploadReceipt(req: Request, res: Response): Promise<void> {
    const { token } = req.params;

    const quotation = await prisma.quotation.findFirst({
      where: {
        metadata: { path: ["paymentReceiptToken"], equals: token },
      },
    });

    if (!quotation) {
      res.status(404).json({ message: "Enlace no válido o expirado" });
      return;
    }

    const meta = (quotation.metadata as any) || {};
    if (meta.paymentReceiptUrl) {
      res
        .status(409)
        .json({ message: "Ya se recibió un comprobante para esta cotización" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "No se recibió ningún archivo" });
      return;
    }

    // Subir a Azure Blob Storage
    const uploaded = await azureBlobStorageService.uploadFile({
      file: file.buffer,
      fileName: `comprobante-${quotation.code}-${Date.now()}.${file.originalname.split(".").pop()}`,
      contentType: file.mimetype,
      folder: "payment-receipts",
      tenantId: quotation.tenantId,
      businessUnitId: quotation.businessUnitId,
    });

    // Actualizar metadata de la cotización
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        metadata: {
          ...meta,
          paymentReceiptUrl: uploaded.url,
          paymentReceiptBlobName: uploaded.blobName,
          paymentReceiptUploadedAt: new Date().toISOString(),
          paymentReceiptFileName: file.originalname,
          paymentReceiptFileMime: file.mimetype,
        },
      },
    });

    console.log(
      `✅ [PublicQuotation] Comprobante recibido: ${quotation.code} → ${uploaded.url}`,
    );

    // Notificar a los admins de la BU que llegó un comprobante
    try {
      await notificationService.create({
        tenantId: quotation.tenantId,
        businessUnitId: quotation.businessUnitId,
        type: "payment_receipt_received",
        title: "🧯 Comprobante de pago recibido",
        body: `Se recibió el comprobante para la cotización ${quotation.code}`,
        data: {
          quotationId: quotation.id,
          quotationCode: quotation.code,
          receiptUrl: uploaded.url,
        },
      });
    } catch (notifErr) {
      // No fallamos el request si la notificación falla
      console.warn("[PublicQuotation] Error enviando notificación:", notifErr);
    }

    res.json({
      success: true,
      message: "Comprobante recibido correctamente",
    });
  }
}

export const publicQuotationController = new PublicQuotationController();
