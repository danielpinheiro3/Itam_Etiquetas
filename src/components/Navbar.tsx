import React, { useState } from 'react';
import { ViewTab, CompanyIdentity } from '../types';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Boxes, 
  Tag, 
  Palette, 
  Printer, 
  Settings2, 
  Layers, 
  FileCheck2,
  Download,
  Building2,
  Database,
  Activity,
  Laptop,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  materialsCount: number;
  queueCount: number;
  companyIdentity: CompanyIdentity;
  onOpenExportOfflineModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  materialsCount,
  queueCount,
  companyIdentity,
  onOpenExportOfflineModal
}) => {
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);

  const mainNavItems: { id: ViewTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-label', label: 'Criar Etiqueta', icon: Tag },
    { id: 'queue', label: 'Fila de Impressão', icon: Printer, badge: queueCount },
    { id: 'preview-print', label: 'Visualizar A4', icon: FileCheck2 },
    { id: 'editor', label: 'Editor de Layout', icon: Palette },
    { id: 'templates', label: 'Meus Modelos', icon: Layers },
    { id: 'materials', label: 'Materiais', icon: Boxes, badge: materialsCount },
    { id: 'import-excel', label: 'Importar Excel', icon: FileSpreadsheet },
  ];

  const configTabs: { id: ViewTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'appearance', label: 'Cores e Aparência', icon: Palette },
    { id: 'print-config', label: 'Configuração da Folha A4', icon: Settings2 },
    { id: 'identity-visual', label: 'Identidade Visual da Empresa', icon: Building2 },
    { id: 'backup-restore', label: 'Backup e Restauração', icon: Database },
    { id: 'diagnostic', label: 'Diagnóstico do Sistema', icon: Activity },
  ];

  const isConfigTabActive = configTabs.some((t) => t.id === activeTab);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Zone 1: Company Logo + System Title & Subtitle */}
          <div className="flex items-center gap-3 shrink-0">
            {companyIdentity.logoUrl ? (
              <img
                src={companyIdentity.logoUrl}
                alt="Logo da Empresa"
                className="w-10 h-10 object-contain rounded-lg bg-white p-0.5 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-inner">
                <span className="font-mono text-base tracking-tighter">ALM</span>
              </div>
            )}
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-left font-bold tracking-tight text-white hover:text-amber-400 transition-colors cursor-pointer"
            >
              <span className="text-sm sm:text-base font-black uppercase tracking-wider block">
                {companyIdentity.systemName || 'SISTEMA DE ETIQUETAS'}
              </span>
              <span className="block text-[10px] font-bold text-amber-400 tracking-widest uppercase leading-none">
                {companyIdentity.subtitle || 'ALMOXARIFADO'}
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Configurações Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  isConfigTabActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Configurações</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {settingsDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setSettingsDropdownOpen(false)}
                >
                  {configTabs.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setSettingsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-amber-400" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Zone 3: Quick Action & EXPORT OFFLINE BUTTON */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 8. Exportar Versão Offline Button */}
            <button
              type="button"
              onClick={onOpenExportOfflineModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm whitespace-nowrap cursor-pointer"
              title="Gera arquivo HTML ou ZIP portátil para usar em qualquer computador sem internet"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar versão offline</span>
              <span className="sm:hidden">Offline</span>
            </button>

            <button
              onClick={() => setActiveTab('create-label')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm whitespace-nowrap cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Buscar Código</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subnav for mobile / medium screens */}
      <div className="xl:hidden overflow-x-auto border-t border-slate-800 px-4 py-2 flex items-center gap-1 scrollbar-none bg-slate-950/70">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white bg-slate-900'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-[10px] ml-1 font-mono">({item.badge})</span>
              )}
            </button>
          );
        })}

        {configTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white bg-slate-900'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
