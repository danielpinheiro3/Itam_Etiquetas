import React, { useRef, useState } from 'react';
import { CompanyIdentity } from '../types';
import { Building2, Upload, Trash2, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface IdentityVisualViewProps {
  identity: CompanyIdentity;
  onSaveIdentity: (identity: CompanyIdentity) => void;
}

export const IdentityVisualView: React.FC<IdentityVisualViewProps> = ({
  identity,
  onSaveIdentity
}) => {
  const [currentIdentity, setCurrentIdentity] = useState<CompanyIdentity>(identity);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, JPEG, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCurrentIdentity((prev) => ({
        ...prev,
        logoUrl: base64
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCurrentIdentity((prev) => ({
      ...prev,
      logoUrl: ''
    }));
  };

  const handleSave = () => {
    onSaveIdentity(currentIdentity);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-500" />
          <span>Configuração da Identidade Visual da Empresa</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure a logo da empresa e o título exibidos no cabeçalho e na interface principal do sistema.
        </p>
      </div>

      {/* Main Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        {/* Logo Upload Section */}
        <div>
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Logo da Empresa (Interface do Sistema)
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Esta logo será exibida no cabeçalho e na tela inicial. Formatos aceitos: PNG, JPG, JPEG ou SVG.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/svg+xml"
            onChange={handleImageUpload}
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            {/* Logo Preview Frame */}
            <div className="w-36 h-24 bg-white border border-slate-300 rounded-lg flex items-center justify-center p-2 shadow-inner overflow-hidden shrink-0">
              {currentIdentity.logoUrl ? (
                <img
                  src={currentIdentity.logoUrl}
                  alt="Logo da Empresa"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400 text-[11px] flex flex-col items-center">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span>Sem logo</span>
                </div>
              )}
            </div>

            {/* Upload & Remove buttons */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentIdentity.logoUrl ? 'Alterar Logo' : 'Importar Logo'}</span>
                </button>

                {currentIdentity.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                A imagem é convertida em Data URL e salva localmente no navegador (localStorage).
              </p>
            </div>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Nome do Sistema / Empresa
            </label>
            <input
              type="text"
              value={currentIdentity.systemName}
              onChange={(e) =>
                setCurrentIdentity({ ...currentIdentity, systemName: e.target.value })
              }
              placeholder="Ex: AlmoxPrint Pro ou NOME DA EMPRESA"
              className="w-full h-10 px-3 rounded-lg border border-slate-300 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Texto Secundário / Descrição do Almoxarifado
            </label>
            <input
              type="text"
              value={currentIdentity.subtitle}
              onChange={(e) =>
                setCurrentIdentity({ ...currentIdentity, subtitle: e.target.value })
              }
              placeholder="Ex: Sistema de Etiquetas · Almoxarifado Central"
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            As alterações são salvas permanentemente no navegador.
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Salvar Identidade Visual</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Identidade visual atualizada com sucesso no cabeçalho e na interface!</span>
          </div>
        )}
      </div>
    </div>
  );
};
