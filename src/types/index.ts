export type SubjectId = 'biology' | 'chemistry' | 'physics';

export interface SubjectConfig {
  id: SubjectId;
  name: string;
  cardBgLight: string;
  cardBgDark: string;
  iconBgLight: string;
  iconBgDark: string;
  textColorLight: string;
  textColorDark: string;
  borderColorLight: string;
  borderColorDark: string;
  accentColor: string;
}

export interface FolderItem {
  id: string;
  subjectId: SubjectId;
  parentId: string | null; // null means subject root level
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface QuizFileItem {
  id: string;
  subjectId: SubjectId;
  folderId: string | null; // null means subject root level
  name: string;
  size: number;
  content: string; // The HTML/JS/CSS code
  questionCount: number;
  createdAt: number;
  updatedAt: number;
}

export type ViewState =
  | { type: 'home' }
  | { type: 'subject'; subjectId: SubjectId; currentFolderId: string | null }
  | { type: 'upload'; preselectedSubject?: SubjectId; preselectedFolderId?: string | null }
  | { type: 'quiz'; fileId: string; returnToSubjectId: SubjectId; returnToFolderId: string | null };

export interface BackupManifest {
  version: number;
  appName: string;
  exportedAt: string;
  folders: FolderItem[];
  files: Omit<QuizFileItem, 'content'>[];
}
