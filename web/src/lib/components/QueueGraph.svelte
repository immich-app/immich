<script lang="ts">
  import { queueManager } from '$lib/managers/queue-manager.svelte';
  import type { QueueSnapshot } from '$lib/types';
  import type { QueueResponseDto } from '@immich/sdk';
  import { LoadingSpinner, Theme, theme } from '@immich/ui';
  import { DateTime } from 'luxon';
  import { onMount } from 'svelte';
  import uPlot, { type AlignedData, type Axis } from 'uplot';
  import 'uplot/dist/uPlot.min.css';

  type Props = {
    queue: QueueResponseDto;
    class?: string;
  };

  const { queue, class: className = '' }: Props = $props();

  type Data = number | null;
  type NormalizedData = [
    Data[], // timestamps
    Data[], // failed counts
    Data[], // active counts
    Data[], // waiting counts
  ];

  const normalizeData = (snapshots: QueueSnapshot[]) => {
    const items: NormalizedData = [[], [], [], []];

    for (const { timestamp, snapshot } of snapshots) {
      items[0].push(timestamp);

      const statistics = (snapshot || []).find(({ name }) => name === queue.name)?.statistics;

      if (statistics) {
        items[1].push(statistics.failed);
        items[2].push(statistics.active);
        items[3].push(statistics.waiting + statistics.paused);
      } else {
        items[0].push(timestamp);
        items[1].push(null);
        items[2].push(null);
        items[3].push(null);
      }
    }

    items[0].push(Date.now() + 5000);
    items[1].push(items[1].at(-1) ?? 0);
    items[2].push(items[2].at(-1) ?? 0);
    items[3].push(items[3].at(-1) ?? 0);

    return items;
  };

  const data = $derived(normalizeData(queueManager.snapshots));

  let chartElement: HTMLDivElement | undefined = $state();
  let isDark = $derived(theme.value === Theme.Dark);
  let plot: uPlot;

  const axisOptions: Axis = {
    stroke: () => (isDark ? '#ccc' : 'black'),
    ticks: {
      show: true,
      stroke: () => (isDark ? '#444' : '#ddd'),
    },
    grid: {
      show: true,
      stroke: () => (isDark ? '#444' : '#ddd'),
    },
  };

  const seriesOptions: uPlot.Series = {
    spanGaps: false,
    points: {
      show: false,
    },
    width: 2,
  };

  const options: uPlot.Options = {
    legend: {
      show: false,
    },
    cursor: {
      show: false,
      lock: true,
      drag: {
        setScale: false,
      },
    },
    width: 200,
    height: 200,
    ms: 1,
    pxAlign: true,
    scales: {
      y: {
        distr: 1,
      },
    },
    series: [
      {},
      {
        stroke: '#d94a4a',
        ...seriesOptions,
      },
      {
        stroke: '#4250af',
        ...seriesOptions,
      },
      {
        stroke: '#1075db',
        ...seriesOptions,
      },
    ],

    axes: [
      {
        ...axisOptions,
        values: (plot, values) => {
          return values.map((value) => {
            if (!value) {
              return '';
            }
            return DateTime.fromMillis(value).toFormat('hh:mm:ss');
          });
        },
      },
      axisOptions,
    ],
  };

  const onThemeChange = () => plot?.redraw(false);

  $effect(() => theme.value && onThemeChange());

  onMount(() => {
    plot = new uPlot(options, data as AlignedData, chartElement);
  });

  const update = () => {
    if (plot && chartElement && data[0].length > 0) {
      const now = Date.now();
      const scale = { min: now - chartElement!.clientWidth * 100, max: now };

      plot.setData(data as AlignedData, false);
      plot.setScale('x', scale);
      plot.setSize({ width: chartElement.clientWidth, height: chartElement.clientHeight });
    }

    requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
</script>

<div class="w-full {className}" bind:this={chartElement}>
  {#if data[0].length === 0}
    <LoadingSpinner size="giant" />
  {/if}
</div>
