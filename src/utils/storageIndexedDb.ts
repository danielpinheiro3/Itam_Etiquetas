import { 
  LabelTemplate, 
  PrintConfig, 
  PrintQueueItem, 
  Material, 
  CompanyIdentity, 
  ExcelMapping, 
  BackupData, 
  StorageDiagnostics 
} from '../types';

const DB_NAME = 'AlmoxPrintDB';
const DB_VERSION = 1;

export const DEFAULT_IDENTITY: CompanyIdentity = {
  logoUrl: '',
  systemName: 'SISTEMA DE ETIQUETAS',
  subtitle: 'ALMOXARIFADO'
};

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

/**
 * Initializes IndexedDB with all required structured stores
 */
export const getDatabase = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste navegador.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Models / Templates Store
      if (!db.objectStoreNames.contains('models')) {
        db.createObjectStore('models', { keyPath: 'id' });
      }

      // 2. Settings Store (key-value)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // 3. Identity Store
      if (!db.objectStoreNames.contains('identity')) {
        db.createObjectStore('identity', { keyPath: 'key' });
      }

      // 4. Materials Store
      if (!db.objectStoreNames.contains('materials')) {
        db.createObjectStore('materials', { keyPath: 'id' });
      }

      // 5. Print Queue Store
      if (!db.objectStoreNames.contains('printQueue')) {
        db.createObjectStore('printQueue', { keyPath: 'id' });
      }

      // 6. Assets Store (Logos, imagens avulsas)
      if (!db.objectStoreNames.contains('assets')) {
        db.createObjectStore('assets', { keyPath: 'id' });
      }

      // 7. Backups Store
      if (!db.objectStoreNames.contains('backups')) {
        db.createObjectStore('backups', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('Falha ao abrir IndexedDB:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbInitPromise;
};

// Generic store transaction helper
async function performTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest | void
): Promise<T> {
  const db = await getDatabase();
  return new Promise<T>((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      let req: IDBRequest | void;

      tx.oncomplete = () => {
        if (req && 'result' in req) {
          resolve(req.result as T);
        } else {
          resolve(undefined as T);
        }
      };

      tx.onerror = () => {
        reject(tx.error);
      };

      req = callback(store);
    } catch (err) {
      reject(err);
    }
  });
}

// ----------------------------------------------------
// MODELS (TEMPLATES) STORAGE
// ----------------------------------------------------
export const saveModelsToDb = async (models: LabelTemplate[]): Promise<void> => {
  try {
    const db = await getDatabase();
    const tx = db.transaction('models', 'readwrite');
    const store = tx.objectStore('models');
    
    // Clear and re-populate to keep strict sync
    store.clear();
    for (const m of models) {
      store.put(m);
    }

    // Also mirror into localStorage for extra safety
    try {
      localStorage.setItem('almox_templates', JSON.stringify(models));
    } catch (e) {
      // ignore localStorage quota warnings
    }
  } catch (err) {
    console.warn('Erro ao salvar modelos no IndexedDB, usando fallback:', err);
    try {
      localStorage.setItem('almox_templates', JSON.stringify(models));
    } catch (e) {}
  }
};

