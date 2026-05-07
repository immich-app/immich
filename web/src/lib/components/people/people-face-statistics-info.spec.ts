import { clearPeopleFaceStatisticsInfoCache } from '$lib/components/people/people-face-statistics-info-cache';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import { locale } from '$lib/stores/preferences.store';
import type { PeopleFaceStatisticsResponseDto } from '@immich/sdk';
import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Component } from 'svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import PeopleFaceStatisticsInfo from './people-face-statistics-info.svelte';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

const statistics = (overrides: Partial<PeopleFaceStatisticsResponseDto> = {}): PeopleFaceStatisticsResponseDto => ({
  assignedHiddenFaceCount: 3456,
  assignedVisibleFaceCount: 2345,
  detectedFaceCount: 1234,
  namedVisiblePersonCount: 154,
  unassignedFaceCount: 4567,
  ...overrides,
});

const renderInfo = (
  props: Partial<{
    cacheKey: string;
    loadStatistics: () => Promise<PeopleFaceStatisticsResponseDto>;
  }> = {},
) => {
  const loadStatistics = props.loadStatistics ?? vi.fn().mockResolvedValue(statistics());
  const componentProps = {
    cacheKey: props.cacheKey ?? 'people',
    loadStatistics,
  };
  return {
    loadStatistics,
    ...render(
      TestWrapper as Component<{
        component: typeof PeopleFaceStatisticsInfo;
        componentProps: typeof componentProps;
      }>,
      {
        props: {
          component: PeopleFaceStatisticsInfo,
          componentProps,
        },
      },
    ),
  };
};

