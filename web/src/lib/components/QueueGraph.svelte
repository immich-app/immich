<script lang="ts">
  import { queueManager } from '$lib/managers/queue-manager.svelte';
  import type { QueueResponseDto } from '@immich/sdk';
  import { LoadingSpinner, Theme, theme } from '@immich/ui';
  import { debounce } from 'lodash-es';
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
  type NormalizedData = [Data[], Data[], Data[], Data[]];

  const normalizeData = () => {
    const items: NormalizedData = [[], [], [], []];

    for (const { timestamp, snapshot } of queueManager.snapshots) {
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

    return items;
  };

  let data = $derived(normalizeData());

  let chartElement: HTMLDivElement | undefined = $state();
  let tooltipElement: HTMLDivElement | undefined = $state();
  let chartId = $state('');
  let tooltipDate = $state('');
  let tooltipValue = $state('');
  let mousePosition = $state<{ x: number; y: number }>({ x: 0, y: 0 });
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
      x: {
        // dir: -1,
      },
    },
    series: [
      {},
      {
        label: 'Failed',
        stroke: '#d94a4a',
        ...seriesOptions,
      },
      {
        label: 'Active',
        stroke: '#4250af',
        ...seriesOptions,
      },
      {
        label: 'Waiting',
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

  const onresize = debounce(() => {
    if (chartElement && plot) {
      plot.setSize({ width: chartElement.clientWidth, height: chartElement.clientHeight });
    }
  }, 150);

  onMount(() => {
    plot = new uPlot(options, data as AlignedData, chartElement);
  });

  const onmousemove = (event: MouseEvent) => {
    mousePosition.x = event.clientX;
    mousePosition.y = event.clientY;
  };

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

<svelte:window {onresize} {onmousemove} />

<div class="w-full {className}">
  <div class="h-full w-full relative flex items-center justify-center" bind:this={chartElement}>
    {#if data[0].length === 0}
      <LoadingSpinner size="giant" />
    {/if}
  </div>
  <div
    bind:this={tooltipElement}
    style="top: {mousePosition.y - 32}px; left: {mousePosition.x - 112}px"
    class:hidden={!(chartId && tooltipValue)}
    class="absolute border shadow-md text-xs w-[100px] rounded-lg bg-light py-2 px-3 text-center font-mono"
  >
    <p>{tooltipDate}</p>
    <p class="font-bold">{tooltipValue}</p>
  </div>
</div>
