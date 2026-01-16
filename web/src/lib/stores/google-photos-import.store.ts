import { derived, writable } from 'svelte/store';

export type ImportStep = 'connect' | 'export' | 'upload' | 'processing' | 'complete';
export type ImportMethod = 'drive' | 'upload' | null;

export interface GoogleDriveFile {
  id: string;
  name: string;
  size: number;
  createdTime: string;
  mimeType: string;
}

export interface ImportProgress {
  phase: 'downloading' | 'extracting' | 'parsing' | 'uploading' | 'complete';
  current: number;
  total: number;
  currentFile?: string;
  albumsFound: number;
  photosMatched: number;
  photosMissingMetadata: number;
  errors: string[];
}

export interface GooglePhotosImportState {
  step: ImportStep;
  method: ImportMethod;
  isGoogleDriveConnected: boolean;
  driveFiles: GoogleDriveFile[];
  selectedDriveFiles: string[];
  uploadedFiles: File[];
  progress: ImportProgress | null;
  error: string | null;
}

const initialState: GooglePhotosImportState = {
  step: 'connect',
  method: null,
  isGoogleDriveConnected: false,
  driveFiles: [],
  selectedDriveFiles: [],
  uploadedFiles: [],
  progress: null,
  error: null,
};

function createGooglePhotosImportStore() {
  const { subscribe, set, update } = writable<GooglePhotosImportState>(initialState);

  return {
    subscribe,

    reset: () => set(initialState),

    setStep: (step: ImportStep) => update((state) => ({ ...state, step })),

    setMethod: (method: ImportMethod) =>
      update((state) => ({
        ...state,
        method,
        step: method === 'drive' ? 'connect' : 'upload',
      })),

    setGoogleDriveConnected: (connected: boolean) =>
      update((state) => ({
        ...state,
        isGoogleDriveConnected: connected,
      })),

    setDriveFiles: (files: GoogleDriveFile[]) =>
      update((state) => ({
        ...state,
        driveFiles: files,
      })),

    toggleDriveFile: (fileId: string) =>
      update((state) => {
        const selected = state.selectedDriveFiles.includes(fileId)
          ? state.selectedDriveFiles.filter((id) => id !== fileId)
          : [...state.selectedDriveFiles, fileId];
        return { ...state, selectedDriveFiles: selected };
      }),

    selectAllDriveFiles: () =>
      update((state) => ({
        ...state,
        selectedDriveFiles: state.driveFiles.map((f) => f.id),
      })),

    deselectAllDriveFiles: () =>
      update((state) => ({
        ...state,
        selectedDriveFiles: [],
      })),

    addUploadedFiles: (files: File[]) =>
      update((state) => ({
        ...state,
        uploadedFiles: [...state.uploadedFiles, ...files],
      })),

    removeUploadedFile: (index: number) =>
      update((state) => ({
        ...state,
        uploadedFiles: state.uploadedFiles.filter((_, i) => i !== index),
      })),

    clearUploadedFiles: () =>
      update((state) => ({
        ...state,
        uploadedFiles: [],
      })),

    setProgress: (progress: ImportProgress | null) =>
      update((state) => ({
        ...state,
        progress,
      })),

    updateProgress: (partial: Partial<ImportProgress>) =>
      update((state) => ({
        ...state,
        progress: state.progress ? { ...state.progress, ...partial } : null,
      })),

    setError: (error: string | null) =>
      update((state) => ({
        ...state,
        error,
      })),
  };
}

export const googlePhotosImportStore = createGooglePhotosImportStore();

// Derived stores for convenience
export const importStep = derived(googlePhotosImportStore, ($store) => $store.step);
export const importMethod = derived(googlePhotosImportStore, ($store) => $store.method);
export const importProgress = derived(googlePhotosImportStore, ($store) => $store.progress);
export const hasFilesToImport = derived(
  googlePhotosImportStore,
  ($store) => $store.selectedDriveFiles.length > 0 || $store.uploadedFiles.length > 0,
);
