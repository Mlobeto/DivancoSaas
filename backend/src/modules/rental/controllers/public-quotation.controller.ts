/**
 * PUBLIC QUOTATION CONTROLLER
 * Endpoints sin autenticación para flujo de clientes:
 * - Página de revisión de cotización (aprobar / pedir cambios)
 */

import { Request, Response } from "express";
import multer from "multer";
import prisma from "@config/database";
import { azureBlobStorageService } from "@shared/storage/azure-blob-storage.service";
import { notificationService } from "@core/services/notification.service";
import {
  approveQuotationAsClient,
  requestChangesAsClient,
} from "../services/quotation-approval.service";

// Multer — se mantiene para legacy (links antiguos ya enviados)
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
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imágenes (JPG, PNG, WEBP) o PDF"));
  },
});

export class PublicQuotationController {
  // ─── NUEVOS ENDPOINTS: REVISIÓN DE COTIZACIÓN ─────────────────────────────

  /**
   * GET /api/v1/public/quotations/:token/review
   * Página donde el cliente puede aprobar la cotización o pedir cambios
   */
  async reviewPage(req: Request, res: Response): Promise<void> {
    const { token } = req.params;

    const quotation = await prisma.quotation.findUnique({
      where: { clientReviewToken: token },
      include: { client: true, businessUnit: true, items: true },
    });

    if (!quotation) {
      res.status(404).send(this._htmlError("Enlace no válido o expirado"));
      return;
    }

    if (quotation.clientResponse === "approved") {
      res.send(this._htmlAlreadyApproved(quotation.code));
      return;
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const approveUrl = `${baseUrl}/api/v1/public/quotations/${token}/approve`;
    const changesUrl = `${baseUrl}/api/v1/public/quotations/${token}/request-changes`;
    const total = Number(quotation.totalAmount).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
    });
    const validUntil = quotation.validUntil.toLocaleDateString("es-MX");

    const itemsHtml = quotation.items
      .map(
        (i) =>
          `<tr>
            <td style="padding:8px 4px">${i.description}</td>
            <td style="padding:8px 4px;text-align:center">${i.quantity}</td>
            <td style="padding:8px 4px;text-align:right">${quotation.currency} ${Number(i.unitPrice).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
            <td style="padding:8px 4px;text-align:right">${quotation.currency} ${Number(i.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
          </tr>`,
      )
      .join("");

    const changesWarning =
      quotation.clientResponse === "changes_requested"
        ? `<div style="background:#fff3cd;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:6px;margin-bottom:20px;font-size:14px;">
            <strong>⚠️ Ya solicitaste cambios</strong><br>
            Puedes enviar un mensaje adicional o aprobar la cotización actualizada.
           </div>`
        : "";

