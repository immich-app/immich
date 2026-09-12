import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { VolumeInfoRepository } from 'src/repositories/volume-info.repository.js';
import {
  ContentFingerprintMatcher,
  DeviceIdentity,
  DeviceIdentityConfidence,
  DeviceIdentityMethod,
} from 'src/services/device-resolver/device-resolver.types.js';

/** Below this sampled-checksum match ratio, a content fingerprint isn't worth surfacing as a candidate at all. */
export const DEFAULT_CONTENT_MATCH_THRESHOLD = 0.7;

export interface ResolveOptions {
  /** Strategy 4 fallback. Omitted until the resolver is wired into the library-scan job. */
  contentMatcher?: ContentFingerprintMatcher;
  /** Overrides DEFAULT_CONTENT_MATCH_THRESHOLD. */
  contentMatchThreshold?: number;
}

/**
 * Resolves a stable identity for a mounted drive by trying a layered chain of signals, most to least reliable, so
 * that one signal failing (a real case on some Windows/USB-enclosure combinations) doesn't fall straight through
 * to "unknown drive". See the PhotoManager plan's Phase 1 design for the full rationale behind the ordering:
 *
 *   1. filesystem volume serial (high confidence)
 *   2. USB/enclosure hardware serial (medium confidence)
 *   3. onboarding marker file (high confidence)
 *   4. content fingerprint against a known library (low confidence - caller should confirm with the user)
 *
 * This service holds no OS- or database-specific code itself: hardware/filesystem reads live in
 * VolumeInfoRepository, and checksum comparisons against the database live behind the injected
 * ContentFingerprintMatcher. That keeps the resolution policy itself fully unit-testable with mocks.
 */
@Injectable()
export class DeviceResolverService {
  constructor(private volumeInfo: VolumeInfoRepository) {}

  async resolve(mountPath: string, options: ResolveOptions = {}): Promise<DeviceIdentity | null> {
    const filesystemSerial = await this.safely(() => this.volumeInfo.getFilesystemSerial(mountPath));
    if (filesystemSerial) {
      return {
        id: filesystemSerial,
        method: DeviceIdentityMethod.FilesystemSerial,
        confidence: DeviceIdentityConfidence.High,
      };
    }

    const usbSerial = await this.safely(() => this.volumeInfo.getUsbHardwareSerial(mountPath));
    if (usbSerial) {
      return {
        id: usbSerial,
        method: DeviceIdentityMethod.UsbHardwareSerial,
        confidence: DeviceIdentityConfidence.Medium,
      };
    }

    const markerId = await this.safely(() => this.volumeInfo.readMarkerFile(mountPath));
    if (markerId) {
      return { id: markerId, method: DeviceIdentityMethod.MarkerFile, confidence: DeviceIdentityConfidence.High };
    }

    if (options.contentMatcher) {
      const threshold = options.contentMatchThreshold ?? DEFAULT_CONTENT_MATCH_THRESHOLD;
      const match = await this.safely(() => options.contentMatcher!.match(mountPath));
      if (match && match.matchRatio >= threshold) {
        return {
          id: match.libraryId,
          method: DeviceIdentityMethod.ContentFingerprint,
          confidence: DeviceIdentityConfidence.Low,
        };
      }
    }

    return null;
  }

  /**
   * Called once `resolve()` returns null and the caller has decided - directly, or after prompting the user per
   * the "ask, don't guess" rule - that this drive is worth tracking going forward. Writes a marker so a future
   * reconnect can succeed at strategy 3 even with no cooperating hardware ID.
   */
  async onboard(mountPath: string): Promise<string> {
    const id = randomUUID();
    await this.volumeInfo.writeMarkerFile(mountPath, id);
    return id;
  }

  private async safely<T>(read: () => Promise<T | null>): Promise<T | null> {
    try {
      return await read();
    } catch {
      return null;
    }
  }
}
