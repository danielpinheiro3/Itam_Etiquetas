import JSZip from 'jszip';
import { BackupData } from '../types';

/**
 * Triggers standard browser file download from Blob
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
};

/**
 * Exports full backup as formatted JSON file
 */
export const downloadBackupJson = (backupData: BackupData): void => {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const filename = `backup_almoxarifado_${dateStr}.json`;
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  downloadBlob(blob, filename);
};

// Safe string pieces to avoid breaking HTML parsers when this file is inlined
const S_OPEN = '<' + 'script';
const S_CLOSE = '<' + '/script>';

/**
 * Obtains the standalone HTML template source code.
 */
export const fetchStandaloneHtmlTemplate = async (): Promise<string> => {
  const candidates = [
    '/standalone-template.html',
    '/Sistema_de_Etiquetas.html',
    '/dist-singlefile/index.html'
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        if (text && (text.includes('<!doctype html>') || text.includes('<!DOCTYPE html>')) && text.includes('id="root"')) {
          return text;
        }
      }
    } catch (e) {
      // Continue to next candidate
    }
  }

  // Fallback: If running in standalone mode or dist
  if (typeof document !== 'undefined') {
    const html = document.documentElement.outerHTML;
    if (html.includes('id="root"')) {
      return '<!DOCTYPE html>\n' + html;
    }
  }

  throw new Error('Modelo HTML offline não pôde ser carregado. Certifique-se de executar o build ou reiniciar.');
};

/**
 * Injects user's current data into the standalone HTML template safely
 */
export const injectDataIntoHtml = (htmlContent: string, backupData: BackupData): string => {
  // Escape any script closing sequences inside the JSON
  const safeJson = JSON.stringify(backupData).replace(
    new RegExp(S_CLOSE, 'gi'),
    '<' + '\\/script>'
  );

  const scriptTag = `\n    ${S_OPEN} id="almox-embedded-initial-data">\n      window.__ALMOX_EMBEDDED_DATA__ = ${safeJson};\n    ${S_CLOSE}\n  `;

  // If already contains embedded data tag, replace it
  const pattern = new RegExp(S_OPEN + ' id="almox-embedded-initial-data"[\\s\\S]*?' + S_CLOSE);
  if (pattern.test(htmlContent)) {
    return htmlContent.replace(pattern, scriptTag.trim());
  }

  // Otherwise insert before </head> or </body>
  if (htmlContent.includes('</head>')) {
    return htmlContent.replace('</head>', `${scriptTag}</head>`);
  }

  if (htmlContent.includes('</body>')) {
    return htmlContent.replace('</body>', `${scriptTag}</body>`);
  }

  return htmlContent + scriptTag;
};

/**
 * Generates and downloads the 100% self-contained Standalone HTML file
 * File name: Sistema_de_Etiquetas.html
 */
export const exportStandaloneHtml = async (
  backupData: BackupData,
  onProgress?: (msg: string) => void
): Promise<void> => {
  if (onProgress) onProgress('Preparando arquivo HTML portátil 100% offline...');

  const rawHtml = await fetchStandaloneHtmlTemplate();
  if (onProgress) onProgress('Incorporando modelos, logotipo e configurações personalizadas...');

  const finalHtml = injectDataIntoHtml(rawHtml, backupData);

  const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
  const filename = 'Sistema_de_Etiquetas.html';

  if (onProgress) onProgress('Iniciando download de Sistema_de_Etiquetas.html...');
  downloadBlob(blob, filename);
};

/**
 * Generates and downloads a complete Portable ZIP package
 * Exact requested structure:
 * Sistema-de-Etiquetas/
 *     index.html
 *     Sistema_de_Etiquetas.html
 *     assets/
 *         ...
 *     backup_configuracoes.json
 *     LEIAME.txt
 */
