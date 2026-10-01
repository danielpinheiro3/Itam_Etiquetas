import React, { useState } from 'react';
import { Material, LabelTemplate, PrintQueueItem, ViewTab, CompanyIdentity } from '../types';
import { LabelView } from './LabelView';
import { 
  Boxes, 
  Layers, 
  Printer, 
  FileSpreadsheet, 
  Search, 
  ArrowRight, 
  Plus, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Laptop,
  Database,
  Building2
} from 'lucide-react';
import { downloadSampleExcelFile } from '../utils/excelUtils';

interface DashboardViewProps {
  materials: Material[];
  activeTemplate: LabelTemplate;
  queue: PrintQueueItem[];
  lastImportDate: string | null;
  companyIdentity: CompanyIdentity;
  setActiveTab: (tab: ViewTab) => void;
  onSearchCode: (code: string) => void;
  onAddToQueue: (material: Material, controle: string, quantity: number, templateId?: string) => void;
  onLoadSampleData: () => void;
  onSelectMaterialToPrint: (material: Material) => void;
  onPrintTestSheet: () => void;
  onOpenExportOfflineModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  materials,
  activeTemplate,
  queue,
  lastImportDate,
  companyIdentity,
  setActiveTab,
  onSearchCode,
  onAddToQueue,
  onLoadSampleData,
  onSelectMaterialToPrint,
  onPrintTestSheet,
  onOpenExportOfflineModal
}) => {
  const [quickCodeInput, setQuickCodeInput] = useState('');
  const [quickControleInput, setQuickControleInput] = useState('');
  const [quickFound, setQuickFound] = useState<Material | null>(null);
  const [quickNotFound, setQuickNotFound] = useState(false);
  const [quickQty, setQuickQty] = useState(2);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const totalQueueItems = queue.reduce((acc, item) => acc + item.quantity, 0);

  const handleQuickSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = quickCodeInput.trim().toUpperCase();
    if (!query) return;

    const match = materials.find(
      (m) => m.codigo.toUpperCase() === query || m.codigo.toUpperCase().replace(/\D/g, '') === query.replace(/\D/g, '')
    );

    if (match) {
      setQuickFound(match);
      setQuickNotFound(false);
    } else {
      setQuickFound(null);
      setQuickNotFound(true);
    }
  };

  const handleAddQuickToQueue = () => {
    if (!quickFound) return;
    onAddToQueue(quickFound, quickControleInput, quickQty, activeTemplate.id);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Brand Identity & Offline Ready Hero Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="flex items-center gap-4">
          {companyIdentity.logoUrl ? (
            <img
              src={companyIdentity.logoUrl}
              alt="Logo da Empresa"
              className="w-16 h-16 object-contain rounded-xl bg-white p-1.5 shadow-md shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-inner shrink-0">
              ALM
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% OFFLINE & PORTÁTIL
              </span>
              <span className="text-xs text-slate-400 font-mono">v1.0</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider mt-1">
              {companyIdentity.systemName || 'SISTEMA DE ETIQUETAS'}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-amber-400 tracking-widest uppercase">
              {companyIdentity.subtitle || 'ALMOXARIFADO'}
            </p>
          </div>
        </div>

        {/* Quick System Actions: Export Offline & Backup */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <button
            type="button"
            onClick={onOpenExportOfflineModal}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Laptop className="w-4 h-4" />
            <span>Exportar Versão Offline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup-restore')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span>Backup e Restauração</span>
          </button>
        </div>
      </div>

      {/* Top Banner / Hero Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Materiais */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Materiais no Excel</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {materials.length}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>{materials.length > 0 ? 'Base ativa pronta para busca' : 'Nenhum material importado'}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Modelo Atual */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="overflow-hidden pr-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Modelo Ativo</div>
            <div className="text-sm font-bold text-slate-900 mt-1 truncate" title={activeTemplate.name}>
              {activeTemplate.name.split(' - ')[0]}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono font-bold">
              {activeTemplate.widthMm} x {activeTemplate.heightMm} mm
            </div>
          </div>
          <button
            onClick={() => setActiveTab('editor')}
            className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-colors shrink-0"
            title="Abrir Editor de Layout"
          >
            <Layers className="w-6 h-6" />
          </button>
        </div>

        {/* Metric 3: Fila de Impressão */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fila de Impressão</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {totalQueueItems} <span className="text-xs font-normal text-slate-500">({queue.length} registros)</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {queue.length > 0 ? 'Pronto para folha A4' : 'Fila vazia'}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('queue')}
            className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
            title="Ver Fila de Impressão"
          >
            <Printer className="w-6 h-6" />
          </button>
        </div>

        {/* Metric 4: Test Sheet Button */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calibração Impressora</div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              Régua Escala 100%
            </div>
            <button
              onClick={onPrintTestSheet}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold mt-1 flex items-center gap-1 cursor-pointer"
            >
              <span>Imprimir página teste</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={onPrintTestSheet}
            className="w-12 h-12 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Imprimir folha de teste com régua física de calibração"
          >
            <Printer className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Prominent Search & Instant Label Generator Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pesquisa de Material & Geração de Etiqueta</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Digite o código do material
          </h2>
          <p className="text-sm text-slate-300 mb-6">
            O sistema localiza na planilha Excel e preenche Código, Descrição e Unidade padrão. Você pode informar o Controle manualmente.
          </p>

          <form onSubmit={handleQuickSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={quickCodeInput}
                onChange={(e) => {
                  setQuickCodeInput(e.target.value);
                  setQuickNotFound(false);
                }}
                placeholder="Informe o código do material (ex: 10001)..."
                className="w-full h-13 pl-4 pr-10 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-base font-mono font-bold shadow-inner focus:outline-hidden focus:ring-3 focus:ring-amber-400"
                autoFocus
              />
              {quickCodeInput && (
                <button
                  type="button"
                  onClick={() => {
                    setQuickCodeInput('');
                    setQuickFound(null);
                    setQuickNotFound(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              className="h-13 px-6 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md whitespace-nowrap cursor-pointer"
            >
              <Search className="w-5 h-5" />
              <span>Buscar Código</span>
            </button>
          </form>

          {quickNotFound && (
            <div className="mt-4 p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Material não localizado na planilha</p>
                <p className="text-xs text-red-300 mt-0.5">
                  Nenhum registro corresponde ao código <strong>&quot;{quickCodeInput}&quot;</strong>.
                </p>
              </div>
            </div>
          )}

          {materials.length === 0 && (
            <div className="mt-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-amber-300">Base vazia</p>
                <p className="text-xs text-slate-300">
                  Deseja carregar 15 materiais de exemplo do almoxarifado para testar agora?
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onLoadSampleData}
                  className="px-3 py-1.5 bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Carregar Amostra
                </button>
                <button
                  type="button"
                  onClick={downloadSampleExcelFile}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Modelo .xlsx</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Found Material Inline Preview Card */}
        {quickFound && (
          <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col lg:flex-row items-center gap-6">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-md">
              <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
                <span>Pré-visualização da Etiqueta:</span>
                <span className="text-amber-400">{activeTemplate.name.split(' - ')[0]}</span>
              </div>
              <div className="bg-white p-2 rounded shadow-inner inline-block">
                <LabelView
                  template={activeTemplate}
                  material={quickFound}
                  controle={quickControleInput}
                />
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                  CÓDIGO: {quickFound.codigo}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{quickFound.descricao}</h3>
                <div className="text-xs font-mono text-slate-400 mt-1">
                  UNIDADE PADRÃO: <strong className="text-white">{quickFound.unidade}</strong>
                </div>
              </div>

              {/* Manual Controle Input */}
              <div className="p-3 rounded-lg bg-slate-800/90 border border-slate-700 max-w-sm">
                <label className="block text-[11px] font-bold text-amber-300 mb-1">
                  Controle (Manual para esta etiqueta):
                </label>
                <input
                  type="text"
                  value={quickControleInput}
                  onChange={(e) => setQuickControleInput(e.target.value)}
                  placeholder="Ex: 45879 ou deixe em branco..."
                  className="w-full h-8 px-2.5 rounded bg-slate-900 border border-slate-600 text-white font-mono font-bold text-xs focus:ring-1 focus:ring-amber-400 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
                  <span className="text-xs text-slate-300 px-2 font-medium">Qtd:</span>
                  <button
                    type="button"
                    onClick={() => setQuickQty(Math.max(1, quickQty - 1))}
                    className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-sm">{quickQty}</span>
                  <button
                    type="button"
                    onClick={() => setQuickQty(quickQty + 1)}
                    className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddQuickToQueue}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar à Fila</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onAddToQueue(quickFound, quickControleInput, quickQty, activeTemplate.id);
                    setActiveTab('preview-print');
                  }}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir em Folha A4</span>
                </button>

                {addedSuccess && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold animate-pulse">
                    <CheckCircle2 className="w-4 h-4" />
                    Adicionado à fila!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => setActiveTab('import-excel')}
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Importar Planilha Excel</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Mapeie Código, Descrição e Unidade padrão de qualquer arquivo .XLSX ou .XLS.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-amber-600 gap-1">
            <span>Acessar importação</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('editor')}
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Editor de Layout Visual</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Arraste os campos de Código, Descrição, Controle, Unidade e Código de barras em milímetros reais.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-amber-600 gap-1">
            <span>Abrir editor visual</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('preview-print')}
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Printer className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Visualizar Folha A4 & PDF</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Cálculo automático de orientação (Retrato/Paisagem) e rotação de 90° com escala 100% exata.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-amber-600 gap-1">
            <span>Visualizar e Imprimir</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
