import React from 'react';
import { PrintConfig, LabelTemplate, LabelRotation } from '../types';
import { calculateManualA4Distribution, suggestFittingGrid } from '../utils/printPdfUtils';
import { 
  Settings2, 
  Printer, 
  RotateCw, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  SlidersHorizontal,
  Compass,
  FileCheck2,
  Columns
} from 'lucide-react';

interface PrintConfigViewProps {
  config: PrintConfig;
  onChangeConfig: (newConfig: PrintConfig) => void;
  activeTemplate: LabelTemplate;
  onPrintTestSheet: () => void;
  setActiveTab: (tab: any) => void;
}

export const PrintConfigView: React.FC<PrintConfigViewProps> = ({
  config,
  onChangeConfig,
  activeTemplate,
  onPrintTestSheet,
  setActiveTab
}) => {
  // Manual distribution calculation strictly respecting user's orientation and rotation
  const layout = calculateManualA4Distribution(
    activeTemplate.widthMm,
    activeTemplate.heightMm,
    config,
    config.columns * config.rows
  );

  const isLandscape = config.orientation === 'landscape';

  const handleOrientationChange = (orient: 'portrait' | 'landscape') => {
    onChangeConfig({
      ...config,
      orientation: orient
    });
  };

  const handleRotationChange = (rot: LabelRotation) => {
    onChangeConfig({
      ...config,
      labelRotation: rot
    });
  };

  const handleApplyPreset = (cols: number, rows: number) => {
    onChangeConfig({
      ...config,
      columns: cols,
      rows: rows
    });
  };

  // Quick auto-fit helper to find maximum columns and rows for current page and rotation
  const handleAutoFitGrid = () => {
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
  };

  const quickPresets = [
    { label: '2 col x 1 lin = 2 etiquetas', cols: 2, rows: 1 },
    { label: '1 col x 2 lin = 2 etiquetas', cols: 1, rows: 2 },
    { label: '2 col x 2 lin = 4 etiquetas', cols: 2, rows: 2 },
    { label: '2 col x 3 lin = 6 etiquetas', cols: 2, rows: 3 },
    { label: '2 col x 4 lin = 8 etiquetas', cols: 2, rows: 4 },
    { label: '2 col x 5 lin = 10 etiquetas', cols: 2, rows: 5 },
    { label: '3 col x 4 lin = 12 etiquetas', cols: 3, rows: 4 },
    { label: '4 col x 4 lin = 16 etiquetas', cols: 4, rows: 4 }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-amber-500" />
            <span>Configuração da Folha A4 e Impressão</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            A escolha de orientação da página e rotação da etiqueta é manual e totalmente controlada por você.
          </p>
        </div>

        {/* 16. BOTÃO DE TESTE DE IMPRESSÃO */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrintTestSheet}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Imprimir teste (Régua 100%)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview-print')}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Visualizar Folha</span>
          </button>
        </div>
      </div>

      {/* 1. ORIENTAÇÃO DA PÁGINA A4 (ESCOLHA MANUAL VISÍVEL [ RETRATO ] [ PAISAGEM ]) */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-500" />
            <span>1. Escolha Manual da Orientação da Página A4</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            O sistema respeita rigorosamente a sua escolha de orientação.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleOrientationChange('portrait')}
            className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
              config.orientation === 'portrait'
                ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/20 shadow-xs'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="w-12 h-16 border-2 border-slate-700 bg-white rounded shadow-xs flex items-center justify-center text-[10px] font-mono font-bold text-slate-800">
              A4
            </div>
            <div className="text-sm font-black text-slate-900">[ RETRATO ]</div>
            <div className="text-xs font-mono text-slate-500">210 mm x 297 mm (Vertical)</div>
          </button>

          <button
            type="button"
            onClick={() => handleOrientationChange('landscape')}
            className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
              config.orientation === 'landscape'
                ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/20 shadow-xs'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="w-16 h-12 border-2 border-slate-700 bg-white rounded shadow-xs flex items-center justify-center text-[10px] font-mono font-bold text-slate-800">
              A4
            </div>
            <div className="text-sm font-black text-slate-900">[ PAISAGEM ]</div>
            <div className="text-xs font-mono text-slate-500">297 mm x 210 mm (Horizontal)</div>
          </button>
        </div>
      </div>

      {/* 2. ROTAÇÃO DA ETIQUETA (INDEPENDENTE DA ORIENTAÇÃO: 0°, 90°, 180°, 270°) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-amber-500" />
            <span>2. Rotação da Etiqueta dentro da Página (0°, 90°, 180°, 270°)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            A rotação da etiqueta é independente da orientação da folha e preserva as proporções e dimensões físicas exatas sem distorção.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([0, 90, 180, 270] as LabelRotation[]).map((rot) => (
            <button
              key={rot}
              type="button"
              onClick={() => handleRotationChange(rot)}
              className={`py-3 px-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                config.labelRotation === rot
                  ? 'border-amber-500 bg-amber-50/70 font-bold text-slate-950 shadow-xs'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold'
              }`}
            >
              <div className="text-base font-mono font-black">{rot}°</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {rot === 0
                  ? 'Normal'
                  : rot === 90
                  ? 'Rotacionada 90°'
                  : rot === 180
                  ? 'Invertida 180°'
                  : 'Rotacionada 270°'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. CONFIGURAÇÃO MANUAL DAS ETIQUETAS POR PÁGINA (COLUNAS X LINHAS) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Columns className="w-4 h-4 text-amber-500" />
              <span>3. Distribuição das Etiquetas por Página</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Informe a quantidade de colunas e linhas desejadas na folha A4.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAutoFitGrid}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold self-start sm:self-auto cursor-pointer"
          >
            Calcular máximo que cabe
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Quantidade de Colunas:
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.columns}
              onChange={(e) =>
                onChangeConfig({ ...config, columns: Math.max(1, parseInt(e.target.value) || 1) })
              }
              className="w-full h-10 px-3 font-mono font-bold text-sm bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Quantidade de Linhas:
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={config.rows}
              onChange={(e) =>
                onChangeConfig({ ...config, rows: Math.max(1, parseInt(e.target.value) || 1) })
              }
              className="w-full h-10 px-3 font-mono font-bold text-sm bg-white border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
            Modelos rápidos de grade:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickPresets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p.cols, p.rows)}
                className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-left truncate transition-colors cursor-pointer ${
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
      </div>

      {/* Status da Configuração: Compatibilidade, Área Disponível vs Necessária */}
      <div className={`p-5 rounded-2xl border ${
        layout.isCompatible
          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
          : 'bg-red-50 border-red-300 text-red-950'
      }`}>
        <div className="flex items-start gap-3">
          {layout.isCompatible ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 space-y-1">
            <div className="font-bold text-sm">
              {layout.isCompatible
                ? 'Configuração válida e compatível com a folha A4!'
                : 'A configuração escolhida não comporta essa quantidade de etiquetas na página.'}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
              <div className="p-2 bg-white/80 rounded border border-current">
                <span className="text-[10px] block opacity-75">Área Necessária:</span>
                <strong>{layout.requiredWidthMm} x {layout.requiredHeightMm} mm</strong>
              </div>
              <div className="p-2 bg-white/80 rounded border border-current">
                <span className="text-[10px] block opacity-75">Área Disponível:</span>
                <strong>{layout.availableWidthMm} x {layout.availableHeightMm} mm</strong>
              </div>
              <div className="p-2 bg-white/80 rounded border border-current">
                <span className="text-[10px] block opacity-75">Por Folha:</span>
                <strong>{layout.labelsPerPage} etiquetas</strong>
              </div>
              <div className="p-2 bg-white/80 rounded border border-current">
                <span className="text-[10px] block opacity-75">Orientação / Rotação:</span>
                <strong>{isLandscape ? 'Paisagem' : 'Retrato'} · {config.labelRotation}°</strong>
              </div>
            </div>

            {!layout.isCompatible && (
              <p className="text-xs text-red-800 mt-2">
                Dica: Reduza o número de colunas/linhas, alterne entre Retrato e Paisagem ou ajuste a rotação da etiqueta para 90°.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Margins & Gaps */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-500" />
            <span>Margens da Folha e Espaçamentos (mm)</span>
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block mb-1">Margem Superior (mm)</span>
            <input
              type="number"
              min="0"
              max="40"
              value={config.marginTopMm}
              onChange={(e) =>
                onChangeConfig({ ...config, marginTopMm: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full h-8 px-2 font-mono font-bold border border-slate-300 rounded"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block mb-1">Margem Inferior (mm)</span>
            <input
              type="number"
              min="0"
              max="40"
              value={config.marginBottomMm}
              onChange={(e) =>
                onChangeConfig({ ...config, marginBottomMm: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full h-8 px-2 font-mono font-bold border border-slate-300 rounded"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block mb-1">Margem Esquerda (mm)</span>
            <input
              type="number"
              min="0"
              max="40"
              value={config.marginLeftMm}
              onChange={(e) =>
                onChangeConfig({ ...config, marginLeftMm: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full h-8 px-2 font-mono font-bold border border-slate-300 rounded"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block mb-1">Margem Direita (mm)</span>
            <input
              type="number"
              min="0"
              max="40"
              value={config.marginRightMm}
              onChange={(e) =>
                onChangeConfig({ ...config, marginRightMm: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full h-8 px-2 font-mono font-bold border border-slate-300 rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block mb-1">Espaço Horizontal entre Etiquetas (mm)</span>
            <input
              type="number"
              min="0"
              max="20"
              value={config.gapHorizontalMm}
              onChange={(e) =>
                onChangeConfig({ ...config, gapHorizontalMm: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full h-8 px-2 font-mono font-bold border border-slate-300 rounded"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block mb-1">Espaço Vertical entre Etiquetas (mm)</span>
            <input
              type="number"
              min="0"
              max="20"
              value={config.gapVerticalMm}
              onChange={(e) =>
                onChangeConfig({ ...config, gapVerticalMm: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full h-8 px-2 font-mono font-bold border border-slate-300 rounded"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showCutLines}
              onChange={(e) => onChangeConfig({ ...config, showCutLines: e.target.checked })}
              className="rounded text-amber-500"
            />
            <span>Exibir linhas guias pontilhadas na tela</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.printCutLines}
              onChange={(e) => onChangeConfig({ ...config, printCutLines: e.target.checked })}
              className="rounded text-amber-500"
            />
            <span>Imprimir linhas guias pontilhadas no papel</span>
          </label>
        </div>
      </div>
    </div>
  );
};
