import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  PrintConfig, 
  PrintQueueItem, 
  LabelTemplate, 
  LayoutCalculationResult, 
  Material,
  LabelRotation
} from '../types';

export interface FlattenedLabel {
  queueIndex: number;
  material: Material;
  controle: string;
  template: LabelTemplate;
}

export const flattenPrintQueue = (
  queue: PrintQueueItem[],
  templates: LabelTemplate[],
  defaultTemplateId: string
): FlattenedLabel[] => {
  const result: FlattenedLabel[] = [];

  queue.forEach((item, qIdx) => {
    const itemTemplate =
      templates.find((t) => t.id === item.templateId) ||
      templates.find((t) => t.id === defaultTemplateId) ||
      templates[0];

    const qty = Math.max(1, item.quantity || 1);
    for (let i = 0; i < qty; i++) {
      result.push({
        queueIndex: qIdx,
        material: item.material,
        controle: item.controle || '',
        template: itemTemplate
      });
    }
  });

  return result;
};

/**
 * Calculates A4 layout strictly respecting the USER's chosen page orientation and rotation.
 * Checks whether the chosen cols x rows fit on the page, or calculates max cols and rows.
 */
export const calculateManualA4Distribution = (
  labelWidthMm: number,
  labelHeightMm: number,
  config: PrintConfig,
  totalItemsCount: number
): LayoutCalculationResult => {
  const isLandscape = config.orientation === 'landscape';
  const pageWidthMm = isLandscape ? 297 : 210;
  const pageHeightMm = isLandscape ? 210 : 297;

  // Physical item dimensions based on rotation
  const isRotated90or270 = config.labelRotation === 90 || config.labelRotation === 270;
  const itemWidthMm = isRotated90or270 ? labelHeightMm : labelWidthMm;
  const itemHeightMm = isRotated90or270 ? labelWidthMm : labelHeightMm;

  const availableWidthMm = pageWidthMm - config.marginLeftMm - config.marginRightMm;
  const availableHeightMm = pageHeightMm - config.marginTopMm - config.marginBottomMm;

  // User manual columns and rows
  const cols = Math.max(1, config.columns);
  const rows = Math.max(1, config.rows);

  const requiredWidthMm = cols * itemWidthMm + (cols - 1) * config.gapHorizontalMm;
  const requiredHeightMm = rows * itemHeightMm + (rows - 1) * config.gapVerticalMm;

  // Compatibility check (+0.5mm tolerance)
  const widthFits = requiredWidthMm <= availableWidthMm + 0.5;
  const heightFits = requiredHeightMm <= availableHeightMm + 0.5;
  const isCompatible = widthFits && heightFits;

  const labelsPerPage = cols * rows;
  const totalPages = Math.max(1, Math.ceil((totalItemsCount + config.startOffsetIndex) / labelsPerPage));

  let incompatibilityReason: string | undefined = undefined;
  if (!isCompatible) {
    incompatibilityReason = `A configuração escolhida (${cols} colunas x ${rows} linhas) não comporta essa quantidade de etiquetas na página A4 ${
      isLandscape ? 'Paisagem' : 'Retrato'
    }.\nÁrea necessária: ${requiredWidthMm.toFixed(1)} x ${requiredHeightMm.toFixed(1)} mm | Área disponível: ${availableWidthMm.toFixed(1)} x ${availableHeightMm.toFixed(1)} mm.`;
  }

  return {
    pageOrientation: config.orientation,
    labelRotation: config.labelRotation,
    columns: cols,
    rows: rows,
    labelsPerPage,
    totalPages,
    cellWidthMm: itemWidthMm,
    cellHeightMm: itemHeightMm,
    availableWidthMm: Number(availableWidthMm.toFixed(1)),
    availableHeightMm: Number(availableHeightMm.toFixed(1)),
    requiredWidthMm: Number(requiredWidthMm.toFixed(1)),
    requiredHeightMm: Number(requiredHeightMm.toFixed(1)),
    isCompatible,
    incompatibilityReason
  };
};

