import React, { useState, useMemo } from 'react';
import { PrintQueueItem, LabelTemplate, Material, ViewTab, PrintConfig } from '../types';
import { calculateManualA4Distribution } from '../utils/printPdfUtils';
import { 
  Printer, 
  Trash2, 
  Plus, 
  FileCheck2, 
  Search, 
  Copy, 
  LayoutGrid,
  RotateCw
} from 'lucide-react';

interface QueueViewProps {
  queue: PrintQueueItem[];
  templates: LabelTemplate[];
  activeTemplate: LabelTemplate;
  printConfig: PrintConfig;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onUpdateControle: (id: string, newControle: string) => void;
  onUpdateTemplate: (id: string, newTemplateId: string) => void;
  onRemoveItem: (id: string) => void;
  onDuplicateItem: (id: string) => void;
  onClearQueue: () => void;
  onAddMaterialToQueue: (material: Material, controle: string, quantity: number, templateId?: string) => void;
  materials: Material[];
  setActiveTab: (tab: ViewTab) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  queue,
  templates,
  activeTemplate,
  printConfig,
  onUpdateQuantity,
  onUpdateControle,
  onUpdateTemplate,
  onRemoveItem,
  onDuplicateItem,
  onClearQueue,
  onAddMaterialToQueue,
  materials,
  setActiveTab
}) => {
  const [quickAddCode, setQuickAddCode] = useState('');
  const [quickAddControle, setQuickAddControle] = useState('');
  const [quickAddQty, setQuickAddQty] = useState(1);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);

  const totalLabels = queue.reduce((acc, item) => acc + item.quantity, 0);

  // Calculate manual layout for the current queue strictly respecting user config
  const manualLayout = useMemo(() => {
    return calculateManualA4Distribution(
      activeTemplate.widthMm,
      activeTemplate.heightMm,
      printConfig,
      totalLabels || 1
    );
  }, [activeTemplate.widthMm, activeTemplate.heightMm, totalLabels, printConfig]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const query = quickAddCode.trim().toUpperCase();
    if (!query) return;

    const match = materials.find(
      (m) => m.codigo.toUpperCase() === query || m.codigo.replace(/\D/g, '') === query.replace(/\D/g, '')
    );

    if (match) {
      onAddMaterialToQueue(match, quickAddControle, quickAddQty, templates[0]?.id);
      setQuickAddCode('');
      setQuickAddControle('');
      setQuickAddQty(1);
      setQuickAddError(null);
    } else {
      setQuickAddError(`Material com código "${query}" não localizado na base.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-500" />
            <span>Fila de Impressão ({totalLabels} etiquetas no total)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monte a folha combinando materiais diferentes ou o mesmo código com múltiplos Controles manuais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja limpar todos os itens da fila de impressão?')) {
                  onClearQueue();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Fila</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('preview-print')}
            disabled={queue.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer ${
              queue.length > 0
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Visualizar Folha A4 ({manualLayout.totalPages} página{manualLayout.totalPages > 1 ? 's' : ''})</span>
          </button>
        </div>
      </div>

      {/* Summary Box & Fast Add Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Layout Engine Summary */}
        <div className="lg:col-span-5 bg-slate-900 text-white border border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-amber-400 text-xs font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4" />
                Configuração da Folha A4 ({printConfig.orientation === 'landscape' ? 'Paisagem' : 'Retrato'})
              </span>
              <span className="text-[10px] text-slate-300 font-mono">
                {activeTemplate.widthMm}x{activeTemplate.heightMm}mm
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
              <div className="p-2 rounded-lg bg-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Total Etiquetas</div>
                <div className="text-lg font-bold text-amber-400">{totalLabels}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Por Folha</div>
                <div className="text-lg font-bold text-white">{manualLayout.labelsPerPage}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Folhas A4</div>
                <div className="text-lg font-bold text-emerald-400">{manualLayout.totalPages}</div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span>
              <strong>A4 {printConfig.orientation === 'landscape' ? 'Paisagem' : 'Retrato'}</strong> ({manualLayout.columns}x{manualLayout.rows}) · Rotação {printConfig.labelRotation}°
            </span>
            <button
              onClick={() => setActiveTab('print-config')}
              className="text-amber-400 hover:underline font-semibold cursor-pointer"
            >
              Ajustar
            </button>
          </div>
        </div>

        {/* Quick Add By Code Input with Manual Controle */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-amber-500" />
            <span>Adicionar Rápido por Código & Controle à Fila</span>
          </div>

          <form onSubmit={handleQuickAdd} className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  value={quickAddCode}
                  onChange={(e) => {
                    setQuickAddCode(e.target.value);
                    setQuickAddError(null);
                  }}
                  placeholder="Código (ex: 10001)..."
                  className="w-full h-10 px-3 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={quickAddControle}
                  onChange={(e) => setQuickAddControle(e.target.value)}
                  placeholder="Controle (ex: 45879)..."
                  className="w-full h-10 px-3 text-xs font-mono font-bold bg-amber-50/50 border border-amber-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3 flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={quickAddQty}
                  onChange={(e) => setQuickAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 h-10 px-1 text-center font-mono font-bold text-xs border border-slate-300 rounded-lg"
                  title="Quantidade"
                />
                <button
                  type="submit"
                  className="flex-1 h-10 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Fila</span>
                </button>
              </div>
            </div>

            {quickAddError && (
              <p className="text-xs text-red-600 font-medium">{quickAddError}</p>
            )}
          </form>
        </div>
      </div>

      {/* Queue Items Table */}
      {queue.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Printer className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">A fila de impressão está vazia</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Adicione materiais através da busca na tela &quot;Criar Etiqueta&quot; ou na tabela de &quot;Materiais&quot;.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('create-label')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Buscar Código do Material
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-mono">Código</th>
                  <th className="py-3 px-4">Descrição do Material</th>
                  <th className="py-3 px-4 font-mono">Unidade</th>
                  <th className="py-3 px-4 font-mono">Controle Manual</th>
                  <th className="py-3 px-4">Modelo da Etiqueta</th>
                  <th className="py-3 px-4 text-center">Quantidade</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-950">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {item.material.codigo}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs" title={item.material.descricao}>
                      <div>{item.material.descricao}</div>
                      {item.controle.trim() ? (
                        <div className="text-[11px] font-bold text-slate-950 font-mono mt-0.5">
                          Na etiqueta: {item.material.descricao} - {item.controle.trim()}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 font-bold">
                      {item.material.unidade}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.controle}
                        onChange={(e) => onUpdateControle(item.id, e.target.value)}
                        placeholder="Sem controle"
                        className="w-28 h-7 px-2 font-mono text-xs font-bold border border-amber-300 rounded bg-amber-50/40 focus:bg-white focus:ring-1 focus:ring-amber-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={item.templateId}
                        onChange={(e) => onUpdateTemplate(item.id, e.target.value)}
                        className="h-8 px-2 rounded border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 max-w-[200px]"
                      >
                        {templates.map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.name.split(' - ')[0]} ({tpl.widthMm}x{tpl.heightMm})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={item.quantity}
                          onChange={(e) =>
                            onUpdateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-14 h-7 text-center font-mono font-bold text-xs border border-slate-200 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onDuplicateItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Duplicar etiqueta"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Remover da fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-600">
              Total de <strong>{totalLabels}</strong> etiquetas divididas em <strong>{manualLayout.totalPages}</strong> folha(s) A4.
            </span>

            <button
              type="button"
              onClick={() => setActiveTab('preview-print')}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Avançar para Visualização da Folha A4</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
