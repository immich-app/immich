import { Injectable } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * Name of the marker file PhotoManager writes to a drive's root when onboarding it, so the drive can be
 * recognized again later even with no cooperating hardware identity (see DeviceResolverService strategy 3).
 */
export const DEVICE_MARKER_FILENAME = '.photomanager-device-id';

/**
 * Linux filesystem types that are never a removable/external drive worth treating as a reconnect candidate -
 * virtual, kernel, and container-overlay filesystems that `findmnt` always reports alongside real mounts.
 */
const LINUX_PSEUDO_FILESYSTEMS = new Set([
  'proc',
  'sysfs',
  'cgroup',
  'cgroup2',
  'tmpfs',
  'devtmpfs',
  'devpts',
  'overlay',
  'squashfs',
  'autofs',
  'mqueue',
  'debugfs',
  'tracefs',
  'securityfs',
  'pstore',
  'bpf',
  'binfmt_misc',
  'configfs',
  'fusectl',
  'hugetlbfs',
  'rpc_pipefs',
]);

/**
 * Reads hardware- and filesystem-level identity signals for a mounted volume.
 *
 * Every method here talks to the OS (shell commands, raw filesystem reads) and is expected to occasionally fail
 * depending on platform, drive, filesystem, or permissions - callers treat a `null` return as "this signal wasn't
 * available", never as an error to propagate. Isolating these OS-specific, sometimes-unreliable primitives here
 * (rather than in DeviceResolverService) keeps the resolution policy unit-testable without touching real hardware,
 * per the project's hexagonal architecture convention (repositories = technology-specific, services = policy).
 */
@Injectable()
export class VolumeInfoRepository {
  /**
   * Returns the filesystem-embedded volume serial number, normalized to an uppercase hex string. NTFS and exFAT
   * carry this serial inside the filesystem itself (not as an OS construct), so the same physical drive yields the
   * same value whether it's read from Windows or Linux - this is the primary, most portable identity signal.
   */
  async getFilesystemSerial(mountPath: string): Promise<string | null> {
    try {
      return process.platform === 'win32'
        ? await this.getFilesystemSerialWindows(mountPath)
        : await this.getFilesystemSerialLinux(mountPath);
    } catch {
      return null;
    }
  }

  /**
   * Returns the USB bridge/enclosure's reported hardware serial - a signal independent of the filesystem, useful
   * when the filesystem serial is unavailable. Treat as corroborating evidence, not sole proof: some low-cost
   * enclosures report a generic or duplicate serial across units.
   */
  async getUsbHardwareSerial(mountPath: string): Promise<string | null> {
    try {
      return process.platform === 'win32'
        ? await this.getUsbHardwareSerialWindows(mountPath)
        : await this.getUsbHardwareSerialLinux(mountPath);
    } catch {
      return null;
    }
  }

  /**
   * Lists currently mounted volumes' root paths, so callers (DeviceMountService.reconcile) can discover reconnect
   * candidates automatically instead of being told where to look. Best-effort: returns `[]` rather than throwing
   * if the platform tool is unavailable or fails, consistent with every other method here.
   */
  async listMountedVolumes(): Promise<string[]> {
    try {
      return process.platform === 'win32'
        ? await this.listMountedVolumesWindows()
        : await this.listMountedVolumesLinux();
    } catch {
      return [];
    }
  }

  /** Reads the marker this repository writes via `writeMarkerFile`. Returns null if absent, unreadable, or empty. */
  async readMarkerFile(mountPath: string): Promise<string | null> {
    try {
      const content = await readFile(path.join(mountPath, DEVICE_MARKER_FILENAME), 'utf8');
      const id = content.trim();
      return id.length > 0 ? id : null;
    } catch {
      return null;
    }
  }

  /**
   * Writes a generated identity to the drive root so it can be recognized next time even with no cooperating
   * hardware ID. Callers should only do this once, when onboarding a drive that no other strategy could identify.
   */
  async writeMarkerFile(mountPath: string, id: string): Promise<void> {
    await writeFile(path.join(mountPath, DEVICE_MARKER_FILENAME), `${id}\n`, 'utf8');
  }

