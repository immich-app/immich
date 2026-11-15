import CalendarHeatmap from '#lib/components/CalendarHeatmap.svelte';
import { locale } from '#lib/stores/preferences.store.ts';
import type { CalendarHeatmapResponseDto } from '@immich/sdk';
import { expect } from 'vitest';
import { render } from 'vitest-browser-svelte';

describe('CalendarHeatmap component', () => {
  const dummyData: CalendarHeatmapResponseDto = {
    from: '2025-11-16', // Sunday
    to: '2025-11-18',
    totalCount: 5,
    series: [
      { date: '2025-11-16', count: 1 },
      { date: '2025-11-17', count: 2 },
      { date: '2025-11-18', count: 2 },
    ],
  };

  const itemLabel = (item: { date: string; count: number }) => `${item.date}: ${item.count}`;
  const totalLabel = (count: number) => `${count} total`;

  it('aligns Sunday to row 1 when using a Sunday-first locale', async () => {
    locale.set('en-US');
    const { baseElement } = await render(CalendarHeatmap, {
      data: dummyData,
      itemLabel,
      totalLabel,
    });

    const firstCell = baseElement.querySelector('div.aspect-square') as HTMLElement;
    expect(firstCell).not.toBeNull();
    expect(firstCell.style.getPropertyValue('--heatmap-row-start')).toBe('1');
  });

  it('aligns Sunday to row 7 when using a Monday-first locale', async () => {
    locale.set('sv');
    const { baseElement } = await render(CalendarHeatmap, {
      data: dummyData,
      itemLabel,
      totalLabel,
    });

    const firstCell = baseElement.querySelector('div.aspect-square') as HTMLElement;
    expect(firstCell).not.toBeNull();
    expect(firstCell.style.getPropertyValue('--heatmap-row-start')).toBe('7');
  });

  it('aligns Monday to row 1 when starting on Monday in a Monday-first locale', async () => {
    locale.set('sv');
    const mondayData: CalendarHeatmapResponseDto = {
      from: '2025-11-17', // Monday
      to: '2025-11-18',
      totalCount: 4,
      series: [
        { date: '2025-11-17', count: 2 },
        { date: '2025-11-18', count: 2 },
      ],
    };

    const { baseElement } = await render(CalendarHeatmap, {
      data: mondayData,
      itemLabel,
      totalLabel,
    });

    const firstCell = baseElement.querySelector('div.aspect-square') as HTMLElement;
    expect(firstCell).not.toBeNull();
    expect(firstCell.style.getPropertyValue('--heatmap-row-start')).toBe('1');
  });
});
