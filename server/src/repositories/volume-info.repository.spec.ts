import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DEVICE_MARKER_FILENAME, VolumeInfoRepository } from 'src/repositories/volume-info.repository.js';
import { afterEach, beforeEach, vitest } from 'vitest';

vitest.mock('node:child_process', () => ({ execFile: vitest.fn() }));

type ExecFileCallback = (error: Error | null, result: { stdout: string; stderr: string }) => void;

/** `execFile` is promisified in the module under test; this drives the mocked callback form it expects. */
function mockExecFileResult(responses: Record<string, string>) {
  (execFile as unknown as ReturnType<typeof vitest.fn>).mockImplementation((...args: unknown[]) => {
    const command = args[0] as string;
    const callback = args.at(-1) as ExecFileCallback;
    const stdout = responses[command] ?? '';
    callback(null, { stdout, stderr: '' });
  });
}

function setPlatform(platform: NodeJS.Platform) {
  Object.defineProperty(process, 'platform', { value: platform, configurable: true });
}

describe(VolumeInfoRepository.name, () => {
  const originalPlatform = process.platform;
  let sut: VolumeInfoRepository;

  beforeEach(() => {
    sut = new VolumeInfoRepository();
    vitest.clearAllMocks();
  });

  afterEach(() => {
    setPlatform(originalPlatform);
  });

  describe('getFilesystemSerial', () => {
    it('reads the UUID via findmnt + blkid on Linux and normalizes it', async () => {
      setPlatform('linux');
      mockExecFileResult({ findmnt: '/dev/sdb1\n', blkid: '1234-5678\n' });

      await expect(sut.getFilesystemSerial('/mnt/external/drive')).resolves.toBe('12345678');
    });

    it('returns null on Linux when findmnt cannot resolve a device', async () => {
      setPlatform('linux');
      mockExecFileResult({ findmnt: '\n' });

      await expect(sut.getFilesystemSerial('/mnt/external/drive')).resolves.toBeNull();
    });

    it('reads the serial via PowerShell on Windows and converts the decimal to normalized hex', async () => {
      setPlatform('win32');
      mockExecFileResult({ 'powershell.exe': '3721182122\n' });

      await expect(sut.getFilesystemSerial(String.raw`D:\Photos`)).resolves.toBe(
        (3_721_182_122).toString(16).toUpperCase(),
      );
    });

    it('returns null on Windows when the mount path has no drive letter', async () => {
      setPlatform('win32');

      await expect(sut.getFilesystemSerial(String.raw`\\nas\share`)).resolves.toBeNull();
      expect(execFile).not.toHaveBeenCalled();
    });

    it('returns null instead of throwing when the underlying command fails', async () => {
      setPlatform('linux');
      (execFile as unknown as ReturnType<typeof vitest.fn>).mockImplementation((...args: unknown[]) => {
        const callback = args.at(-1) as ExecFileCallback;
        callback(new Error('command not found'), { stdout: '', stderr: '' });
      });

      await expect(sut.getFilesystemSerial('/mnt/external/drive')).resolves.toBeNull();
    });
  });

  describe('getUsbHardwareSerial', () => {
    it('parses ID_SERIAL_SHORT from udevadm output on Linux', async () => {
      setPlatform('linux');
      mockExecFileResult({
        findmnt: '/dev/sdb1\n',
        udevadm: 'ID_FS_TYPE=exfat\nID_SERIAL_SHORT=ABC123XYZ\nID_BUS=usb\n',
      });

      await expect(sut.getUsbHardwareSerial('/mnt/external/drive')).resolves.toBe('ABC123XYZ');
    });

    it('returns null on Linux when udevadm has no ID_SERIAL_SHORT property', async () => {
      setPlatform('linux');
      mockExecFileResult({ findmnt: '/dev/sdb1\n', udevadm: 'ID_BUS=usb\n' });

      await expect(sut.getUsbHardwareSerial('/mnt/external/drive')).resolves.toBeNull();
    });
  });

  describe('listMountedVolumes', () => {
    it('lists real mount targets on Linux and filters out pseudo filesystems', async () => {
      setPlatform('linux');
      const lines = ['/ ext4', '/boot vfat', '/proc proc', '/sys sysfs', '/mnt/external/drive exfat', '/tmp tmpfs', ''];
      mockExecFileResult({ findmnt: lines.join('\n') });

      await expect(sut.listMountedVolumes()).resolves.toEqual(['/', '/boot', '/mnt/external/drive']);
    });

    it('returns [] on Linux when findmnt fails', async () => {
      setPlatform('linux');
      (execFile as unknown as ReturnType<typeof vitest.fn>).mockImplementation((...args: unknown[]) => {
        const callback = args.at(-1) as ExecFileCallback;
        callback(new Error('command not found'), { stdout: '', stderr: '' });
      });

      await expect(sut.listMountedVolumes()).resolves.toEqual([]);
    });

    it('lists lettered volumes on Windows via PowerShell', async () => {
      setPlatform('win32');
      mockExecFileResult({ 'powershell.exe': 'C:\\\nD:\\\n' });

      await expect(sut.listMountedVolumes()).resolves.toEqual(['C:\\', 'D:\\']);
    });
  });

  describe('marker file', () => {
    let dir: string;

    beforeEach(async () => {
      dir = await mkdtemp(path.join(tmpdir(), 'photomanager-volume-info-'));
    });

    afterEach(async () => {
      await rm(dir, { recursive: true, force: true });
    });

    it('returns null when no marker file exists yet', async () => {
      await expect(sut.readMarkerFile(dir)).resolves.toBeNull();
    });

    it('round-trips a written marker', async () => {
      await sut.writeMarkerFile(dir, 'some-generated-uuid');

      await expect(sut.readMarkerFile(dir)).resolves.toBe('some-generated-uuid');
    });

    it('writes the marker under the documented filename', async () => {
      await sut.writeMarkerFile(dir, 'some-generated-uuid');

      await expect(sut.readMarkerFile(path.dirname(path.join(dir, DEVICE_MARKER_FILENAME)))).resolves.toBe(
        'some-generated-uuid',
      );
    });
  });
});
