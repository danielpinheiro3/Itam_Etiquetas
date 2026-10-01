import React, { useRef, useState } from 'react';
import { LabelTemplate, Material, ViewTab } from '../types';
import { LabelView } from './LabelView';
import { 
  Layers, 
  Plus, 
  Copy, 
  Trash2, 
  Edit3, 
  Star, 
  Download, 
  Upload, 
  Check, 
  X,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface TemplatesViewProps {
  templates: LabelTemplate[];
  activeTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  onRenameTemplate: (templateId: string, newName: string, newDescription?: string) => void;
  onSetDefaultTemplate: (templateId: string) => void;
  onDuplicateTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onImportTemplates: (templates: LabelTemplate[]) => void;
  setActiveTab: (tab: ViewTab) => void;
  previewMaterial: Material;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  templates,
  activeTemplateId,
  onSelectTemplate,
  onRenameTemplate,
  onSetDefaultTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onImportTemplates,
  setActiveTab,
  previewMaterial
}) => {
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  // Renaming state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [editDescInput, setEditDescInput] = useState('');

  const handleStartRename = (tpl: LabelTemplate) => {
    setEditingTemplateId(tpl.id);
    setEditNameInput(tpl.name);
    setEditDescInput(tpl.description || '');
  };

  const handleSaveRename = (templateId: string) => {
    if (!editNameInput.trim()) {
      alert('O nome do modelo não pode estar vazio.');
      return;
    }
    onRenameTemplate(templateId, editNameInput.trim(), editDescInput.trim());
    setEditingTemplateId(null);
  };

  const handleCancelRename = () => {
    setEditingTemplateId(null);
  };

  const handleExportTemplatesJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(templates, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `modelos_etiquetas_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].widthMm) {
          onImportTemplates(parsed);
          alert(`${parsed.length} modelo(s) importado(s) com sucesso!`);
        } else {
          alert('Arquivo JSON com estrutura de modelo inválida.');
        }
      } catch (err) {
        alert('Erro ao interpretar o arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recente';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            <span>Meus Modelos de Etiquetas ({templates.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Crie, renomeie, personalize e duplique modelos de etiquetas com salvamento local no navegador.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImportJson}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleExportTemplatesJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Exportar backup dos modelos em JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar JSON</span>
          </button>

          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Importar modelos salvos anteriormente"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar JSON</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onDuplicateTemplate(activeTemplateId);
              setActiveTab('editor');
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Novo Modelo</span>
          </button>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => {
          const isDefault = tpl.isDefault;
          const isActive = tpl.id === activeTemplateId;
          const isEditing = editingTemplateId === tpl.id;

          return (
            <div
              key={tpl.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                isActive
                  ? 'border-amber-400 ring-2 ring-amber-400/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header or Renaming input */}
                {isEditing ? (
                  <div className="space-y-2 mb-3 p-3 bg-amber-50/70 border border-amber-300 rounded-xl">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase mb-0.5">
                        Nome do Modelo:
                      </label>
                      <input
                        type="text"
                        value={editNameInput}
                        onChange={(e) => setEditNameInput(e.target.value)}
                        className="w-full h-8 px-2.5 rounded border border-amber-300 bg-white text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase mb-0.5">
                        Descrição Opcional:
                      </label>
                      <input
                        type="text"
                        value={editDescInput}
                        onChange={(e) => setEditDescInput(e.target.value)}
                        className="w-full h-7 px-2 rounded border border-amber-300 bg-white text-[11px] text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveRename(tpl.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Salvar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {tpl.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleStartRename(tpl)}
                          className="text-slate-400 hover:text-amber-600 p-0.5 rounded cursor-pointer"
                          title="Editar nome do modelo"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
                        <span>{tpl.widthMm} x {tpl.heightMm} mm</span>
                        <span>·</span>
                        <span>{tpl.elements.length} elementos</span>
                      </div>
                    </div>

                    {isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300 shrink-0">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Padrão
                      </span>
                    )}
                  </div>
                )}

                {tpl.description && !isEditing && (
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                    {tpl.description}
                  </p>
                )}

                {/* Timestamps */}
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-2 font-mono">
                  <Calendar className="w-3 h-3" />
                  <span>Modificado: {formatDate(tpl.updatedAt)}</span>
                </div>

                {/* Scaled Preview Frame */}
                <div className="my-2 p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden min-h-[140px] max-h-[180px]">
                  <div className="origin-center transform scale-75">
                    <LabelView
                      template={tpl}
                      material={previewMaterial}
                      scale={0.8}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTemplate(tpl.id);
                      setActiveTab('editor');
                    }}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3 h-3 text-amber-400" />
                    <span>Abrir no Editor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDuplicateTemplate(tpl.id)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                    title="Duplicar modelo"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartRename(tpl)}
                    className="px-2 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
                    title="Renomear modelo"
                  >
                    Renomear
                  </button>

                  {templates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja excluir o modelo "${tpl.name}"?`)) {
                          onDeleteTemplate(tpl.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Excluir modelo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {!isDefault && (
                  <button
                    type="button"
                    onClick={() => onSetDefaultTemplate(tpl.id)}
                    className="text-xs text-slate-600 hover:text-amber-600 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Star className="w-3 h-3" />
                    <span>Definir padrão</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