export const calculateOptimalA4Distribution = (
  labelWidthMm: number,
  labelHeightMm: number,
  arg3: number | PrintConfig,
  arg4?: PrintConfig | number
): LayoutCalculationResult => {
  const config = (typeof arg3 === 'object' ? arg3 : typeof arg4 === 'object' ? arg4 : undefined) as PrintConfig;
  const count = (typeof arg3 === 'number' ? arg3 : typeof arg4 === 'number' ? arg4 : 1) as number;
  return calculateManualA4Distribution(labelWidthMm, labelHeightMm, config, count);
};

export const calculateGridDimensions = calculateManualA4Distribution;


/**
 * Suggests maximum fitting columns and rows for a given label and page orientation
 */
export const suggestFittingGrid = (
  labelWidthMm: number,
  labelHeightMm: number,
  orientation: 'portrait' | 'landscape',
  rotation: LabelRotation,
  config: PrintConfig
): { columns: number; rows: number; total: number } => {
  const isLandscape = orientation === 'landscape';
  const pageWidthMm = isLandscape ? 297 : 210;
  const pageHeightMm = isLandscape ? 210 : 297;

  const isRotated = rotation === 90 || rotation === 270;
  const itemW = isRotated ? labelHeightMm : labelWidthMm;
  const itemH = isRotated ? labelWidthMm : labelHeightMm;

  const effW = pageWidthMm - config.marginLeftMm - config.marginRightMm;
  const effH = pageHeightMm - config.marginTopMm - config.marginBottomMm;

  const cols = Math.max(1, Math.floor((effW + config.gapHorizontalMm) / (itemW + config.gapHorizontalMm)));
  const rows = Math.max(1, Math.floor((effH + config.gapVerticalMm) / (itemH + config.gapVerticalMm)));

  return { columns: cols, rows, total: cols * rows };
};

/**
 * Sets CSS @page rule strictly according to user's choice (size: A4 portrait / size: A4 landscape)
 */
export const applyPrintPageStyle = (orientation: 'portrait' | 'landscape') => {
  const existing = document.getElementById('dynamic-print-style');
  if (existing) existing.remove();

  const isLand = orientation === 'landscape';
  const styleEl = document.createElement('style');
  styleEl.id = 'dynamic-print-style';
  styleEl.innerHTML = `
    @media print {
      @page {
        size: ${isLand ? 'A4 landscape' : 'A4 portrait'};
        margin: 0 !important;
      }
      html, body {
        width: ${isLand ? '297mm' : '210mm'} !important;
        height: ${isLand ? '210mm' : '297mm'} !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body * {
        visibility: hidden !important;
      }
      #print-mount-area, #print-mount-area * {
        visibility: visible !important;
      }
      #print-mount-area {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: ${isLand ? '297mm' : '210mm'} !important;
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        z-index: 999999 !important;
      }
      .a4-print-sheet {
        width: ${isLand ? '297mm' : '210mm'} !important;
        height: ${isLand ? '210mm' : '297mm'} !important;
        page-break-after: always !important;
        break-after: page !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        background: #ffffff !important;
      }
    }
  `;
  document.head.appendChild(styleEl);
};

/**
 * High-fidelity, reliable PDF generator for A4 sheets with unit: "mm", format: "a4".
 * Accurately reproduces positions, barcodes, logos, text, and physical dimensions.
 */
export const generatePdfA4 = async (
  pageElements: HTMLElement[],
  orientation: 'portrait' | 'landscape',
  filename = 'etiquetas_almoxarifado.pdf',
  onProgress?: (msg: string) => void
): Promise<void> => {
  if (onProgress) onProgress('Preparando renderização do documento PDF...');

  const isLandscape = orientation === 'landscape';
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidthMm = isLandscape ? 297 : 210;
  const pageHeightMm = isLandscape ? 210 : 297;

  for (let i = 0; i < pageElements.length; i++) {
    const pageEl = pageElements[i];
    if (onProgress) onProgress(`Renderizando página ${i + 1} de ${pageElements.length}...`);

    if (i > 0) {
      pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
    }

    // High scale capture for ultra-crisp barcodes and logo images
    const canvas = await html2canvas(pageEl, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: pageEl.scrollWidth || 1200,
      windowHeight: pageEl.scrollHeight || 1600
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
  }

  if (onProgress) onProgress('Salvando e baixando arquivo PDF...');
  pdf.save(filename);
};
