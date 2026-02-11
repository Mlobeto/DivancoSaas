// Pages
// DEPRECATED: export { MachineryPage } from "./pages/MachineryPage"; // Usar AssetFormPage
export { AssetsListPage } from "./pages/AssetsListPage";
export { AssetTemplatesPage } from "./pages/AssetTemplatesPage";
export { DocumentTypesPage } from "./pages/DocumentTypesPage";
export { AssetFormPage } from "./pages/AssetFormPage";
export { AlertsDashboardPage } from "./pages/AlertsDashboardPage";

// Services
// DEPRECATED: export { machineryService } from "./services/machinery.service"; // Usar assetsService
export { assetTemplateService } from "./services/asset-template.service";
export { documentTypesService } from "./services/document-types.service";
export { assetsService } from "./services/assets.service";
export { alertsService } from "./services/alerts.service";

// Types (DEPRECATED - Equipment/Machinery system)
// export type {
//   Machinery,
//   MachineryFilters,
//   CreateMachineryData,
//   UpdateMachineryData,
// } from "./services/machinery.service";

export type {
  AssetTemplate,
  CustomField,
  CreateTemplateInput,
  UpdateTemplateInput,
  AssetCategory,
  FieldType,
} from "./services/asset-template.service";

export {
  AssetCategoryLabels,
  FieldTypeLabels,
} from "./services/asset-template.service";

export type {
  AssetDocumentType,
  CreateDocumentTypeData,
  UpdateDocumentTypeData,
} from "./services/document-types.service";

export type {
  Asset,
  CreateAssetData,
  UpdateAssetData,
  AssetAttachment,
} from "./services/assets.service";

export type { ExpiringDocument } from "./services/alerts.service";

// Components
export { AssetDocumentationModal } from "./components/AssetDocumentationModal";
