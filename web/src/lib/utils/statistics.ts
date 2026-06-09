export interface StatisticsResponse {
  monthly: MonthlyEntry[];
  temporalMatrix: Array<{ dayOfWeek: number; hour: number; count: number }>;
  topPeople: Array<{
    id: string;
    name: string;
    birthDate: string | null;
    thumbnailPath: string;
    isHidden: boolean;
    updatedAt?: string;
    isFavorite?: boolean;
    color?: string;
    count: number;
  }>;
  topCameras: Array<{ make: string | null; model: string | null; count: number }>;
  topLenses: Array<{ lensModel: string | null; count: number }>;
  topCities: Array<{ city: string | null; count: number }>;
  topCountries: Array<{ country: string | null; count: number }>;
  storage: Array<{ type: 'IMAGE' | 'VIDEO'; size: number; count: number }>;
  total: { photos: number; videos: number; storage: number };
}

export interface MonthlyEntry {
  year: number;
  month: number;
  count: number;
}

export interface TemporalCell {
  hour: number;
  count: number;
  intensity: number;
}

export interface TemporalRow {
  dayOfWeek: number;
  label: string;
  cells: TemporalCell[];
}

export interface PersonaInfo {
  title: string;
  description: string;
}

export type TemporalPersonaKind =
  | 'golden_hour_chaser'
  | 'midnight_maverick'
  | 'sunrise_scout'
  | 'weekend_wanderer'
  | 'daylight_documenter'
  | 'pattern_explorer';

export interface TemporalPersona {
  kind: TemporalPersonaKind;
  peakHour: number;
  peakDay: number;
}

export interface StorageSegment {
  type: string;
  size: number;
  start: number;
  end: number;
  color: string;
}

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' });
const weekdayFormatters = {
  short: new Intl.DateTimeFormat(undefined, { weekday: 'short' }),
  long: new Intl.DateTimeFormat(undefined, { weekday: 'long' }),
} as const;
const storageColors = {
  IMAGE: '#3b82f6',
  VIDEO: '#8b5cf6',
} as const;

export function formatBytes(value: number): string {
  if (value === 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** unitIndex).toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatMonth(year: number, month: number): string {
  return monthFormatter.format(new Date(year, month - 1, 1));
}

export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function getWeekdayLabels(format: keyof typeof weekdayFormatters = 'short'): string[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) =>
    weekdayFormatters[format].format(new Date(Date.UTC(2024, 0, 7 + dayOfWeek, 12))),
  );
}

export function getHourLabels(): number[] {
  return Array.from({ length: 24 }, (_, hour) => hour);
}

export function getSortedMonthly(statistics: StatisticsResponse) {
  return [...statistics.monthly].sort((left, right) => {
    if (left.year !== right.year) {
      return left.year - right.year;
    }
    return left.month - right.month;
  });
}

export function getTemporalCounts(statistics: StatisticsResponse) {
  const counts = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));

  for (const entry of statistics.temporalMatrix) {
    if (
      entry.dayOfWeek >= 0 &&
      entry.dayOfWeek < counts.length &&
      entry.hour >= 0 &&
      entry.hour < counts[entry.dayOfWeek].length
    ) {
      counts[entry.dayOfWeek][entry.hour] = entry.count;
    }
  }

  return counts;
}

export function getTemporalStats(temporalCounts: number[][]) {
  const temporalTotal = temporalCounts.reduce((sum, row) => sum + row.reduce((rowSum, count) => rowSum + count, 0), 0);
  const temporalMax = Math.max(...temporalCounts.flat(), 1);
  const hourTotals = Array.from({ length: 24 }, (_, hour) => temporalCounts.reduce((sum, row) => sum + row[hour], 0));
  const dayTotals = temporalCounts.map((row) => row.reduce((sum, count) => sum + count, 0));
  let peakHour = 0;
  for (let hour = 1; hour < hourTotals.length; hour += 1) {
    if (hourTotals[hour] > hourTotals[peakHour]) {
      peakHour = hour;
    }
  }

  let peakDay = 0;
  for (let dayOfWeek = 1; dayOfWeek < dayTotals.length; dayOfWeek += 1) {
    if (dayTotals[dayOfWeek] > dayTotals[peakDay]) {
      peakDay = dayOfWeek;
    }
  }

  const weekendShare = temporalTotal > 0 ? (dayTotals[0] + dayTotals[6]) / temporalTotal : 0;

  return { temporalTotal, temporalMax, hourTotals, dayTotals, peakHour, peakDay, weekendShare };
}

export function getTemporalPersona(
  temporalTotal: number,
  peakHour: number,
  peakDay: number,
  weekendShare: number,
): TemporalPersona | null {
  if (temporalTotal === 0) {
    return null;
  }

  if (peakHour >= 16 && peakHour <= 19) {
    return { kind: 'golden_hour_chaser', peakHour, peakDay };
  }

  if (peakHour >= 0 && peakHour <= 3) {
    return { kind: 'midnight_maverick', peakHour, peakDay };
  }

  if (peakHour >= 5 && peakHour <= 8) {
    return { kind: 'sunrise_scout', peakHour, peakDay };
  }

  if (weekendShare >= 0.45) {
    return { kind: 'weekend_wanderer', peakHour, peakDay };
  }

  if (peakHour >= 9 && peakHour <= 17) {
    return { kind: 'daylight_documenter', peakHour, peakDay };
  }

  return { kind: 'pattern_explorer', peakHour, peakDay };
}

export function getTemporalRows(
  weekdayLabels: string[],
  hourLabels: number[],
  temporalCounts: number[][],
  temporalMax: number,
): TemporalRow[] {
  return weekdayLabels.map((label, dayOfWeek) => ({
    dayOfWeek,
    label,
    cells: hourLabels.map((hour) => ({
      hour,
      count: temporalCounts[dayOfWeek][hour],
      intensity: temporalCounts[dayOfWeek][hour] / temporalMax,
    })),
  }));
}

export function getStorageSegments(statistics: StatisticsResponse): StorageSegment[] {
  const storageTotal = statistics.storage.reduce((sum, entry) => sum + entry.size, 0);

  return statistics.storage.map((entry, index, entries) => {
    const previous = entries.slice(0, index).reduce((sum, current) => sum + current.size, 0);
    const start = storageTotal > 0 ? (previous / storageTotal) * 100 : 0;
    const end = storageTotal > 0 ? ((previous + entry.size) / storageTotal) * 100 : 0;
    return {
      ...entry,
      start,
      end,
      color: storageColors[entry.type as keyof typeof storageColors] || '#6b7280',
    };
  });
}

export function getStorageTotal(statistics: StatisticsResponse): number {
  return statistics.storage.reduce((sum, entry) => sum + entry.size, 0);
}

export function hasStatisticsData(statistics: StatisticsResponse, monthly: MonthlyEntry[]): boolean {
  return (
    monthly.length > 0 ||
    statistics.temporalMatrix.length > 0 ||
    statistics.topPeople.length > 0 ||
    statistics.topCameras.length > 0 ||
    statistics.topLenses.length > 0 ||
    statistics.topCities.length > 0 ||
    statistics.topCountries.length > 0 ||
    statistics.storage.length > 0
  );
}
