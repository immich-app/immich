import { describe, expect, it } from 'vitest';
import type { MonthGroup } from '../month-group.svelte';
import { findClosestGroupForDate } from './search-support.svelte';

function createMockMonthGroup(year: number, month: number): MonthGroup {
  return {
    yearMonth: { year, month },
  } as MonthGroup;
}

describe('findClosestGroupForDate', () => {
  it('should return undefined for empty months array', () => {
    const result = findClosestGroupForDate([], { year: 2024, month: 1 });
    expect(result).toBeUndefined();
  });

  it('should return the only month when there is only one month', () => {
    const months = [createMockMonthGroup(2024, 6)];
    const result = findClosestGroupForDate(months, { year: 2025, month: 1 });
    expect(result?.yearMonth).toEqual({ year: 2024, month: 6 });
  });

  it('should return exact match when available', () => {
    const months = [createMockMonthGroup(2024, 1), createMockMonthGroup(2024, 6), createMockMonthGroup(2024, 12)];
    const result = findClosestGroupForDate(months, { year: 2024, month: 6 });
    expect(result?.yearMonth).toEqual({ year: 2024, month: 6 });
  });

  it('should find closest month when target is between two months', () => {
    const months = [createMockMonthGroup(2024, 1), createMockMonthGroup(2024, 6), createMockMonthGroup(2024, 12)];
    const result = findClosestGroupForDate(months, { year: 2024, month: 4 });
    expect(result?.yearMonth).toEqual({ year: 2024, month: 6 });
  });

  it('should handle year boundaries correctly (2023-12 vs 2024-01)', () => {
    const months = [createMockMonthGroup(2023, 12), createMockMonthGroup(2024, 2)];
    const result = findClosestGroupForDate(months, { year: 2024, month: 1 });
    // 2024-01 is 1 month from 2023-12 and 1 month from 2024-02
    // Should return first encountered with min distance (2023-12)
    expect(result?.yearMonth).toEqual({ year: 2023, month: 12 });
  });

  it('should correctly calculate distance across years', () => {
    const months = [createMockMonthGroup(2022, 6), createMockMonthGroup(2024, 6)];
    const result = findClosestGroupForDate(months, { year: 2023, month: 6 });
    // Both are exactly 12 months away, should return first encountered
    expect(result?.yearMonth).toEqual({ year: 2022, month: 6 });
  });

  it('should handle target before all months', () => {
    const months = [createMockMonthGroup(2024, 6), createMockMonthGroup(2024, 12)];
    const result = findClosestGroupForDate(months, { year: 2024, month: 1 });
    expect(result?.yearMonth).toEqual({ year: 2024, month: 6 });
  });

  it('should handle target after all months', () => {
    const months = [createMockMonthGroup(2024, 1), createMockMonthGroup(2024, 6)];
    const result = findClosestGroupForDate(months, { year: 2025, month: 1 });
    expect(result?.yearMonth).toEqual({ year: 2024, month: 6 });
  });

  it('should handle multiple years correctly', () => {
    const months = [createMockMonthGroup(2020, 1), createMockMonthGroup(2022, 1), createMockMonthGroup(2024, 1)];
    const result = findClosestGroupForDate(months, { year: 2023, month: 1 });
    // 2023-01 is 12 months from 2022-01 and 12 months from 2024-01
    expect(result?.yearMonth).toEqual({ year: 2022, month: 1 });
  });

  it('should prefer closer month when one is clearly closer', () => {
    const months = [createMockMonthGroup(2024, 1), createMockMonthGroup(2024, 10)];
    const result = findClosestGroupForDate(months, { year: 2024, month: 11 });
    // 2024-11 is 1 month from 2024-10 and 10 months from 2024-01
    expect(result?.yearMonth).toEqual({ year: 2024, month: 10 });
  });
});
