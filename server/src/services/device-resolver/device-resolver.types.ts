/** How a drive's identity was established. Ordered, in the resolver, from most to least reliable. */
export enum DeviceIdentityMethod {
  FilesystemSerial = 'filesystem-serial',
  UsbHardwareSerial = 'usb-hardware-serial',
  MarkerFile = 'marker-file',
  ContentFingerprint = 'content-fingerprint',
}

export enum DeviceIdentityConfidence {
  /** Hardware- or marker-backed match. Safe to auto-link without asking. */
  High = 'high',
  /** Corroborating-but-not-definitive signal (e.g. a USB enclosure serial). Safe to auto-link, but worth logging. */
  Medium = 'medium',
  /** Circumstantial content-based match only. Callers should confirm with the user before auto-linking - this is
   * the "ask, don't guess" case from the Phase 1 design. */
  Low = 'low',
}

export interface DeviceIdentity {
  /** Normalized identity string. Stable across reconnects, and across Windows/Linux for the same physical drive. */
  id: string;
  method: DeviceIdentityMethod;
  confidence: DeviceIdentityConfidence;
}

export interface ContentFingerprintMatch {
  /** The existing library this mounted path's contents appear to match. */
  libraryId: string;
  /** Fraction (0-1) of sampled files whose checksum matched an asset already recorded under `libraryId`. */
  matchRatio: number;
}

/**
 * Supplies the content-fingerprint fallback (resolver strategy 4): hashes a sample of files under `mountPath`
 * and reports how well they match a known library's assets. This is implemented separately - wired to
 * AssetRepository/LibraryRepository - once the resolver is integrated into the library-scan job; it's an
 * injected port here so DeviceResolverService stays unit-testable without a database.
 */
export interface ContentFingerprintMatcher {
  match(mountPath: string): Promise<ContentFingerprintMatch | null>;
}
