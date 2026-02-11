/**
 * @swagger
 * tags:
 *   - name: Assets
 *     description: Asset (Equipment/Machinery) management
 *   - name: Maintenance
 *     description: Asset maintenance records
 *   - name: Usage
 *     description: Asset usage tracking and reporting
 *   - name: Attachments
 *     description: Asset file attachments (photos, PDFs, etc)
 *   - name: Document Types
 *     description: Configurable document types per Business Unit (Insurance, Permits, Certifications, etc)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Asset:
 *       type: object
 *       required:
 *         - name
 *         - assetType
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         tenantId:
 *           type: string
 *           format: uuid
 *         businessUnitId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "Excavadora CAT 320"
 *         assetType:
 *           type: string
 *           example: "excavator"
 *           description: "Free-form string, not hardcoded enum"
 *         acquisitionCost:
 *           type: number
 *           example: 150000
 *         origin:
 *           type: string
 *           example: "Purchased new from dealer"
 *         requiresOperator:
 *           type: boolean
 *           default: false
 *         requiresTracking:
 *           type: boolean
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         state:
 *           $ref: '#/components/schemas/AssetState'
 *
 *     AssetState:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         assetId:
 *           type: string
 *           format: uuid
 *         workflowId:
 *           type: string
 *           format: uuid
 *         currentState:
 *           type: string
 *           example: "available"
 *           description: "Workflow-driven state"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     MaintenanceRecord:
 *       type: object
 *       required:
 *         - assetId
 *         - startedAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         assetId:
 *           type: string
 *           format: uuid
 *         description:
 *           type: string
 *           example: "Oil change and filter replacement"
 *         startedAt:
 *           type: string
 *           format: date-time
 *         endedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: "Null if maintenance is still ongoing"
 *
 *     AssetUsage:
 *       type: object
 *       required:
 *         - assetId
 *         - date
 *         - hoursUsed
 *         - source
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         assetId:
 *           type: string
 *           format: uuid
 *         date:
 *           type: string
 *           format: date
 *         hoursUsed:
 *           type: number
 *           example: 8.5
 *         standbyHours:
 *           type: number
 *           example: 2.0
 *           nullable: true
 *         reportedByUserId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         source:
 *           type: string
 *           example: "APP"
 *           description: "Free-form string: APP, WHATSAPP, API, SYSTEM"
 *         notes:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     AssetAttachment:
 *       type: object
 *       required:
 *         - assetId
 *         - type
 *         - url
 *         - source
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         assetId:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           example: "PHOTO"
 *           description: "Free-form string: PHOTO, PDF, VIDEO, etc"
 *         url:
 *           type: string
 *           format: uri
 *         source:
 *           type: string
 *           example: "APP"
 *           description: "Free-form string: WHATSAPP, APP, SYSTEM"
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     AssetDocumentType:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - requiresExpiry
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         businessUnitId:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *           example: "SOAT"
 *           description: "Unique code for document type within Business Unit"
 *         name:
 *           type: string
 *           example: "Seguro Obligatorio"
 *         description:
 *           type: string
 *           example: "Seguro obligatorio de accidentes de tránsito"
 *         requiresExpiry:
 *           type: boolean
 *           description: "Whether this document type requires expiry date tracking"
 *         defaultAlertDays:
 *           type: integer
 *           example: 30
 *           description: "Days before expiry to send alert"
 *         color:
 *           type: string
 *           example: "#FF5722"
 *           description: "Hex color for UI display"
 *         icon:
 *           type: string
 *           example: "shield"
 *           description: "Icon name for UI display"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /modules/assets/assets:
 *   post:
 *     tags: [Assets]
 *     summary: Create a new asset
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - assetType
 *             properties:
 *               name:
 *                 type: string
 *               assetType:
 *                 type: string
 *               acquisitionCost:
 *                 type: number
 *               origin:
 *                 type: string
 *               requiresOperator:
 *                 type: boolean
 *               requiresTracking:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Asset created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       400:
 *         description: Business unit context required or validation error
 *
 *   get:
 *     tags: [Assets]
 *     summary: List all assets with filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assetType
 *         schema:
 *           type: string
 *       - in: query
 *         name: requiresOperator
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: requiresTracking
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of assets
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
 *                     $ref: '#/components/schemas/Asset'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */

/**
 * @swagger
 * /modules/assets/assets/{assetId}:
 *   get:
 *     tags: [Assets]
 *     summary: Get asset by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asset details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       404:
 *         description: Asset not found
 *
 *   patch:
 *     tags: [Assets]
 *     summary: Update asset
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               assetType:
 *                 type: string
 *               acquisitionCost:
 *                 type: number
 *               origin:
 *                 type: string
 *               requiresOperator:
 *                 type: boolean
 *               requiresTracking:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Asset updated
 *       404:
 *         description: Asset not found
 *
 *   delete:
 *     tags: [Assets]
 *     summary: Delete asset
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asset deleted successfully
 *       404:
 *         description: Asset not found
 */

/**
 * @swagger
 * /modules/assets/assets/{assetId}/state:
 *   post:
 *     tags: [Assets]
 *     summary: Update asset state (workflow-driven)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workflowId
 *               - currentState
 *             properties:
 *               workflowId:
 *                 type: string
 *                 format: uuid
 *               currentState:
 *                 type: string
 *                 example: "in-use"
 *     responses:
 *       200:
 *         description: State updated successfully
 *       404:
 *         description: Asset not found
 */

/**
 * @swagger
 * /modules/assets/assets/{assetId}/events:
 *   get:
 *     tags: [Assets]
 *     summary: Get asset event history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of asset events
 */

/**
 * @swagger
 * /modules/assets/maintenance:
 *   post:
 *     tags: [Maintenance]
 *     summary: Create maintenance record
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetId
 *               - startedAt
 *             properties:
 *               assetId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *               startedAt:
 *                 type: string
 *                 format: date-time
 *               endedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Maintenance record created
 */

/**
 * @swagger
 * /modules/assets/usage:
 *   post:
 *     tags: [Usage]
 *     summary: Record asset usage
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetId
 *               - date
 *               - hoursUsed
 *               - source
 *             properties:
 *               assetId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               hoursUsed:
 *                 type: number
 *               standbyHours:
 *                 type: number
 *               reportedByUserId:
 *                 type: string
 *                 format: uuid
 *               source:
 *                 type: string
 *                 example: "APP"
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usage recorded successfully
 *
 *   get:
 *     tags: [Usage]
 *     summary: List usage records with filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assetId
 *         schema:
 *           type: string
 *       - in: query
 *         name: reportedByUserId
 *         schema:
 *           type: string
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of usage records
 */

/**
 * @swagger
 * /modules/assets/attachments:
 *   post:
 *     tags: [Attachments]
 *     summary: Create attachment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetId
 *               - type
 *               - url
 *               - source
 *             properties:
 *               assetId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 example: "PHOTO"
 *               url:
 *                 type: string
 *                 format: uri
 *               source:
 *                 type: string
 *                 example: "APP"
 *     responses:
 *       201:
 *         description: Attachment created
 *
 *   get:
 *     tags: [Attachments]
 *     summary: List attachments for an asset
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of attachments
 */

/**
 * @swagger
 * /modules/assets/assets/{assetId}/image:
 *   post:
 *     tags: [Assets]
 *     summary: Upload main image for asset
 *     description: Upload a single main image for the asset (replaces existing image)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPG, PNG, WebP - max 5MB)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     asset:
 *                       $ref: '#/components/schemas/Asset'
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *       400:
 *         description: Invalid file or missing image
 *       404:
 *         description: Asset not found
 *
 *   delete:
 *     tags: [Assets]
 *     summary: Delete main image from asset
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       404:
 *         description: Asset not found
 */

