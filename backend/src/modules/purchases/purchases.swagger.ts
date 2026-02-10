/**
 * @swagger
 * tags:
 *   - name: Supply Categories
 *     description: Configurable supply category management (per BusinessUnit)
 *   - name: Suppliers
 *     description: Supplier management with contacts and account tracking
 *   - name: Supply Quotes
 *     description: Price quotes from suppliers
 *   - name: Purchase Orders
 *     description: Purchase order management and receiving
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SupplyCategory:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - type
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
 *         code:
 *           type: string
 *           example: "LUBRICANTE"
 *           description: "Unique code per BusinessUnit (user-defined, uppercase)"
 *         name:
 *           type: string
 *           example: "Lubricantes"
 *           description: "Display name (user-defined)"
 *         description:
 *           type: string
 *           example: "Aceites y lubricantes para maquinaria"
 *         type:
 *           type: string
 *           enum: [CONSUMABLE, SPARE_PART, RAW_MATERIAL, FINISHED_PRODUCT, TOOL, OTHER]
 *           description: "Generic system type for behavior control"
 *           example: "CONSUMABLE"
 *         color:
 *           type: string
 *           example: "#3B82F6"
 *           description: "Hex color for UI visualization"
 *         icon:
 *           type: string
 *           example: "droplet"
 *           description: "Icon identifier for UI"
 *         requiresStockControl:
 *           type: boolean
 *           default: true
 *           description: "Enable inventory tracking"
 *         allowNegativeStock:
 *           type: boolean
 *           default: false
 *           description: "Allow negative stock (backorders)"
 *         isActive:
 *           type: boolean
 *           default: true
 *         suppliesCount:
 *           type: integer
 *           description: "Number of supplies using this category"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Supplier:
 *       type: object
 *       required:
 *         - code
 *         - name
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
 *         code:
 *           type: string
 *           example: "PROV-001"
 *         name:
 *           type: string
 *           example: "Aceros del Norte S.A."
 *         tradeName:
 *           type: string
 *           example: "Aceros del Norte"
 *         taxId:
 *           type: string
 *           example: "800123456-1"
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BLOCKED]
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /modules/purchases/supply-categories:
 *   get:
 *     summary: List all supply categories
 *     description: Returns all categories for the current BusinessUnit with filters
 *     tags: [Supply Categories]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CONSUMABLE, SPARE_PART, RAW_MATERIAL, FINISHED_PRODUCT, TOOL, OTHER]
 *         description: Filter by category type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in code, name, or description
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of categories
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
 *                     $ref: '#/components/schemas/SupplyCategory'
 *                 count:
 *                   type: integer
 *
 *   post:
 *     summary: Create a new supply category
 *     description: Creates a category with user-defined code and name
 *     tags: [Supply Categories]
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
 *             required:
 *               - code
 *               - name
 *               - type
 *             properties:
 *               code:
 *                 type: string
 *                 example: "LUBRICANTE_MOTOR"
 *                 description: "Unique code (will be uppercased)"
 *               name:
 *                 type: string
 *                 example: "Lubricantes de Motor"
 *               description:
 *                 type: string
 *                 example: "Aceites para motores diésel y gasolina"
 *               type:
 *                 type: string
 *                 enum: [CONSUMABLE, SPARE_PART, RAW_MATERIAL, FINISHED_PRODUCT, TOOL, OTHER]
 *                 example: "CONSUMABLE"
 *               color:
 *                 type: string
 *                 example: "#3B82F6"
 *               icon:
 *                 type: string
 *                 example: "droplet"
 *               requiresStockControl:
 *                 type: boolean
 *                 default: true
 *               allowNegativeStock:
 *                 type: boolean
 *                 default: false
 *           examples:
 *             construction:
 *               summary: Construction industry
 *               value:
 *                 code: "LUBRICANTE_MOTOR"
 *                 name: "Lubricantes de Motor"
 *                 type: "CONSUMABLE"
 *                 color: "#3B82F6"
 *                 icon: "droplet"
 *             textile:
 *               summary: Textile industry
 *               value:
 *                 code: "TELA_ALGODON"
 *                 name: "Telas de Algodón"
 *                 type: "RAW_MATERIAL"
 *                 color: "#10B981"
 *                 icon: "layers"
 *             livestock:
 *               summary: Livestock industry
 *               value:
 *                 code: "CONCENTRADO_BOVINO"
 *                 name: "Concentrado para Bovinos"
 *                 type: "CONSUMABLE"
 *                 color: "#F59E0B"
 *                 icon: "package"
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SupplyCategory'
 *       400:
 *         description: Validation error or duplicate code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /modules/purchases/supply-categories/stats:
 *   get:
 *     summary: Get category statistics
 *     description: Returns statistics grouped by type
 *     tags: [Supply Categories]
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
 *         description: Category statistics
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
 *                     total:
 *                       type: integer
 *                       example: 12
 *                     byType:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           count:
 *                             type: integer
 *                           suppliesCount:
 *                             type: integer
 *                           active:
 *                             type: integer
 *                     activeCategories:
 *                       type: integer
 *                     inactiveCategories:
 *                       type: integer
 */

/**
 * @swagger
 * /modules/purchases/supply-categories/{categoryId}:
 *   get:
 *     summary: Get category by ID
 *     description: Returns detailed information including related supplies
 *     tags: [Supply Categories]
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
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SupplyCategory'
 *       404:
 *         description: Category not found
 *
 *   put:
 *     summary: Update category
 *     description: Updates category information
 *     tags: [Supply Categories]
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
 *         name: categoryId
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
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 *
 *   delete:
 *     summary: Delete category
 *     description: Deletes category if no supplies are assigned
 *     tags: [Supply Categories]
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
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Cannot delete category with supplies assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Cannot delete category with 15 supplies assigned"
 */

/**
 * @swagger
 * /modules/purchases/supply-categories/{categoryId}/toggle-active:
 *   patch:
 *     summary: Toggle category active status
 *     description: Activates or deactivates a category
 *     tags: [Supply Categories]
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
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category status toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SupplyCategory'
 *                 message:
 *                   type: string
 *                   example: "Category activated successfully"
 */
