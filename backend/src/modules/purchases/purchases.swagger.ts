/**
 * @swagger
 * tags:
 *   - name: Supply Categories
 *     description: Configurable supply category management (per BusinessUnit)
 *   - name: Supplies
 *     description: Supply/SKU catalog management with inventory control
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
 *
 *     Supply:
 *       type: object
 *       required:
 *         - name
 *         - categoryId
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
 *           example: "SUM-0001"
 *           description: "Auto-generated unique code (SUM-XXXX)"
 *         name:
 *           type: string
 *           example: "Andamio Tubular 2m"
 *           description: "Supply name"
 *         description:
 *           type: string
 *           example: "Andamio tubular metálico de 2 metros de altura"
 *         categoryId:
 *           type: string
 *           format: uuid
 *           description: "Reference to SupplyCategory"
 *         category:
 *           $ref: '#/components/schemas/SupplyCategory'
 *         sku:
 *           type: string
 *           example: "AND-TUB-2M"
 *           description: "Stock Keeping Unit (optional)"
 *         barcode:
 *           type: string
 *           example: "7501234567890"
 *           description: "Barcode for scanning (optional)"
 *         unit:
 *           type: string
 *           example: "unidades"
 *           description: "Unit of measurement (e.g., unidades, litros, kg, metros)"
 *         costPerUnit:
 *           type: number
 *           format: decimal
 *           example: 350000
 *           description: "Cost per unit in cents"
 *         currentStock:
 *           type: number
 *           format: decimal
 *           example: 45.5
 *           default: 0
 *           description: "Current stock quantity"
 *         minStock:
 *           type: number
 *           format: decimal
 *           example: 10
 *           description: "Minimum stock threshold for alerts"
 *         maxStock:
 *           type: number
 *           format: decimal
 *           example: 100
 *           description: "Maximum stock capacity"
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: "Active status"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
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

/**
 * @swagger
 * /modules/purchases/supplies:
 *   get:
 *     summary: List all supplies
 *     description: Returns all supplies for the current BusinessUnit with filters and pagination
 *     tags: [Supplies]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in code, name, description, SKU, or barcode
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Show only items with low stock (currentStock < minStock)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of supplies with pagination
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
 *                     $ref: '#/components/schemas/Supply'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 150
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     totalPages:
 *                       type: integer
 *                       example: 8
 *
 *   post:
 *     summary: Create a new supply
 *     description: Creates a supply with auto-generated code (SUM-XXXX)
 *     tags: [Supplies]
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
 *               - name
 *               - categoryId
 *             properties:
 *               code:
 *                 type: string
 *                 example: "SUM-0001"
 *                 description: "Optional custom code (if not provided, auto-generated)"
 *               name:
 *                 type: string
 *                 example: "Andamio Tubular 2m"
 *               description:
 *                 type: string
 *                 example: "Andamio tubular metálico de 2 metros"
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               sku:
 *                 type: string
 *                 example: "AND-TUB-2M"
 *               barcode:
 *                 type: string
 *                 example: "7501234567890"
 *               unit:
 *                 type: string
 *                 example: "unidades"
 *               costPerUnit:
 *                 type: number
 *                 example: 350000
 *                 description: "Cost in cents"
 *               minStock:
 *                 type: number
 *                 example: 10
 *               maxStock:
 *                 type: number
 *                 example: 100
 *     responses:
 *       201:
 *         description: Supply created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Supply'
 *       400:
 *         description: Invalid input or duplicate code
 */

/**
 * @swagger
 * /modules/purchases/supplies/{supplyId}:
 *   get:
 *     summary: Get supply by ID
 *     description: Returns detailed supply information including category and quotes
 *     tags: [Supplies]
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
 *         name: supplyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Supply details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Supply'
 *       404:
 *         description: Supply not found
 *
 *   patch:
 *     summary: Update supply
 *     description: Updates supply information (code cannot be changed if transactions exist)
 *     tags: [Supplies]
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
 *         name: supplyId
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
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               sku:
 *                 type: string
 *               barcode:
 *                 type: string
 *               unit:
 *                 type: string
 *               costPerUnit:
 *                 type: number
 *               minStock:
 *                 type: number
 *               maxStock:
 *                 type: number
 *     responses:
 *       200:
 *         description: Supply updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Supply'
 *       404:
 *         description: Supply not found
 *
 *   delete:
 *     summary: Delete supply
 *     description: Deletes supply if no transactions exist (no purchase orders or stock movements)
 *     tags: [Supplies]
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
 *         name: supplyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Supply deleted successfully
 *       400:
 *         description: Cannot delete supply with existing transactions
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
 *                   example: "Cannot delete supply with existing purchase orders"
 */