/**
 * @swagger
 * /modules/assets/assets/{assetId}/attachments:
 *   post:
 *     tags: [Attachments]
 *     summary: Upload multiple attachments (documents/photos)
 *     description: Upload multiple files with optional document type and expiry tracking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple files (images, PDF, Word, Excel - max 10 files, 10MB each)
 *               documentTypeId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional link to AssetDocumentType (e.g., "Insurance", "Permit")
 *               issueDate:
 *                 type: string
 *                 format: date
 *                 description: Document issue date
 *               expiryDate:
 *                 type: string
 *                 format: date
 *                 description: Document expiry date (for tracking)
 *               alertDays:
 *                 type: integer
 *                 description: Days before expiry to send alert (default 30)
 *               notes:
 *                 type: string
 *                 description: Additional notes about the documents
 *               source:
 *                 type: string
 *                 example: "web"
 *                 description: Upload source (web, mobile, api)
 *     responses:
 *       200:
 *         description: Attachments uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AssetAttachment'
 *                 message:
 *                   type: string
 *                   example: "5 attachment(s) uploaded successfully"
 *       400:
 *         description: Invalid files or missing required fields
 *       404:
 *         description: Asset not found
 */

/**
 * @swagger
 * /modules/assets/usage/{usageId}/evidence:
 *   post:
 *     tags: [Usage]
 *     summary: Upload evidence for usage record
 *     description: Upload photos of odometer/hourometer as evidence for usage report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Evidence photos (max 5 images, 5MB each)
 *     responses:
 *       200:
 *         description: Evidence uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AssetUsage'
 *                 message:
 *                   type: string
 *                   example: "3 evidence file(s) uploaded successfully"
 *       400:
 *         description: Invalid files or missing required fields
 *       404:
 *         description: Usage record not found
 */

/**
 * @swagger
 * /modules/assets/document-types:
 *   post:
 *     tags: [Document Types]
 *     summary: Create a new document type
 *     description: Define a new document type for asset documentation (e.g., Insurance, Permit, SOAT)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - requiresExpiry
 *             properties:
 *               code:
 *                 type: string
 *                 example: "SOAT"
 *                 description: Unique code within Business Unit
 *               name:
 *                 type: string
 *                 example: "Seguro Obligatorio"
 *               description:
 *                 type: string
 *                 example: "Seguro obligatorio de accidentes de tránsito"
 *               requiresExpiry:
 *                 type: boolean
 *                 description: Whether this document type requires expiry date
 *               defaultAlertDays:
 *                 type: integer
 *                 example: 30
 *               color:
 *                 type: string
 *                 example: "#FF5722"
 *               icon:
 *                 type: string
 *                 example: "shield"
 *     responses:
 *       201:
 *         description: Document type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AssetDocumentType'
 *       400:
 *         description: Invalid input or duplicate code
 *
 *   get:
 *     tags: [Document Types]
 *     summary: List document types
 *     description: Get all document types configured for the Business Unit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: requiresExpiry
 *         schema:
 *           type: boolean
 *         description: Filter by expiry requirement
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, code, or description
 *       - in: query
 *         name: stats
 *         schema:
 *           type: boolean
 *         description: Include usage statistics (attachment count, expiring count)
 *     responses:
 *       200:
 *         description: List of document types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AssetDocumentType'
 */

/**
 * @swagger
 * /modules/assets/document-types/{documentTypeId}:
 *   get:
 *     tags: [Document Types]
 *     summary: Get document type by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentTypeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document type details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AssetDocumentType'
 *       404:
 *         description: Document type not found
 *
 *   patch:
 *     tags: [Document Types]
 *     summary: Update document type
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentTypeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               requiresExpiry:
 *                 type: boolean
 *               defaultAlertDays:
 *                 type: integer
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AssetDocumentType'
 *       404:
 *         description: Document type not found
 *
 *   delete:
 *     tags: [Document Types]
 *     summary: Delete document type
 *     description: Delete a document type (only if not in use by any attachments)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentTypeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document type deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Document type deleted successfully"
 *       400:
 *         description: Cannot delete - document type is in use
 *       404:
 *         description: Document type not found
 */
