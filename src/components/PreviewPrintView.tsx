import React, { useState, useMemo, useEffect } from 'react';
import { PrintConfig, PrintQueueItem, LabelTemplate, Material, ViewTab, LabelRotation } from '../types';
import { LabelView } from './LabelView';
import { 
  flattenPrintQueue, 
  calculateManualA4Distribution, 
  suggestFittingGrid,
  applyPrintPageStyle,
  generatePdfA4
} from '../utils/printPdfUtils';
import { 
  Printer, 
  FileDown, 
  Settings2, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  FileCheck2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  Compass,
  Columns
} from 'lucide-react';

interface PreviewPrintViewProps {
  queue: PrintQueueItem[];
  templates: LabelTemplate[];
  activeTemplateId: string;
  config: PrintConfig;
  onChangeConfig?: (newConfig: PrintConfig) => void;
  previewMaterial: Material;
  setActiveTab: (tab: ViewTab) => void;
  isTestMode?: boolean;
}

export const PreviewPrintView: React.FC<PreviewPrintViewProps> = ({
  queue,
  templates,
  activeTemplateId,
  config,
  onChangeConfig,
  previewMaterial,
  setActiveTab,
  isTestMode = false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [scalePercent, setScalePercent] = useState(65);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showQuickSettings, setShowQuickSettings] = useState(true);

  const activeTemplate = templates.find((t) => t.id === activeTemplateId) || templates[0];

  // Flattened labels list
  const flattenedLabels = useMemo(() => {
    if (isTestMode) {
      // Test calibration sheet
      return [
        {
          queueIndex: 0,
          material: {
            id: 'test-mat',
            codigo: 'TESTE-10001',
            descricao: 'ETIQUETA DE TESTE DE CALIBRAÇÃO (MEÇA COM UMA RÉGUA FÍSICA)',
            unidade: 'UN'
          },
          controle: 'CALIBRAÇÃO-100%',
          template: activeTemplate
        }
      ];
    }

    if (queue.length === 0) {
      return [
        {
          queueIndex: 0,
          material: previewMaterial,
          controle: 'AMOSTRA',
          template: activeTemplate
        }
      ];
    }

    return flattenPrintQueue(queue, templates, activeTemplateId);
  }, [queue, templates, activeTemplateId, previewMaterial, isTestMode, activeTemplate]);

  // Strict manual calculation respecting USER manual choice of orientation, rotation, and columns/rows
  const layout = useMemo(() => {
    return calculateManualA4Distribution(
      activeTemplate.widthMm,
      activeTemplate.heightMm,
      config,
      flattenedLabels.length
    );
  }, [activeTemplate.widthMm, activeTemplate.heightMm, config, flattenedLabels.length]);

  const effectiveOrientation = config.orientation;
  const effectiveRotation = config.labelRotation;
  const effectiveCols = config.columns;
  const effectiveRows = config.rows;
  const labelsPerPage = effectiveCols * effectiveRows;

  const totalSlotsCount = flattenedLabels.length + config.startOffsetIndex;
  const totalPages = Math.max(1, Math.ceil(totalSlotsCount / (labelsPerPage || 1)));

  // Sync page style for print
  useEffect(() => {
    applyPrintPageStyle(effectiveOrientation);
  }, [effectiveOrientation]);

  // Ensure current page does not exceed totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  // Sizing in mm
  const isLandscape = effectiveOrientation === 'landscape';
  const pageWidthMm = isLandscape ? 297 : 210;
  const pageHeightMm = isLandscape ? 210 : 297;

  // Physical item dimensions based on rotation (90° and 270° swap physical width and height)
  const isRotated90or270 = effectiveRotation === 90 || effectiveRotation === 270;
  const itemWidthMm = isRotated90or270 ? activeTemplate.heightMm : activeTemplate.widthMm;
  const itemHeightMm = isRotated90or270 ? activeTemplate.widthMm : activeTemplate.heightMm;

  // Handlers for instant changes
  const handleOrientationChange = (orient: 'portrait' | 'landscape') => {
    if (onChangeConfig) {
      onChangeConfig({ ...config, orientation: orient });
    }
  };

  const handleRotationChange = (rot: LabelRotation) => {
    if (onChangeConfig) {
      onChangeConfig({ ...config, labelRotation: rot });
    }
  };

  const handleColumnsChange = (cols: number) => {
    if (onChangeConfig) {
      onChangeConfig({ ...config, columns: Math.max(1, cols) });
    }
  };

  const handleRowsChange = (rows: number) => {
    if (onChangeConfig) {
      onChangeConfig({ ...config, rows: Math.max(1, rows) });
    }
  };

  const handleApplyPreset = (cols: number, rows: number) => {
    if (onChangeConfig) {
      onChangeConfig({ ...config, columns: cols, rows: rows });
    }
  };

  const handleAutoFit = () => {
    if (onChangeConfig) {
      const suggested = suggestFittingGrid(
        activeTemplate.widthMm,
        activeTemplate.heightMm,
        config.orientation,
        config.labelRotation,
        config
      );
      onChangeConfig({
        ...config,
        columns: suggested.columns,
        rows: suggested.rows
      });
    }
  };

  // Grid distribution
  const getPageLabels = (pageIndex: number) => {
    const slots: (typeof flattenedLabels[0] | null)[] = [];
    const startIndex = pageIndex * labelsPerPage;

    for (let slot = 0; slot < labelsPerPage; slot++) {
      const globalSlotIndex = startIndex + slot;
      const effectiveDataIndex = globalSlotIndex - config.startOffsetIndex;

      if (effectiveDataIndex >= 0 && effectiveDataIndex < flattenedLabels.length) {
        slots.push(flattenedLabels[effectiveDataIndex]);
      } else {
        slots.push(null);
      }
    }
    return slots;
  };

  // Validation before Print / PDF
  const validateBeforeAction = (): boolean => {
    if (flattenedLabels.length === 0) {
      setValidationError('Nenhuma etiqueta para imprimir. Adicione materiais à fila.');
      return false;
    }
    if (!activeTemplate || activeTemplate.widthMm <= 0 || activeTemplate.heightMm <= 0) {
      setValidationError('O modelo de etiqueta selecionado não possui dimensões válidas.');
      return false;
    }
    if (!layout.isCompatible) {
      setValidationError(
        `A configuração escolhida (${config.columns} col x ${config.rows} lin) não comporta essa quantidade de etiquetas na página A4 ${isLandscape ? 'Paisagem' : 'Retrato'}. Área necessária: ${layout.requiredWidthMm} x ${layout.requiredHeightMm} mm | Área disponível: ${layout.availableWidthMm} x ${layout.availableHeightMm} mm.`
      );
      return false;
    }
    for (const item of flattenedLabels) {
      if (!item.material.codigo || !item.material.codigo.trim()) {
        setValidationError('Existe etiqueta com código vazio na fila de impressão.');
        return false;
      }
    }
    setValidationError(null);
    return true;
  };

  const handlePrint = () => {
    if (!validateBeforeAction()) return;
    applyPrintPageStyle(effectiveOrientation);
    window.print();
  };

  const handleGeneratePdf = async () => {
    if (!validateBeforeAction()) return;
    setIsPdfGenerating(true);
    setPdfProgress('Preparando páginas para PDF...');

    try {
      const printMountArea = document.getElementById('print-mount-area');
      if (!printMountArea) {
        throw new Error('Área de impressão não encontrada no DOM.');
      }

      const pages = Array.from(printMountArea.querySelectorAll<HTMLElement>('.a4-print-sheet'));
      if (pages.length === 0) {
        throw new Error('Nenhuma página de etiqueta encontrada para gerar PDF.');
      }

      await generatePdfA4(
        pages,
        effectiveOrientation,
        `etiquetas_almoxarifado_${effectiveOrientation}_${Date.now()}.pdf`,
        (msg) => setPdfProgress(msg)
      );
    } catch (err: any) {
      alert(`Falha ao gerar PDF: ${err?.message || err}`);
    } finally {
      setIsPdfGenerating(false);
      setPdfProgress(null);
    }
  };

  const quickPresets = [
    { label: '2 x 1 (2)', cols: 2, rows: 1 },
    { label: '1 x 2 (2)', cols: 1, rows: 2 },
    { label: '2 x 2 (4)', cols: 2, rows: 2 },
    { label: '2 x 3 (6)', cols: 2, rows: 3 },
    { label: '2 x 4 (8)', cols: 2, rows: 4 },
    { label: '2 x 5 (10)', cols: 2, rows: 5 },
    { label: '3 x 4 (12)', cols: 3, rows: 4 },
    { label: '4 x 4 (16)', cols: 4, rows: 4 }
  ];

  return (
    <div className="space-y-4">
      {/* Top Action Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-amber-500" />
            <span>
              {isTestMode ? 'Folha de Teste de Calibração' : 'Visualização da Folha A4'} ({flattenedLabels.length} etiqueta{flattenedLabels.length !== 1 ? 's' : ''} · {totalPages} folha{totalPages > 1 ? 's' : ''})
            </span>
          </h2>
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5 font-mono">
            <span>Papel: <strong>A4</strong></span>
            <span>·</span>
            <span className="text-amber-600 font-bold">
              {isLandscape ? 'A4 Paisagem (297 x 210 mm)' : 'A4 Retrato (210 x 297 mm)'}
            </span>
            <span>·</span>
            <span>Rotação: <strong>{effectiveRotation}°</strong></span>
            <span>·</span>
            <span>Grade: <strong>{effectiveCols} col x {effectiveRows} lin</strong></span>
          </div>
        </div>

        {/* Action Buttons: Imprimir e Gerar PDF */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setScalePercent(Math.max(35, scalePercent - 10))}
              className="p-1 hover:bg-white rounded text-slate-700 cursor-pointer"
              title="Reduzir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-xs font-bold text-slate-700">
              {scalePercent}%
            </span>
            <button
              type="button"
              onClick={() => setScalePercent(Math.min(120, scalePercent + 10))}
              className="p-1 hover:bg-white rounded text-slate-700 cursor-pointer"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowQuickSettings(!showQuickSettings)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{showQuickSettings ? 'Ocultar Controles' : 'Ajustar Folha'}</span>
          </button>

          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isPdfGenerating}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isPdfGenerating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{isPdfGenerating ? (pdfProgress || 'Gerando PDF...') : 'Gerar PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-extrabold shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* QUICK SETTINGS BAR (Orientação [RETRATO] [PAISAGEM], Rotação e Grade em Tempo Real) */}
      {showQuickSettings && onChangeConfig && (
        <div className="bg-white border-2 border-slate-300 rounded-xl p-4 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Orientação da Página A4: Escolha Manual [ RETRATO ] [ PAISAGEM ] */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-500" />
                <span>1. Orientação da Folha A4</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOrientationChange('portrait')}
                  className={`py-2 px-3 rounded-lg border-2 text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    config.orientation === 'portrait'
                      ? 'border-amber-500 bg-amber-50 text-slate-950 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>[ RETRATO ]</span>
                  <span className="text-[10px] font-mono font-normal text-slate-500">210 x 297 mm</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOrientationChange('landscape')}
                  className={`py-2 px-3 rounded-lg border-2 text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    config.orientation === 'landscape'
                      ? 'border-amber-500 bg-amber-50 text-slate-950 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>[ PAISAGEM ]</span>
                  <span className="text-[10px] font-mono font-normal text-slate-500">297 x 210 mm</span>
                </button>
              </div>
            </div>

            {/* 2. Rotação da Etiqueta: 0°, 90°, 180°, 270° */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-amber-500" />
                <span>2. Rotação da Etiqueta</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {([0, 90, 180, 270] as LabelRotation[]).map((rot) => (
                  <button
                    key={rot}
                    type="button"
                    onClick={() => handleRotationChange(rot)}
                    className={`py-2 px-1 rounded-lg border-2 text-xs font-mono font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                      config.labelRotation === rot
                        ? 'border-amber-500 bg-amber-50 text-slate-950 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>{rot}°</span>
                    <span className="text-[9px] font-normal text-slate-500">
                      {rot === 0 ? 'Normal' : rot === 90 ? '90°' : rot === 180 ? '180°' : '270°'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Colunas x Linhas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Columns className="w-3.5 h-3.5 text-amber-500" />
                  <span>3. Colunas x Linhas</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoFit}
                  className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                >
                  Máximo que cabe
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500">Colunas:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.columns}
                    onChange={(e) => handleColumnsChange(parseInt(e.target.value) || 1)}
                    className="w-full text-center font-mono font-bold text-xs bg-white border border-slate-300 rounded py-1"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500">Linhas:</span>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={config.rows}
                    onChange={(e) => handleRowsChange(parseInt(e.target.value) || 1)}
                    className="w-full text-center font-mono font-bold text-xs bg-white border border-slate-300 rounded py-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick presets row */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Modelos rápidos:</span>
            {quickPresets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p.cols, p.rows)}
                className={`px-2 py-1 rounded text-[11px] font-medium shrink-0 transition-colors cursor-pointer border ${
                  config.columns === p.cols && config.rows === p.rows
                    ? 'bg-slate-900 text-white border-slate-900 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compatibility Banner: if does not fit, show exact required message */}
      {!layout.isCompatible && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-400 text-red-950 text-xs shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-black text-sm text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>A configuração escolhida não comporta essa quantidade de etiquetas na página.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs pt-1">
            <div className="p-2.5 bg-white/90 rounded border border-red-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Área disponível na página:</span>
              <strong className="text-slate-900 text-sm">{layout.availableWidthMm} x {layout.availableHeightMm} mm</strong>
            </div>
            <div className="p-2.5 bg-white/90 rounded border border-red-200">
              <span className="text-[10px] uppercase font-bold text-red-600 block">Área necessária pelas etiquetas:</span>
              <strong className="text-red-700 text-sm">{layout.requiredWidthMm} x {layout.requiredHeightMm} mm</strong>
            </div>
          </div>
          <p className="text-[11px] text-red-800">
            Sugestão: Reduza o número de colunas ou linhas, alterne a orientação [ RETRATO ] / [ PAISAGEM ] ou ajuste a rotação da etiqueta.
          </p>
        </div>
      )}

      {/* Validation Alert if any */}
      {validationError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>Não foi possível iniciar a impressão:</strong> {validationError}
          </div>
        </div>
      )}

      {/* 15. IMPRESSÃO SEM REDIMENSIONAMENTO (Aviso obrigatório para escala 100%) */}
      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Aviso de Impressão:</strong> Na janela de impressão do seu navegador, selecione <strong>Escala: 100%</strong> (ou &quot;Tamanho Real&quot;) e desative margens extras para manter as dimensões milimétricas reais.
          </span>
        </div>
        <div className="font-mono text-[11px] text-amber-800 font-bold shrink-0">
          Escala: 100%
        </div>
      </div>

      {/* Multipage navigator */}
      {totalPages > 1 && (
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="flex items-center gap-1 px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Página Anterior</span>
          </button>

          <div className="font-bold text-slate-800 font-mono">
            Folha A4 {currentPage} de {totalPages}
          </div>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            className="flex items-center gap-1 px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-800"
          >
            <span>Próxima Página</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Interactive On-Screen Visualizer of the current page */}
      <div className="bg-slate-200/90 p-4 sm:p-8 rounded-2xl border border-slate-300 shadow-inner flex flex-col items-center justify-center overflow-auto min-h-[640px]">
        <div
          className="transition-transform origin-top"
          style={{
            transform: `scale(${scalePercent / 100})`,
            marginBottom: `${((scalePercent / 100) - 1) * (pageHeightMm * 3.78)}px`
          }}
        >
          {/* Physical Sheet Container in mm */}
          <div
            className="bg-white shadow-2xl relative select-none"
            style={{
              width: `${pageWidthMm}mm`,
              height: `${pageHeightMm}mm`,
              boxSizing: 'border-box',
              paddingTop: `${config.marginTopMm}mm`,
              paddingBottom: `${config.marginBottomMm}mm`,
              paddingLeft: `${config.marginLeftMm}mm`,
              paddingRight: `${config.marginRightMm}mm`
            }}
          >
            {/* Calibration Ruler if test mode */}
            {isTestMode && (
              <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-500 pointer-events-none">
                <div className="font-bold text-slate-800">RÉGUA DE CALIBRAÇÃO DE IMPRESSÃO (ESCALA 100%)</div>
                <div className="w-[100mm] h-3 border-b-2 border-slate-800 flex justify-between text-[8px]">
                  <span>| 0mm</span>
                  <span>| 25mm</span>
                  <span>| 50mm</span>
                  <span>| 75mm</span>
                  <span>| 100mm |</span>
                </div>
              </div>
            )}

            {/* Grid of Labels */}
            <div
              className="w-full h-full"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${effectiveCols}, ${itemWidthMm}mm)`,
                gridTemplateRows: `repeat(${effectiveRows}, ${itemHeightMm}mm)`,
                columnGap: `${config.gapHorizontalMm}mm`,
                rowGap: `${config.gapVerticalMm}mm`,
                boxSizing: 'border-box'
              }}
            >
              {getPageLabels(currentPage - 1).map((item, idx) => (
                <div
                  key={idx}
                  className={`relative flex items-center justify-center overflow-hidden ${
                    config.showCutLines ? 'border border-dashed border-slate-300' : ''
                  }`}
                  style={{
                    width: `${itemWidthMm}mm`,
                    height: `${itemHeightMm}mm`,
                    boxSizing: 'border-box'
                  }}
                >
                  {item ? (
                    <LabelView
                      template={item.template}
                      material={item.material}
                      controle={item.controle}
                      rotation={effectiveRotation}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 font-mono text-[9px]">
                      <span>Célula Vazia</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA EXCLUSIVA DE IMPRESSÃO (Visível para o navegador em window.print() e para jsPDF) */}
      <div id="print-mount-area">
        {Array.from({ length: totalPages }).map((_, pIdx) => (
          <div
            key={pIdx}
            className="a4-print-sheet bg-white"
            style={{
              width: `${pageWidthMm}mm`,
              height: `${pageHeightMm}mm`,
              paddingTop: `${config.marginTopMm}mm`,
              paddingBottom: `${config.marginBottomMm}mm`,
              paddingLeft: `${config.marginLeftMm}mm`,
              paddingRight: `${config.marginRightMm}mm`,
              boxSizing: 'border-box',
              pageBreakAfter: 'always',
              breakAfter: 'page',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${effectiveCols}, ${itemWidthMm}mm)`,
                gridTemplateRows: `repeat(${effectiveRows}, ${itemHeightMm}mm)`,
                columnGap: `${config.gapHorizontalMm}mm`,
                rowGap: `${config.gapVerticalMm}mm`,
                width: '100%',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              {getPageLabels(pIdx).map((item, cellIdx) => (
                <div
                  key={cellIdx}
                  className={config.printCutLines ? 'border border-dashed border-slate-400' : ''}
                  style={{
                    width: `${itemWidthMm}mm`,
                    height: `${itemHeightMm}mm`,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {item ? (
                    <LabelView
                      template={item.template}
                      material={item.material}
                      controle={item.controle}
                      rotation={effectiveRotation}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
