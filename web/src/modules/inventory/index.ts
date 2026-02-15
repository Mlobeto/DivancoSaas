// Module Definition (for platform registration)
export { inventoryModule } from "./module";

// Pages
export { AssetsListPage } from "./pages/AssetsListPage";
export { AssetTemplatesPage } from "./pages/AssetTemplatesPage";
export { DocumentTypesPage } from "./pages/DocumentTypesPage";
export { AssetFormPage } from "./pages/AssetFormPage";
export { AlertsDashboardPage } from "./pages/AlertsDashboardPage";

// Services
export { assetTemplateService } from "./services/asset-template.service";
export { documentTypesService } from "./services/document-types.service";
export { assetsService } from "./services/assets.service";
export { alertsService } from "./services/alerts.service";

// Types
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
