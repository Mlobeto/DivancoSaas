/**
 * @swagger
 * tags:
 *   - name: Clients
 *     description: Client management, contacts, tax profiles and account balance per BusinessUnit
 *   - name: Client Account Movements
 *     description: Current account movements and balances for clients
 *   - name: Client Configuration
 *     description: Ranking and risk configuration per BusinessUnit
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       description: "Business client shared across modules, scoped to Tenant and BusinessUnit"
 *       required:
 *         - name
 *         - type
 *         - countryCode
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
 *           example: "Constructora El Norte S.A."
 *         displayName:
 *           type: string
 *           example: "El Norte"
 *         type:
 *           type: string
 *           enum: [COMPANY, INDIVIDUAL]
 *           example: COMPANY
 *         countryCode:
 *           type: string
 *           example: "CO"
 *           description: "ISO 3166-1 alpha-2 country code (e.g. CO, AR, MX)"
 *         email:
 *           type: string
 *           format: email
 *           example: "contacto@elnorte.com"
 *         phone:
 *           type: string
 *           example: "+57 300 123 4567"
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BLOCKED]
 *           example: ACTIVE
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["VIP", "CONSTRUCCION"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ClientContact:
 *       type: object
 *       description: "Operational contact for a client (sales, billing, logistics, etc.)"
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         clientId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "María Gómez"
 *         position:
 *           type: string
 *           example: "Jefe de compras"
 *         email:
 *           type: string
 *           format: email
 *           example: "maria.gomez@elnorte.com"
 *         phone:
 *           type: string
 *           example: "+57 301 555 0000"
 *         channel:
 *           type: string
 *           enum: [EMAIL, PHONE, WHATSAPP, OTHER]
 *           example: WHATSAPP
 *
 *     ClientTaxProfile:
 *       type: object
 *       description: "Tax/fiscal profile for a client in a given country/regime"
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         clientId:
 *           type: string
 *           format: uuid
 *         countryCode:
 *           type: string
 *           example: "CO"
 *         taxIdType:
 *           type: string
 *           example: "NIT"
 *         taxIdNumber:
 *           type: string
 *           example: "800123456-1"
 *         taxRegime:
 *           type: string
 *           example: "REGIMEN_COMUN"
 *         fiscalResponsibility:
 *           type: string
 *           example: "Responsable de IVA"
 *         legalName:
 *           type: string
 *           example: "Constructora El Norte S.A."
 *         addressLine1:
 *           type: string
 *         addressLine2:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         postalCode:
 *           type: string
 *         extra:
 *           type: object
 *           additionalProperties: true
 *
 *     ClientAccountMovement:
 *       type: object
 *       description: "Financial movement in the client's current account (AR)"
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
 *         clientId:
 *           type: string
 *           format: uuid
 *         date:
 *           type: string
 *           format: date-time
 *         amount:
 *           type: number
 *           example: 1500000
 *         direction:
 *           type: string
 *           enum: [DEBIT, CREDIT]
 *           description: "DEBIT increases balance (client owes more), CREDIT decreases"
 *         currency:
 *           type: string
 *           example: "COP"
 *         sourceModule:
 *           type: string
 *           example: "assets-rental"
 *         sourceType:
 *           type: string
 *           example: "RENTAL_ORDER"
 *         sourceId:
 *           type: string
 *           example: "RO-2025-0001"
 *         description:
 *           type: string
 *           example: "Anticipo por arriendo de retroexcavadora"
 *         metadata:
 *           type: object
 *           additionalProperties: true
 *
 *     ClientRiskSnapshot:
 *       type: object
 *       description: "Aggregated risk/ranking snapshot for a client"
 *       properties:
 *         clientId:
 *           type: string
 *           format: uuid
 *         score:
 *           type: number
 *           example: 82.5
 *         segment:
 *           type: string
 *           example: "A"
 *         currentBalance:
 *           type: number
 *           example: 3200000
 *         details:
 *           type: object
 *           additionalProperties: true
 *         lastUpdatedAt:
 *           type: string
 *           format: date-time
 *
 *     ClientRankingConfig:
 *       type: object
 *       description: "Ranking and risk configuration per BusinessUnit"
 *       properties:
 *         tenantId:
 *           type: string
 *           format: uuid
 *         businessUnitId:
 *           type: string
 *           format: uuid
 *         weights:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: "Weight per factor (e.g. onTimePayments, recency, volume)"
 *         thresholds:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: "Numeric thresholds per segment or rule"
 *         policies:
 *           type: object
 *           additionalProperties: true
 *           description: "Arbitrary JSON policies (e.g. minDepositBySegment, autoApprovalRules)"
 */

