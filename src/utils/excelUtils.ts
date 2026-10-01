import * as XLSX from 'xlsx';
import { Material, ExcelMapping, ExcelImportValidation } from '../types';

export const DEFAULT_EXCEL_MAPPING: ExcelMapping = {
  codigoCol: '',
  descricaoCol: '',
  unidadeCol: ''
};

export const guessColumnMapping = (headers: string[]): ExcelMapping => {
  const mapping: ExcelMapping = { ...DEFAULT_EXCEL_MAPPING };

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  headers.forEach((header) => {
    const norm = normalize(header);

    // Code guessing
    if (!mapping.codigoCol && (norm.includes('cod') || norm.includes('sku') || norm.includes('item') || norm === 'id')) {
      mapping.codigoCol = header;
    }
    // Description guessing (Descrição or Nome)
    else if (!mapping.descricaoCol && (norm.includes('desc') || norm.includes('nome') || norm.includes('produto') || norm.includes('material') || norm.includes('item'))) {
      mapping.descricaoCol = header;
    }
    // Unit guessing
    else if (!mapping.unidadeCol && (norm.includes('unid') || norm.includes('um') || norm.includes('medida') || norm === 'un')) {
      mapping.unidadeCol = header;
    }
  });

  // Fallbacks if not detected by keywords
  if (!mapping.codigoCol && headers.length > 0) {
    mapping.codigoCol = headers[0];
  }
  if (!mapping.descricaoCol && headers.length > 1) {
    mapping.descricaoCol = headers[1];
  }
  if (!mapping.unidadeCol && headers.length > 2) {
    mapping.unidadeCol = headers[2];
  }

  return mapping;
};

export const parseExcelFile = async (
  file: File
): Promise<{ headers: string[]; rows: any[]; sheetNames: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetNames = workbook.SheetNames;

        if (sheetNames.length === 0) {
          throw new Error('Nenhuma planilha encontrada no arquivo.');
        }

        const firstSheet = workbook.Sheets[sheetNames[0]];
        const rawRows: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

        if (rawRows.length === 0) {
          const aoa: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          if (aoa.length === 0) {
            resolve({ headers: [], rows: [], sheetNames });
            return;
          }
          const headers = (aoa[0] || []).map((h, i) => (h ? String(h).trim() : `Coluna ${i + 1}`));
          const rows = aoa.slice(1).map((r) => {
            const obj: Record<string, any> = {};
            headers.forEach((h, idx) => {
              obj[h] = r[idx] !== undefined ? String(r[idx]).trim() : '';
            });
            return obj;
          });
          resolve({ headers, rows, sheetNames });
          return;
        }

        const headers = Object.keys(rawRows[0] || {});
        resolve({ headers, rows: rawRows, sheetNames });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const validateAndConvertExcel = (
  rawRows: any[],
  mapping: ExcelMapping
): { materials: Material[]; validation: ExcelImportValidation } => {
  const materials: Material[] = [];
  const seenCodes = new Set<string>();
  const duplicateCodes = new Set<string>();
  let emptyCodesCount = 0;
  let missingDescCount = 0;

  rawRows.forEach((row, index) => {
    const rawCode = mapping.codigoCol ? String(row[mapping.codigoCol] ?? '').trim() : '';
    const rawDesc = mapping.descricaoCol ? String(row[mapping.descricaoCol] ?? '').trim() : '';
    const rawUnidade = mapping.unidadeCol ? String(row[mapping.unidadeCol] ?? '').trim() : 'UN';

    if (!rawCode) {
      emptyCodesCount++;
    } else {
      if (seenCodes.has(rawCode)) {
        duplicateCodes.add(rawCode);
      } else {
        seenCodes.add(rawCode);
      }
    }

    if (!rawDesc) {
      missingDescCount++;
    }

    materials.push({
      id: `mat-${index + 1}-${Date.now()}`,
      codigo: rawCode || `SEM-COD-${index + 1}`,
      descricao: rawDesc || `Material sem descrição (${index + 1})`,
      unidade: rawUnidade || 'UN',
      raw: row
    });
  });

  const validation: ExcelImportValidation = {
    totalRows: rawRows.length,
    validRows: rawRows.length - emptyCodesCount,
    duplicateCodesCount: duplicateCodes.size,
    duplicateCodesList: Array.from(duplicateCodes).slice(0, 10),
    emptyCodesCount,
    missingDescCount,
    detectedColumns: Object.keys(rawRows[0] || {})
  };

  return { materials, validation };
};

export const downloadSampleExcelFile = () => {
  const sampleData = [
    {
      'Código': '10001',
      'Descrição': 'Parafuso Sextavado M8 x 25mm',
      'Unidade padrão': 'UN'
    },
    {
      'Código': '10002',
      'Descrição': 'Porca Sextavada M8',
      'Unidade padrão': 'UN'
    },
    {
      'Código': '10003',
      'Descrição': 'Arruela Lisa 5/16',
      'Unidade padrão': 'PC'
    },
    {
      'Código': '10004',
      'Descrição': 'Rolamento Rígido de Esferas 6204-2Z',
      'Unidade padrão': 'UN'
    },
    {
      'Código': '10005',
      'Descrição': 'Luvas de Segurança Nitrílicas Tam G',
      'Unidade padrão': 'PAR'
    },
    {
      'Código': '10006',
      'Descrição': 'Óleo Lubrificante Industrial ISO VG 68',
      'Unidade padrão': 'LT'
    },
    {
      'Código': '10007',
      'Descrição': 'Disco de Corte Fino Inox 4.1/2 Pol',
      'Unidade padrão': 'UN'
    },
    {
      'Código': '10008',
      'Descrição': 'Cabo Flexível 2,5mm² 750V Preto',
      'Unidade padrão': 'M'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Materiais_Almoxarifado');
  XLSX.writeFile(workbook, 'modelo_planilha_almoxarifado.xlsx');
};