describe('PeopleFaceStatisticsInfo', () => {
  beforeAll(async () => {
    register('en-US', () => import('$i18n/en.json'));
    await init({ fallbackLocale: 'en-US', initialLocale: 'en-US' });
    await waitLocale('en-US');
  });

  beforeEach(() => {
    clearPeopleFaceStatisticsInfoCache();
    locale.set('en-US');
  });

  afterEach(() => {
    cleanup();
  });

  it('renders an accessible icon button trigger without loading statistics on initial render', () => {
    const loadStatistics = vi.fn().mockResolvedValue(statistics());

    renderInfo({ loadStatistics });

    expect(screen.getByRole('button', { name: 'View face statistics details' })).toBeInTheDocument();
    expect(loadStatistics).not.toHaveBeenCalled();
  });

  it('shows loading text while the first request is pending', async () => {
    const request = deferred<PeopleFaceStatisticsResponseDto>();
    const loadStatistics = vi.fn(() => request.promise);

    renderInfo({ loadStatistics });
    await userEvent.click(screen.getByRole('button', { name: 'View face statistics details' }));

    expect(loadStatistics).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Loading face statistics');
  });

  it('exposes expanded state, controls, and keyboard activation through the button', async () => {
    const request = deferred<PeopleFaceStatisticsResponseDto>();
    const loadStatistics = vi.fn(() => request.promise);

    renderInfo({ loadStatistics });

    const trigger = screen.getByRole('button', { name: 'View face statistics details' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const detailsId = trigger.getAttribute('aria-controls');
    expect(detailsId).toBeTruthy();

    trigger.focus();
    await userEvent.keyboard('{Enter}');

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'View face statistics details' })).toHaveAttribute('id', detailsId);
  });

  it('uses unique control ids for multiple instances', () => {
    renderInfo({ cacheKey: 'people-a' });
    renderInfo({ cacheKey: 'people-b' });

    const controls = screen
      .getAllByRole('button', { name: 'View face statistics details' })
      .map((trigger) => trigger.getAttribute('aria-controls'));

    expect(new Set(controls).size).toBe(2);
  });

  it('renders the details surface as a compact dialog for narrow viewports', async () => {
    renderInfo();
    await userEvent.click(screen.getByRole('button', { name: 'View face statistics details' }));

    const dialog = screen.getByRole('dialog', { name: 'View face statistics details' });
    expect(dialog).toHaveClass('fixed');
    expect(dialog).not.toHaveClass('absolute');
    expect(dialog).toHaveClass('w-72');
    expect(dialog).toHaveClass('max-w-[calc(100vw-1rem)]');
  });

  it('closes the details surface on Escape and outside click', async () => {
    renderInfo();

    const trigger = screen.getByRole('button', { name: 'View face statistics details' });
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'View face statistics details' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'View face statistics details' })).not.toBeInTheDocument();

    await userEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'View face statistics details' })).toBeInTheDocument();

    await fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog', { name: 'View face statistics details' })).not.toBeInTheDocument();
  });

  it('renders the diagnostic rows with locale-formatted values after a successful load', async () => {
    renderInfo({ loadStatistics: vi.fn().mockResolvedValue(statistics()) });

    await userEvent.click(screen.getByRole('button', { name: 'View face statistics details' }));

    expect(await screen.findByText('Detected faces')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('Assigned to visible people')).toBeInTheDocument();
    expect(screen.getByText('2,345')).toBeInTheDocument();
    expect(screen.getByText('Named visible people')).toBeInTheDocument();
    expect(screen.getByText('154')).toBeInTheDocument();
    expect(screen.getByText('Assigned to hidden people')).toBeInTheDocument();
    expect(screen.getByText('3,456')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('4,567')).toBeInTheDocument();
  });

  it('uses cached statistics when reopening with the same cache key', async () => {
    const loadStatistics = vi.fn().mockResolvedValue(statistics());
    renderInfo({ cacheKey: 'people', loadStatistics });

    const trigger = screen.getByRole('button', { name: 'View face statistics details' });
    await userEvent.click(trigger);
    expect(await screen.findByText('1,234')).toBeInTheDocument();
    await userEvent.click(trigger);
    await userEvent.click(trigger);

    expect(loadStatistics).toHaveBeenCalledTimes(1);
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('loads fresh statistics for a new cache key and does not show stale rows', async () => {
    const loadStatistics = vi
      .fn<() => Promise<PeopleFaceStatisticsResponseDto>>()
      .mockResolvedValueOnce(statistics({ detectedFaceCount: 1111 }))
      .mockResolvedValueOnce(statistics({ detectedFaceCount: 2222 }));
    const view = renderInfo({ cacheKey: 'people-a', loadStatistics });

    await userEvent.click(screen.getByRole('button', { name: 'View face statistics details' }));
    expect(await screen.findByText('1,111')).toBeInTheDocument();

    await view.rerender({
      component: PeopleFaceStatisticsInfo,
      componentProps: { cacheKey: 'people-b', loadStatistics },
    });

    expect(screen.queryByText('1,111')).not.toBeInTheDocument();
    expect(loadStatistics).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('2,222')).toBeInTheDocument();
  });

  it('caches a slow old response under its original key without displaying it for the new key', async () => {
    const firstRequest = deferred<PeopleFaceStatisticsResponseDto>();
    const secondRequest = deferred<PeopleFaceStatisticsResponseDto>();
    const loadStatistics = vi
      .fn<() => Promise<PeopleFaceStatisticsResponseDto>>()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    const view = renderInfo({ cacheKey: 'old-key', loadStatistics });

    await userEvent.click(screen.getByRole('button', { name: 'View face statistics details' }));
    await view.rerender({
      component: PeopleFaceStatisticsInfo,
      componentProps: { cacheKey: 'new-key', loadStatistics },
    });

    firstRequest.resolve(statistics({ detectedFaceCount: 1111 }));
    await Promise.resolve();

    expect(screen.queryByText('1,111')).not.toBeInTheDocument();
    expect(loadStatistics).toHaveBeenCalledTimes(2);

    secondRequest.resolve(statistics({ detectedFaceCount: 2222 }));
    expect(await screen.findByText('2,222')).toBeInTheDocument();

    await view.rerender({
      component: PeopleFaceStatisticsInfo,
      componentProps: { cacheKey: 'old-key', loadStatistics },
    });
    expect(await screen.findByText('1,111')).toBeInTheDocument();
    expect(loadStatistics).toHaveBeenCalledTimes(2);
  });

  it('renders an alert after a rejected load and leaves the trigger usable', async () => {
    const loadStatistics = vi
      .fn<() => Promise<PeopleFaceStatisticsResponseDto>>()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(statistics({ detectedFaceCount: 1234 }));

    renderInfo({ loadStatistics });

    const trigger = screen.getByRole('button', { name: 'View face statistics details' });
    await userEvent.click(trigger);

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load face statistics');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(trigger);
    await userEvent.click(trigger);

    expect(await screen.findByText('1,234')).toBeInTheDocument();
    expect(loadStatistics).toHaveBeenCalledTimes(2);
  });
});
