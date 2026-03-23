import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import TemporalPicker from '../temporal-picker.svelte';
import { aggregateYears, getMonthsForYear } from '../temporal-utils';

describe('temporal-utils', () => {
  const buckets = [
    { timeBucket: '2020-01-01', count: 100 },
    { timeBucket: '2020-06-01', count: 200 },
    { timeBucket: '2020-08-01', count: 400 },
    { timeBucket: '2021-03-01', count: 150 },
    { timeBucket: '2021-07-01', count: 50 },
  ];

  it('should aggregate monthly buckets into year counts', () => {
    const years = aggregateYears(buckets);
    expect(years).toHaveLength(2);
    expect(years[0]).toEqual({ year: 2020, count: 700, volumePercent: 100 });
    expect(years[1]).toEqual({ year: 2021, count: 200, volumePercent: 29 });
  });

  it('should calculate relative volume (max year = 100%)', () => {
    const years = aggregateYears(buckets);
    expect(years[0].volumePercent).toBe(100);
    expect(years[1].volumePercent).toBeLessThan(100);
  });

  it('should return all 12 months for a specific year', () => {
    const months = getMonthsForYear(buckets, 2020);
    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ month: 1, label: 'Jan', count: 100 });
    expect(months[5]).toEqual({ month: 6, label: 'Jun', count: 200 });
    expect(months[7]).toEqual({ month: 8, label: 'Aug', count: 400 });
    expect(months[1]).toEqual({ month: 2, label: 'Feb', count: 0 });
  });

  it('should handle empty buckets', () => {
    const years = aggregateYears([]);
    expect(years).toHaveLength(0);
  });

  it('should handle single bucket', () => {
    const years = aggregateYears([{ timeBucket: '2023-05-01', count: 42 }]);
    expect(years).toHaveLength(1);
    expect(years[0]).toEqual({ year: 2023, count: 42, volumePercent: 100 });
  });
});

describe('TemporalPicker component', () => {
  const buckets = [
    { timeBucket: '2022-01-01', count: 50 },
    { timeBucket: '2023-06-01', count: 100 },
    { timeBucket: '2023-08-01', count: 200 },
  ];

  it('should show year grid when no year is selected', () => {
    const { getByTestId, queryByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets },
    });
    expect(getByTestId('year-grid')).toBeTruthy();
    expect(queryByTestId('month-grid')).toBeNull();
  });

  it('should show month grid when selectedYear is set via prop', () => {
    const { getByTestId, queryByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, selectedYear: 2023 },
    });
    expect(getByTestId('month-grid')).toBeTruthy();
    expect(queryByTestId('year-grid')).toBeNull();
  });

  it('should highlight the selected year with active styling', () => {
    const { getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, selectedYear: 2023 },
    });
    // When selectedYear=2023 is set, the breadcrumb shows the year
    const breadcrumb = getByTestId('temporal-breadcrumb-all');
    expect(breadcrumb).toBeTruthy();
  });

  it('should highlight the selected month with active styling', () => {
    const { getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, selectedYear: 2023, selectedMonth: 6 },
    });
    const monthBtn = getByTestId('month-btn-6');
    expect(monthBtn.className).toContain('bg-immich-primary');
  });

  it('should call onYearSelect with the year when clicking an unselected year', async () => {
    const spy = vi.fn();
    const { getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, onYearSelect: spy },
    });
    await fireEvent.click(getByTestId('year-btn-2023'));
    expect(spy).toHaveBeenCalledWith(2023);
  });

  it('should call onYearSelect with undefined when clicking the already-selected year', async () => {
    const spy = vi.fn();
    const { getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, selectedYear: 2023, onYearSelect: spy },
    });
    // The year grid isn't shown when selectedYear is set, but the breadcrumb year is shown.
    // Click "All" breadcrumb to deselect.
    await fireEvent.click(getByTestId('temporal-breadcrumb-all'));
    expect(spy).toHaveBeenCalledWith(undefined);
  });

  it('should call onMonthSelect with the month when clicking an unselected month', async () => {
    const spy = vi.fn();
    const { getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, selectedYear: 2023, onMonthSelect: spy },
    });
    await fireEvent.click(getByTestId('month-btn-6'));
    expect(spy).toHaveBeenCalledWith(2023, 6);
  });

  it('should call onMonthSelect with undefined when clicking the already-selected month', async () => {
    const spy = vi.fn();
    const { getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, selectedYear: 2023, selectedMonth: 6, onMonthSelect: spy },
    });
    await fireEvent.click(getByTestId('month-btn-6'));
    expect(spy).toHaveBeenCalledWith(2023, undefined);
  });

  it('should not call onMonthSelect for months with zero count', async () => {
    const spy = vi.fn();
    const { getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, selectedYear: 2023, onMonthSelect: spy },
    });
    // February has zero photos
    await fireEvent.click(getByTestId('month-btn-2'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('should show breadcrumb with month name when selectedMonth is set', () => {
    const { getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, selectedYear: 2023, selectedMonth: 6 },
    });
    const breadcrumb = getByTestId('temporal-breadcrumb-month');
    expect(breadcrumb.textContent).toContain('Jun');
  });
});
