import { VolumeInfoRepository } from 'src/repositories/volume-info.repository.js';
import { DeviceResolverService } from 'src/services/device-resolver/device-resolver.service.js';
import {
  ContentFingerprintMatcher,
  DeviceIdentityConfidence,
  DeviceIdentityMethod,
} from 'src/services/device-resolver/device-resolver.types.js';
import { Mocked, vitest } from 'vitest';

const MOUNT_PATH = '/mnt/external/test-drive';

describe(DeviceResolverService.name, () => {
  let sut: DeviceResolverService;
  let volumeInfo: Mocked<VolumeInfoRepository>;

  beforeEach(() => {
    volumeInfo = {
      getFilesystemSerial: vitest.fn(),
      getUsbHardwareSerial: vitest.fn(),
      readMarkerFile: vitest.fn(),
      writeMarkerFile: vitest.fn(),
    } as unknown as Mocked<VolumeInfoRepository>;

    sut = new DeviceResolverService(volumeInfo);
  });

  describe('resolve', () => {
    it('returns the filesystem serial at high confidence when available', async () => {
      volumeInfo.getFilesystemSerial.mockResolvedValue('ABCD1234');

      const result = await sut.resolve(MOUNT_PATH);

      expect(result).toEqual({
        id: 'ABCD1234',
        method: DeviceIdentityMethod.FilesystemSerial,
        confidence: DeviceIdentityConfidence.High,
      });
      expect(volumeInfo.getUsbHardwareSerial).not.toHaveBeenCalled();
      expect(volumeInfo.readMarkerFile).not.toHaveBeenCalled();
    });

    it('falls through to the USB hardware serial at medium confidence when the filesystem serial is unavailable', async () => {
      volumeInfo.getFilesystemSerial.mockResolvedValue(null);
      volumeInfo.getUsbHardwareSerial.mockResolvedValue('USB-SERIAL-1');

      const result = await sut.resolve(MOUNT_PATH);

      expect(result).toEqual({
        id: 'USB-SERIAL-1',
        method: DeviceIdentityMethod.UsbHardwareSerial,
        confidence: DeviceIdentityConfidence.Medium,
      });
      expect(volumeInfo.readMarkerFile).not.toHaveBeenCalled();
    });

    it('falls through to the marker file at high confidence when both hardware signals are unavailable', async () => {
      volumeInfo.getFilesystemSerial.mockResolvedValue(null);
      volumeInfo.getUsbHardwareSerial.mockResolvedValue(null);
      volumeInfo.readMarkerFile.mockResolvedValue('marker-uuid-1');

      const result = await sut.resolve(MOUNT_PATH);

      expect(result).toEqual({
        id: 'marker-uuid-1',
        method: DeviceIdentityMethod.MarkerFile,
        confidence: DeviceIdentityConfidence.High,
      });
    });

    it('treats a thrown error from a strategy the same as an unavailable signal and falls through', async () => {
      volumeInfo.getFilesystemSerial.mockRejectedValue(new Error('blkid not found'));
      volumeInfo.getUsbHardwareSerial.mockResolvedValue(null);
      volumeInfo.readMarkerFile.mockResolvedValue('marker-uuid-2');

      const result = await sut.resolve(MOUNT_PATH);

      expect(result?.id).toBe('marker-uuid-2');
    });

    it('falls through to the content fingerprint at low confidence when above the match threshold', async () => {
      volumeInfo.getFilesystemSerial.mockResolvedValue(null);
      volumeInfo.getUsbHardwareSerial.mockResolvedValue(null);
      volumeInfo.readMarkerFile.mockResolvedValue(null);

      const contentMatcher: ContentFingerprintMatcher = {
        match: vitest.fn().mockResolvedValue({ libraryId: 'library-1', matchRatio: 0.95 }),
      };

      const result = await sut.resolve(MOUNT_PATH, { contentMatcher });

      expect(result).toEqual({
        id: 'library-1',
        method: DeviceIdentityMethod.ContentFingerprint,
        confidence: DeviceIdentityConfidence.Low,
      });
    });

    it('does not return a content-fingerprint candidate below the match threshold', async () => {
      volumeInfo.getFilesystemSerial.mockResolvedValue(null);
      volumeInfo.getUsbHardwareSerial.mockResolvedValue(null);
      volumeInfo.readMarkerFile.mockResolvedValue(null);

      const contentMatcher: ContentFingerprintMatcher = {
        match: vitest.fn().mockResolvedValue({ libraryId: 'library-1', matchRatio: 0.2 }),
      };

      const result = await sut.resolve(MOUNT_PATH, { contentMatcher });

      expect(result).toBeNull();
    });

    it('respects a custom match threshold', async () => {
      volumeInfo.getFilesystemSerial.mockResolvedValue(null);
      volumeInfo.getUsbHardwareSerial.mockResolvedValue(null);
      volumeInfo.readMarkerFile.mockResolvedValue(null);

      const contentMatcher: ContentFingerprintMatcher = {
        match: vitest.fn().mockResolvedValue({ libraryId: 'library-1', matchRatio: 0.5 }),
      };

      const result = await sut.resolve(MOUNT_PATH, { contentMatcher, contentMatchThreshold: 0.4 });

      expect(result?.id).toBe('library-1');
    });

    it('returns null when every strategy is exhausted and no content matcher is supplied', async () => {
      volumeInfo.getFilesystemSerial.mockResolvedValue(null);
      volumeInfo.getUsbHardwareSerial.mockResolvedValue(null);
      volumeInfo.readMarkerFile.mockResolvedValue(null);

      const result = await sut.resolve(MOUNT_PATH);

      expect(result).toBeNull();
    });
  });

  describe('onboard', () => {
    it('writes a generated marker and returns its id', async () => {
      const id = await sut.onboard(MOUNT_PATH);

      expect(id).toMatch(/^[\da-f-]{36}$/);
      expect(volumeInfo.writeMarkerFile).toHaveBeenCalledWith(MOUNT_PATH, id);
    });
  });
});