export const getModelsFromDb = async (): Promise<LabelTemplate[]> => {
  try {
    const db = await getDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('models', 'readonly');
      const store = tx.objectStore('models');
      const req = store.getAll();
      req.onsuccess = () => {
        if (req.result && req.result.length > 0) {
          resolve(req.result);
        } else {
          // fallback to localStorage
          try {
            const raw = localStorage.getItem('almox_templates');
            if (raw) resolve(JSON.parse(raw));
            else resolve([]);
          } catch (e) {
            resolve([]);
          }
        }
      };
      req.onerror = () => {
        try {
          const raw = localStorage.getItem('almox_templates');
          resolve(raw ? JSON.parse(raw) : []);
        } catch (e) {
          resolve([]);
        }
      };
    });
  } catch (err) {
    try {
      const raw = localStorage.getItem('almox_templates');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
};

// ----------------------------------------------------
// IDENTITY STORAGE
// ----------------------------------------------------
export const saveIdentityToDb = async (identity: CompanyIdentity): Promise<void> => {
  try {
    await performTx('identity', 'readwrite', (store) => {
      store.put({ key: 'company_identity', ...identity });
    });
    try {
      localStorage.setItem('almox_identity', JSON.stringify(identity));
    } catch (e) {}
  } catch (err) {
    try {
      localStorage.setItem('almox_identity', JSON.stringify(identity));
    } catch (e) {}
  }
};

export const getIdentityFromDb = async (): Promise<CompanyIdentity> => {
  try {
    const item = await performTx<any>('identity', 'readonly', (store) => {
      return store.get('company_identity');
    });
    if (item && item.systemName) {
      return {
        logoUrl: item.logoUrl || '',
        systemName: item.systemName || DEFAULT_IDENTITY.systemName,
        subtitle: item.subtitle || DEFAULT_IDENTITY.subtitle
      };
    }
  } catch (err) {}

  try {
    const raw = localStorage.getItem('almox_identity');
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return DEFAULT_IDENTITY;
};

// ----------------------------------------------------
// PRINT CONFIG STORAGE
// ----------------------------------------------------
export const savePrintConfigToDb = async (config: PrintConfig): Promise<void> => {
  try {
    await performTx('settings', 'readwrite', (store) => {
      store.put({ key: 'print_config', value: config });
    });
    try {
      localStorage.setItem('almox_print_config', JSON.stringify(config));
    } catch (e) {}
  } catch (err) {
    try {
      localStorage.setItem('almox_print_config', JSON.stringify(config));
    } catch (e) {}
  }
};

export const getPrintConfigFromDb = async (): Promise<PrintConfig | null> => {
  try {
    const item = await performTx<any>('settings', 'readonly', (store) => {
      return store.get('print_config');
    });
    if (item && item.value) return item.value;
  } catch (err) {}

  try {
    const raw = localStorage.getItem('almox_print_config');
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return null;
};

// ----------------------------------------------------
// MATERIALS STORAGE (EXCEL DATA)
// ----------------------------------------------------
export const saveMaterialsToDb = async (materials: Material[]): Promise<void> => {
  try {
    const db = await getDatabase();
    const tx = db.transaction('materials', 'readwrite');
    const store = tx.objectStore('materials');
    store.clear();
    for (const m of materials) {
      store.put(m);
    }
    try {
      localStorage.setItem('almox_materials', JSON.stringify(materials));
    } catch (e) {}
  } catch (err) {
    try {
      localStorage.setItem('almox_materials', JSON.stringify(materials));
    } catch (e) {}
  }
};

export const getMaterialsFromDb = async (): Promise<Material[]> => {
  try {
    const db = await getDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('materials', 'readonly');
      const store = tx.objectStore('materials');
      const req = store.getAll();
      req.onsuccess = () => {
        if (req.result && req.result.length > 0) resolve(req.result);
        else {
          try {
            const raw = localStorage.getItem('almox_materials');
            resolve(raw ? JSON.parse(raw) : []);
          } catch (e) {
            resolve([]);
          }
        }
      };
      req.onerror = () => {
        try {
          const raw = localStorage.getItem('almox_materials');
          resolve(raw ? JSON.parse(raw) : []);
        } catch (e) {
          resolve([]);
        }
      };
    });
  } catch (err) {
    try {
      const raw = localStorage.getItem('almox_materials');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
};

// ----------------------------------------------------
// PRINT QUEUE STORAGE
// ----------------------------------------------------
export const saveQueueToDb = async (queue: PrintQueueItem[]): Promise<void> => {
  try {
    const db = await getDatabase();
    const tx = db.transaction('printQueue', 'readwrite');
    const store = tx.objectStore('printQueue');
    store.clear();
    for (const q of queue) {
      store.put(q);
    }
    try {
      localStorage.setItem('almox_print_queue', JSON.stringify(queue));
    } catch (e) {}
  } catch (err) {
    try {
      localStorage.setItem('almox_print_queue', JSON.stringify(queue));
    } catch (e) {}
  }
};

export const getQueueFromDb = async (): Promise<PrintQueueItem[]> => {
  try {
    const db = await getDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('printQueue', 'readonly');
      const store = tx.objectStore('printQueue');
      const req = store.getAll();
      req.onsuccess = () => {
        if (req.result && req.result.length > 0) resolve(req.result);
        else {
          try {
            const raw = localStorage.getItem('almox_print_queue');
            resolve(raw ? JSON.parse(raw) : []);
          } catch (e) {
            resolve([]);
          }
        }
      };
      req.onerror = () => {
        try {
          const raw = localStorage.getItem('almox_print_queue');
          resolve(raw ? JSON.parse(raw) : []);
        } catch (e) {
          resolve([]);
        }
      };
    });
  } catch (err) {
    try {
      const raw = localStorage.getItem('almox_print_queue');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
};

// ----------------------------------------------------
// SETTINGS KEY-VALUE HELPER
// ----------------------------------------------------
export const saveSetting = async (key: string, value: any): Promise<void> => {
  try {
    await performTx('settings', 'readwrite', (store) => {
      store.put({ key, value });
    });
    try {
      localStorage.setItem(`almox_setting_${key}`, JSON.stringify(value));
    } catch (e) {}
  } catch (err) {
    try {
      localStorage.setItem(`almox_setting_${key}`, JSON.stringify(value));
    } catch (e) {}
  }
};

export const getSetting = async <T>(key: string, defaultValue?: T): Promise<T | undefined> => {
  try {
    const item = await performTx<any>('settings', 'readonly', (store) => {
      return store.get(key);
    });
    if (item && 'value' in item) return item.value;
  } catch (err) {}

  try {
    const raw = localStorage.getItem(`almox_setting_${key}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return defaultValue;
};

// ----------------------------------------------------
// ASSETS STORAGE
// ----------------------------------------------------
export const saveAssetToDb = async (id: string, name: string, dataUrl: string): Promise<void> => {
  try {
    await performTx('assets', 'readwrite', (store) => {
      store.put({
        id,
        name,
        dataUrl,
        sizeBytes: dataUrl.length,
        updatedAt: new Date().toISOString()
      });
    });
  } catch (e) {
    console.error('Falha ao salvar asset:', e);
  }
};

export const getAssetsFromDb = async (): Promise<any[]> => {
  try {
    const db = await getDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('assets', 'readonly');
      const store = tx.objectStore('assets');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
};

// ----------------------------------------------------
// EMBEDDED INITIAL DATA (PORTABLE STANDALONE SUPPORT)
// ----------------------------------------------------
export const getEmbeddedInitialData = (): BackupData | null => {
  if (typeof window !== 'undefined' && (window as any).__ALMOX_EMBEDDED_DATA__) {
    try {
      return (window as any).__ALMOX_EMBEDDED_DATA__ as BackupData;
    } catch (e) {
      console.error('Erro ao ler __ALMOX_EMBEDDED_DATA__:', e);
    }
  }
  return null;
};

// ----------------------------------------------------
// FULL BACKUP EXPORT & RESTORE
// ----------------------------------------------------
export const createFullBackup = async (
  currentTemplates: LabelTemplate[],
  currentConfig: PrintConfig,
  currentIdentity: CompanyIdentity,
  currentMaterials: Material[],
  currentMapping: ExcelMapping,
  currentQueue: PrintQueueItem[],
  activeTemplateId: string
): Promise<BackupData> => {
  const assets = await getAssetsFromDb();
  const assetsMap: Record<string, any> = {};
  assets.forEach((a) => {
    assetsMap[a.id] = a;
  });

  const backup: BackupData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    systemName: currentIdentity.systemName || 'SISTEMA DE ETIQUETAS',
    templates: currentTemplates,
    printConfig: currentConfig,
    identity: currentIdentity,
    materials: currentMaterials,
    savedMapping: currentMapping,
    queue: currentQueue,
    activeTemplateId,
    assets: assetsMap
  };

  // Record this backup snapshot into IndexedDB
  try {
    await performTx('backups', 'readwrite', (store) => {
      store.put({
        id: `backup-${Date.now()}`,
        date: backup.exportDate,
        summary: `${backup.templates.length} modelos, ${backup.materials.length} materiais`,
        data: backup
      });
    });
  } catch (e) {}

  return backup;
};

export const restoreFullBackup = async (backup: BackupData): Promise<void> => {
  if (!backup || !backup.templates || !Array.isArray(backup.templates)) {
    throw new Error('Formato de arquivo de backup inválido.');
  }

  // Restore into IndexedDB
  await saveModelsToDb(backup.templates);
  if (backup.identity) await saveIdentityToDb(backup.identity);
  if (backup.printConfig) await savePrintConfigToDb(backup.printConfig);
  if (backup.materials) await saveMaterialsToDb(backup.materials);
  if (backup.queue) await saveQueueToDb(backup.queue);
  if (backup.savedMapping) await saveSetting('excel_mapping', backup.savedMapping);
  if (backup.activeTemplateId) await saveSetting('active_template_id', backup.activeTemplateId);

  // Restore assets if present
  if (backup.assets) {
    for (const assetId of Object.keys(backup.assets)) {
      const asset = backup.assets[assetId];
      if (asset && asset.dataUrl) {
        await saveAssetToDb(asset.id || assetId, asset.name || 'Logo', asset.dataUrl);
      }
    }
  }

  // Also update localStorage keys
  try {
    localStorage.setItem('almox_templates', JSON.stringify(backup.templates));
    if (backup.identity) localStorage.setItem('almox_identity', JSON.stringify(backup.identity));
    if (backup.printConfig) localStorage.setItem('almox_print_config', JSON.stringify(backup.printConfig));
    if (backup.materials) localStorage.setItem('almox_materials', JSON.stringify(backup.materials));
    if (backup.queue) localStorage.setItem('almox_print_queue', JSON.stringify(backup.queue));
    if (backup.savedMapping) localStorage.setItem('almox_excel_mapping', JSON.stringify(backup.savedMapping));
    if (backup.activeTemplateId) localStorage.setItem('almox_active_template_id', backup.activeTemplateId);
  } catch (e) {}
};

// ----------------------------------------------------
// STORAGE DIAGNOSTICS
// ----------------------------------------------------
export const getStorageDiagnostics = async (): Promise<StorageDiagnostics> => {
  const isIndexedDbSupported = typeof window !== 'undefined' && !!window.indexedDB;
  let isIndexedDbConnected = false;
  let dbVersion = DB_VERSION;
  let storesCount = 0;
  let modelsCount = 0;
  let materialsCount = 0;
  let assetsCount = 0;

  if (isIndexedDbSupported) {
    try {
      const db = await getDatabase();
      isIndexedDbConnected = true;
      dbVersion = db.version;
      storesCount = db.objectStoreNames.length;

      const models = await getModelsFromDb();
      modelsCount = models.length;

      const materials = await getMaterialsFromDb();
      materialsCount = materials.length;

      const assets = await getAssetsFromDb();
      assetsCount = assets.length;
    } catch (e) {
      isIndexedDbConnected = false;
    }
  }

  // Calculate LocalStorage approximate size
  let localStorageUsageKb = 0;
  try {
    let totalLen = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('almox_')) {
        totalLen += (localStorage.getItem(k) || '').length;
      }
    }
    localStorageUsageKb = Math.round(totalLen / 1024);
  } catch (e) {}

  // Navigator Storage estimate if supported
  let estimatedStorageMb: number | undefined;
  let quotaStorageMb: number | undefined;

  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage !== undefined) {
        estimatedStorageMb = Number((estimate.usage / (1024 * 1024)).toFixed(2));
      }
      if (estimate.quota !== undefined) {
        quotaStorageMb = Number((estimate.quota / (1024 * 1024)).toFixed(0));
      }
    } catch (e) {}
  }

  return {
    isIndexedDbSupported,
    isIndexedDbConnected,
    dbVersion,
    storesCount,
    modelsCount,
    materialsCount,
    assetsCount,
    localStorageUsageKb,
    estimatedStorageMb,
    quotaStorageMb
  };
};