  private async getFilesystemSerialLinux(mountPath: string): Promise<string | null> {
    const device = await this.resolveLinuxDevice(mountPath);
    if (!device) {
      return null;
    }

    const { stdout } = await execFileAsync('blkid', ['-o', 'value', '-s', 'UUID', device]);
    return normalizeSerial(stdout);
  }

  private async getFilesystemSerialWindows(mountPath: string): Promise<string | null> {
    const driveLetter = toWindowsDriveLetter(mountPath);
    if (!driveLetter) {
      return null;
    }

    const { stdout } = await execFileAsync('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `(Get-CimInstance Win32_Volume -Filter "DriveLetter='${driveLetter}'").SerialNumber`,
    ]);

    // Win32_Volume reports the same on-disk serial NTFS/exFAT store, as a signed 32-bit decimal rather than hex.
    const decimal = Number(stdout.trim());
    return Number.isFinite(decimal) && decimal !== 0 ? normalizeSerial((decimal >>> 0).toString(16)) : null;
  }

  private async getUsbHardwareSerialLinux(mountPath: string): Promise<string | null> {
    const device = await this.resolveLinuxDevice(mountPath);
    if (!device) {
      return null;
    }

    const { stdout } = await execFileAsync('udevadm', ['info', '--query=property', '--name', device]);
    const line = stdout.split('\n').find((entry) => entry.startsWith('ID_SERIAL_SHORT='));
    return line ? normalizeSerial(line.slice('ID_SERIAL_SHORT='.length)) : null;
  }

  private async getUsbHardwareSerialWindows(mountPath: string): Promise<string | null> {
    const driveLetter = toWindowsDriveLetter(mountPath);
    if (!driveLetter) {
      return null;
    }

    // Walk the WMI association chain logical disk -> partition -> physical disk drive: the physical disk drive's
    // SerialNumber identifies the USB bridge/enclosure, which is distinct from the filesystem-level serial above.
    const script = [
      `$part = Get-CimInstance -Query "ASSOCIATORS OF {Win32_LogicalDisk.DeviceID='${driveLetter}'} WHERE AssocClass=Win32_LogicalDiskToPartition";`,
      `$disk = Get-CimInstance -Query "ASSOCIATORS OF {Win32_DiskPartition.DeviceID='$($part.DeviceID)'} WHERE AssocClass=Win32_DiskDriveToDiskPartition";`,
      '$disk.SerialNumber',
    ].join(' ');

    const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script]);
    return normalizeSerial(stdout);
  }

  private async resolveLinuxDevice(mountPath: string): Promise<string | null> {
    const { stdout } = await execFileAsync('findmnt', ['-n', '-o', 'SOURCE', '--target', mountPath]);
    const device = stdout.trim();
    return device.length > 0 ? device : null;
  }

  private async listMountedVolumesLinux(): Promise<string[]> {
    const { stdout } = await execFileAsync('findmnt', ['-r', '-n', '-o', 'TARGET,FSTYPE']);
    const targets: string[] = [];

    for (const line of stdout.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      const separatorIndex = trimmed.lastIndexOf(' ');
      if (separatorIndex === -1) {
        continue;
      }

      const target = trimmed.slice(0, separatorIndex);
      const fsType = trimmed.slice(separatorIndex + 1);
      if (!LINUX_PSEUDO_FILESYSTEMS.has(fsType)) {
        targets.push(target);
      }
    }

    return targets;
  }

  private async listMountedVolumesWindows(): Promise<string[]> {
    const { stdout } = await execFileAsync('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      String.raw`(Get-Volume | Where-Object { $_.DriveLetter } | ForEach-Object { "$($_.DriveLetter):\" })`,
    ]);

    return stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^[A-Za-z]:\\$/.test(line));
  }
}

function normalizeSerial(value: string): string | null {
  const cleaned = value.replaceAll(/[^0-9a-zA-Z]/g, '').toUpperCase();
  return cleaned.length > 0 ? cleaned : null;
}

function toWindowsDriveLetter(mountPath: string): string | null {
  const match = /^([A-Za-z]):/.exec(mountPath);
  return match ? `${match[1].toUpperCase()}:` : null;
}
