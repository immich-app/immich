const KB = 1000;
const MB = KB * 1000;
const GB = MB * 1000;
const TB = GB * 1000;
const PB = TB * 1000;

export const HumanReadableSize = { KB, MB, GB, TB, PB };

export function asHumanReadable(bytes: number, precision = 1) {
  if (bytes >= PB) {
    return `${(bytes / PB).toFixed(precision)}PB`;
  }

  if (bytes >= TB) {
    return `${(bytes / TB).toFixed(precision)}TB`;
  }

  if (bytes >= GB) {
    return `${(bytes / GB).toFixed(precision)}GB`;
  }

  if (bytes >= MB) {
    return `${(bytes / MB).toFixed(precision)}MB`;
  }

  if (bytes >= KB) {
    return `${(bytes / KB).toFixed(precision)}KB`;
  }

  return `${bytes}B`;
}
