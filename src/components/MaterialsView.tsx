import React, { useState, useMemo } from 'react';
import { Material, LabelTemplate } from '../types';
import { 
  Search, 
  Plus, 
  Printer, 
  Trash2, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2,
  Boxes,
  Tag
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface MaterialsViewProps {
  materials: Material[];
  activeTemplate: LabelTemplate;
  onAddToQueue: (material: Material, controle: string, quantity: number, templateId?: string) => void;
  onSelectMaterialToPrint: (material: Material) => void;
  onClearMaterials: () => void;
  onNavigateToImport: () => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  materials,
  activeTemplate,
  onAddToQueue,
  onSelectMaterialToPrint,
  onClearMaterials,
  onNavigateToImport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [selectedControles, setSelectedControles] = useState<Record<string, string>>({});
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return materials.filter((m) => {
      return (
        !term ||
        m.codigo.toLowerCase().includes(term) ||
        m.descricao.toLowerCase().includes(term) ||
        m.unidade.toLowerCase().includes(term)
      );
    });
  }, [materials, searchTerm]);

  const handleQuantityChange = (id: string, qty: number) => {
    setSelectedQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, qty)
    }));
  };

  const handleControleChange = (id: string, ctrl: string) => {
    setSelectedControles((prev) => ({
      ...prev,
      [id]: ctrl
    }));
  };

  const handleAdd = (mat: Material) => {
    const qty = selectedQuantities[mat.id] || 1;
    const ctrl = selectedControles[mat.id] || '';
    onAddToQueue(mat, ctrl, qty, activeTemplate.id);
    setLastAddedId(mat.id);
    setTimeout(() => setLastAddedId(null), 1800);
  };

  const handleExportExcel = () => {
    if (materials.length === 0) return;
    const exportData = materials.map((m) => ({
      'Código': m.codigo,
      'Descrição': m.descricao,
      'Unidade padrão': m.unidade
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Materiais');
    XLSX.writeFile(wb, `banco_materiais_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-500" />
            <span>Banco de Materiais ({materials.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dados importados da planilha: Código, Descrição e Unidade padrão. O Controle é informado na criação.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {materials.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exportar Excel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja realmente limpar todos os materiais carregados em memória?')) {
                    onClearMaterials();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Banco</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onNavigateToImport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>+ Importar Planilha</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por código, descrição ou unidade padrão..."
            className="w-full h-9 pl-9 pr-8 text-xs font-medium bg-slate-50 hover:bg-white focus:bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {materials.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Boxes className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Nenhum material na base de dados</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Importe uma planilha Excel (.xlsx ou .xls) com as colunas de Código, Descrição e Unidade padrão.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onNavigateToImport}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Importar Planilha Agora
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-mono">Código</th>
                  <th className="py-3 px-4">Descrição do Material</th>
                  <th className="py-3 px-4 font-mono">Unidade padrão</th>
                  <th className="py-3 px-4">Controle Manual (para a etiqueta)</th>
                  <th className="py-3 px-4 text-right">Adicionar à Fila</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map((mat) => {
                  const qty = selectedQuantities[mat.id] || 1;
                  const ctrl = selectedControles[mat.id] || '';
                  const isJustAdded = lastAddedId === mat.id;

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-950 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {mat.codigo}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 max-w-sm truncate" title={mat.descricao}>
                        {mat.descricao}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {mat.unidade || 'UN'}
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          placeholder="Informe o controle..."
                          value={ctrl}
                          onChange={(e) => handleControleChange(mat.id, e.target.value)}
                          className="w-36 h-7 px-2 font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={qty}
                            onChange={(e) => handleQuantityChange(mat.id, parseInt(e.target.value) || 1)}
                            className="w-12 h-7 px-1 text-center font-mono font-bold text-xs bg-slate-50 border border-slate-200 rounded"
                          />
                          <button
                            type="button"
                            onClick={() => handleAdd(mat)}
                            className={`h-7 px-2.5 rounded font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer ${
                              isJustAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {isJustAdded ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Adicionado</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>+ Fila</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectMaterialToPrint(mat)}
                          className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Abrir na tela de criação de etiqueta"
                        >
                          <Tag className="w-3 h-3" />
                          <span>Etiqueta</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Exibindo <strong>{filteredMaterials.length}</strong> de <strong>{materials.length}</strong> registros
            </span>
            {searchTerm && (
              <span className="font-mono">Filtro: &quot;{searchTerm}&quot;</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