/**
 * @swagger
 * /modules/purchases/supplies/{supplyId}/toggle-active:
 *   patch:
 *     summary: Toggle supply active status
 *     description: Activates or deactivates a supply
 *     tags: [Supplies]
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
 *         name: supplyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Supply status toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Supply'
 *                 message:
 *                   type: string
 *                   example: "Supply activated successfully"
 */

/**
 * @swagger
 * /modules/purchases/supplies/{supplyId}/adjust-stock:
 *   post:
 *     summary: Adjust supply stock
 *     description: Manually adjust stock levels (creates StockTransaction for audit trail)
 *     tags: [Supplies]
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
 *         name: supplyId
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
 *               - quantity
 *               - reason
 *             properties:
 *               quantity:
 *                 type: number
 *                 example: 10
 *                 description: "Quantity to add (positive) or remove (negative)"
 *               reason:
 *                 type: string
 *                 example: "Corrección de inventario"
 *                 description: "Reason for adjustment (required for audit)"
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Supply'
 *                 message:
 *                   type: string
 *                   example: "Stock adjusted successfully. New stock: 55.5"
 *       404:
 *         description: Supply not found
 */

/**
 * @swagger
 * /modules/purchases/supply-categories/import:
 *   post:
 *     summary: Import supply categories from CSV
 *     description: Bulk import categories from CSV file. Creates categories in batch with validation.
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with categories (max 5MB)
 *           example:
 *             columns: "code,name,type,description,color,icon,requiresStockControl,allowNegativeStock"
 *             sample: "IMPLEMENTOS,Implementos de Construcción,TOOL,Andamios y estructuras,#3B82F6,wrench,true,false"
 *     responses:
 *       200:
 *         description: Import completed (may include partial errors)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                   description: "true if all records imported successfully, false if there were errors"
 *                 created:
 *                   type: integer
 *                   example: 5
 *                   description: "Number of categories successfully created"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       row:
 *                         type: integer
 *                         example: 3
 *                       error:
 *                         type: string
 *                         example: "Category with code 'IMPLEMENTOS' already exists"
 *                       data:
 *                         type: object
 *                 summary:
 *                   type: string
 *                   example: "Imported 5 of 6 categories. 1 errors."
 *       400:
 *         description: Invalid file or validation errors
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
 *                   example: "CSV file is required"
 */

/**
 * @swagger
 * /modules/purchases/supplies/import:
 *   post:
 *     summary: Import supplies from CSV
 *     description: Bulk import supplies from CSV file. Validates category references and creates supplies in batch.
 *     tags: [Supplies]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with supplies (max 5MB)
 *           example:
 *             columns: "code,name,categoryCode,sku,barcode,unit,costPerUnit,currentStock,minStock,maxStock,description"
 *             sample: "SUM-0001,Andamio Tubular 2m,IMPLEMENTOS,AND-TUB-2M,7501234567890,unidades,350000,0,5,20,Andamio tubular metálico"
 *             note: "If 'code' is empty, it will be auto-generated (SUM-XXXX)"
 *     responses:
 *       200:
 *         description: Import completed (may include partial errors)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                   description: "true if all records imported successfully, false if there were errors"
 *                 created:
 *                   type: integer
 *                   example: 7
 *                   description: "Number of supplies successfully created"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       row:
 *                         type: integer
 *                         example: 5
 *                       error:
 *                         type: string
 *                         example: "Category with code 'MATERIALES' not found"
 *                       data:
 *                         type: object
 *                 summary:
 *                   type: string
 *                   example: "Imported 7 of 8 supplies. 1 errors."
 *       400:
 *         description: Invalid file or validation errors
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
 *                   example: "CSV file is required"
 */
