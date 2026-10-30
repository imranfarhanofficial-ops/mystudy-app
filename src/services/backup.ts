import JSZip from 'jszip';
import { getAllFolders, getAllFiles, bulkImportData } from './db';
import { FolderItem, QuizFileItem, SubjectId } from '../types';

export interface BackupStats {
  restoredFolders: number;
  restoredFiles: number;
}

// Build folder path map e.g. { [folderId]: 'The Unit of Life/Cell Structure' }
function buildFolderPaths(folders: FolderItem[]): Map<string, string> {
  const map = new Map<string, string>();
  const folderById = new Map<string, FolderItem>();
  for (const f of folders) {
    folderById.set(f.id, f);
  }

  function getPath(fId: string): string {
    if (map.has(fId)) return map.get(fId)!;
    const f = folderById.get(fId);
    if (!f) return '';
    if (!f.parentId) {
      map.set(fId, f.name);
      return f.name;
    }
    const parentPath = getPath(f.parentId);
    const full = parentPath ? `${parentPath}/${f.name}` : f.name;
    map.set(fId, full);
    return full;
  }

  for (const f of folders) {
    getPath(f.id);
  }

  return map;
}

export async function createFullBackupZip(): Promise<{ blob: Blob; filename: string; stats: { folders: number; files: number } }> {
  const folders = await getAllFolders();
  const files = await getAllFiles();
  const folderPaths = buildFolderPaths(folders);

  const zip = new JSZip();

  // Root manifest
  const manifest = {
    version: 1,
    appName: 'MyStudy',
    exportedAt: new Date().toISOString(),
    stats: {
      foldersCount: folders.length,
      filesCount: files.length,
    },
    folders,
    filesMetadata: files.map(({ content, ...rest }) => rest),
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // Create subject root folders
  const subjects: SubjectId[] = ['biology', 'chemistry', 'physics'];
  const subjectFolders: Record<SubjectId, JSZip> = {
    biology: zip.folder('Biology')!,
    chemistry: zip.folder('Chemistry')!,
    physics: zip.folder('Physics')!,
  };

  // Add files into their respective nested paths
  for (const file of files) {
    const subjZip = subjectFolders[file.subjectId] || zip;
    let targetFolderZip = subjZip;

    if (file.folderId && folderPaths.has(file.folderId)) {
      const relativePath = folderPaths.get(file.folderId)!;
      targetFolderZip = subjZip.folder(relativePath)!;
    }

    targetFolderZip.file(file.name, file.content);
  }

  // Also include empty folders in the ZIP so folder structure is preserved
  for (const folder of folders) {
    const subjZip = subjectFolders[folder.subjectId] || zip;
    const relativePath = folderPaths.get(folder.id);
    if (relativePath) {
      subjZip.folder(relativePath);
    }
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `MyStudy_Library_Backup_${dateStr}.zip`;
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

  return {
    blob,
    filename,
    stats: {
      folders: folders.length,
      files: files.length,
    },
  };
}

export function triggerDownload(blob: Blob, filename: string): void {
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
}

// Share backup directly via Android Native Share Sheet (Save to Google Drive)
export async function shareBackupToGoogleDrive(blob: Blob, filename: string): Promise<boolean> {
  const file = new File([blob], filename, { type: 'application/zip' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'MyStudy Library Backup',
        text: 'Backup of MyStudy offline library and HTML quizzes for Google Drive',
        files: [file],
      });
      return true;
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share error:', err);
      }
      return false;
    }
  }
  return false;
}

export async function restoreBackupFromZip(file: File, overwrite = false): Promise<BackupStats> {
  const zip = await JSZip.loadAsync(file);

  // Check if manifest.json exists
  const manifestFile = zip.file('manifest.json');
  if (manifestFile) {
    const manifestStr = await manifestFile.async('string');
    const manifest = JSON.parse(manifestStr);

    const folders: FolderItem[] = manifest.folders || [];
    const restoredFiles: QuizFileItem[] = [];

    // Find and read all files
    for (const fMeta of manifest.filesMetadata || []) {
      // Find where file is in the zip
      let content = '';
      const candidates = [
        `Biology/${fMeta.name}`,
        `Chemistry/${fMeta.name}`,
        `Physics/${fMeta.name}`,
      ];

      // Also search by filename anywhere in the zip
      const matchingZipFiles = zip.file(new RegExp(`(^|/)${escapeRegex(fMeta.name)}$`, 'i'));
      if (matchingZipFiles.length > 0) {
        content = await matchingZipFiles[0].async('string');
      }

      if (content) {
        restoredFiles.push({
          ...fMeta,
          content,
        });
      }
    }

    const { addedFolders, addedFiles } = await bulkImportData(folders, restoredFiles, overwrite);
    return { restoredFolders: addedFolders, restoredFiles: addedFiles };
  }

  // Fallback: Restore from raw ZIP directory structure (e.g. if manually zipped)
  const folders: FolderItem[] = [];
  const restoredFiles: QuizFileItem[] = [];
  const pathMap = new Map<string, string>(); // path -> folderId

  const entries: { path: string; isDir: boolean }[] = [];
  zip.forEach((relPath, entry) => {
    entries.push({ path: relPath, isDir: entry.dir });
  });

  // Sort paths by depth
  entries.sort((a, b) => a.path.split('/').length - b.path.split('/').length);

  for (const entry of entries) {
    const parts = entry.path.split('/').filter(Boolean);
    if (parts.length === 0) continue;

    const topSubject = parts[0].toLowerCase();
    let subjectId: SubjectId = 'biology';
    if (topSubject.includes('chem')) subjectId = 'chemistry';
    else if (topSubject.includes('phys')) subjectId = 'physics';

    if (entry.isDir) {
      if (parts.length > 1) {
        // Nested folder
        const folderName = parts[parts.length - 1];
        const parentPath = parts.slice(0, parts.length - 1).join('/');
        const parentId = parts.length > 2 ? pathMap.get(parentPath) || null : null;
        const folderId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        pathMap.set(entry.path.replace(/\/$/, ''), folderId);
        folders.push({
          id: folderId,
          subjectId,
          parentId,
          name: folderName,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    } else {
      // It's a file
      const fileName = parts[parts.length - 1];
      if (fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm')) {
        const parentPath = parts.slice(0, parts.length - 1).join('/');
        const folderId = parts.length > 1 ? pathMap.get(parentPath) || null : null;
        const zipObj = zip.file(entry.path);
        if (zipObj) {
          const content = await zipObj.async('string');
          restoredFiles.push({
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            subjectId,
            folderId,
            name: fileName,
            size: content.length,
            content,
            questionCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
    }
  }

  const { addedFolders, addedFiles } = await bulkImportData(folders, restoredFiles, overwrite);
  return { restoredFolders: addedFolders, restoredFiles: addedFiles };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function exportJSONBackup(): Promise<string> {
  const folders = await getAllFolders();
  const files = await getAllFiles();
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    folders,
    files,
  }, null, 2);
}

export async function restoreJSONBackup(jsonStr: string, overwrite = false): Promise<BackupStats> {
  const data = JSON.parse(jsonStr);
  const folders: FolderItem[] = data.folders || [];
  const files: QuizFileItem[] = data.files || [];
  const { addedFolders, addedFiles } = await bulkImportData(folders, files, overwrite);
  return { restoredFolders: addedFolders, restoredFiles: addedFiles };
}
