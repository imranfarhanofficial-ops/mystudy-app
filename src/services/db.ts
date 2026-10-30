import { FolderItem, QuizFileItem, SubjectId } from '../types';

const DB_NAME = 'MyStudyDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Folders store
      if (!db.objectStoreNames.contains('folders')) {
        const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
        folderStore.createIndex('subjectId', 'subjectId', { unique: false });
        folderStore.createIndex('parentId', 'parentId', { unique: false });
        folderStore.createIndex('subject_parent', ['subjectId', 'parentId'], { unique: false });
      }

      // Files store
      if (!db.objectStoreNames.contains('files')) {
        const fileStore = db.createObjectStore('files', { keyPath: 'id' });
        fileStore.createIndex('subjectId', 'subjectId', { unique: false });
        fileStore.createIndex('folderId', 'folderId', { unique: false });
        fileStore.createIndex('subject_folder', ['subjectId', 'folderId'], { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ================= FOLDER OPERATIONS =================

export async function getFolders(subjectId: SubjectId, parentId: string | null): Promise<FolderItem[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('folders', 'readonly');
    const store = tx.objectStore('folders');
    const request = store.getAll();

    request.onsuccess = () => {
      const all: FolderItem[] = request.result || [];
      const filtered = all.filter(
        (f) => f.subjectId === subjectId && (f.parentId ?? null) === (parentId ?? null)
      );
      // Sort alphabetically by default
      filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      resolve(filtered);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getAllFolders(subjectId?: SubjectId): Promise<FolderItem[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('folders', 'readonly');
    const store = tx.objectStore('folders');
    const request = store.getAll();

    request.onsuccess = () => {
      let all: FolderItem[] = request.result || [];
      if (subjectId) {
        all = all.filter((f) => f.subjectId === subjectId);
      }
      resolve(all);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getFolderById(id: string): Promise<FolderItem | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('folders', 'readonly');
    const store = tx.objectStore('folders');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function createFolder(
  subjectId: SubjectId,
  parentId: string | null,
  name: string
): Promise<FolderItem> {
  const db = await getDB();
  const folder: FolderItem = {
    id: generateId(),
    subjectId,
    parentId,
    name: name.trim(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('folders', 'readwrite');
    const store = tx.objectStore('folders');
    const request = store.add(folder);

    request.onsuccess = () => resolve(folder);
    request.onerror = () => reject(request.error);
  });
}

export async function renameFolder(id: string, newName: string): Promise<FolderItem> {
  const db = await getDB();
  const folder = await getFolderById(id);
  if (!folder) throw new Error('Folder not found');

  folder.name = newName.trim();
  folder.updatedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('folders', 'readwrite');
    const store = tx.objectStore('folders');
    const request = store.put(folder);

    request.onsuccess = () => resolve(folder);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFolder(id: string): Promise<void> {
  const allFolders = await getAllFolders();
  const allFiles = await getAllFiles();

  // Recursively gather all subfolder IDs to delete
  const folderIdsToDelete = new Set<string>([id]);
  let added = true;
  while (added) {
    added = false;
    for (const f of allFolders) {
      if (f.parentId && folderIdsToDelete.has(f.parentId) && !folderIdsToDelete.has(f.id)) {
        folderIdsToDelete.add(f.id);
        added = true;
      }
    }
  }

  // Find all files belonging to any of these folders
  const filesToDelete = allFiles.filter((file) => file.folderId && folderIdsToDelete.has(file.folderId));

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['folders', 'files'], 'readwrite');
    const folderStore = tx.objectStore('folders');
    const fileStore = tx.objectStore('files');

    for (const fId of folderIdsToDelete) {
      folderStore.delete(fId);
    }
    for (const f of filesToDelete) {
      fileStore.delete(f.id);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ================= FILE OPERATIONS =================

export async function getFiles(subjectId: SubjectId, folderId: string | null): Promise<QuizFileItem[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const store = tx.objectStore('files');
    const request = store.getAll();

    request.onsuccess = () => {
      const all: QuizFileItem[] = request.result || [];
      const filtered = all.filter(
        (f) => f.subjectId === subjectId && (f.folderId ?? null) === (folderId ?? null)
      );
      filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      resolve(filtered);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getAllFiles(subjectId?: SubjectId): Promise<QuizFileItem[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const store = tx.objectStore('files');
    const request = store.getAll();

    request.onsuccess = () => {
      let all: QuizFileItem[] = request.result || [];
      if (subjectId) {
        all = all.filter((f) => f.subjectId === subjectId);
      }
      resolve(all);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getFileById(id: string): Promise<QuizFileItem | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const store = tx.objectStore('files');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFile(params: {
  subjectId: SubjectId;
  folderId: string | null;
  name: string;
  size: number;
  content: string;
  questionCount: number;
}): Promise<QuizFileItem> {
  const db = await getDB();
  const existingFiles = await getFiles(params.subjectId, params.folderId);
  
  // Handle duplicate name by appending counter e.g. Cockroach(1).html
  let finalName = params.name.trim();
  const existingNames = new Set(existingFiles.map((f) => f.name.toLowerCase()));
  if (existingNames.has(finalName.toLowerCase())) {
    const extIndex = finalName.lastIndexOf('.');
    const base = extIndex !== -1 ? finalName.substring(0, extIndex) : finalName;
    const ext = extIndex !== -1 ? finalName.substring(extIndex) : '';
    let counter = 1;
    while (existingNames.has(`${base}_${counter}${ext}`.toLowerCase())) {
      counter++;
    }
    finalName = `${base}_${counter}${ext}`;
  }

  const fileItem: QuizFileItem = {
    id: generateId(),
    subjectId: params.subjectId,
    folderId: params.folderId,
    name: finalName,
    size: params.size,
    content: params.content,
    questionCount: params.questionCount,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    const request = store.add(fileItem);

    request.onsuccess = () => resolve(fileItem);
    request.onerror = () => reject(request.error);
  });
}

export async function renameFile(id: string, newName: string): Promise<QuizFileItem> {
  const db = await getDB();
  const file = await getFileById(id);
  if (!file) throw new Error('File not found');

  let sanitized = newName.trim();
  if (!sanitized.toLowerCase().endsWith('.html') && !sanitized.toLowerCase().endsWith('.htm')) {
    sanitized += '.html';
  }

  file.name = sanitized;
  file.updatedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    const request = store.put(file);

    request.onsuccess = () => resolve(file);
    request.onerror = () => reject(request.error);
  });
}

export async function moveFile(id: string, newFolderId: string | null): Promise<QuizFileItem> {
  const db = await getDB();
  const file = await getFileById(id);
  if (!file) throw new Error('File not found');

  file.folderId = newFolderId;
  file.updatedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    const request = store.put(file);

    request.onsuccess = () => resolve(file);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ================= SETTINGS OPERATIONS =================

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result && request.result.value !== undefined) {
          resolve(request.result.value as T);
        } else {
          resolve(defaultValue);
        }
      };
      request.onerror = () => resolve(defaultValue);
    });
  } catch {
    return defaultValue;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    const request = store.put({ key, value });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ================= BACKUP & BULK RESTORE =================

export async function bulkImportData(
  folders: FolderItem[],
  files: QuizFileItem[],
  overwrite = false
): Promise<{ addedFolders: number; addedFiles: number }> {
  const db = await getDB();

  if (overwrite) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['folders', 'files'], 'readwrite');
      tx.objectStore('folders').clear();
      tx.objectStore('files').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  const existingFolders = await getAllFolders();
  const existingFiles = await getAllFiles();
  const existingFolderIds = new Set(existingFolders.map((f) => f.id));
  const existingFileIds = new Set(existingFiles.map((f) => f.id));

  let addedFolders = 0;
  let addedFiles = 0;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['folders', 'files'], 'readwrite');
    const folderStore = tx.objectStore('folders');
    const fileStore = tx.objectStore('files');

    for (const f of folders) {
      if (!existingFolderIds.has(f.id) || overwrite) {
        folderStore.put(f);
        addedFolders++;
      }
    }

    for (const fl of files) {
      if (!existingFileIds.has(fl.id) || overwrite) {
        fileStore.put(fl);
        addedFiles++;
      }
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return { addedFolders, addedFiles };
}

export async function clearAllUserData(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['folders', 'files'], 'readwrite');
    tx.objectStore('folders').clear();
    tx.objectStore('files').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
