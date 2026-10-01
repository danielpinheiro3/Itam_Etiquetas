/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Material, 
  LabelTemplate, 
  PrintConfig, 
  PrintQueueItem, 
  ExcelMapping, 
  ViewTab,
  CompanyIdentity,
  BackupData
} from './types';
import { DEFAULT_TEMPLATES, DEFAULT_PRINT_CONFIG } from './data/defaultTemplates';
import { SAMPLE_MATERIALS } from './data/sampleMaterials';
import { applyPrintPageStyle } from './utils/printPdfUtils';
import { 
  DEFAULT_IDENTITY, 
  getEmbeddedInitialData, 
  saveModelsToDb, 
  getModelsFromDb, 
  saveIdentityToDb, 
  getIdentityFromDb, 
  savePrintConfigToDb, 
  getPrintConfigFromDb, 
  saveMaterialsToDb, 
  getMaterialsFromDb, 
  saveQueueToDb, 
  getQueueFromDb, 
  saveSetting, 
  getSetting, 
  restoreFullBackup 
} from './utils/storageIndexedDb';

// Components
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CreateLabelView } from './components/CreateLabelView';
import { ImportExcelView } from './components/ImportExcelView';
import { MaterialsView } from './components/MaterialsView';
import { EditorView } from './components/EditorView';
import { TemplatesView } from './components/TemplatesView';
import { QueueView } from './components/QueueView';
import { PrintConfigView } from './components/PrintConfigView';
import { PreviewPrintView } from './components/PreviewPrintView';
import { IdentityVisualView } from './components/IdentityVisualView';
import { AppearanceThemeView } from './components/AppearanceThemeView';
import { BackupRestoreView } from './components/BackupRestoreView';
import { DiagnosticView } from './components/DiagnosticView';
import { ExportOfflineModal } from './components/ExportOfflineModal';
import { SystemThemeConfig } from './types';
import { applyTheme, getStoredTheme, saveStoredTheme } from './utils/themeUtils';

