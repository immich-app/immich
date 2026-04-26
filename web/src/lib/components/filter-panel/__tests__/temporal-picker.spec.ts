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

  it('should render custom range inputs above year grid', () => {
    const { getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets },
    });

    const customRange = getByTestId('custom-date-range');
    const yearGrid = getByTestId('year-grid');

    expect(customRange.compareDocumentPosition(yearGrid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('should emit from-only custom range', async () => {
    const spy = vi.fn();
    const { getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, onCustomRangeChange: spy },
    });

    await fireEvent.input(getByTestId('custom-date-from-input'), { target: { value: '2024-01-01' } });

    expect(spy).toHaveBeenCalledWith('2024-01-01', undefined);
  });

  it('should emit to-only custom range', async () => {
    const spy = vi.fn();
    const { getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, onCustomRangeChange: spy },
    });

    await fireEvent.input(getByTestId('custom-date-to-input'), { target: { value: '2024-12-31' } });

    expect(spy).toHaveBeenCalledWith(undefined, '2024-12-31');
  });

  it('should populate custom range values from props', () => {
    const { getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, dateAfter: '2024-01-01', dateBefore: '2024-12-31' },
    });

    expect(getByTestId('custom-date-from-input')).toHaveValue('2024-01-01');
    expect(getByTestId('custom-date-to-input')).toHaveValue('2024-12-31');
  });

  it('should not emit inverted custom ranges and should show an inline error', async () => {
    const spy = vi.fn();
    const { getByText, getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, dateAfter: '2024-12-31', onCustomRangeChange: spy },
    });

    await fireEvent.input(getByTestId('custom-date-to-input'), { target: { value: '2024-01-01' } });

    expect(spy).not.toHaveBeenCalled();
    expect(getByText('From date must be on or before To date')).toBeTruthy();
  });

  it('should not emit malformed custom dates and should show an inline error', async () => {
    const spy = vi.fn();
    const { getByText, getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, onCustomRangeChange: spy },
    });

    await fireEvent.input(getByTestId('custom-date-from-input'), { target: { value: '2024-1-1' } });

    expect(spy).not.toHaveBeenCalled();
    expect(getByText('Enter a valid From date')).toBeTruthy();
  });

  it('should not emit impossible custom dates and should show an inline error', async () => {
    const spy = vi.fn();
    const { getByText, getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, onCustomRangeChange: spy },
    });

    await fireEvent.input(getByTestId('custom-date-to-input'), { target: { value: '2024-02-31' } });

    expect(spy).not.toHaveBeenCalled();
    expect(getByText('Enter a valid To date')).toBeTruthy();
  });

  it('should emit remaining valid open-ended range when clearing an invalid field', async () => {
    const spy = vi.fn();
    const { getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets, dateBefore: '2024-12-31', onCustomRangeChange: spy },
    });

    await fireEvent.input(getByTestId('custom-date-from-input'), { target: { value: '2024-1-1' } });
    expect(spy).not.toHaveBeenCalled();

    await fireEvent.input(getByTestId('custom-date-from-input'), { target: { value: '' } });

    expect(spy).toHaveBeenCalledWith(undefined, '2024-12-31');
  });

  it('should render custom range controls as numeric text inputs with date-only attributes', () => {
    const { getByTestId } = render(TemporalPicker, {
      props: { timeBuckets: buckets },
    });

    for (const testId of ['custom-date-from-input', 'custom-date-to-input']) {
      const input = getByTestId(testId);
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('inputmode', 'numeric');
      expect(input).toHaveAttribute('autocomplete', 'off');
      expect(input).toHaveAttribute('placeholder', 'YYYY-MM-DD');
      expect(input).toHaveAttribute('pattern', String.raw`\d{4}-\d{2}-\d{2}`);
    }
  });

  it('should clear invalid custom range state before selecting a year', async () => {
    const { getByTestId, queryByText } = render(TemporalPicker, {
      props: { timeBuckets: buckets, onYearSelect: vi.fn() },
    });

    await fireEvent.input(getByTestId('custom-date-from-input'), { target: { value: '2024-1-1' } });
    expect(queryByText('Enter a valid From date')).toBeTruthy();

    await fireEvent.click(getByTestId('year-btn-2023'));

    expect(getByTestId('custom-date-from-input')).toHaveValue('');
    expect(getByTestId('custom-date-to-input')).toHaveValue('');
    expect(queryByText('Enter a valid From date')).toBeNull();
  });

  it('should clear invalid custom range state before selecting a month', async () => {
    const { getByTestId, queryByText } = render(TemporalPicker, {
      props: { timeBuckets: buckets, selectedYear: 2023, onMonthSelect: vi.fn() },
    });

    await fireEvent.input(getByTestId('custom-date-to-input'), { target: { value: '2024-2-31' } });
    expect(queryByText('Enter a valid To date')).toBeTruthy();

    await fireEvent.click(getByTestId('month-btn-6'));

    expect(getByTestId('custom-date-from-input')).toHaveValue('');
    expect(getByTestId('custom-date-to-input')).toHaveValue('');
    expect(queryByText('Enter a valid To date')).toBeNull();
  });

  it('should clear stale validation error when props rerender to a valid range', async () => {
    const { getByTestId, queryByText, rerender } = render(TemporalPicker, {
      props: { timeBuckets: buckets },
    });

    await fireEvent.input(getByTestId('custom-date-from-input'), { target: { value: '2024-1-1' } });
    expect(queryByText('Enter a valid From date')).toBeTruthy();

    await rerender({ timeBuckets: buckets, dateAfter: '2024-01-01', dateBefore: '2024-12-31' });

    expect(getByTestId('custom-date-from-input')).toHaveValue('2024-01-01');
    expect(getByTestId('custom-date-to-input')).toHaveValue('2024-12-31');
    expect(queryByText('Enter a valid From date')).toBeNull();
  });

  it('should clear stale validation error when props rerender to an empty range', async () => {
    const { getByTestId, queryByText, rerender } = render(TemporalPicker, {
      props: { timeBuckets: buckets },
    });

    await fireEvent.input(getByTestId('custom-date-to-input'), { target: { value: '2024-2-31' } });
    expect(queryByText('Enter a valid To date')).toBeTruthy();

    await rerender({ timeBuckets: buckets });

    expect(getByTestId('custom-date-from-input')).toHaveValue('');
    expect(getByTestId('custom-date-to-input')).toHaveValue('');
    expect(queryByText('Enter a valid To date')).toBeNull();
  });

  it('should associate from validation errors with the from input', async () => {
    const { getByTestId, getByText } = render(TemporalPicker, {
      props: { timeBuckets: buckets },
    });

    await fireEvent.input(getByTestId('custom-date-from-input'), { target: { value: '2024-1-1' } });

    const fromInput = getByTestId('custom-date-from-input');
    const toInput = getByTestId('custom-date-to-input');
    const error = getByText('Enter a valid From date');

    expect(fromInput).toHaveAttribute('aria-invalid', 'true');
    expect(fromInput).toHaveAttribute('aria-describedby', 'custom-date-range-error');
    expect(toInput).not.toHaveAttribute('aria-invalid', 'true');
    expect(error).toHaveAttribute('id', 'custom-date-range-error');
    expect(error).toHaveAttribute('role', 'alert');
  });

  it('should associate to validation errors with the to input', async () => {
    const { getByTestId, getByText } = render(TemporalPicker, {
      props: { timeBuckets: buckets },
    });

    await fireEvent.input(getByTestId('custom-date-to-input'), { target: { value: '2024-2-31' } });

    const fromInput = getByTestId('custom-date-from-input');
    const toInput = getByTestId('custom-date-to-input');
    const error = getByText('Enter a valid To date');

    expect(fromInput).not.toHaveAttribute('aria-invalid', 'true');
    expect(toInput).toHaveAttribute('aria-invalid', 'true');
    expect(toInput).toHaveAttribute('aria-describedby', 'custom-date-range-error');
    expect(error).toHaveAttribute('id', 'custom-date-range-error');
    expect(error).toHaveAttribute('role', 'alert');
  });

  it('should associate inverted range errors with both custom date inputs', async () => {
    const { getByTestId, getByText } = render(TemporalPicker, {
      props: { timeBuckets: buckets, dateAfter: '2024-12-31' },
    });

    await fireEvent.input(getByTestId('custom-date-to-input'), { target: { value: '2024-01-01' } });

    const fromInput = getByTestId('custom-date-from-input');
    const toInput = getByTestId('custom-date-to-input');
    const error = getByText('From date must be on or before To date');

    expect(fromInput).toHaveAttribute('aria-invalid', 'true');
    expect(fromInput).toHaveAttribute('aria-describedby', 'custom-date-range-error');
    expect(toInput).toHaveAttribute('aria-invalid', 'true');
    expect(toInput).toHaveAttribute('aria-describedby', 'custom-date-range-error');
    expect(error).toHaveAttribute('id', 'custom-date-range-error');
    expect(error).toHaveAttribute('role', 'alert');
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
