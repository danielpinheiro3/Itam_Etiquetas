import React, { useRef, useState } from 'react';
import { BackupData } from '../types';
import { downloadBackupJson } from '../utils/offlineExportUtils';
import { 
  Download, 
  Upload, 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileJson, 
  Clock, 
  Layers, 
  Boxes,
  HelpCircle
} from 'lucide-react';

interface BackupRestoreViewProps {
  backupData: BackupData;
  onRestoreBackup: (backup: BackupData) => Promise<void>;
  onExportOfflineModal: () => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  backupData,
  onRestoreBackup,
  onExportOfflineModal
}) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmModalData, setConfirmModalData] = useState<BackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportBackup = () => {
    downloadBackupJson(backupData);
    setSuccessMessage('Arquivo de backup exportado com sucesso (.json)!');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as BackupData;
        if (!parsed || !parsed.templates || !Array.isArray(parsed.templates)) {
          throw new Error('Arquivo de backup inválido: não contém lista de modelos válida.');
        }

        // Show confirmation before restoring (Requirement 23)
        setConfirmModalData(parsed);
      } catch (err: any) {
        setErrorMessage(`Falha ao ler arquivo de backup: ${err?.message || err}`);
        setTimeout(() => setErrorMessage(null), 4000);
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeRestore = async () => {
    if (!confirmModalData) return;
    setIsRestoring(true);
    setErrorMessage(null);
    try {
      await onRestoreBackup(confirmModalData);
      setSuccessMessage('Backup restaurado com sucesso! Todos os modelos e configurações foram atualizados.');
      setConfirmModalData(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(`Erro ao restaurar backup: ${err?.message || err}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            <span>Backup e Restauração de Dados do Sistema</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Exporte e restaure periodicamente seus modelos, configurações de impressão, logo e dados locais.
          </p>
        </div>

        <button
          type="button"
          onClick={onExportOfflineModal}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <span>Exportar Versão Offline (.html)</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Backup and Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Backup Card */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-600">
              <Download className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Exportar Backup Completo</h3>
              <p className="text-xs text-slate-500 mt-1">
                Gera um arquivo de segurança no formato <strong>.json</strong> contendo todos os modelos, configurações de folha A4, margens, logotipo da empresa e materiais carregados.
              </p>
            </div>

            {/* Snapshot metrics */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Modelos inclusos:</span>
                <strong>{backupData.templates.length} modelo(s)</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Logo da empresa:</span>
                <strong>{backupData.identity.logoUrl ? 'Presente' : 'Não configurada'}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Materiais em base:</span>
                <strong>{backupData.materials.length} item(ns)</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Formato da folha:</span>
                <strong>A4 {backupData.printConfig.orientation === 'landscape' ? 'Paisagem' : 'Retrato'}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportBackup}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <FileJson className="w-4 h-4 text-amber-400" />
            <span>Baixar Arquivo de Backup (.json)</span>
          </button>
        </div>

        {/* Import Backup Card */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-600">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Restaurar Backup</h3>
              <p className="text-xs text-slate-500 mt-1">
                Selecione um arquivo <strong>.json</strong> exportado anteriormente para reconstruir completamente todos os seus modelos, logotipos e configurações neste computador.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Proteção contra perda:</strong> O sistema exibirá um resumo das informações contidas no backup e solicitará sua confirmação explícita antes de aplicar qualquer alteração.
              </span>
            </div>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Selecionar Arquivo de Backup para Restaurar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal before restoring (Requirement 23) */}
      {confirmModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Confirmar Restauração de Backup</h4>
                <p className="text-xs text-slate-500">
                  Esta ação poderá substituir as configurações atuais. Deseja continuar?
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-800">Conteúdo do arquivo selecionado:</div>
              <ul className="space-y-1 font-mono text-slate-600 text-[11px]">
                <li>• Modelos: <strong>{confirmModalData.templates?.length || 0}</strong></li>
                <li>• Data da exportação: <strong>{confirmModalData.exportDate ? new Date(confirmModalData.exportDate).toLocaleString('pt-BR') : 'Desconhecida'}</strong></li>
                <li>• Materiais em planilha: <strong>{confirmModalData.materials?.length || 0}</strong></li>
                <li>• Logo da empresa: <strong>{confirmModalData.identity?.logoUrl ? 'Sim' : 'Não'}</strong></li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalData(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeRestore}
                disabled={isRestoring}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isRestoring ? 'Restaurando...' : 'Confirmar e Restaurar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
