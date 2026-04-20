import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { DateTime } from 'luxon';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import AssetChangeDateModal from './AssetChangeDateModal.svelte';

describe('AssetChangeDateModal component', () => {
  const initialDate = DateTime.fromISO('2026-03-19T23:31:30.112');
  const initialTimeZone = 'Europe/Lisbon';
  const onClose = vi.fn();

  const getDateInput = async () => (await screen.findByDisplayValue('2026-03-19T23:31:30.112')) as HTMLInputElement;
  const getTimeZoneInput = () => screen.getByRole('combobox', { name: /timezone/i }) as HTMLInputElement;

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  test('preserves the selected timezone when changing the datetime', async () => {
    render(AssetChangeDateModal, {
      props: {
        initialDate,
        initialTimeZone,
        timezoneInput: true,
        asset: { id: 'asset-id' } as never,
        onClose,
      },
    });

    const timezoneInput = getTimeZoneInput();
    const datetimeInput = await getDateInput();

    const initialTimezoneValue = timezoneInput.value;

    await fireEvent.focus(timezoneInput);
    await fireEvent.input(timezoneInput, { target: { value: 'Pacific/Pitcairn' } });

    const option = await screen.findByText(/Pacific\/Pitcairn/i);
    await fireEvent.click(option);

    expect(timezoneInput.value).toBe('Pacific/Pitcairn (-08:00)');
    expect(timezoneInput.value).not.toBe(initialTimezoneValue);

    const beforeDatetime = datetimeInput.value;

    await fireEvent.input(datetimeInput, {
      target: { value: '2026-03-19T23:31:31.113' },
    });
    await fireEvent.change(datetimeInput, {
      target: { value: '2026-03-19T23:31:31.113' },
    });

    expect(datetimeInput.value).not.toBe(beforeDatetime);
    expect(timezoneInput.value).toBe('Pacific/Pitcairn (-08:00)');
  });
});
