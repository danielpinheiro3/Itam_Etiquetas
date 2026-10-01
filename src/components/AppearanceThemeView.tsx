import React, { useState } from 'react';
import { SystemThemeConfig, SystemThemeColors, PresetThemeId } from '../types';
import { THEME_PRESETS, DEFAULT_THEME_CONFIG } from '../utils/themeUtils';
import { 
  Palette, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Eye, 
  Tag, 
  Laptop, 
  Building2 
} from 'lucide-react';

interface AppearanceThemeViewProps {
  currentTheme: SystemThemeConfig;
  onSaveTheme: (theme: SystemThemeConfig) => void;
}

export const AppearanceThemeView: React.FC<AppearanceThemeViewProps> = ({
  currentTheme,
  onSaveTheme
}) => {
  const [theme, setTheme] = useState<SystemThemeConfig>(currentTheme);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSelectPreset = (presetId: PresetThemeId) => {
    const preset = THEME_PRESETS[presetId];
    if (!preset) return;
    setTheme({
      presetId,
      colors: { ...preset.colors }
    });
  };

  const handleColorChange = (key: keyof SystemThemeColors, val: string) => {
    setTheme((prev) => ({
      ...prev,
      presetId: 'personalizado',
      colors: {
        ...prev.colors,
        [key]: val
      }
    }));
  };

  const handleSave = () => {
    onSaveTheme(theme);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefault = () => {
    const defaultTheme = { ...DEFAULT_THEME_CONFIG };
    setTheme(defaultTheme);
    onSaveTheme(defaultTheme);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const colorFields: { key: keyof SystemThemeColors; label: string; desc: string }[] = [
    { key: 'headerBg', label: 'Cabeçalho e Topo', desc: 'Cor de fundo da barra superior do sistema' },
    { key: 'primary', label: 'Cor Principal / Destaque', desc: 'Cor ativa dos botões, ícones e realces' },
    { key: 'buttonBg', label: 'Fundo dos Botões de Ação', desc: 'Cor de fundo dos botões principais de ação' },
    { key: 'buttonText', label: 'Texto dos Botões', desc: 'Cor do texto interno dos botões de ação' },
    { key: 'bgPage', label: 'Fundo Geral da Página', desc: 'Cor do fundo principal do sistema' },
    { key: 'bgCard', label: 'Fundo dos Cartões e Painéis', desc: 'Superfície de cartões, formulários e tabelas' },
    { key: 'borderColor', label: 'Bordas e Divisórias', desc: 'Linhas divisórias e contornos dos elementos' },
    { key: 'accent', label: 'Cor de Sucesso / Confirmação', desc: 'Badges de status, sucesso e confirmações' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Palette className="w-5 h-5 text-amber-500" />
          <span>Personalização das Cores do Sistema</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Escolha um tema pré-definido ou personalize manualmente as cores dos botões, cabeçalho e menus para combinar com a identidade visual do seu almoxarifado.
        </p>
      </div>

      {/* Preset Themes Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Temas Pré-definidos</span>
          </h3>
          <span className="text-xs text-slate-500">Clique para aplicar instantaneamente</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(THEME_PRESETS) as PresetThemeId[]).map((pid) => {
            const p = THEME_PRESETS[pid];
            const isSelected = theme.presetId === pid;
            return (
              <button
                key={pid}
                type="button"
                onClick={() => handleSelectPreset(pid)}
                className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900">{p.name}</span>
                    {isSelected && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-950 rounded">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight mb-3">
                    {p.description}
                  </p>
                </div>

                {/* Color swatches preview */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
                  <span
                    className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: p.colors.headerBg }}
                    title="Cabeçalho"
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: p.colors.primary }}
                    title="Cor Principal"
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: p.colors.buttonBg }}
                    title="Botão de Ação"
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: p.colors.bgPage }}
                    title="Fundo da Página"
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: p.colors.accent }}
                    title="Destaque"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Interactive Preview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-500" />
          <span>Pré-visualização em Tempo Real</span>
        </h3>

        {/* Mini simulated UI */}
        <div
          className="rounded-xl border p-4 space-y-4 overflow-hidden transition-all shadow-inner"
          style={{
            backgroundColor: theme.colors.bgPage,
            borderColor: theme.colors.borderColor
          }}
        >
          {/* Simulated Header */}
          <div
            className="p-3 rounded-lg flex items-center justify-between shadow-xs transition-colors"
            style={{ backgroundColor: theme.colors.headerBg }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.buttonText
                }}
              >
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black text-white uppercase tracking-wider leading-none">
                  SISTEMA DE ETIQUETAS
                </span>
                <span
                  className="block text-[9px] font-bold tracking-widest uppercase mt-0.5"
                  style={{ color: theme.colors.primary }}
                >
                  ALMOXARIFADO
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className="px-2 py-1 text-[11px] font-bold rounded-md"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.buttonText
                }}
              >
                Menu Ativo
              </span>
              <span className="px-2 py-1 text-[11px] font-medium text-slate-300">
                Outra Aba
              </span>
            </div>
          </div>

          {/* Simulated Card & Button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              className="p-4 rounded-xl border space-y-2"
              style={{
                backgroundColor: theme.colors.bgCard,
                borderColor: theme.colors.borderColor
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Card de Exemplo</span>
                <span
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded"
                  style={{
                    backgroundColor: `${theme.colors.accent}20`,
                    color: theme.colors.accent
                  }}
                >
                  Sucesso
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Visualização de como seus formulários e etiquetas serão apresentados com as cores selecionadas.
              </p>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-default"
                style={{
                  backgroundColor: theme.colors.buttonBg,
                  color: theme.colors.buttonText
                }}
              >
                Botão de Ação
              </button>
            </div>

            <div
              className="p-4 rounded-xl border flex flex-col justify-between"
              style={{
                backgroundColor: theme.colors.bgCard,
                borderColor: theme.colors.borderColor
              }}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Tag className="w-4 h-4" style={{ color: theme.colors.primary }} />
                <span>Etiqueta 100 x 50 mm</span>
              </div>
              <div className="text-xs text-slate-600 font-mono mt-2">
                Código: <strong className="text-slate-900">10001</strong> · UN: <strong>UN</strong>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Controle Manual: <strong className="text-slate-900">S. 08</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Color Pickers Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Palette className="w-4 h-4 text-amber-500" />
          <span>Ajuste Fino das Cores Individuais</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {colorFields.map((f) => {
            const val = theme.colors[f.key];
            return (
              <div key={f.key} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-900">
                    {f.label}
                  </label>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {f.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={val}
                    onChange={(e) => handleColorChange(f.key, e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleColorChange(f.key, e.target.value)}
                    placeholder="#000000"
                    className="w-full h-9 px-2 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-800 bg-white uppercase focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Laptop className="w-4 h-4 text-slate-400" />
          <span>As cores selecionadas são salvas localmente e mantidas mesmo após fechar o navegador.</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão Âmbar</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Salvar Cores do Sistema</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Cores do sistema atualizadas e salvas com sucesso!</span>
        </div>
      )}
    </div>
  );
};
