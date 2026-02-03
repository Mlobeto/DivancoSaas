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
