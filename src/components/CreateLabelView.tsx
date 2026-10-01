import React, { useState, useEffect, useMemo } from 'react';
import { Material, LabelTemplate, BarcodeFormat, ViewTab, PrintConfig } from '../types';
import { LabelView } from './LabelView';
import { calculateManualA4Distribution } from '../utils/printPdfUtils';
import { 
  Search, 
  Printer, 
  Plus, 
  Layers, 
  Barcode, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Sparkles,
  LayoutGrid,
  RotateCw,
  Info
} from 'lucide-react';

interface CreateLabelViewProps {
  materials: Material[];
  templates: LabelTemplate[];
  activeTemplate: LabelTemplate;
  printConfig: PrintConfig;
  onSelectTemplate: (templateId: string) => void;
  onAddToQueue: (material: Material, controle: string, quantity: number, templateId?: string) => void;
  initialMaterial?: Material | null;
  setActiveTab: (tab: ViewTab) => void;
}

export const CreateLabelView: React.FC<CreateLabelViewProps> = ({
  materials,
  templates,
  activeTemplate,
  printConfig,
  onSelectTemplate,
  onAddToQueue,
  initialMaterial,
  setActiveTab
}) => {
  const [searchInput, setSearchInput] = useState(initialMaterial?.codigo || '');
  const [foundMaterial, setFoundMaterial] = useState<Material | null>(initialMaterial || null);
  const [manualControle, setManualControle] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(2);
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>('CODE128');
  const [selectedTemplateId, setSelectedTemplateId] = useState(activeTemplate.id);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Sync if initialMaterial changes from parent
  useEffect(() => {
    if (initialMaterial) {
      setSearchInput(initialMaterial.codigo);
      setFoundMaterial(initialMaterial);
      setNotFound(false);
    }
  }, [initialMaterial]);

  // Sync selected template
  useEffect(() => {
    setSelectedTemplateId(activeTemplate.id);
  }, [activeTemplate.id]);

  // Search logic
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    const query = val.trim().toUpperCase();

    if (!query) {
      setFoundMaterial(null);
      setNotFound(false);
      return;
    }

    const match = materials.find(
      (m) =>
        m.codigo.toUpperCase() === query ||
        m.codigo.toUpperCase().replace(/\D/g, '') === query.replace(/\D/g, '')
    );

    if (match) {
      setFoundMaterial(match);
      setNotFound(false);
    } else {
      setFoundMaterial(null);
      setNotFound(true);
    }
  };

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || activeTemplate;

  // Real-time manual distribution calculation
  const manualLayout = useMemo(() => {
    return calculateManualA4Distribution(
      currentTemplate.widthMm,
      currentTemplate.heightMm,
      printConfig,
      quantity
    );
  }, [currentTemplate.widthMm, currentTemplate.heightMm, quantity, printConfig]);

  const handlePrintImmediate = () => {
    if (!foundMaterial) return;
    onAddToQueue(foundMaterial, manualControle, quantity, currentTemplate.id);
    setActiveTab('preview-print');
  };

  const handleAddQueue = () => {
    if (!foundMaterial) return;
    onAddToQueue(foundMaterial, manualControle, quantity, currentTemplate.id);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Prominent Search Header Box */}
      <div className="bg-white border-2 border-amber-400 rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Pesquisa do Material (Base Excel)</span>
        </div>

        <label
          htmlFor="material-code-input"
          className="block text-xl sm:text-2xl font-black text-slate-900 mb-2"
        >
          Digite o código do material
        </label>
        <p className="text-xs text-slate-500 mb-4">
          O sistema pesquisa o material na planilha importada e preenche Código, Descrição e Unidade padrão.
        </p>

        <div className="relative">
          <input
            id="material-code-input"
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Ex: 10001, 10002, 10003..."
            autoFocus
            className="w-full h-15 pl-5 pr-12 rounded-xl bg-slate-50 border-2 border-slate-300 text-slate-900 text-lg font-mono font-bold tracking-wider placeholder-slate-400 shadow-inner focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 focus:outline-hidden transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Suggestion Pills if no input */}
        {!searchInput && materials.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Sugestões da base:</span>
            {materials.slice(0, 5).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSearchChange(m.codigo)}
                className="px-2.5 py-1 text-xs font-mono font-semibold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded border border-slate-200 transition-colors cursor-pointer"
              >
                {m.codigo} ({m.descricao.split(' ')[0]})
              </button>
            ))}
          </div>
        )}

        {/* Not Found Feedback */}
        {notFound && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-900">Material não localizado na planilha</p>
              <p className="mt-0.5 text-red-700">
                O código <strong>&quot;{searchInput}&quot;</strong> não existe na planilha Excel carregada.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('materials')}
                  className="font-semibold text-red-900 hover:underline"
                >
                  Pesquisar na lista de materiais →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const manualMat: Material = {
                      id: `manual-${Date.now()}`,
                      codigo: searchInput.trim().toUpperCase(),
                      descricao: 'MATERIAL CADASTRADO MANUALMENTE',
                      unidade: 'UN'
                    };
                    setFoundMaterial(manualMat);
                    setNotFound(false);
                  }}
                  className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-900 font-bold rounded"
                >
                  + Criar etiqueta avulsa com este código
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* When Material Is Found */}
      {foundMaterial && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Center: Realtime Label Preview */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-between">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-800">
                  Prévia da Etiqueta em Tempo Real (100% Tamanho Real)
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600">
                {currentTemplate.widthMm} x {currentTemplate.heightMm} mm
              </span>
            </div>

            {/* Label preview */}
            <div className="p-6 bg-slate-100 rounded-xl border border-slate-200 w-full flex items-center justify-center overflow-auto">
              <div className="shadow-lg rounded bg-white">
                <LabelView
                  template={{
                    ...currentTemplate,
                    elements: currentTemplate.elements.map((el) =>
                      el.type === 'barcode' ? { ...el, barcodeFormat } : el
                    )
                  }}
                  material={foundMaterial}
                  controle={manualControle}
                />
              </div>
            </div>

            {/* Barcode code caption */}
            <div className="w-full mt-4 text-center">
              <p className="text-[11px] text-slate-500">
                Código de barras gerado automaticamente a partir do código:{' '}
                <strong className="font-mono text-slate-800">{foundMaterial.codigo}</strong>
              </p>
            </div>
          </div>

          {/* Right: Manual Controle Input & Layout Configuration */}
          <div className="lg:col-span-5 space-y-4">
            {/* Auto-filled details from Excel + Manual Controle */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Dados da Etiqueta</span>
              </h3>

              {/* Excel retrieved fields */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
                  <span className="text-slate-500">Código (Excel):</span>
                  <strong className="font-mono text-slate-900 text-sm">{foundMaterial.codigo}</strong>
                </div>
                <div className="py-0.5 border-b border-slate-200/60">
                  <span className="text-slate-500 block text-[11px]">Descrição Original (Excel):</span>
                  <span className="font-bold text-slate-900 leading-tight block mt-0.5">
                    {foundMaterial.descricao}
                  </span>
                </div>
                {manualControle.trim() && (
                  <div className="py-0.5 border-b border-slate-200/60 bg-amber-50/50 p-1.5 rounded">
                    <span className="text-amber-800 block text-[11px] font-semibold">
                      {currentTemplate.elements.some((el) => el.visible && el.type === 'field' && el.fieldKey === 'controle')
                        ? 'Controle Individual na Etiqueta:'
                        : 'Descrição na Etiqueta (com Controle):'}
                    </span>
                    <span className="font-black text-slate-950 leading-tight block mt-0.5">
                      {currentTemplate.elements.some((el) => el.visible && el.type === 'field' && el.fieldKey === 'controle')
                        ? manualControle.trim()
                        : `${foundMaterial.descricao} - ${manualControle.trim()}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500">Unidade padrão (Excel):</span>
                  <span className="font-mono font-bold text-slate-900">{foundMaterial.unidade}</span>
                </div>
              </div>

              {/* 3. CONTROLE MANUAL (Critically emphasized) */}
              <div className="p-3.5 bg-amber-50/70 border-2 border-amber-300 rounded-xl space-y-1.5">
                <label className="block text-xs font-bold text-amber-950 flex items-center justify-between">
                  <span>Controle (Preenchimento Manual)</span>
                  <span className="text-[10px] text-amber-700 font-normal">Opcional / Alfanumérico</span>
                </label>
                <input
                  type="text"
                  value={manualControle}
                  onChange={(e) => setManualControle(e.target.value)}
                  placeholder="Ex: 45879, LOTE-01, PRAT-A2..."
                  className="w-full h-10 px-3 rounded-lg bg-white border border-amber-300 text-slate-900 text-sm font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-amber-800 leading-tight">
                  Este Controle será associado <strong>somente a esta etiqueta</strong>, sem alterar a planilha original do Excel.
                </p>
              </div>

              {/* Model selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Modelo / Dimensão da Etiqueta
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    setSelectedTemplateId(e.target.value);
                    onSelectTemplate(e.target.value);
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.widthMm} x {tpl.heightMm} mm)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantidade de Etiquetas
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold flex items-center justify-center text-lg cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 h-10 px-3 text-center font-mono font-bold text-base border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold flex items-center justify-center text-lg cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Manual A4 Distribution Box */}
              <div className={`p-3 rounded-xl space-y-2 text-xs border ${
                manualLayout.isCompatible
                  ? 'bg-slate-900 text-white border-slate-800'
                  : 'bg-red-50 text-red-950 border-red-300'
              }`}>
                <div className="flex items-center justify-between font-bold text-[11px] uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <LayoutGrid className={`w-3.5 h-3.5 ${manualLayout.isCompatible ? 'text-amber-400' : 'text-red-600'}`} />
                    Distribuição da Folha A4 ({printConfig.orientation === 'landscape' ? 'Paisagem' : 'Retrato'})
                  </span>
                  <span className={manualLayout.isCompatible ? 'text-emerald-400 font-bold' : 'text-red-600 font-black'}>
                    {manualLayout.isCompatible ? 'Compatível' : 'Não Comporta'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="opacity-75 block text-[10px]">Orientação Folha:</span>
                    <strong>
                      A4 {printConfig.orientation === 'landscape' ? 'Paisagem (297x210)' : 'Retrato (210x297)'}
                    </strong>
                  </div>
                  <div>
                    <span className="opacity-75 block text-[10px]">Rotação Etiqueta:</span>
                    <strong className={printConfig.labelRotation !== 0 ? 'text-amber-300' : ''}>
                      {printConfig.labelRotation}° {printConfig.labelRotation === 0 ? '(Normal)' : ''}
                    </strong>
                  </div>
                  <div>
                    <span className="opacity-75 block text-[10px]">Grade Configurada:</span>
                    <strong>
                      {manualLayout.columns} col x {manualLayout.rows} lin ({manualLayout.labelsPerPage}/folha)
                    </strong>
                  </div>
                  <div>
                    <span className="opacity-75 block text-[10px]">Folhas Necessárias:</span>
                    <strong className={manualLayout.isCompatible ? 'text-emerald-400' : 'text-red-600'}>
                      {manualLayout.totalPages} página(s)
                    </strong>
                  </div>
                </div>

                {!manualLayout.isCompatible && (
                  <div className="text-[10px] text-red-800 font-mono pt-1 border-t border-red-200">
                    Aviso: A configuração não cabe ({manualLayout.requiredWidthMm}x{manualLayout.requiredHeightMm}mm necessária &gt; {manualLayout.availableWidthMm}x{manualLayout.availableHeightMm}mm disponível).
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleAddQueue}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Adicionar à Fila de Impressão</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintImmediate}
                  className="w-full h-11 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Configurar & Imprimir Folha A4 Agora</span>
                </button>

                {addedFeedback && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Etiqueta adicionada à fila com sucesso!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