export default function App() {
  // Check if opening an exported standalone HTML with embedded user data
  const embeddedInitial = getEmbeddedInitialData();

  // 1. Company Identity State
  const [companyIdentity, setCompanyIdentity] = useState<CompanyIdentity>(() => {
    if (embeddedInitial?.identity) return embeddedInitial.identity;
    try {
      const stored = localStorage.getItem('almox_identity');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_IDENTITY;
  });

  // 1.1 System Theme State
  const [systemTheme, setSystemTheme] = useState<SystemThemeConfig>(() => {
    if (embeddedInitial?.theme) return embeddedInitial.theme;
    return getStoredTheme();
  });

  useEffect(() => {
    applyTheme(systemTheme);
  }, [systemTheme]);

  // 2. Materials State
  const [materials, setMaterials] = useState<Material[]>(() => {
    if (embeddedInitial?.materials && embeddedInitial.materials.length > 0) {
      return embeddedInitial.materials;
    }
    try {
      const stored = localStorage.getItem('almox_materials');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return SAMPLE_MATERIALS;
  });

  // 3. Templates State
  const [templates, setTemplates] = useState<LabelTemplate[]>(() => {
    if (embeddedInitial?.templates && embeddedInitial.templates.length > 0) {
      return embeddedInitial.templates;
    }
    try {
      const stored = localStorage.getItem('almox_templates');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_TEMPLATES;
  });

  // 4. Active Template ID
  const [activeTemplateId, setActiveTemplateId] = useState<string>(() => {
    if (embeddedInitial?.activeTemplateId) return embeddedInitial.activeTemplateId;
    try {
      const stored = localStorage.getItem('almox_active_template_id');
      if (stored) return stored;
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_TEMPLATES[0].id;
  });

  // 5. Print Configuration
  const [printConfig, setPrintConfig] = useState<PrintConfig>(() => {
    if (embeddedInitial?.printConfig) return embeddedInitial.printConfig;
    try {
      const stored = localStorage.getItem('almox_print_config');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PRINT_CONFIG;
  });

  // 6. Print Queue
  const [queue, setQueue] = useState<PrintQueueItem[]>(() => {
    if (embeddedInitial?.queue && embeddedInitial.queue.length > 0) {
      return embeddedInitial.queue;
    }
    try {
      const stored = localStorage.getItem('almox_print_queue');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'q-1', material: SAMPLE_MATERIALS[0], controle: '45879', quantity: 2, templateId: DEFAULT_TEMPLATES[0].id },
      { id: 'q-2', material: SAMPLE_MATERIALS[1], controle: '45880', quantity: 1, templateId: DEFAULT_TEMPLATES[0].id },
      { id: 'q-3', material: SAMPLE_MATERIALS[2], controle: '', quantity: 1, templateId: DEFAULT_TEMPLATES[0].id }
    ];
  });

  // 7. Excel Mapping
  const [savedMapping, setSavedMapping] = useState<ExcelMapping>(() => {
    if (embeddedInitial?.savedMapping) return embeddedInitial.savedMapping;
    try {
      const stored = localStorage.getItem('almox_excel_mapping');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      codigoCol: 'Código',
      descricaoCol: 'Descrição',
      unidadeCol: 'Unidade padrão'
    };
  });

  // 8. Last Import Date
  const [lastImportDate, setLastImportDate] = useState<string | null>(() => {
    return localStorage.getItem('almox_last_import') || 'Base inicial de exemplo (15 itens)';
  });

  // 9. Navigation & Modals
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [selectedMaterialToPrint, setSelectedMaterialToPrint] = useState<Material | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isExportOfflineModalOpen, setIsExportOfflineModalOpen] = useState(false);

  // Initial load from IndexedDB on startup (if not seeded by embedded bundle)
  useEffect(() => {
    if (embeddedInitial) {
      // If opened from an exported standalone HTML with embedded data, seed IndexedDB immediately
      saveModelsToDb(embeddedInitial.templates || templates);
      saveIdentityToDb(embeddedInitial.identity || companyIdentity);
      savePrintConfigToDb(embeddedInitial.printConfig || printConfig);
      saveMaterialsToDb(embeddedInitial.materials || materials);
      saveQueueToDb(embeddedInitial.queue || queue);
      return;
    }

    const loadFromIndexedDb = async () => {
      try {
        const [dbModels, dbIdentity, dbConfig, dbMaterials, dbQueue] = await Promise.all([
          getModelsFromDb(),
          getIdentityFromDb(),
          getPrintConfigFromDb(),
          getMaterialsFromDb(),
          getQueueFromDb()
        ]);

        if (dbModels && dbModels.length > 0) setTemplates(dbModels);
        if (dbIdentity && dbIdentity.systemName) setCompanyIdentity(dbIdentity);
        if (dbConfig) setPrintConfig(dbConfig);
        if (dbMaterials && dbMaterials.length > 0) setMaterials(dbMaterials);
        if (dbQueue && dbQueue.length > 0) setQueue(dbQueue);
      } catch (err) {
        console.warn('Iniciando com dados locais em cache:', err);
      }
    };

    loadFromIndexedDb();
  }, []);

  // IndexedDB + LocalStorage Automatic Persistence
  useEffect(() => {
    saveMaterialsToDb(materials);
  }, [materials]);

  useEffect(() => {
    saveModelsToDb(templates);
  }, [templates]);

  useEffect(() => {
    saveIdentityToDb(companyIdentity);
  }, [companyIdentity]);

  useEffect(() => {
    savePrintConfigToDb(printConfig);
  }, [printConfig]);

  useEffect(() => {
    saveQueueToDb(queue);
  }, [queue]);

  useEffect(() => {
    saveSetting('active_template_id', activeTemplateId);
  }, [activeTemplateId]);

  useEffect(() => {
    saveSetting('excel_mapping', savedMapping);
  }, [savedMapping]);

  // CSS Print Style Synchronization
  useEffect(() => {
    applyPrintPageStyle(printConfig.orientation);
  }, [printConfig.orientation]);

  const activeTemplate =
    templates.find((t) => t.id === activeTemplateId) || templates[0] || DEFAULT_TEMPLATES[0];

  // Materials Handlers
  const handleImportComplete = (importedMaterials: Material[], rawFileName: string) => {
    setMaterials(importedMaterials);
    const dateStr = `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (${rawFileName})`;
    setLastImportDate(dateStr);
    localStorage.setItem('almox_last_import', dateStr);
    setActiveTab('materials');
  };

  const handleClearMaterials = () => {
    if (!window.confirm('Esta ação excluirá todos os materiais importados da base local. Deseja continuar?')) {
      return;
    }
    setMaterials([]);
    setLastImportDate(null);
    localStorage.removeItem('almox_last_import');
  };

  const handleLoadSampleData = () => {
    setMaterials(SAMPLE_MATERIALS);
    const dateStr = `Amostra carregada em ${new Date().toLocaleTimeString('pt-BR')}`;
    setLastImportDate(dateStr);
    localStorage.setItem('almox_last_import', dateStr);
  };

  // Queue Handlers
  const handleAddToQueue = (
    material: Material,
    controle: string,
    quantity: number,
    templateId?: string
  ) => {
    const tId = templateId || activeTemplateId;
    const cleanControle = controle ? controle.trim() : '';

    setQueue((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.material.codigo === material.codigo &&
          item.templateId === tId &&
          (item.controle || '') === cleanControle
      );

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += quantity;
        return copy;
      }

      return [
        ...prev,
        {
          id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          material,
          controle: cleanControle,
          quantity,
          templateId: tId
        }
      ];
    });
  };

  const handleUpdateQueueQuantity = (id: string, newQty: number) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  const handleUpdateQueueControle = (id: string, newControle: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, controle: newControle } : item))
    );
  };

  const handleUpdateQueueTemplate = (id: string, newTemplateId: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, templateId: newTemplateId } : item))
    );
  };

  const handleRemoveQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDuplicateQueueItem = (id: string) => {
    const target = queue.find((i) => i.id === id);
    if (!target) return;
    const newItem: PrintQueueItem = {
      ...target,
      id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    };
    setQueue((prev) => [...prev, newItem]);
  };

  const handleClearQueue = () => {
    setQueue([]);
  };

  // Templates Handlers
  const handleSaveTemplate = (updated: LabelTemplate) => {
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleSaveAsNewTemplate = (newTpl: LabelTemplate) => {
    setTemplates((prev) => [...prev, newTpl]);
    setActiveTemplateId(newTpl.id);
  };

  const handleSetDefaultTemplate = (templateId: string) => {
    setTemplates((prev) =>
      prev.map((t) => ({ ...t, isDefault: t.id === templateId }))
    );
    setActiveTemplateId(templateId);
  };

  const handleDuplicateTemplate = (templateId: string) => {
    const target = templates.find((t) => t.id === templateId) || activeTemplate;
    const duplicated: LabelTemplate = {
      ...target,
      id: `tpl-${Date.now().toString(36)}`,
      name: `${target.name} (Cópia)`,
      isDefault: false
    };
    setTemplates((prev) => [...prev, duplicated]);
    setActiveTemplateId(duplicated.id);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (templates.length <= 1) {
      alert('É necessário manter pelo menos um modelo no sistema.');
      return;
    }
    const target = templates.find((t) => t.id === templateId);
    if (!window.confirm(`Esta ação poderá excluir o modelo "${target?.name || ''}". Deseja continuar?`)) {
      return;
    }
    const remaining = templates.filter((t) => t.id !== templateId);
    setTemplates(remaining);
    if (activeTemplateId === templateId) {
      setActiveTemplateId(remaining[0].id);
    }
  };

  const handleRenameTemplate = (templateId: string, newName: string, newDescription?: string) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === templateId
          ? { ...t, name: newName, description: newDescription !== undefined ? newDescription : t.description }
          : t
      )
    );
  };

  const handleImportTemplates = (imported: LabelTemplate[]) => {
    setTemplates(imported);
    if (imported.length > 0) {
      setActiveTemplateId(imported[0].id);
    }
  };

  // Full Backup Payload
  const fullBackupPayload: BackupData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    systemName: companyIdentity.systemName || 'SISTEMA DE ETIQUETAS',
    templates,
    printConfig,
    identity: companyIdentity,
    theme: systemTheme,
    materials,
    savedMapping,
    queue,
    activeTemplateId
  };

  const handleRestoreBackup = async (backup: BackupData) => {
    await restoreFullBackup(backup);
    if (backup.templates && backup.templates.length > 0) {
      setTemplates(backup.templates);
      setActiveTemplateId(backup.activeTemplateId || backup.templates[0].id);
    }
    if (backup.identity) setCompanyIdentity(backup.identity);
    if (backup.theme) {
      setSystemTheme(backup.theme);
      applyTheme(backup.theme);
      saveStoredTheme(backup.theme);
    }
    if (backup.printConfig) setPrintConfig(backup.printConfig);
    if (backup.materials) setMaterials(backup.materials);
    if (backup.queue) setQueue(backup.queue);
    if (backup.savedMapping) setSavedMapping(backup.savedMapping);
  };

  const handlePrintTestSheet = () => {
    setIsTestMode(true);
    setActiveTab('preview-print');
  };

  const previewMaterial = selectedMaterialToPrint || materials[0] || SAMPLE_MATERIALS[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Bar Navigation */}
      <div className="no-print">
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setIsTestMode(false);
            setActiveTab(tab);
          }}
          materialsCount={materials.length}
          queueCount={queue.reduce((acc, i) => acc + i.quantity, 0)}
          companyIdentity={companyIdentity}
          onOpenExportOfflineModal={() => setIsExportOfflineModalOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 no-print">
        {activeTab === 'dashboard' && (
          <DashboardView
            materials={materials}
            activeTemplate={activeTemplate}
            queue={queue}
            lastImportDate={lastImportDate}
            companyIdentity={companyIdentity}
            setActiveTab={setActiveTab}
            onSearchCode={(code) => {
              const found = materials.find((m) => m.codigo === code);
              if (found) setSelectedMaterialToPrint(found);
              setIsTestMode(false);
              setActiveTab('create-label');
            }}
            onAddToQueue={handleAddToQueue}
            onLoadSampleData={handleLoadSampleData}
            onSelectMaterialToPrint={(mat) => {
              setSelectedMaterialToPrint(mat);
              setIsTestMode(false);
              setActiveTab('create-label');
            }}
            onPrintTestSheet={handlePrintTestSheet}
            onOpenExportOfflineModal={() => setIsExportOfflineModalOpen(true)}
          />
        )}

        {activeTab === 'create-label' && (
          <CreateLabelView
            materials={materials}
            templates={templates}
            activeTemplate={activeTemplate}
            printConfig={printConfig}
            onSelectTemplate={setActiveTemplateId}
            onAddToQueue={handleAddToQueue}
            initialMaterial={selectedMaterialToPrint}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'import-excel' && (
          <ImportExcelView
            onImportComplete={handleImportComplete}
            savedMapping={savedMapping}
            onSaveMapping={setSavedMapping}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialsView
            materials={materials}
            activeTemplate={activeTemplate}
            onAddToQueue={handleAddToQueue}
            onSelectMaterialToPrint={(mat) => {
              setSelectedMaterialToPrint(mat);
              setIsTestMode(false);
              setActiveTab('create-label');
            }}
            onClearMaterials={handleClearMaterials}
            onNavigateToImport={() => setActiveTab('import-excel')}
          />
        )}

        {activeTab === 'editor' && (
          <EditorView
            template={activeTemplate}
            templates={templates}
            onSaveTemplate={handleSaveTemplate}
            onSaveAsNewTemplate={handleSaveAsNewTemplate}
            onSetDefaultTemplate={handleSetDefaultTemplate}
            onSelectTemplate={setActiveTemplateId}
            previewMaterial={previewMaterial}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesView
            templates={templates}
            activeTemplateId={activeTemplateId}
            onSelectTemplate={setActiveTemplateId}
            onRenameTemplate={handleRenameTemplate}
            onSetDefaultTemplate={handleSetDefaultTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onImportTemplates={handleImportTemplates}
            setActiveTab={setActiveTab}
            previewMaterial={previewMaterial}
          />
        )}

        {activeTab === 'queue' && (
          <QueueView
            queue={queue}
            templates={templates}
            activeTemplate={activeTemplate}
            printConfig={printConfig}
            onUpdateQuantity={handleUpdateQueueQuantity}
            onUpdateControle={handleUpdateQueueControle}
            onUpdateTemplate={handleUpdateQueueTemplate}
            onRemoveItem={handleRemoveQueueItem}
            onDuplicateItem={handleDuplicateQueueItem}
            onClearQueue={handleClearQueue}
            onAddMaterialToQueue={handleAddToQueue}
            materials={materials}
            setActiveTab={(tab) => {
              setIsTestMode(false);
              setActiveTab(tab);
            }}
          />
        )}

        {activeTab === 'print-config' && (
          <PrintConfigView
            config={printConfig}
            onChangeConfig={setPrintConfig}
            activeTemplate={activeTemplate}
            onPrintTestSheet={handlePrintTestSheet}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'preview-print' && (
          <PreviewPrintView
            queue={queue}
            templates={templates}
            activeTemplateId={activeTemplateId}
            config={printConfig}
            onChangeConfig={setPrintConfig}
            previewMaterial={previewMaterial}
            setActiveTab={setActiveTab}
            isTestMode={isTestMode}
          />
        )}

        {activeTab === 'identity-visual' && (
          <IdentityVisualView
            identity={companyIdentity}
            onSaveIdentity={(newId) => {
              setCompanyIdentity(newId);
            }}
          />
        )}

        {activeTab === 'appearance' && (
          <AppearanceThemeView
            currentTheme={systemTheme}
            onSaveTheme={(newTheme) => {
              setSystemTheme(newTheme);
              applyTheme(newTheme);
              saveStoredTheme(newTheme);
            }}
          />
        )}

        {activeTab === 'backup-restore' && (
          <BackupRestoreView
            backupData={fullBackupPayload}
            onRestoreBackup={handleRestoreBackup}
            onExportOfflineModal={() => setIsExportOfflineModalOpen(true)}
          />
        )}

        {activeTab === 'diagnostic' && (
          <DiagnosticView
            activeTemplate={activeTemplate}
            materials={materials}
            config={printConfig}
            companyIdentity={companyIdentity}
            onPrintTestSheet={handlePrintTestSheet}
            templatesCount={templates.length}
          />
        )}
      </main>

      {/* Export Offline Modal */}
      <ExportOfflineModal
        isOpen={isExportOfflineModalOpen}
        onClose={() => setIsExportOfflineModalOpen(false)}
        backupData={fullBackupPayload}
      />

      {/* Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <strong>{companyIdentity.systemName || 'SISTEMA DE ETIQUETAS'}</strong>
            <span>·</span>
            <span>{companyIdentity.subtitle || 'ALMOXARIFADO'}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold">
              v1.0 Offline
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>IndexedDB Local</span>
            <span>·</span>
            <span>CODE 128 Local</span>
            <span>·</span>
            <span>jsPDF Vetorial A4</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => setIsExportOfflineModalOpen(true)}
              className="text-amber-600 hover:text-amber-700 font-bold underline cursor-pointer"
            >
              Exportar para HTML
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
