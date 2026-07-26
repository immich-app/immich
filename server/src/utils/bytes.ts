const KiB = Math.pow(1024, 1);
const MiB = Math.pow(1024, 2);
const GiB = Math.pow(1024, 3);
const TiB = Math.pow(1024, 4);
const PiB = Math.pow(1024, 5);

export const HumanReadableSize = { KiB, MiB, GiB, TiB, PiB };

export function asHumanReadable(bytes: number, precision = 1): string {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];

  let magnitude = 0;
  let remainder = bytes;
  while (remainder >= 1024) {
    if (magnitude + 1 < units.length) {
      magnitude++;
      remainder /= 1024;
    } else {
      break;
    }
  }

  // Rounding for display can reach a full 1024 of the chosen unit, which that
  // unit cannot hold: 1 MiB - 1 byte would render as "1024.0 KiB". Promote to
  // the next unit instead.
  if (magnitude + 1 < units.length && Number(remainder.toFixed(magnitude === 0 ? 0 : precision)) >= 1024) {
    magnitude++;
    remainder /= 1024;
  }

  return `${remainder.toFixed(magnitude == 0 ? 0 : precision)} ${units[magnitude]}`;
}

// if an asset is jsonified in the DB before being returned, its buffer fields will be hex-encoded strings
export const hexOrBufferToBase64 = (encoded: string | Buffer) => {
  if (typeof encoded === 'string') {
    return Buffer.from(encoded.slice(2), 'hex').toString('base64');
  }

  return encoded.toString('base64');
};
