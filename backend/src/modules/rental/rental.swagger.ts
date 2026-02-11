/**
 * @swagger
 * tags:
 *   - name: Quotations
 *     description: Quotation management with digital signature support
 *   - name: Contracts
 *     description: Contract management generated from quotations
 *   - name: Templates
 *     description: Document template management for quotations and contracts
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Quotation:
 *       type: object
 *       description: "Quotation with digital signature support"
 *       required:
 *         - businessUnitId
 *         - clientId
 *         - items
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *           example: "QU-2026-001"
 *         businessUnitId:
 *           type: string
 *           format: uuid
 *         clientId:
 *           type: string
 *           format: uuid
 *         assignedUserId:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [draft, signature_pending, signed, paid, contract_created, cancelled]
 *           example: "draft"
 *         subtotal:
 *           type: number
 *           example: 8000.00
 *         taxRate:
 *           type: number
 *           example: 19
 *         taxAmount:
 *           type: number
 *           example: 1520.00
 *         totalAmount:
 *           type: number
 *           example: 9520.00
 *         currency:
 *           type: string
 *           example: "USD"
 *         quotationDate:
 *           type: string
 *           format: date-time
 *         validUntil:
 *           type: string
 *           format: date-time
 *         pdfUrl:
 *           type: string
 *           example: "https://storage.divancosaas.com/..."
 *         signedPdfUrl:
 *           type: string
 *           example: "https://storage.divancosaas.com/.../signed.pdf"
 *         signatureRequestId:
 *           type: string
 *         signatureStatus:
 *           type: string
 *           enum: [pending, viewed, signed, declined, expired, cancelled]
 *         signatureProvider:
 *           type: string
 *           example: "signow"
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed]
 *         notes:
 *           type: string
 *         termsAndConditions:
 *           type: string
 *
 *     QuotationItem:
 *       type: object
 *       required:
 *         - description
 *         - quantity
 *         - unitPrice
 *       properties:
 *         assetId:
 *           type: string
 *           format: uuid
 *         description:
 *           type: string
 *           example: "Retroexcavadora CAT 420F"
 *         quantity:
 *           type: number
 *           example: 1
 *         unitPrice:
 *           type: number
 *           example: 5000.00
 *         rentalDays:
 *           type: number
 *           example: 30
 *         rentalStartDate:
 *           type: string
 *           format: date
 *         rentalEndDate:
 *           type: string
 *           format: date
 *
 *     QuotationContract:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *           example: "CON-2026-001"
 *         quotationId:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [active, completed, cancelled, suspended]
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         pdfUrl:
 *           type: string
 *         signedPdfUrl:
 *           type: string
 *         totalAmount:
 *           type: number
 *         currency:
 *           type: string
 *
 *     Template:
 *       type: object
 *       required:
 *         - businessUnitId
 *         - name
 *         - type
 *         - content
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         businessUnitId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "Cotización de Alquiler v1"
 *         type:
 *           type: string
 *           enum: [quotation, contract, invoice, receipt, report, certificate]
 *         content:
 *           type: string
 *           description: "HTML template with Handlebars variables"
 *         logoUrl:
 *           type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /rental/quotations:
 *   post:
 *     summary: Create a new quotation
 *     tags: [Quotations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessUnitId
 *               - clientId
 *               - validUntil
 *               - items
 *             properties:
 *               businessUnitId:
 *                 type: string
 *                 format: uuid
 *               clientId:
 *                 type: string
 *                 format: uuid
 *               assignedUserId:
 *                 type: string
 *                 format: uuid
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/QuotationItem'
 *               taxRate:
 *                 type: number
 *                 default: 0
 *               currency:
 *                 type: string
 *                 default: "USD"
 *               notes:
 *                 type: string
 *               termsAndConditions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Quotation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Quotation'
 *   get:
 *     summary: List quotations
 *     tags: [Quotations]
 *     parameters:
 *       - in: query
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of quotations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Quotation'
 */

/**
 * @swagger
 * /rental/quotations/{id}:
 *   get:
 *     summary: Get quotation by ID
 *     tags: [Quotations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Quotation'
 */

/**
 * @swagger
 * /rental/quotations/{id}/generate-pdf:
 *   post:
 *     summary: Generate PDF for quotation
 *     tags: [Quotations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     pdfUrl:
 *                       type: string
 */

/**
 * @swagger
 * /rental/quotations/{id}/request-signature:
 *   post:
 *     summary: Request digital signature for quotation
 *     tags: [Quotations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signers
 *             properties:
 *               signers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *               message:
 *                 type: string
 *               expiresInDays:
 *                 type: number
 *                 default: 15
 *     responses:
 *       200:
 *         description: Signature request created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     signatureRequestId:
 *                       type: string
 *                     signUrl:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 */

/**
 * @swagger
 * /rental/quotations/{id}/create-contract:
 *   post:
 *     summary: Create contract from signed and paid quotation
 *     tags: [Quotations, Contracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Contract created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/QuotationContract'
 */

/**
 * @swagger
 * /rental/contracts:
 *   get:
 *     summary: List contracts
 *     tags: [Contracts]
 *     parameters:
 *       - in: query
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: quotationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of contracts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QuotationContract'
 */

/**
 * @swagger
 * /templates:
 *   post:
 *     summary: Create document template
 *     tags: [Templates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Template'
 *     responses:
 *       201:
 *         description: Template created
 *   get:
 *     summary: List templates
 *     tags: [Templates]
 *     parameters:
 *       - in: query
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of templates
 */