    res.send(`<!DOCTYPE html><html lang="es">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Revisión Cotización ${quotation.code}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f0f4f8;min-height:100vh;padding:24px 16px}
    .card{background:white;border-radius:16px;padding:32px;box-shadow:0 8px 32px rgba(0,0,0,.12);max-width:620px;margin:0 auto}
    h1{font-size:22px;color:#1a202c;margin-bottom:6px}
    .sub{color:#718096;font-size:14px;margin-bottom:24px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
    .info-item{background:#f7fafc;padding:12px;border-radius:8px}
    .info-item label{font-size:11px;text-transform:uppercase;color:#a0aec0;font-weight:600}
    .info-item p{font-size:15px;color:#1a202c;font-weight:600;margin-top:2px}
    table{width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px}
    thead th{background:#f7fafc;padding:8px 4px;text-align:left;color:#718096;font-weight:600;font-size:12px;text-transform:uppercase}
    tbody tr:nth-child(even){background:#f7fafc}
    .total-row{background:#ebf8ff!important;font-weight:700}
    .divider{border:none;border-top:1px solid #e2e8f0;margin:20px 0}
    .btn-approve{width:100%;padding:16px;background:#38a169;color:white;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;transition:.2s;margin-bottom:12px}
    .btn-approve:hover{background:#2f855a}
    .btn-changes{width:100%;padding:14px;background:white;color:#4a5568;border:2px solid #e2e8f0;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;transition:.2s}
    .btn-changes:hover{border-color:#cbd5e0;background:#f7fafc}
    #changesForm{display:none;margin-top:16px}
    textarea{width:100%;height:120px;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:15px;resize:vertical;font-family:inherit}
    textarea:focus{outline:none;border-color:#3182ce}
    .btn-send{width:100%;padding:14px;background:#3182ce;color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;margin-top:12px}
    #msg{margin-top:16px;padding:14px;border-radius:8px;font-size:14px;display:none}
    .success{background:#f0fff4;color:#276749;border:1px solid #9ae6b4}
    .error{background:#fff5f5;color:#c53030;border:1px solid #fc8181}
    .footer{text-align:center;margin-top:24px;color:#a0aec0;font-size:12px}
  </style>
</head>
<body>
  <div class="card">
    <h1>📋 Cotización ${quotation.code}</h1>
    <p class="sub">${quotation.businessUnit.name}</p>

    ${changesWarning}

    <div class="info-grid">
      <div class="info-item"><label>Cliente</label><p>${quotation.client.name}</p></div>
      <div class="info-item"><label>Válida hasta</label><p>${validUntil}</p></div>
      ${quotation.estimatedStartDate ? `<div class="info-item"><label>Fecha inicio</label><p>${quotation.estimatedStartDate.toLocaleDateString("es-MX")}</p></div>` : ""}
      ${quotation.estimatedEndDate ? `<div class="info-item"><label>Fecha fin</label><p>${quotation.estimatedEndDate.toLocaleDateString("es-MX")}</p></div>` : ""}
    </div>

    <table>
      <thead><tr><th>Descripción</th><th style="text-align:center">Cant.</th><th style="text-align:right">P. Unit.</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>
        ${itemsHtml}
        ${Number(quotation.taxAmount) > 0 ? `<tr><td colspan="3" style="padding:8px 4px;text-align:right;color:#718096">Impuesto (${quotation.taxRate}%)</td><td style="padding:8px 4px;text-align:right">${quotation.currency} ${Number(quotation.taxAmount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>` : ""}
        <tr class="total-row"><td colspan="3" style="padding:10px 4px;text-align:right">TOTAL</td><td style="padding:10px 4px;text-align:right">${quotation.currency} $${total}</td></tr>
      </tbody>
    </table>

    ${quotation.notes ? `<div style="background:#f7fafc;padding:12px 16px;border-radius:8px;font-size:14px;margin-bottom:20px"><strong>Notas:</strong> ${quotation.notes}</div>` : ""}

    <hr class="divider">
    <p style="color:#4a5568;font-size:14px;margin-bottom:16px">Revise los detalles de su cotización:</p>

    <button class="btn-approve" onclick="doApprove()">✅ Aprobar Cotización</button>
    <button class="btn-changes" onclick="document.getElementById('changesForm').style.display='block';this.style.display='none'">✏️ Solicitar modificaciones</button>

    <div id="changesForm">
      <p style="font-size:14px;color:#4a5568;margin-bottom:8px">Explique brevemente qué cambios necesita:</p>
      <textarea id="changeMsg" placeholder="Ej: Necesito reducir la cantidad del ítem 2 y agregar 3 días más al periodo..."></textarea>
      <button class="btn-send" onclick="doChanges()">📩 Enviar solicitud de cambios</button>
    </div>

    <div id="msg"></div>
    <p class="footer">© ${new Date().getFullYear()} ${quotation.businessUnit.name}</p>
  </div>

  <script>
    async function doApprove() {
      const msg = document.getElementById('msg');
      try {
        const r = await fetch('${approveUrl}', { method: 'POST', headers: {'Content-Type':'application/json'} });
        const d = await r.json();
        if (d.success) {
          document.querySelector('.card').innerHTML =
            '<div style="text-align:center;padding:40px 20px"><div style="font-size:64px;margin-bottom:16px">🎉</div><h2 style="color:#38a169;margin-bottom:12px">¡Cotización aprobada!</h2><p style="color:#4a5568">Hemos generado su contrato <strong>' + d.contractCode + '</strong>.<br>Recibirá un email con los detalles y el enlace para subir su comprobante de pago.</p></div>';
        } else { throw new Error(d.error || 'Error'); }
      } catch(e) { msg.style.display='block'; msg.className='error'; msg.textContent='❌ ' + e.message; }
    }
    async function doChanges() {
      const text = document.getElementById('changeMsg').value.trim();
      if (!text) { alert('Por favor escriba su solicitud'); return; }
      const msg = document.getElementById('msg');
      try {
        const r = await fetch('${changesUrl}', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ message: text }) });
        const d = await r.json();
        if (d.success) {
          document.getElementById('changesForm').innerHTML = '<div class="success" style="display:block;margin-top:8px">✅ Su solicitud fue enviada. Nuestro equipo la revisará y le responderá a la brevedad.</div>';
        } else { throw new Error(d.error || 'Error'); }
      } catch(e) { msg.style.display='block'; msg.className='error'; msg.textContent='❌ ' + e.message; }
    }
  </script>
</body></html>`);
  }

  /**
   * POST /api/v1/public/quotations/:token/approve
   * El cliente aprueba la cotización → crea contrato automáticamente
   */
  async approveAction(req: Request, res: Response): Promise<void> {
    const { token } = req.params;
    const result = await approveQuotationAsClient(token);
    res.json({ success: true, ...result });
  }

  /**
   * POST /api/v1/public/quotations/:token/request-changes
   * El cliente pide modificaciones con un mensaje
   */
  async requestChangesAction(req: Request, res: Response): Promise<void> {
    const { token } = req.params;
    const { message } = req.body;
    if (!message?.trim()) {
      res
        .status(400)
        .json({ success: false, error: "El mensaje es requerido" });
      return;
    }
    await requestChangesAsClient(token, message.trim());
    res.json({ success: true });
  }

  // ─── LEGACY: Subida de comprobante en cotización (links ya enviados) ────────

  /**
   * GET /api/v1/public/quotations/:token/upload  (LEGACY)
   * Mantiene compatibilidad con links de pago enviados antes del nuevo flujo
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
      res.status(404).send(this._htmlError("Enlace no válido o expirado"));
      return;
    }

    const meta = (quotation.metadata as any) || {};
    if (meta.paymentReceiptUrl) {
      res.send(this._htmlAlreadyApproved(quotation.code));
      return;
    }

    const uploadUrl = `${req.protocol}://${req.get("host")}/api/v1/public/quotations/${token}/upload`;
    const total = Number(quotation.totalAmount).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
    });

    res.send(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1.0">
      <title>Comprobante de Pago – ${quotation.code}</title>
      <style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0f4f8}
      .card{background:white;padding:40px;border-radius:16px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.12);max-width:460px;width:90%}
      h2{color:#1a202c}.btn{background:#3182ce;color:white;padding:14px 32px;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;width:100%;margin-top:12px}
      input[type=file]{display:none;position:absolute;pointer-events:none}
      .drop{border:2px dashed #90caf9;border-radius:12px;padding:36px 20px;cursor:pointer;margin:20px 0}
      #st{margin-top:16px;font-size:14px}</style></head>
      <body><div class="card"><h2>💳 Comprobante de Pago</h2>
        <p>Cotización: <strong>${quotation.code}</strong></p>
        <p>Total: <strong>${quotation.currency} $${total}</strong></p>
        <form id="f" method="POST" enctype="multipart/form-data" action="${uploadUrl}">
          <input type="file" id="fi" name="receipt" accept="image/jpeg,image/png,image/webp,application/pdf">
          <div class="drop" onclick="document.getElementById('fi').click()">
            <p>📎 Toca para seleccionar</p><p id="fn" style="color:#1976d2;font-weight:bold"></p>
          </div>
          <button type="submit" class="btn" id="sb" disabled>📤 Subir Comprobante</button>
        </form>
        <div id="st"></div>
      </div>
      <script>
        const fi=document.getElementById('fi'),sb=document.getElementById('sb'),fn=document.getElementById('fn'),st=document.getElementById('st');
        fi.addEventListener('change',()=>{if(fi.files[0]){fn.textContent=fi.files[0].name;sb.disabled=false;}});
        document.getElementById('f').addEventListener('submit',async e=>{
          e.preventDefault();sb.disabled=true;sb.textContent='⏳ Subiendo...';
          const fd=new FormData();fd.append('receipt',fi.files[0]);
          try{const r=await fetch('${uploadUrl}',{method:'POST',body:fd});const d=await r.json();
            if(d.success){st.innerHTML='<span style="color:green">✅ Comprobante recibido. ¡Gracias!</span>';sb.textContent='✅ Enviado';}
            else{throw new Error(d.message||'Error');}
          }catch(err){st.innerHTML='<span style="color:red">❌ '+err.message+'</span>';sb.disabled=false;sb.textContent='📤 Subir';}
        });
      </script></body></html>`);
  }

  /**
   * POST /api/v1/public/quotations/:token/upload  (LEGACY)
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

  // ─── HELPERS PRIVADOS ──────────────────────────────────────────────────────

  private _htmlError(msg: string): string {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1.0">
      <title>Error</title>
      <style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f0f4f8;margin:0}
      .card{background:white;padding:40px;border-radius:16px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.12);max-width:400px}</style></head>
      <body><div class="card">
        <div style="font-size:56px;margin-bottom:16px">⚠️</div>
        <h2 style="color:#c53030;margin-bottom:12px">Enlace no disponible</h2>
        <p style="color:#4a5568">${msg}</p>
      </div></body></html>`;
  }

  private _htmlAlreadyApproved(code: string): string {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1.0">
      <title>Ya respondida</title>
      <style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f0f4f8;margin:0}
      .card{background:white;padding:40px;border-radius:16px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.12);max-width:400px}</style></head>
      <body><div class="card">
        <div style="font-size:56px;margin-bottom:16px">✅</div>
        <h2 style="color:#38a169;margin-bottom:12px">Cotización ya procesada</h2>
        <p style="color:#4a5568">La cotización <strong>${code}</strong> ya fue aprobada. Revise su correo para los detalles del contrato.</p>
      </div></body></html>`;
  }
}

export const publicQuotationController = new PublicQuotationController();
