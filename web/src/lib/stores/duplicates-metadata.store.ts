import { writable } from 'svelte/store';

export interface MetadataPreference {
  // Asset Properties
  fileCreatedAt: boolean;
  fileModifiedAt: boolean;
  originalFileName: boolean;
  originalPath: boolean;

  // EXIF Properties
  dateTimeOriginal: boolean;
  description: boolean;
  exposureTime: boolean;
  fNumber: boolean;
  focalLength: boolean;
  iso: boolean;
  lensModel: boolean;
  make: boolean;
  model: boolean;
  modifyDate: boolean;
  orientation: boolean;
  projectionType: boolean;
  rating: boolean;

  // Location Properties (from EXIF)
  city: boolean;
  country: boolean;
  state: boolean;
  timeZone: boolean;
  latitude: boolean;
  longitude: boolean;
}

const initialMetadataPreference: MetadataPreference = {
  fileCreatedAt: false,
  fileModifiedAt: false,
  originalFileName: false,
  originalPath: false,
  dateTimeOriginal: false,
  description: false,
  exposureTime: false,
  fNumber: false,
  focalLength: false,
  iso: false,
  lensModel: false,
  make: false,
  model: false,
  modifyDate: false,
  orientation: false,
  projectionType: false,
  rating: false,
  city: false,
  country: false,
  state: false,
  timeZone: false,
  latitude: false,
  longitude: false,
};

export const metadataPreferenceStore = writable<MetadataPreference>(initialMetadataPreference);

export const updateMetadataPreference = (key: keyof MetadataPreference, value: boolean) => {
  metadataPreferenceStore.update((prefs) => ({
    ...prefs,
    [key]: value,
  }));
};

// Controls whether to show all selected metadata values, or only those that differ across assets
export const showAllMetadataStore = writable<boolean>(false);
