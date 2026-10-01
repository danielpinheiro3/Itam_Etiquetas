import React, { useState } from 'react';
import { BackupData } from '../types';
import { exportStandaloneHtml, exportPortableZip } from '../utils/offlineExportUtils';
import { 
  Download, 
  FileCode, 
  Archive, 
  CheckCircle2, 
  Sparkles, 
  Laptop, 
  WifiOff, 
  HardDrive, 
  X, 
  RefreshCw,
  Info,
  ShieldCheck
} from 'lucide-react';

interface ExportOfflineModalProps {
  isOpen: boolean;
  onClose: () => void;
  backupData: BackupData;
}

export const ExportOfflineModal: React.FC<ExportOfflineModalProps> = ({
  isOpen,
  onClose,
  backupData
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [exportedSuccess, setExportedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportHtml = async () => {
    setIsExporting(true);
    setExportedSuccess(null);
    try {
      await exportStandaloneHtml(backupData, (msg) => setProgressMsg(msg));
      setExportedSuccess('Arquivo HTML gerado com sucesso! Salve-o em seu pendrive ou pasta.');
    } catch (err: any) {
      alert(`Falha ao exportar HTML: ${err?.message || err}`);
    } finally {
      setIsExporting(false);
      setProgressMsg(null);
    }
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    setExportedSuccess(null);
    try {
      await exportPortableZip(backupData, (msg) => setProgressMsg(msg));
      setExportedSuccess('Pacote ZIP portátil gerado com sucesso!');
    } catch (err: any) {
      alert(`Falha ao exportar ZIP: ${err?.message || err}`);
    } finally {
      setIsExporting(false);
      setProgressMsg(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Exportar Sistema 100% Portátil e Offline</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v1.0
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Funciona em qualquer computador sem precisar de internet, servidor ou instalação.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Key Advantages Highlights */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <WifiOff className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-900">Zero Internet</div>
              <div className="text-[10px] text-slate-500">Totalmente offline</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <HardDrive className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-900">Zero Instalação</div>
              <div className="text-[10px] text-slate-500">Roda pelo navegador</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <ShieldCheck className="w-5 h-5 text-sky-500 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-900">Dados Salvos</div>
              <div className="text-[10px] text-slate-500">IndexedDB local</div>
            </div>
          </div>

          {/* Current Package Content Preview */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Conteúdo que será incorporado à sua versão portátil:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono pt-1">
              <div className="p-1.5 bg-white/80 rounded border border-amber-200">
                <strong>{backupData.templates.length}</strong> modelos
              </div>
              <div className="p-1.5 bg-white/80 rounded border border-amber-200">
                {backupData.identity.logoUrl ? '✓ Logo da empresa' : 'Sem logo'}
              </div>
              <div className="p-1.5 bg-white/80 rounded border border-amber-200">
                <strong>{backupData.materials.length}</strong> materiais
              </div>
              <div className="p-1.5 bg-white/80 rounded border border-amber-200">
                A4 {backupData.printConfig.orientation === 'landscape' ? 'Paisagem' : 'Retrato'}
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {progressMsg && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
              <span className="font-medium">{progressMsg}</span>
            </div>
          )}

          {exportedSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{exportedSuccess}</span>
            </div>
          )}

          {/* Export Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Option 1: Standalone HTML */}
            <div className="p-4 rounded-xl border-2 border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/20 transition-all flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Arquivo HTML Único</h4>
                    <span className="text-[10px] font-semibold text-emerald-600">Direto no Navegador</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Gera o arquivo <strong>Sistema_de_Etiquetas.html</strong> 100% autocontido. Ao clicar duas vezes nele, o sistema abre imediatamente sem necessidade de instalação ou internet.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportHtml}
                disabled={isExporting}
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Sistema_de_Etiquetas.html</span>
              </button>
            </div>

            {/* Option 2: Complete Portable ZIP */}
            <div className="p-4 rounded-xl border-2 border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <Archive className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Pacote Portátil ZIP</h4>
                    <span className="text-[10px] font-semibold text-slate-500">Pacote com Pasta Completa</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Gera <strong>Sistema_de_Etiquetas_Portatil.zip</strong> contendo a pasta <strong>Sistema-de-Etiquetas/</strong> com <strong>index.html</strong>, pasta de assets, backup JSON e instruções.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportZip}
                disabled={isExporting}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Baixar Pacote Portátil (.zip)</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-start gap-1.5 pt-1">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Ao transportar para outro computador via pendrive, abra o arquivo HTML diretamente no Google Chrome ou Microsoft Edge. Todas as suas alterações e novos modelos criados continuarão sendo salvos no navegador daquele computador.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
