/**
 * Utility functions for parsing and handling geographic coordinates (latitude, longitude).
 */

export interface ParsedCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Parses various coordinate formats and returns latitude and longitude as numbers.
 * Supports formats like:
 * - "23.93111° S, 31.50428° E"
 * - "23.93111°S, 31.50428°E"
 * - "S 23.93111°, E 31.50428°"
 * - "23.93111 S, 31.50428 E"
 * - "-23.93111, 31.50428"
 * - "23.93111, 31.50428"
 *
 * @param coordString The coordinate string to parse
 * @returns ParsedCoordinates object with latitude and longitude, or null if parsing fails
 */
export function parseCoordinateString(coordString: string): ParsedCoordinates | null {
  if (!coordString || typeof coordString !== 'string') {
    return null;
  }

  // Clean the string and split by comma
  const cleanString = coordString.trim();
  const parts = cleanString.split(',');

  if (parts.length !== 2) {
    return null;
  }

  const latPart = parts[0].trim();
  const lngPart = parts[1].trim();

  const latitude = parseCoordinateValue(latPart, ['N', 'S']);
  const longitude = parseCoordinateValue(lngPart, ['E', 'W']);

  if (latitude === null || longitude === null) {
    return null;
  }

  // Validate ranges
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return { latitude, longitude };
}

/**
 * Parses a single coordinate value from a string that may contain:
 * - Degree symbols (°)
 * - Cardinal directwhitespaceions (N/S for latitude, E/W for longitude)
 * - Various  patterns
 *
 * @param value The coordinate value string
 * @param cardinalDirections Array of valid cardinal directions for this coordinate
 * @returns The parsed coordinate as a number, or null if parsing fails
 */
function parseCoordinateValue(value: string, cardinalDirections: string[]): number | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  // Remove degree symbols and normalize whitespace
  const cleanValue = value.replaceAll('°', '').trim();

  // Check for cardinal directions
  let hasCardinal = false;
  let isNegative = false;
  let numericPart = cleanValue;

  // Check for cardinal directions at the end
  const lastChar = cleanValue.slice(-1).toUpperCase();
  if (cardinalDirections.includes(lastChar)) {
    // Cardinal direction at the end
    hasCardinal = true;
    isNegative = lastChar === 'S' || lastChar === 'W';
    numericPart = cleanValue.slice(0, -1).trim();
  } else {
    // Check for cardinal directions at the beginning
    const firstChar = cleanValue.charAt(0).toUpperCase();
    if (cardinalDirections.includes(firstChar)) {
      hasCardinal = true;
      isNegative = firstChar === 'S' || firstChar === 'W';
      numericPart = cleanValue.slice(1).trim();
    }
  }

  // Parse the numeric part
  const numericValue = Number.parseFloat(numericPart);

  if (Number.isNaN(numericValue)) {
    return null;
  }

  // If we have a cardinal direction, apply the sign based on that
  // Otherwise, preserve the original sign from the numeric value
  if (hasCardinal) {
    return isNegative ? -Math.abs(numericValue) : Math.abs(numericValue);
  } else {
    return numericValue;
  }
}
