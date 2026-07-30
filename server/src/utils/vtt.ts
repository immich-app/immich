const pad = (value: number, width = 2) => value.toString().padStart(width, '0');

const formatVttTimestamp = (seconds: number): string => {
  const totalMs = Math.round(seconds * 1000);
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(ms, 3)}`;
};

export const toWebVtt = (segments: { startTime: number; endTime: number; text: string }[]): string => {
  let vtt = 'WEBVTT\n\n';
  for (const segment of segments) {
    vtt += `${formatVttTimestamp(segment.startTime)} --> ${formatVttTimestamp(segment.endTime)}\n${segment.text}\n\n`;
  }
  return vtt;
};
