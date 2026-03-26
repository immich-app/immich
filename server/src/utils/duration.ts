export function parseDurationToSeconds(duration: string | null): number | null {
  if (!duration) {
    return null;
  }

  const match = duration.match(/^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/);
  if (!match) {
    return null;
  }

  const [, hours, minutes, seconds, fractional] = match;
  const total = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  if (fractional) {
    return total + Number(`0.${fractional}`);
  }
  return total;
}

export function formatSecondsToDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const wholeSecs = Math.floor(secs);
  const fractional = (secs - wholeSecs).toFixed(6).slice(2);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(wholeSecs).padStart(2, '0')}.${fractional}`;
}
