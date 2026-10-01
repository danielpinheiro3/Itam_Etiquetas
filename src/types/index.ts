export interface Material {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  raw?: Record<string, any>;
}

export interface ExcelMapping {
  codigoCol: string;
  descricaoCol: string;
  unidadeCol: string;
}

export type ElementType = 
  | 'field' 
  | 'static-text' 
  | 'barcode' 
  | 'box' 
  | 'divider'
  | 'logo'
  | 'line'
  | 'rectangle'
  | 'image';

export type MaterialFieldKey = 'codigo' | 'descricao' | 'controle' | 'unidade';

export type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13';

export type LabelRotation = 0 | 90 | 180 | 270;

export interface LabelElement {
  id: string;
  type: ElementType;
  name: string;
  fieldKey?: MaterialFieldKey;
  labelPrefix?: string; // e.g. "CÓDIGO: ", "CONTROLE: "
  staticText?: string;
  imageUrl?: string; // Data URL base64 for logo or image
  keepAspectRatio?: boolean;
  x: number; // in mm
  y: number; // in mm
  width: number; // in mm
  height: number; // in mm
  fontSize: number; // pt
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  alignVertical?: 'top' | 'middle' | 'bottom';
  color: string;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  visible: boolean;
  locked: boolean;
  rotation?: number; // 0, 90, 180, 270
  barcodeFormat?: BarcodeFormat;
  barcodeShowText?: boolean;
  barcodeHeight?: number; // in mm
}

export interface LabelTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  widthMm: number;
  heightMm: number;
  paddingMm: number;
  borderWidth: number;
  borderColor: string;
  borderRadiusMm: number;
  backgroundColor: string;
  elements: LabelElement[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LayoutCalculationResult {
  pageOrientation: 'portrait' | 'landscape';
  labelRotation: LabelRotation;
  columns: number;
  rows: number;
  labelsPerPage: number;
  totalPages: number;
  cellWidthMm: number;
  cellHeightMm: number;
  availableWidthMm: number;
  availableHeightMm: number;
  requiredWidthMm: number;
  requiredHeightMm: number;
  isCompatible: boolean;
  incompatibilityReason?: string;
}

export interface PrintConfig {
  paperSize: 'A4';
  orientation: 'portrait' | 'landscape'; // Manual user choice: RETRATO or PAISAGEM
  labelRotation: LabelRotation; // 0, 90, 180, 270
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  gapHorizontalMm: number;
  gapVerticalMm: number;
  columns: number;
  rows: number;
  showCutLines: boolean;
  printCutLines: boolean;
  startOffsetIndex: number;
  isAdvancedMode: boolean;
}

export interface PrintQueueItem {
  id: string;
  material: Material;
  controle: string; // User-entered manual control, specific to this label
  quantity: number;
  templateId: string;
}

export interface CompanyIdentity {
  logoUrl: string; // Base64 Data URL
  systemName: string;
  subtitle: string;
}

export interface SystemThemeColors {
  primary: string;         // Cor principal
  primaryHover: string;    // Cor principal ao passar o mouse
  secondary: string;       // Cor secundária
  headerBg: string;        // Cor do cabeçalho
  menuBg: string;          // Cor do menu
  accent: string;          // Cor de destaque
  buttonBg: string;        // Cor dos botões de ação
  buttonHover: string;     // Cor dos botões ao passar o mouse
  buttonText: string;      // Cor do texto dos botões
  textPrimary: string;     // Cor dos textos principais
  textSecondary: string;   // Cor dos textos secundários
  bgPage: string;          // Cor de fundo geral da página
  bgCard: string;          // Cor dos cartões e painéis
  borderColor: string;     // Cor das bordas
}

export type PresetThemeId = 
  | 'ambar-padrao'
  | 'azul-profissional' 
  | 'azul-escuro' 
  | 'verde-industrial' 
  | 'cinza-grafite' 
  | 'preto-moderno' 
  | 'personalizado';

export interface SystemThemeConfig {
  presetId: PresetThemeId;
  colors: SystemThemeColors;
}

export interface BackupData {
  version: string;
  exportDate: string;
  systemName: string;
  templates: LabelTemplate[];
  printConfig: PrintConfig;
  identity: CompanyIdentity;
  theme?: SystemThemeConfig;
  materials: Material[];
  savedMapping: ExcelMapping;
  queue: PrintQueueItem[];
  activeTemplateId: string;
  assets?: Record<string, any>;
}

export interface StorageDiagnostics {
  isIndexedDbSupported: boolean;
  isIndexedDbConnected: boolean;
  dbVersion: number;
  storesCount: number;
  modelsCount: number;
  materialsCount: number;
  assetsCount: number;
  localStorageUsageKb: number;
  estimatedStorageMb?: number;
  quotaStorageMb?: number;
  lastBackupDate?: string;
}

export type ViewTab = 
  | 'dashboard'
  | 'import-excel'
  | 'materials'
  | 'create-label'
  | 'editor'
  | 'queue'
  | 'print-config'
  | 'templates'
  | 'preview-print'
  | 'identity-visual'
  | 'appearance'
  | 'diagnostic'
  | 'backup-restore';

export interface ExcelImportValidation {
  totalRows: number;
  validRows: number;
  duplicateCodesCount: number;
  duplicateCodesList: string[];
  emptyCodesCount: number;
  missingDescCount: number;
  detectedColumns: string[];
}