export const exportPortableZip = async (
  backupData: BackupData,
  onProgress?: (msg: string) => void
): Promise<void> => {
  if (onProgress) onProgress('Iniciando montagem do pacote ZIP portátil...');
  const zip = new JSZip();
  const folder = zip.folder('Sistema-de-Etiquetas') || zip;

  // 1. Single-file standalone HTML version
  if (onProgress) onProgress('Incorporando versão HTML autocontida...');
  let standaloneHtml = '';
  try {
    const rawTemplate = await fetchStandaloneHtmlTemplate();
    standaloneHtml = injectDataIntoHtml(rawTemplate, backupData);
    folder.file('Sistema_de_Etiquetas.html', standaloneHtml);
  } catch (e) {
    console.warn('Erro ao obter standalone-template:', e);
  }

  // 2. Multi-file portable distribution (index.html + assets/)
  if (onProgress) onProgress('Obtendo arquivos de assets locais...');
  try {
    // Try to fetch manifest or known assets
    let manifestFiles: string[] = [];
    try {
      const manifestRes = await fetch('/portable-manifest.json');
      if (manifestRes.ok) {
        manifestFiles = await manifestRes.json();
      }
    } catch (e) {
      // ignore
    }

    if (manifestFiles.length > 0) {
      for (const relPath of manifestFiles) {
        if (relPath === 'index.html') {
          const indexRes = await fetch(`/portable-bundle/${relPath}`);
          if (indexRes.ok) {
            let indexHtml = await indexRes.text();
            indexHtml = injectDataIntoHtml(indexHtml, backupData);
            folder.file('index.html', indexHtml);
          }
        } else {
          const assetRes = await fetch(`/portable-bundle/${relPath}`);
          if (assetRes.ok) {
            const blob = await assetRes.blob();
            folder.file(relPath, blob);
          }
        }
      }
    } else {
      // Fallback: If manifest is not available, ensure index.html is the standalone HTML
      if (standaloneHtml) {
        folder.file('index.html', standaloneHtml);
      }
    }
  } catch (err) {
    console.warn('Falha ao empacotar assets avulsos:', err);
    if (standaloneHtml) {
      folder.file('index.html', standaloneHtml);
    }
  }

  // 3. Backup JSON file
  if (onProgress) onProgress('Adicionando backup completo das configurações (JSON)...');
  const jsonStr = JSON.stringify(backupData, null, 2);
  folder.file('backup_configuracoes.json', jsonStr);

  // 4. Detailed instructions LEIAME.txt
  const readmeText = `===================================================================
SISTEMA DE ETIQUETAS PARA ALMOXARIFADO - VERSÃO OFFLINE PORTÁTIL
===================================================================

Este pacote é 100% autônomo, portátil e funciona TOTALMENTE SEM INTERNET.
Não é necessário instalar nenhum programa, servidor, banco de dados ou Node.js.

COMO UTILIZAR:
1. Extraia o conteúdo deste arquivo ZIP em qualquer pasta (ex: Pendrive, HD, Área de Trabalho).
2. Dê um duplo clique em qualquer uma das opções:
   - "index.html" (Versão padrão)
   - "Sistema_de_Etiquetas.html" (Versão em arquivo único autocontido)
3. O sistema abrirá diretamente no seu navegador (Google Chrome, Microsoft Edge ou Firefox).
4. Todas as suas etiquetas, modelos, logotipo da empresa e cores personalizadas já estão carregadas.

RECURSOS DISPONÍVEIS 100% OFFLINE:
- Importação de planilhas Excel (.xlsx e .xls) locais
- Pesquisa rápida de materiais por Código ou Descrição
- Campo de Controle manual incorporado à etiqueta (opcional e individual)
- Geração instantânea de Código de Barras CODE 128
- Editor visual de layouts com medidas precisas em milímetros
- Suporte a logotipo da empresa e imagens nos modelos
- Impressão real em folhas A4 (210 x 297 mm) nos modos Retrato e Paisagem
- Rotação de etiquetas em 0°, 90°, 180° e 270°
- Exportação de arquivo PDF vetorial real (sem precisar de internet)
- Salvamento automático de dados no navegador (IndexedDB local)
- Personalização de cores e identidade visual
- Backup e Restauração de configurações a qualquer momento

TRANSPORTE PARA OUTRO COMPUTADOR:
- Basta copiar a pasta "Sistema-de-Etiquetas" ou o arquivo "Sistema_de_Etiquetas.html" para um pendrive.
- Conecte no outro computador e abra no navegador normalmente.
===================================================================
`;
  folder.file('LEIAME.txt', readmeText);

  if (onProgress) onProgress('Compactando arquivo ZIP final...');
  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

  const filename = 'Sistema_de_Etiquetas_Portatil.zip';
  if (onProgress) onProgress('Iniciando download do pacote ZIP...');
  downloadBlob(zipBlob, filename);
};
