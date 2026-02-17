import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import { calcNewDate } from '$lib/modals/timezone-utils';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { DateTime } from 'luxon';
import AssetSelectionChangeDateModal from './AssetSelectionChangeDateModal.svelte';

describe('DateSelectionModal component', () => {
  const initialDate = DateTime.fromISO('2024-01-01');
  const initialTimeZone = 'Europe/Berlin';

  const onClose = vi.fn();

  const getRelativeInputToggle = () => screen.getByTestId('edit-by-offset-switch');
  const getDateInput = () => screen.getByLabelText('date_and_time') as HTMLInputElement;
  const getTimeZoneInput = () => screen.getByLabelText('timezone') as HTMLInputElement;
  const getCancelButton = () => screen.getByRole('button', { name: /cancel/i });
  const getConfirmButton = () => screen.getByRole('button', { name: /confirm/i });

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
  });

  afterAll(async () => {
    await waitFor(() => {
      // check that bits-ui body scroll-lock class is gone
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  test('should render correct values', () => {
    render(AssetSelectionChangeDateModal, {
      initialDate,
      initialTimeZone,
      assets: [],

      onClose,
    });
    expect(getDateInput().value).toBe('2024-01-01T00:00');
    expect(getTimeZoneInput().value).toBe('Europe/Berlin (+01:00)');
  });

  test('calls onConfirm with correct date on confirm', async () => {
    render(AssetSelectionChangeDateModal, {
      props: { initialDate, initialTimeZone, assets: [], onClose },
    });

    await fireEvent.click(getConfirmButton());

    expect(sdkMock.updateAssets).toHaveBeenCalledWith({
      assetBulkUpdateDto: {
        ids: [],
        dateTimeOriginal: '2024-01-01T00:00:00.000+01:00',
      },
    });
  });

  test('calls onCancel on cancel', async () => {
    render(AssetSelectionChangeDateModal, {
      props: { initialDate, initialTimeZone, assets: [], onClose },
    });

    await fireEvent.click(getCancelButton());

    expect(onClose).toHaveBeenCalled();
  });

  test('does not fall back to UTC when datetime-local value has no seconds', async () => {
    render(AssetSelectionChangeDateModal, {
      props: { initialDate, initialTimeZone, assets: [], onClose },
    });

    await fireEvent.input(getDateInput(), { target: { value: '2024-01-01T00:00' } });
    await fireEvent.blur(getDateInput());

    expect(getTimeZoneInput().value).toBe('Europe/Berlin (+01:00)');

    await fireEvent.focus(getTimeZoneInput());
    expect(screen.queryByText('no_results')).not.toBeInTheDocument();
  });

  test('does not fall back to UTC when datetime-local value has no milliseconds', async () => {
    render(AssetSelectionChangeDateModal, {
      props: { initialDate, initialTimeZone, assets: [], onClose },
    });

    await fireEvent.input(getDateInput(), { target: { value: '2024-01-01T00:00:00' } });
    await fireEvent.blur(getDateInput());

    expect(getTimeZoneInput().value).toBe('Europe/Berlin (+01:00)');

    await fireEvent.focus(getTimeZoneInput());
    expect(screen.queryByText('no_results')).not.toBeInTheDocument();
  });

  describe('when date is in daylight saving time', () => {
    const dstDate = DateTime.fromISO('2024-07-01');

    test('should render correct timezone with offset', () => {
      render(AssetSelectionChangeDateModal, {
        initialDate: dstDate,
        initialTimeZone,
        assets: [],
        onClose,
      });

      expect(getTimeZoneInput().value).toBe('Europe/Berlin (+02:00)');
    });

    test('calls onConfirm with correct date on confirm', async () => {
      render(AssetSelectionChangeDateModal, {
        props: { initialDate: dstDate, initialTimeZone, assets: [], onClose },
      });

      await fireEvent.click(getConfirmButton());

      expect(sdkMock.updateAssets).toHaveBeenCalledWith({
        assetBulkUpdateDto: {
          ids: [],
          dateTimeOriginal: '2024-07-01T00:00:00.000+02:00',
        },
      });
    });
  });

  test('calls onConfirm with correct offset in relative mode', async () => {
    render(AssetSelectionChangeDateModal, {
      props: { initialDate, initialTimeZone, assets: [], onClose },
    });

    await fireEvent.click(getRelativeInputToggle());

    const dayInput = screen.getByPlaceholderText('days');
    const hoursInput = screen.getByPlaceholderText('hours');
    const minutesInput = screen.getByPlaceholderText('minutes');

    const days = 5;
    const hours = 4;
    const minutes = 3;

    await fireEvent.input(dayInput, { target: { value: days } });
    await fireEvent.input(hoursInput, { target: { value: hours } });
    await fireEvent.input(minutesInput, { target: { value: minutes } });

    await fireEvent.click(getConfirmButton());

    expect(sdkMock.updateAssets).toHaveBeenCalledWith({
      assetBulkUpdateDto: {
        ids: [],
        dateTimeRelative: days * 60 * 24 + hours * 60 + minutes,
        timeZone: 'Europe/Berlin',
      },
    });
  });

  test('calls onConfirm with correct timeZone in relative mode', async () => {
    const user = userEvent.setup();
    render(AssetSelectionChangeDateModal, {
      props: { initialDate, initialTimeZone, assets: [], onClose },
    });

    await user.click(getRelativeInputToggle());
    await user.type(getTimeZoneInput(), initialTimeZone);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await user.click(getConfirmButton());

    expect(sdkMock.updateAssets).toHaveBeenCalledWith({
      assetBulkUpdateDto: {
        ids: [],
        dateTimeRelative: 0,
        timeZone: 'Europe/Berlin',
      },
    });
  });

  test('correctly handles date preview', () => {
    const testCases = [
      {
        timestamp: DateTime.fromISO('2024-01-01T00:00:00.000+01:00', { setZone: true }),
        duration: 0,
        timezone: undefined,
        expectedResult: '2024-01-01T00:00:00.000',
      },
      {
        timestamp: DateTime.fromISO('2024-01-01T04:00:00.000+05:00', { setZone: true }),
        duration: 0,
        timezone: undefined,
        expectedResult: '2024-01-01T04:00:00.000',
      },
      {
        timestamp: DateTime.fromISO('2024-01-01T00:00:00.000+00:00', { setZone: true }),
        duration: 0,
        timezone: 'Europe/Berlin',
        expectedResult: '2024-01-01T01:00:00.000',
      },
      {
        timestamp: DateTime.fromISO('2024-07-01T00:00:00.000+00:00', { setZone: true }),
        duration: 0,
        timezone: 'Europe/Berlin',
        expectedResult: '2024-07-01T02:00:00.000',
      },
      {
        timestamp: DateTime.fromISO('2024-01-01T00:00:00.000+01:00', { setZone: true }),
        duration: 1440,
        timezone: undefined,
        expectedResult: '2024-01-02T00:00:00.000',
      },
      {
        timestamp: DateTime.fromISO('2024-01-01T00:00:00.000+01:00', { setZone: true }),
        duration: -1440,
        timezone: undefined,
        expectedResult: '2023-12-31T00:00:00.000',
      },
      {
        timestamp: DateTime.fromISO('2024-01-01T00:00:00.000-01:00', { setZone: true }),
        duration: -1440,
        timezone: 'America/Anchorage',
        expectedResult: '2023-12-30T16:00:00.000',
      },
    ];

    for (const testCase of testCases) {
      expect(calcNewDate(testCase.timestamp, testCase.duration, testCase.timezone), JSON.stringify(testCase)).toBe(
        testCase.expectedResult,
      );
    }
  });
});
