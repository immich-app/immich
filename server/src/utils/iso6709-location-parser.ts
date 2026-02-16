export type LatLonResult =
  | { hasGeo: true; latitude: number; longitude: number }
  | { hasGeo: false; latitude: null; longitude: null; error: string };

type ParseCoordinateResult = { ok: true; value: number } | { ok: false; error: string };

/**
 * Parse ISO 6709 Annex H string
 */
export function parseIso6709Location(input: string): LatLonResult {
  if (typeof input !== 'string' || input.length === 0) {
    return { hasGeo: false, latitude: null, longitude: null, error: 'Input must be a non-empty string.' };
  }

  if (!input.endsWith('/')) {
    return { hasGeo: false, latitude: null, longitude: null, error: "ISO 6709 string must end with '/'." };
  }

  // Remove trailing slash
  const body = input.slice(0, -1);

  // Remove CRS if present
  const crsIndex = body.indexOf('CRS');
  const coordPart = crsIndex === -1 ? body : body.slice(0, crsIndex);

  // Extract signed components
  const matches = coordPart.match(/[+-][^+-]+/g);
  if (!matches || matches.length < 2) {
    return {
      hasGeo: false,
      latitude: null,
      longitude: null,
      error: 'ISO 6709 must contain both latitude and longitude.',
    };
  }

  if (matches.length < 2) {
    return { hasGeo: false, latitude: null, longitude: null, error: 'Missing longitude component.' };
  }

  const latStr = matches[0];
  const lonStr = matches[1];

  const lat = parseCoordinate(latStr, true);
  if (!lat.ok) {
    return { hasGeo: false, latitude: null, longitude: null, error: `Latitude parsing: ${lat.error}` };
  }

  const lon = parseCoordinate(lonStr, false);
  if (!lon.ok) {
    return { hasGeo: false, latitude: null, longitude: null, error: `Longitude parsing: ${lon.error}` };
  }

  return {
    hasGeo: true,
    latitude: lat.value,
    longitude: lon.value,
  };
}

function parseCoordinate(value: string, isLatitude: boolean): ParseCoordinateResult {
  if (!/^[+-]\d+(\.\d+)?$/.test(value)) {
    return { ok: false, error: 'Invalid numeric coordinate format.' };
  }

  const sign = value[0] === '-' ? -1 : 1;
  const unsigned = value.slice(1);

  const [intPart, fracPart] = unsigned.split('.');
  const intLen = intPart.length;

  const degLen = isLatitude ? 2 : 3;

  // ---- Case 1: Decimal Degrees ----
  if (intLen === degLen) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return { ok: false, error: 'Invalid decimal degrees.' };
    }
    if (!validateRange(n, isLatitude)) {
      return rangeError(isLatitude);
    }
    return { ok: true, value: n };
  }

  // ---- Case 2: Degrees + Minutes ----
  if (intLen === degLen + 2) {
    const degrees = Number(intPart.slice(0, degLen));
    const minutes = Number(intPart.slice(degLen) + (fracPart ? '.' + fracPart : ''));

    if (!validNumber(degrees) || !validNumber(minutes)) {
      return { ok: false, error: 'Invalid degrees/minutes format.' };
    }

    if (minutes >= 60) {
      return { ok: false, error: 'Minutes must be < 60.' };
    }

    const decimal = sign * (degrees + minutes / 60);

    if (!validateRange(decimal, isLatitude)) {
      return rangeError(isLatitude);
    }

    return { ok: true, value: decimal };
  }

  // ---- Case 3: Degrees + Minutes + Seconds ----
  if (intLen === degLen + 4) {
    const degrees = Number(intPart.slice(0, degLen));
    const minutes = Number(intPart.slice(degLen, degLen + 2));
    const seconds = Number(intPart.slice(degLen + 2) + (fracPart ? '.' + fracPart : ''));

    if (!validNumber(degrees) || !validNumber(minutes) || !validNumber(seconds)) {
      return { ok: false, error: 'Invalid DMS format.' };
    }

    if (minutes >= 60 || seconds >= 60) {
      return { ok: false, error: 'Minutes and seconds must be < 60.' };
    }

    const decimal = sign * (degrees + minutes / 60 + seconds / 3600);

    if (!validateRange(decimal, isLatitude)) {
      return rangeError(isLatitude);
    }

    return { ok: true, value: decimal };
  }

  return { ok: false, error: 'Unrecognized ISO 6709 coordinate format.' };
}

function validateRange(value: number, isLatitude: boolean): boolean {
  return isLatitude ? value >= -90 && value <= 90 : value >= -180 && value <= 180;
}

function validNumber(n: number): boolean {
  return Number.isFinite(n);
}

function rangeError(isLatitude: boolean) {
  return {
    ok: false as const,
    error: isLatitude ? 'Latitude must be between -90 and 90.' : 'Longitude must be between -180 and 180.',
  };
}
