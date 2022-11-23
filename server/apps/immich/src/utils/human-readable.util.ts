const KiB = Math.pow(1024, 1);
const MiB = Math.pow(1024, 2);
const GiB = Math.pow(1024, 3);
const TiB = Math.pow(1024, 4);
const PiB = Math.pow(1024, 5);

export const HumanReadableSize = { KiB, MiB, GiB, TiB, PiB };

export function asHumanReadable(bytes: number, precision = 1): string {
  if (bytes >= PiB) {
    return `${(bytes / PiB).toFixed(precision)} PiB`;
  }
  else if (bytes >= TiB) {
    return `${(bytes / TiB).toFixed(precision)} TiB`;
  }
  else if (bytes >= GiB) {
    return `${(bytes / GiB).toFixed(precision)} GiB`;
  }
  else if (bytes >= MiB) {
    return `${(bytes / MiB).toFixed(precision)} MiB`;
  }
  else if (bytes >= KiB) {
    return `${(bytes / KiB).toFixed(precision)} KiB`;
  }
  else {
    return `${bytes} B`;
  }
}
