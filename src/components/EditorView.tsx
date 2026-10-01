import React, { useState, useRef, useEffect } from 'react';
import { 
  LabelTemplate, 
  LabelElement, 
  Material, 
  MaterialFieldKey, 
  BarcodeFormat, 
  ElementType 
} from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Save, 
  Move, 
  Type, 
  Barcode as BarcodeIcon, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  CheckCircle2,
  BookmarkPlus,
  Image as ImageIcon,
  Minus,
  Edit3,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check
} from 'lucide-react';

interface EditorViewProps {
  template: LabelTemplate;
  templates: LabelTemplate[];
  onSaveTemplate: (updatedTemplate: LabelTemplate) => void;
  onSaveAsNewTemplate: (newTemplate: LabelTemplate) => void;
  onSetDefaultTemplate: (templateId: string) => void;
  onSelectTemplate: (templateId: string) => void;
  previewMaterial: Material;
}

export const EditorView: React.FC<EditorViewProps> = ({
  template: initialTemplate,
  templates,
  onSaveTemplate,
  onSaveAsNewTemplate,
  onSetDefaultTemplate,
  onSelectTemplate,
  previewMaterial
}) => {
  const [currentTemplate, setCurrentTemplate] = useState<LabelTemplate>(initialTemplate);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    initialTemplate.elements[0]?.id || null
  );
  const [zoom, setZoom] = useState(1.4);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);
  const [previewControle, setPreviewControle] = useState('45879');

  // Renaming state directly in Editor
  const [isRenaming, setIsRenaming] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState(initialTemplate.name);

  // Hidden image uploader ref for logo / image elements
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCurrentTemplate(initialTemplate);
    setTemplateNameInput(initialTemplate.name);
    if (!selectedElementId && initialTemplate.elements.length > 0) {
      setSelectedElementId(initialTemplate.elements[0].id);
    }
  }, [initialTemplate.id]);

  const selectedElement = currentTemplate.elements.find((el) => el.id === selectedElementId);

  // Dragging logic
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null);

  const MM_TO_PX = 3.78 * zoom;

  const handlePointerDownElement = (e: React.PointerEvent, el: LabelElement) => {
    e.stopPropagation();
    setSelectedElementId(el.id);
    if (el.locked) return;

    setIsDragging(true);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: el.x,
      elY: el.y
    });

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStart || !selectedElement || selectedElement.locked) return;

    const deltaX = (e.clientX - dragStart.mouseX) / MM_TO_PX;
    const deltaY = (e.clientY - dragStart.mouseY) / MM_TO_PX;

    // Snap to 0.5 mm
    const snap = 0.5;
    const newX = Math.max(0, Math.round((dragStart.elX + deltaX) / snap) * snap);
    const newY = Math.max(0, Math.round((dragStart.elY + deltaY) / snap) * snap);

    const boundedX = Math.min(newX, currentTemplate.widthMm - selectedElement.width);
    const boundedY = Math.min(newY, currentTemplate.heightMm - selectedElement.height);

    updateElement(selectedElement.id, {
      x: Number(boundedX.toFixed(1)),
      y: Number(boundedY.toFixed(1))
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const updateElement = (id: string, patch: Partial<LabelElement>) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      elements: prev.elements.map((el) => (el.id === id ? { ...el, ...patch } : el))
    }));
  };

  // 4. "Adicionar elementos" - Texto, Código, Descrição, Controle, Unidade padrão, Código de barras, Texto fixo, LOGO, LINHA, RETÂNGULO, IMAGEM
  const handleAddElement = (type: ElementType, fieldKey?: MaterialFieldKey, text?: string) => {
    const newId = `el-${Date.now().toString(36)}`;
    let newEl: LabelElement;

    if (type === 'logo') {
      newEl = {
        id: newId,
        type: 'logo',
        name: 'Logo da Etiqueta',
        x: 4,
        y: 4,
        width: 25,
        height: 15,
        fontSize: 8,
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'normal',
        textAlign: 'center',
        alignVertical: 'middle',
        color: '#000000',
        keepAspectRatio: true,
        visible: true,
        locked: false
      };
    } else if (type === 'image') {
      newEl = {
        id: newId,
        type: 'image',
        name: 'Imagem Ilustrativa',
        x: 5,
        y: 5,
        width: 30,
        height: 20,
        fontSize: 8,
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'normal',
        textAlign: 'center',
        alignVertical: 'middle',
        color: '#000000',
        keepAspectRatio: true,
        visible: true,
        locked: false
      };
    } else if (type === 'line') {
      newEl = {
        id: newId,
        type: 'line',
        name: 'Linha Divisória',
        x: 2,
        y: 10,
        width: currentTemplate.widthMm - 4,
        height: 1,
        fontSize: 8,
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#0f172a',
        borderWidth: 1,
        visible: true,
        locked: false
      };
    } else if (type === 'rectangle' || type === 'box') {
      newEl = {
        id: newId,
        type: 'rectangle',
        name: 'Retângulo / Moldura',
        x: 2,
        y: 2,
        width: currentTemplate.widthMm - 4,
        height: 8,
        fontSize: 8,
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'normal',
        textAlign: 'center',
        color: '#0f172a',
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 1,
        visible: true,
        locked: false
      };
    } else if (type === 'barcode') {
      newEl = {
        id: newId,
        type: 'barcode',
        name: 'Código de Barras',
        fieldKey: 'codigo',
        x: 5,
        y: Math.max(5, currentTemplate.heightMm - 20),
        width: Math.min(80, currentTemplate.widthMm - 10),
        height: 16,
        fontSize: 8.5,
        fontFamily: 'JetBrains Mono',
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
        visible: true,
        locked: false,
        barcodeFormat: 'CODE128',
        barcodeShowText: true,
        barcodeHeight: 12
      };
    } else if (type === 'static-text') {
      newEl = {
        id: newId,
        type: 'static-text',
        name: 'Texto Fixo',
        staticText: text || 'ALMOXARIFADO',
        x: 5,
        y: 4,
        width: 50,
        height: 5,
        fontSize: 8,
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        textAlign: 'left',
        color: '#0f172a',
        visible: true,
        locked: false
      };
    } else {
      // field
      const fieldNames: Record<MaterialFieldKey, string> = {
        codigo: 'Código',
        descricao: 'Descrição',
        controle: 'Controle (Manual)',
        unidade: 'Unidade padrão'
      };
      const key = fieldKey || 'descricao';
      newEl = {
        id: newId,
        type: 'field',
        name: fieldNames[key],
        fieldKey: key,
        labelPrefix: key === 'codigo' ? 'CÓDIGO: ' : (key === 'controle' ? '' : (key === 'unidade' ? 'UNID: ' : '')),
        x: 5,
        y: 10,
        width: Math.min(80, currentTemplate.widthMm - 10),
        height: 6,
        fontSize: key === 'codigo' ? 10 : (key === 'descricao' ? 9.5 : 8.5),
        fontFamily: key === 'codigo' || key === 'controle' ? 'JetBrains Mono' : 'Plus Jakarta Sans',
        fontWeight: 'bold',
        textAlign: 'left',
        color: '#0f172a',
        visible: true,
        locked: false
      };
    }

    setCurrentTemplate((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      elements: [...prev.elements, newEl]
    }));
    setSelectedElementId(newId);
  };

  const handleDuplicateElement = (el: LabelElement) => {
    const copyId = `el-${Date.now().toString(36)}`;
    const copyEl: LabelElement = {
      ...el,
      id: copyId,
      name: `${el.name} (cópia)`,
      x: Math.min(el.x + 3, currentTemplate.widthMm - el.width),
      y: Math.min(el.y + 3, currentTemplate.heightMm - el.height),
      locked: false
    };

    setCurrentTemplate((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      elements: [...prev.elements, copyEl]
    }));
    setSelectedElementId(copyId);
  };

  const handleDeleteElement = (id: string) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      elements: prev.elements.filter((el) => el.id !== id)
    }));
    setSelectedElementId(null);
  };

  const handleSave = () => {
    const updated = {
      ...currentTemplate,
      name: templateNameInput.trim() || currentTemplate.name,
      updatedAt: new Date().toISOString()
    };
    onSaveTemplate(updated);
    setIsRenaming(false);
    setSavedNotification('Modelo de etiqueta salvo com sucesso!');
    setTimeout(() => setSavedNotification(null), 2500);
  };

  const handleSaveAsNew = () => {
    const newName = prompt('Nome para o novo modelo:', `${currentTemplate.name} (Novo)`);
    if (!newName) return;

    const newTemplate: LabelTemplate = {
      ...currentTemplate,
      id: `tpl-${Date.now().toString(36)}`,
      name: newName,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveAsNewTemplate(newTemplate);
    setSavedNotification(`Novo modelo "${newName}" criado!`);
    setTimeout(() => setSavedNotification(null), 2500);
  };

  // Logo / Image element image picker
  const handleUploadElementImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateElement(selectedElement.id, {
        imageUrl: base64
      });
    };
    reader.readAsDataURL(file);
  };

  // Alignment helpers
  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedElement) return;
    if (type === 'left') {
      updateElement(selectedElement.id, { x: 0 });
    } else if (type === 'center') {
      const centerX = Number(((currentTemplate.widthMm - selectedElement.width) / 2).toFixed(1));
      updateElement(selectedElement.id, { x: Math.max(0, centerX) });
    } else if (type === 'right') {
      const rightX = Number((currentTemplate.widthMm - selectedElement.width).toFixed(1));
      updateElement(selectedElement.id, { x: Math.max(0, rightX) });
    } else if (type === 'top') {
      updateElement(selectedElement.id, { y: 0 });
    } else if (type === 'middle') {
      const middleY = Number(((currentTemplate.heightMm - selectedElement.height) / 2).toFixed(1));
      updateElement(selectedElement.id, { y: Math.max(0, middleY) });
    } else if (type === 'bottom') {
      const bottomY = Number((currentTemplate.heightMm - selectedElement.height).toFixed(1));
      updateElement(selectedElement.id, { y: Math.max(0, bottomY) });
    }
  };

  const resolvePreviewText = (el: LabelElement) => {
    if (el.type === 'static-text') return el.staticText || '';
    if (el.type === 'field' && el.fieldKey) {
      if (el.fieldKey === 'controle') {
        const val = previewControle.trim();
        if (!val) return '';
        return `${el.labelPrefix || ''}${val}`;
      }
      if (el.fieldKey === 'descricao') {
        const desc = (previewMaterial.descricao || '').trim();
        const ctrl = previewControle.trim();
        if (ctrl) {
          return `${el.labelPrefix || ''}${desc} - ${ctrl}`;
        }
        return `${el.labelPrefix || ''}${desc}`;
      }
      const val = previewMaterial[el.fieldKey] || '';
      return `${el.labelPrefix || ''}${val}`;
    }
    return '';
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input for logo / image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/svg+xml"
        onChange={handleUploadElementImage}
        className="hidden"
      />

      {/* Top Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Template Selector & Renaming */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Modelo Ativo
            </label>
            <div className="flex items-center gap-1.5">
              {isRenaming ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={templateNameInput}
                    onChange={(e) => setTemplateNameInput(e.target.value)}
                    className="h-9 px-2.5 rounded-lg border border-amber-400 font-bold text-xs text-slate-900 focus:outline-hidden"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateElement('', {}); // trigger update
                      setCurrentTemplate((p) => ({ ...p, name: templateNameInput }));
                      setIsRenaming(false);
                    }}
                    className="p-1.5 bg-emerald-600 text-white rounded cursor-pointer"
                    title="Confirmar nome"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <select
                    value={currentTemplate.id}
                    onChange={(e) => onSelectTemplate(e.target.value)}
                    className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.widthMm} x {tpl.heightMm} mm)
                      </option>
                    ))}
                  </select>

                  {/* 8. Botão Renomear Modelo */}
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateNameInput(currentTemplate.name);
                      setIsRenaming(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
                    title="Renomear modelo de etiqueta"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Renomear modelo</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Physical Dimensions */}
          <div className="flex items-center gap-2 pt-4 sm:pt-0">
            <div>
              <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Largura (mm)</label>
              <input
                type="number"
                min="20"
                max="297"
                value={currentTemplate.widthMm}
                onChange={(e) =>
                  setCurrentTemplate({ ...currentTemplate, widthMm: Math.max(20, parseInt(e.target.value) || 20) })
                }
                className="w-16 h-8 px-2 text-xs font-mono font-bold border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Altura (mm)</label>
              <input
                type="number"
                min="15"
                max="297"
                value={currentTemplate.heightMm}
                onChange={(e) =>
                  setCurrentTemplate({ ...currentTemplate, heightMm: Math.max(15, parseInt(e.target.value) || 15) })
                }
                className="w-16 h-8 px-2 text-xs font-mono font-bold border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Margem (mm)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={currentTemplate.paddingMm}
                onChange={(e) =>
                  setCurrentTemplate({ ...currentTemplate, paddingMm: Math.max(0, parseInt(e.target.value) || 0) })
                }
                className="w-14 h-8 px-2 text-xs font-mono font-bold border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Borda (px)</label>
              <input
                type="number"
                min="0"
                max="5"
                value={currentTemplate.borderWidth}
                onChange={(e) =>
                  setCurrentTemplate({ ...currentTemplate, borderWidth: Math.max(0, parseInt(e.target.value) || 0) })
                }
                className="w-14 h-8 px-2 text-xs font-mono font-bold border border-slate-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setZoom(Math.max(0.8, zoom - 0.2))}
              className="p-1.5 hover:bg-white rounded text-slate-700 cursor-pointer"
              title="Reduzir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-xs font-bold text-slate-700">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(Math.min(2.5, zoom + 0.2))}
              className="p-1.5 hover:bg-white rounded text-slate-700 cursor-pointer"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Modelo</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAsNew}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Salvar como Novo</span>
          </button>
        </div>
      </div>

      {savedNotification && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{savedNotification}</span>
        </div>
      )}

      {/* Editor Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Panel: 4. ADICIONAR ELEMENTOS */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-amber-500" />
              <span>Adicionar elementos</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleAddElement('field', 'codigo')}
                className="p-2 text-left bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800">Código</div>
                <div className="text-[10px] text-slate-500">Campo do Excel</div>
              </button>

              <button
                type="button"
                onClick={() => handleAddElement('barcode')}
                className="p-2 text-left bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800">Cód. Barras</div>
                <div className="text-[10px] text-slate-500">JsBarcode CODE 128</div>
              </button>

              <button
                type="button"
                onClick={() => handleAddElement('field', 'descricao')}
                className="p-2 text-left bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800">Descrição</div>
                <div className="text-[10px] text-slate-500">Texto do produto</div>
              </button>

              <button
                type="button"
                onClick={() => handleAddElement('field', 'controle')}
                className="p-2 text-left bg-amber-50/60 hover:bg-amber-100 hover:border-amber-400 border border-amber-300 rounded-lg transition-colors cursor-pointer"
              >
                <div className="font-bold text-amber-900">Controle</div>
                <div className="text-[10px] text-amber-700">Preenchimento manual</div>
              </button>

              <button
                type="button"
                onClick={() => handleAddElement('field', 'unidade')}
                className="p-2 text-left bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800">Unidade padrão</div>
                <div className="text-[10px] text-slate-500">UN, PC, KG...</div>
              </button>

              <button
                type="button"
                onClick={() => handleAddElement('static-text', undefined, 'ALMOXARIFADO')}
                className="p-2 text-left bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800">Texto fixo</div>
                <div className="text-[10px] text-slate-500">ALMOXARIFADO</div>
              </button>

              {/* 5. LOGO */}
              <button
                type="button"
                onClick={() => handleAddElement('logo')}
                className="p-2 text-left bg-blue-50/60 hover:bg-blue-100 hover:border-blue-400 border border-blue-300 rounded-lg transition-colors cursor-pointer"
              >
                <div className="font-bold text-blue-900 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>LOGO</span>
                </div>
                <div className="text-[10px] text-blue-700">Logo na etiqueta</div>
              </button>

              {/* IMAGEM */}
              <button
                type="button"
                onClick={() => handleAddElement('image')}
                className="p-2 text-left bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800">IMAGEM</div>
                <div className="text-[10px] text-slate-500">Foto / Ilustração</div>
              </button>

              {/* LINHA */}
              <button
                type="button"
                onClick={() => handleAddElement('line')}
                className="p-2 text-left bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Minus className="w-3.5 h-3.5" />
                  <span>LINHA</span>
                </div>
                <div className="text-[10px] text-slate-500">Divisória horizontal</div>
              </button>

              {/* RETÂNGULO */}
              <button
                type="button"
                onClick={() => handleAddElement('rectangle')}
                className="p-2 text-left bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Square className="w-3.5 h-3.5" />
                  <span>RETÂNGULO</span>
                </div>
                <div className="text-[10px] text-slate-500">Caixa e bordas</div>
              </button>
            </div>
          </div>

          {/* Elements list */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Campos na Etiqueta ({currentTemplate.elements.length})
            </h3>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {currentTemplate.elements.map((el) => {
                const isSelected = selectedElementId === el.id;
                return (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100/70 border border-amber-300 font-bold text-amber-950'
                        : 'bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {el.type === 'barcode' ? (
                        <BarcodeIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      ) : el.type === 'logo' || el.type === 'image' ? (
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      ) : el.type === 'line' ? (
                        <Minus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      ) : el.type === 'rectangle' || el.type === 'box' ? (
                        <Square className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      ) : (
                        <Type className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                      <span className="truncate">{el.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => updateElement(el.id, { visible: !el.visible })}
                        className="p-1 text-slate-400 hover:text-slate-700"
                        title={el.visible ? 'Ocultar' : 'Exibir'}
                      >
                        {el.visible ? <Eye className="w-3 h-3 text-slate-600" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => updateElement(el.id, { locked: !el.locked })}
                        className="p-1 text-slate-400 hover:text-slate-700"
                        title={el.locked ? 'Desbloquear' : 'Bloquear posição'}
                      >
                        {el.locked ? <Lock className="w-3 h-3 text-amber-600" /> : <Unlock className="w-3 h-3 text-slate-400" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteElement(el.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                        title="Excluir elemento"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Panel: Visual Canvas */}
        <div className="lg:col-span-6 bg-slate-200/80 p-6 rounded-2xl border border-slate-300 shadow-inner flex flex-col items-center justify-center overflow-auto min-h-[500px]">
          <div className="text-[11px] font-mono text-slate-600 mb-2 flex items-center gap-2">
            <span>Área da Etiqueta:</span>
            <strong>{currentTemplate.widthMm} x {currentTemplate.heightMm} mm</strong>
            <span>· Arraste os elementos com o mouse</span>
          </div>

          <div
            ref={canvasRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative select-none bg-white rounded shadow-xl border border-slate-400"
            style={{
              width: `${currentTemplate.widthMm * MM_TO_PX}px`,
              height: `${currentTemplate.heightMm * MM_TO_PX}px`,
              backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
              backgroundSize: `${5 * MM_TO_PX}px ${5 * MM_TO_PX}px`,
              backgroundColor: currentTemplate.backgroundColor || '#ffffff',
              boxSizing: 'border-box'
            }}
          >
            {currentTemplate.elements.map((el) => {
              if (!el.visible) return null;
              const isSelected = selectedElementId === el.id;

              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => handlePointerDownElement(e, el)}
                  className={`absolute box-border select-none transition-shadow ${
                    isSelected
                      ? 'ring-2 ring-amber-500 z-30 shadow-md'
                      : 'hover:ring-1 hover:ring-amber-300 z-10'
                  } ${el.locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                  style={{
                    left: `${el.x * MM_TO_PX}px`,
                    top: `${el.y * MM_TO_PX}px`,
                    width: `${el.width * MM_TO_PX}px`,
                    height: `${el.height * MM_TO_PX}px`,
                    fontSize: `${el.fontSize * (zoom * 0.9)}pt`,
                    fontFamily: el.fontFamily,
                    fontWeight: el.fontWeight,
                    fontStyle: el.fontStyle || 'normal',
                    textAlign: el.textAlign,
                    color: el.color,
                    backgroundColor: el.backgroundColor || 'transparent',
                    borderWidth: el.borderWidth ? `${el.borderWidth}px` : '0px',
                    borderStyle: el.borderWidth ? 'solid' : 'none',
                    borderColor: el.borderColor || 'transparent',
                    borderRadius: el.borderRadius ? `${el.borderRadius * MM_TO_PX}px` : '0px',
                    lineHeight: 1.15,
                    display: 'flex',
                    alignItems: el.type === 'box' || el.type === 'rectangle' ? 'center' : (el.textAlign === 'center' ? 'center' : 'flex-start'),
                    justifyContent: el.textAlign === 'center' ? 'center' : (el.textAlign === 'right' ? 'flex-end' : 'flex-start'),
                    overflow: 'hidden'
                  }}
                >
                  {(el.type === 'field' || el.type === 'static-text') && (
                    <span className="w-full break-words whitespace-pre-wrap leading-tight p-0.5 pointer-events-none">
                      {resolvePreviewText(el)}
                    </span>
                  )}

                  {el.type === 'barcode' && (
                    <div className="w-full h-full flex items-center justify-center pointer-events-none p-0.5">
                      <BarcodeRenderer
                        value={previewMaterial.codigo || '10001'}
                        format={el.barcodeFormat || 'CODE128'}
                        displayValue={el.barcodeShowText !== false}
                        height={((el.barcodeHeight || (el.height * 0.7)) * MM_TO_PX)}
                        fontSize={Math.max(7, el.fontSize * zoom)}
                        fontFamily={el.fontFamily}
                        lineColor={el.color || '#000000'}
                      />
                    </div>
                  )}

                  {(el.type === 'logo' || el.type === 'image') && (
                    <div className="w-full h-full flex items-center justify-center pointer-events-none p-0.5 overflow-hidden">
                      {el.imageUrl ? (
                        <img
                          src={el.imageUrl}
                          alt={el.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full border border-dashed border-blue-400 bg-blue-50/50 flex flex-col items-center justify-center text-blue-800 text-[10px] p-1">
                          <ImageIcon className="w-5 h-5 mb-0.5" />
                          <span>Clique para carregar logo</span>
                        </div>
                      )}
                    </div>
                  )}

                  {el.type === 'line' && (
                    <div
                      className="w-full pointer-events-none"
                      style={{
                        backgroundColor: el.color || '#0f172a',
                        height: `${Math.max(1, (el.borderWidth || 1))}px`,
                        alignSelf: 'center'
                      }}
                    />
                  )}

                  {isSelected && (
                    <div className="absolute -top-5 left-0 bg-amber-500 text-slate-950 font-mono text-[9px] font-bold px-1 rounded shadow-xs whitespace-nowrap pointer-events-none">
                      X: {el.x}mm Y: {el.y}mm
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-600 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-300">
            <span className="font-semibold">Simular Controle na prévia:</span>
            <input
              type="text"
              value={previewControle}
              onChange={(e) => setPreviewControle(e.target.value)}
              className="w-24 h-6 px-1.5 font-mono font-bold text-xs border border-slate-300 rounded bg-white"
            />
          </div>
        </div>

        {/* Right Panel: Element Properties Inspector */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Propriedades do Elemento
            </h3>
            {selectedElement && (
              <span className="text-[10px] font-mono text-slate-500">
                {selectedElement.type}
              </span>
            )}
          </div>

          {selectedElement ? (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nome do Elemento</label>
                <input
                  type="text"
                  value={selectedElement.name}
                  onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-slate-300 font-medium"
                />
              </div>

              {/* Geometry */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Posição & Dimensões (mm)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">X (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={selectedElement.x}
                      onChange={(e) => updateElement(selectedElement.id, { x: parseFloat(e.target.value) || 0 })}
                      className="w-full h-7 px-2 font-mono border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Y (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={selectedElement.y}
                      onChange={(e) => updateElement(selectedElement.id, { y: parseFloat(e.target.value) || 0 })}
                      className="w-full h-7 px-2 font-mono border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Largura (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={selectedElement.width}
                      onChange={(e) => updateElement(selectedElement.id, { width: parseFloat(e.target.value) || 5 })}
                      className="w-full h-7 px-2 font-mono border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Altura (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={selectedElement.height}
                      onChange={(e) => updateElement(selectedElement.id, { height: parseFloat(e.target.value) || 3 })}
                      className="w-full h-7 px-2 font-mono border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>

                {/* 5. Alinhamentos rápidos: esquerda, centro, direita, topo, centro vertical, base */}
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 block">Alinhamento Rápido na Etiqueta:</span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => handleAlign('left')}
                      className="py-1 px-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-semibold"
                    >
                      Esq
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAlign('center')}
                      className="py-1 px-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-semibold"
                    >
                      Centro X
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAlign('right')}
                      className="py-1 px-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-semibold"
                    >
                      Dir
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAlign('top')}
                      className="py-1 px-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-semibold"
                    >
                      Topo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAlign('middle')}
                      className="py-1 px-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-semibold"
                    >
                      Centro Y
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAlign('bottom')}
                      className="py-1 px-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-semibold"
                    >
                      Base
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Se for LOGO ou IMAGEM */}
              {(selectedElement.type === 'logo' || selectedElement.type === 'image') && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                  <span className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                    Arquivo de Imagem / Logo
                  </span>

                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{selectedElement.imageUrl ? 'Substituir Imagem' : 'Importar Imagem (PNG/JPG/SVG)'}</span>
                  </button>

                  <label className="flex items-center gap-2 text-[11px] text-blue-950 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={selectedElement.keepAspectRatio !== false}
                      onChange={(e) => updateElement(selectedElement.id, { keepAspectRatio: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Manter proporção da imagem</span>
                  </label>
                </div>
              )}

              {/* Se for Texto Fixo */}
              {selectedElement.type === 'static-text' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Texto Fixo</label>
                  <input
                    type="text"
                    value={selectedElement.staticText || ''}
                    onChange={(e) => updateElement(selectedElement.id, { staticText: e.target.value })}
                    className="w-full h-8 px-2 rounded border border-slate-300 font-semibold"
                  />
                </div>
              )}

              {/* Se for Campo */}
              {selectedElement.type === 'field' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Campo Associado</label>
                    <select
                      value={selectedElement.fieldKey}
                      onChange={(e) => updateElement(selectedElement.id, { fieldKey: e.target.value as MaterialFieldKey })}
                      className="w-full h-8 px-2 rounded border border-slate-300 font-medium"
                    >
                      <option value="codigo">Código do Material</option>
                      <option value="descricao">Descrição</option>
                      <option value="controle">Controle (Preenchimento manual)</option>
                      <option value="unidade">Unidade padrão</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prefixo / Rótulo</label>
                    <input
                      type="text"
                      value={selectedElement.labelPrefix || ''}
                      placeholder="Ex: CÓD: ou CONTROLE: "
                      onChange={(e) => updateElement(selectedElement.id, { labelPrefix: e.target.value })}
                      className="w-full h-8 px-2 rounded border border-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* Se for Código de Barras */}
              {selectedElement.type === 'barcode' && (
                <div className="space-y-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Padrão do Código de Barras
                  </span>
                  <div>
                    <select
                      value={selectedElement.barcodeFormat || 'CODE128'}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { barcodeFormat: e.target.value as BarcodeFormat })
                      }
                      className="w-full h-7 px-2 font-mono border border-slate-300 rounded text-xs"
                    >
                      <option value="CODE128">CODE 128 (Padrão)</option>
                      <option value="CODE39">CODE 39</option>
                      <option value="EAN13">EAN 13</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Altura das Barras (mm)</label>
                    <input
                      type="number"
                      min="5"
                      max="40"
                      value={selectedElement.barcodeHeight || 12}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { barcodeHeight: parseFloat(e.target.value) || 12 })
                      }
                      className="w-full h-7 px-2 font-mono border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={selectedElement.barcodeShowText !== false}
                      onChange={(e) => updateElement(selectedElement.id, { barcodeShowText: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    <span>Exibir texto do código abaixo</span>
                  </label>
                </div>
              )}

              {/* Tipografia */}
              {selectedElement.type !== 'box' && selectedElement.type !== 'rectangle' && selectedElement.type !== 'line' && selectedElement.type !== 'logo' && selectedElement.type !== 'image' && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Tipografia & Alinhamento
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500">Fonte</label>
                      <select
                        value={selectedElement.fontFamily}
                        onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                        className="w-full h-7 px-1 border border-slate-300 rounded text-[11px]"
                      >
                        <option value="Plus Jakarta Sans">Sans-serif</option>
                        <option value="JetBrains Mono">Monospace</option>
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Serif</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Tamanho (pt)</label>
                      <input
                        type="number"
                        min="5"
                        max="32"
                        step="0.5"
                        value={selectedElement.fontSize}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseFloat(e.target.value) || 8 })}
                        className="w-full h-7 px-2 font-mono border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateElement(selectedElement.id, {
                          fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold'
                        })
                      }
                      className={`flex-1 py-1 rounded border text-xs font-bold ${
                        selectedElement.fontWeight === 'bold'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Negrito
                    </button>
                    {(['left', 'center', 'right'] as const).map((al) => (
                      <button
                        key={al}
                        type="button"
                        onClick={() => updateElement(selectedElement.id, { textAlign: al })}
                        className={`flex-1 py-1 rounded border text-[10px] uppercase font-bold ${
                          selectedElement.textAlign === al
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        {al === 'left' ? 'Esq' : (al === 'center' ? 'Cen' : 'Dir')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDuplicateElement(selectedElement)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Duplicar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteElement(selectedElement.id)}
                  className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">
              <Move className="w-6 h-6 mx-auto mb-2 text-slate-300" />
              <p>Selecione um elemento para visualizar e ajustar suas propriedades.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
