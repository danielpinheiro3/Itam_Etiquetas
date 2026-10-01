import React, { useState, useRef } from 'react';
import { Material, ExcelMapping, ExcelImportValidation } from '../types';
import { 
  parseExcelFile, 
  validateAndConvertExcel, 
  guessColumnMapping, 
  downloadSampleExcelFile 
} from '../utils/excelUtils';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  Check, 
  AlertTriangle, 
  Save, 
  RefreshCw,
  FileCheck,
  CheckCircle2,
  Info
} from 'lucide-react';

interface ImportExcelViewProps {
  onImportComplete: (materials: Material[], rawFileName: string) => void;
  savedMapping: ExcelMapping;
  onSaveMapping: (mapping: ExcelMapping) => void;
}

export const ImportExcelView: React.FC<ImportExcelViewProps> = ({
  onImportComplete,
  savedMapping,
  onSaveMapping
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<ExcelMapping>(savedMapping);
  const [validation, setValidation] = useState<ExcelImportValidation | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      setError('Formato inválido. Por favor, envie uma planilha com extensão .XLSX ou .XLS.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setLoading(true);
    setImportSuccess(false);

    try {
      const { headers, rows } = await parseExcelFile(selectedFile);
      if (headers.length === 0 || rows.length === 0) {
        throw new Error('A planilha selecionada está vazia ou não possui cabeçalhos legíveis.');
      }

      setDetectedHeaders(headers);
      setRawRows(rows);

      // Guess column mappings
      const guessed = guessColumnMapping(headers);
      const activeMapping: ExcelMapping = {
        codigoCol: headers.includes(savedMapping.codigoCol) ? savedMapping.codigoCol : guessed.codigoCol,
        descricaoCol: headers.includes(savedMapping.descricaoCol) ? savedMapping.descricaoCol : guessed.descricaoCol,
        unidadeCol: headers.includes(savedMapping.unidadeCol) ? savedMapping.unidadeCol : guessed.unidadeCol,
      };

      setMapping(activeMapping);

      const { validation: valReport } = validateAndConvertExcel(rows, activeMapping);
      setValidation(valReport);
    } catch (err: any) {
      setError(err?.message || 'Falha ao processar o arquivo Excel.');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (field: keyof ExcelMapping, value: string) => {
    const updated = { ...mapping, [field]: value };
    setMapping(updated);
    if (rawRows.length > 0) {
      const { validation: valReport } = validateAndConvertExcel(rawRows, updated);
      setValidation(valReport);
    }
  };

  const handleConfirmImport = () => {
    if (!mapping.codigoCol) {
      setError('Por favor, selecione qual coluna do Excel corresponde ao "Código do material".');
      return;
    }

    const { materials, validation: valReport } = validateAndConvertExcel(rawRows, mapping);
    setValidation(valReport);
    onSaveMapping(mapping);
    onImportComplete(materials, file?.name || 'planilha_materiais.xlsx');
    setImportSuccess(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
            <span>Importação da Base de Materiais (Excel)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Carregue sua planilha com os campos <strong>Código</strong>, <strong>Descrição</strong> e <strong>Unidade padrão</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={downloadSampleExcelFile}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Baixar Planilha Modelo (.xlsx)</span>
        </button>
      </div>

      {/* Notice about Controle */}
      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong>Atenção sobre o campo Controle:</strong> O Controle <em>não é obrigatório na planilha</em>. Ele será informado manualmente por você na tela de criação da etiqueta ou na fila de impressão.
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          file
            ? 'border-emerald-400 bg-emerald-50/30'
            : 'border-slate-300 hover:border-amber-400 bg-white hover:bg-amber-50/10'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileChange(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
          {file ? <FileCheck className="w-7 h-7 text-emerald-600" /> : <Upload className="w-7 h-7" />}
        </div>

        {file ? (
          <div>
            <p className="text-sm font-bold text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-500 mt-1">
              Tamanho: {(file.size / 1024).toFixed(1)} KB · Clique ou arraste outro arquivo para substituir
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-bold text-slate-900">
              Clique para selecionar ou arraste sua planilha aqui
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Arquivos Excel .XLSX e .XLS são aceitos
            </p>
          </div>
        )}
      </div>

      {loading && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-3 text-sm text-slate-600">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
          <span>Lendo e analisando colunas da planilha Excel...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Falha ao ler planilha</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Column Mapping Section */}
      {detectedHeaders.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Relacionamento de Colunas</h3>
              <p className="text-xs text-slate-500">
                Identifique as 3 colunas essenciais do Excel correspondentes ao material.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {rawRows.length} linhas detectadas
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Campo Código */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>1. Código do Material *</span>
                <span className="text-[10px] text-amber-600 font-bold uppercase">Busca & Barras</span>
              </label>
              <select
                value={mapping.codigoCol}
                onChange={(e) => handleMappingChange('codigoCol', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="">-- Selecione a coluna do Código --</option>
                {detectedHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo Descrição */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>2. Descrição *</span>
                <span className="text-[10px] text-slate-500 uppercase">Texto do Produto</span>
              </label>
              <select
                value={mapping.descricaoCol}
                onChange={(e) => handleMappingChange('descricaoCol', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="">-- Selecione a coluna de Descrição --</option>
                {detectedHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo Unidade Padrão */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>3. Unidade padrão</span>
                <span className="text-[10px] text-slate-500 uppercase">UN, PC, KG...</span>
              </label>
              <select
                value={mapping.unidadeCol}
                onChange={(e) => handleMappingChange('unidadeCol', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="">-- Selecione a coluna da Unidade --</option>
                {detectedHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Validation & Consistency Report */}
          {validation && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Relatório de Consistência da Planilha</span>
                <span className="font-mono text-slate-500">{validation.totalRows} registros</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Registros Válidos</div>
                  <div className="text-base font-bold text-emerald-700 font-mono">
                    {validation.validRows}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Códigos Vazios</div>
                  <div className={`text-base font-bold font-mono ${validation.emptyCodesCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                    {validation.emptyCodesCount}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Códigos Repetidos</div>
                  <div className={`text-base font-bold font-mono ${validation.duplicateCodesCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                    {validation.duplicateCodesCount}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Sem Descrição</div>
                  <div className={`text-base font-bold font-mono ${validation.missingDescCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                    {validation.missingDescCount}
                  </div>
                </div>
              </div>

              {validation.duplicateCodesCount > 0 && (
                <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200">
                  <strong>Aviso:</strong> Foram identificados códigos repetidos na planilha (exemplos: {validation.duplicateCodesList.join(', ')}). Todos os registros serão mantidos para consulta.
                </div>
              )}
            </div>
          )}

          {/* Confirm Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5 text-slate-400" />
              <span>O relacionamento será salvo automaticamente no navegador.</span>
            </div>

            <button
              type="button"
              onClick={handleConfirmImport}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Carregar {rawRows.length} Materiais</span>
            </button>
          </div>

          {importSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Materiais importados com sucesso! Você já pode pesquisar por código.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
