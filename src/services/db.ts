
import { FolderItem, QuizFileItem, SubjectId } from '../types';

const DB_NAME = 'MyStudyDB';
const DB_VERSION = 3;

let dbPromise: Promise<IDBDatabase> | null = null;

// ================= DATABASE =================

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('folders')) {
        const store = db.createObjectStore('folders', { keyPath: 'id' });
        store.createIndex('subjectId', 'subjectId', { unique: false });
        store.createIndex('parentId', 'parentId', { unique: false });
        store.createIndex('subject_parent', ['subjectId', 'parentId'], { unique: false });
      }

      if (!db.objectStoreNames.contains('files')) {
        const store = db.createObjectStore('files', { keyPath: 'id' });
        store.createIndex('subjectId', 'subjectId', { unique: false });
        store.createIndex('folderId', 'folderId', { unique: false });
        store.createIndex('subject_folder', ['subjectId', 'folderId'], { unique: false });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('routines')) {
        const store = db.createObjectStore('routines', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains('notifications')) {
        const store = db.createObjectStore('notifications', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn('Database upgrade is blocked by another open connection.');
    };
  });

  return dbPromise;
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ================= FOLDER OPERATIONS =================

export async function getFolders(
  subjectId: SubjectId,
  parentId: string | null
): Promise<FolderItem[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const request = db.transaction('folders', 'readonly')
      .objectStore('folders').getAll();

    request.onsuccess = () => {
      const all = (request.result || []) as FolderItem[];
      const filtered = all.filter(
        (f) => f.subjectId === subjectId &&
          (f.parentId ?? null) === (parentId ?? null)
      );

      filtered.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );

      resolve(filtered);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getAllFolders(subjectId?: SubjectId): Promise<FolderItem[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const request = db.transaction('folders', 'readonly')
      .objectStore('folders').getAll();

    request.onsuccess = () => {
      let all = (request.result || []) as FolderItem[];
      if (subjectId) all = all.filter((f) => f.subjectId === subjectId);
      resolve(all);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getFolderById(id: string): Promise<FolderItem | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const request = db.transaction('folders', 'readonly')
      .objectStore('folders').get(id);

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
    tx.objectStore('folders').add(folder);

    tx.oncomplete = () => resolve(folder);
    tx.onerror = () => reject(tx.error);
  });
}

export async function renameFolder(
  id: string,
  newName: string
): Promise<FolderItem> {
  const folder = await getFolderById(id);
  if (!folder) throw new Error('Folder not found');

  folder.name = newName.trim();
  folder.updatedAt = Date.now();

  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('folders', 'readwrite');
    tx.objectStore('folders').put(folder);

    tx.oncomplete = () => resolve(folder);
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteFolder(id: string): Promise<void> {
  const allFolders = await getAllFolders();
  const allFiles = await getAllFiles();

  const folderIds = new Set<string>([id]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const folder of allFolders) {
      if (
        folder.parentId &&
        folderIds.has(folder.parentId) &&
        !folderIds.has(folder.id)
      ) {
        folderIds.add(folder.id);
        changed = true;
      }
    }
  }

  const filesToDelete = allFiles.filter(
    (file) => file.folderId && folderIds.has(file.folderId)
  );

  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['folders', 'files'], 'readwrite');
    const folderStore = tx.objectStore('folders');
    const fileStore = tx.objectStore('files');

    folderIds.forEach((folderId) => folderStore.delete(folderId));
    filesToDelete.forEach((file) => fileStore.delete(file.id));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ================= FILE OPERATIONS =================

export async function getFiles(
  subjectId: SubjectId,
  folderId: string | null
): Promise<QuizFileItem[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const request = db.transaction('files', 'readonly')
      .objectStore('files').getAll();

    request.onsuccess = () => {
      const all = (request.result || []) as QuizFileItem[];

      const filtered = all.filter(
        (f) => f.subjectId === subjectId &&
          (f.folderId ?? null) === (folderId ?? null)
      );

      filtered.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );

      resolve(filtered);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getAllFiles(subjectId?: SubjectId): Promise<QuizFileItem[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const request = db.transaction('files', 'readonly')
      .objectStore('files').getAll();

    request.onsuccess = () => {
      let all = (request.result || []) as QuizFileItem[];
      if (subjectId) all = all.filter((f) => f.subjectId === subjectId);
      resolve(all);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getFileById(id: string): Promise<QuizFileItem | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const request = db.transaction('files', 'readonly')
      .objectStore('files').get(id);

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
    tx.objectStore('files').add(fileItem);

    tx.oncomplete = () => resolve(fileItem);
    tx.onerror = () => reject(tx.error);
  });
}

export async function renameFile(
  id: string,
  newName: string
): Promise<QuizFileItem> {
  const file = await getFileById(id);
  if (!file) throw new Error('File not found');

  let sanitized = newName.trim();

  if (
    !sanitized.toLowerCase().endsWith('.html') &&
    !sanitized.toLowerCase().endsWith('.htm')
  ) {
    sanitized += '.html';
  }

  file.name = sanitized;
  file.updatedAt = Date.now();

  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(file);

    tx.oncomplete = () => resolve(file);
    tx.onerror = () => reject(tx.error);
  });
}