/**
 * @swagger
 * /modules/clients/clients:
 *   get:
 *     summary: List clients
 *     description: Returns paginated list of clients for the current BusinessUnit
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: X-Business-Unit-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name or displayName
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BLOCKED]
 *     responses:
 *       200:
 *         description: Paginated list of clients
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
 *                     $ref: '#/components/schemas/Client'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *   post:
 *     summary: Create client
 *     description: Creates a new client with optional contacts and a primary tax profile
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: X-Business-Unit-Id
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
 *               displayName:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [COMPANY, INDIVIDUAL]
 *               countryCode:
 *                 type: string
 *                 example: "CO"
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, BLOCKED]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               contacts:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ClientContact'
 *               taxProfile:
 *                 $ref: '#/components/schemas/ClientTaxProfile'
 *           examples:
 *             construction:
 *               summary: Construction company client
 *               value:
 *                 name: "Constructora El Norte S.A."
 *                 displayName: "El Norte"
 *                 type: "COMPANY"
 *                 countryCode: "CO"
 *                 email: "contacto@elnorte.com"
 *                 phone: "+57 300 123 4567"
 *                 status: "ACTIVE"
 *                 tags: ["VIP", "CONSTRUCCION"]
 *                 contacts:
 *                   - name: "María Gómez"
 *                     position: "Jefe de compras"
 *                     email: "maria.gomez@elnorte.com"
 *                     phone: "+57 301 555 0000"
 *                     channel: "WHATSAPP"
 *                 taxProfile:
 *                   countryCode: "CO"
 *                   taxIdType: "NIT"
 *                   taxIdNumber: "800123456-1"
 *                   taxRegime: "REGIMEN_COMUN"
 *                   fiscalResponsibility: "Responsable de IVA"
 *
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 */

/**
 * @swagger
 * /modules/clients/clients/{clientId}:
 *   get:
 *     summary: Get client by ID
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: X-Business-Unit-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Client details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *   put:
 *     summary: Update client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: X-Business-Unit-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: clientId
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
 *               displayName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, BLOCKED]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Updated client
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 */

/**
 * @swagger
 * /modules/clients/clients/{clientId}/summary:
 *   get:
 *     summary: Get client summary (profile, contacts, tax profile, recent movements, risk)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: X-Business-Unit-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Aggregated client summary
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
 *                     client:
 *                       $ref: '#/components/schemas/Client'
 *                     recentMovements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ClientAccountMovement'
 *                     risk:
 *                       $ref: '#/components/schemas/ClientRiskSnapshot'
 */

/**
 * @swagger
 * /modules/clients/clients/{clientId}/risk-profile:
 *   get:
 *     summary: Get client risk/ranking profile
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: X-Business-Unit-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Risk snapshot for client (may be null if not calculated yet)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/ClientRiskSnapshot'
 *                     - type: "null"
 */

/**
 * @swagger
 * /modules/clients/clients/{clientId}/account-movements:
 *   get:
 *     summary: List client account movements
 *     tags: [Client Account Movements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: X-Business-Unit-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Paginated list of movements
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
 *                     $ref: '#/components/schemas/ClientAccountMovement'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *   post:
 *     summary: Register a client account movement
 *     tags: [Client Account Movements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: X-Business-Unit-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: clientId
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
 *               - amount
 *               - direction
 *               - currency
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               amount:
 *                 type: number
 *               direction:
 *                 type: string
 *                 enum: [DEBIT, CREDIT]
 *               currency:
 *                 type: string
 *               sourceModule:
 *                 type: string
 *               sourceType:
 *                 type: string
 *               sourceId:
 *                 type: string
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       201:
 *         description: Movement created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ClientAccountMovement'
 */

/**
 * @swagger
 * /modules/clients/config/current:
 *   get:
 *     summary: Get current client ranking/risk configuration for BusinessUnit
 *     tags: [Client Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: X-Business-Unit-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Configuration for ranking and risk (may be default if not customized)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ClientRankingConfig'
 *   put:
 *     summary: Update client ranking/risk configuration for BusinessUnit
 *     tags: [Client Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: X-Business-Unit-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientRankingConfig'
 *     responses:
 *       200:
 *         description: Updated configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ClientRankingConfig'
 */
