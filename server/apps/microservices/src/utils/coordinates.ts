export function parseLatitude(input: string): number | null {
  const latitude = Number.parseFloat(input);

  if (latitude < -90 || latitude > 90 || Number.isNaN(latitude)) {
    return null;
  }
  return latitude;
}

export function parseLongitude(input: string): number | null {
  const longitude = Number.parseFloat(input);

  if (longitude < -180 || longitude > 180 || Number.isNaN(longitude)) {
    return null;
  }
  return longitude;
}