export async function moveFile(
  id: string,
  newFolderId: string | null
): Promise<QuizFileItem> {
  const file = await getFileById(id);
  if (!file) throw new Error('File not found');

  file.folderId = newFolderId;
  file.updatedAt = Date.now();

  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(file);

    tx.oncomplete = () => resolve(file);
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ================= SETTINGS OPERATIONS =================

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDB();

    return await new Promise((resolve) => {
      const request = db.transaction('settings', 'readonly')
        .objectStore('settings').get(key);

      request.onsuccess = () => {
        resolve(
          request.result && request.result.value !== undefined
            ? request.result.value as T
            : defaultValue
        );
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
    tx.objectStore('settings').put({ key, value });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
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

  const folderIds = new Set(existingFolders.map((f) => f.id));
  const fileIds = new Set(existingFiles.map((f) => f.id));

  let addedFolders = 0;
  let addedFiles = 0;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['folders', 'files'], 'readwrite');
    const folderStore = tx.objectStore('folders');
    const fileStore = tx.objectStore('files');

    for (const folder of folders) {
      if (!folderIds.has(folder.id) || overwrite) {
        folderStore.put(folder);
        addedFolders++;
      }
    }

    for (const file of files) {
      if (!fileIds.has(file.id) || overwrite) {
        fileStore.put(file);
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
    const tx = db.transaction(
      ['folders', 'files', 'routines'],
      'readwrite'
    );

    tx.objectStore('folders').clear();
    tx.objectStore('files').clear();
    tx.objectStore('routines').clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ================= DAILY ROUTINE OPERATIONS =================

export interface DailyRoutineItem {
  id: string;
  date: string;
  title: string;
  completed: boolean;
  locked: boolean;
  createdAt: number;
  completedAt?: number;
}

export async function getDailyRoutines(
  date: string
): Promise<DailyRoutineItem[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const request = db.transaction('routines', 'readonly')
      .objectStore('routines').index('date').getAll(date);

    request.onsuccess = () => {
      const routines = (request.result || []) as DailyRoutineItem[];
      routines.sort((a, b) => a.createdAt - b.createdAt);
      resolve(routines);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function createDailyRoutine(
  date: string,
  title: string
): Promise<DailyRoutineItem> {
  const db = await getDB();

  const routine: DailyRoutineItem = {
    id: generateId(),
    date,
    title: title.trim(),
    completed: false,
    locked: false,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('routines', 'readwrite');
    tx.objectStore('routines').add(routine);

    tx.oncomplete = () => resolve(routine);
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateDailyRoutine(
  id: string,
  title: string
): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('routines', 'readwrite');
    const store = tx.objectStore('routines');
    const request = store.get(id);

    request.onsuccess = () => {
      const routine = request.result as DailyRoutineItem | undefined;

      if (!routine || routine.locked || routine.completed) {
        tx.abort();
        return;
      }

      routine.title = title.trim();
      store.put(routine);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Routine update cancelled'));
  });
}

export async function lockDailyRoutine(id: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('routines', 'readwrite');
    const store = tx.objectStore('routines');
    const request = store.get(id);

    request.onsuccess = () => {
      const routine = request.result as DailyRoutineItem | undefined;

      if (!routine || routine.completed) {
        tx.abort();
        return;
      }

      routine.locked = true;
      store.put(routine);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Routine lock cancelled'));
  });
}

export async function completeDailyRoutine(id: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('routines', 'readwrite');
    const store = tx.objectStore('routines');
    const request = store.get(id);

    request.onsuccess = () => {
      const routine = request.result as DailyRoutineItem | undefined;

      if (!routine || routine.completed) {
        tx.abort();
        return;
      }

      routine.completed = true;
      routine.completedAt = Date.now();
      store.put(routine);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Routine completion cancelled'));
  });
}

// Delete only completed routines for the selected date.
// Pending routines are never deleted by this function.
export async function deleteCompletedDailyRoutines(
  date: string
): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('routines', 'readwrite');
    const store = tx.objectStore('routines');
    const request = store.index('date').getAll(date);

    request.onsuccess = () => {
      const routines = (request.result || []) as DailyRoutineItem[];

      routines.forEach((routine) => {
        if (routine.completed) {
          store.delete(routine.id);
        }
      });
    };

    request.onerror = () => {
      try {
        tx.abort();
      } catch {
        reject(request.error);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Routine deletion cancelled'));
  });
}

// ================= NOTIFICATION OPERATIONS =================

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: number;
  type: 'update' | 'info' | 'success';
  read: boolean;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const request = db.transaction('notifications', 'readonly')
      .objectStore('notifications').getAll();

    request.onsuccess = () => {
      const items = (request.result || []) as NotificationItem[];
      items.sort((a, b) => b.date - a.date);
      resolve(items);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function createNotification(
  notification: Omit<NotificationItem, 'id' | 'date' | 'read'> & {
    id?: string;
    date?: number;
  }
): Promise<NotificationItem> {
  const db = await getDB();

  const item: NotificationItem = {
    id: notification.id || generateId(),
    title: notification.title,
    message: notification.message,
    date: notification.date ?? Date.now(),
    type: notification.type,
    read: false,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('notifications', 'readwrite');
    tx.objectStore('notifications').put(item);

    tx.oncomplete = () => resolve(item);
    tx.onerror = () => reject(tx.error);
  });
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('notifications', 'readwrite');
    const store = tx.objectStore('notifications');
    const request = store.get(id);

    request.onsuccess = () => {
      const item = request.result as NotificationItem | undefined;

      if (item && !item.read) {
        item.read = true;
        store.put(item);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const items = await getNotifications();
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('notifications', 'readwrite');
    const store = tx.objectStore('notifications');

    items.forEach((item) => {
      if (!item.read) {
        item.read = true;
        store.put(item);
      }
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteNotification(id: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('notifications', 'readwrite');
    tx.objectStore('notifications').delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
