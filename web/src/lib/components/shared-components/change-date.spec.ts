import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { DateTime } from 'luxon';
import ChangeDate from './change-date.svelte';

describe('ChangeDate component', () => {
  const initialDate = DateTime.fromISO('2024-01-01');
  const initialTimeZone = 'Europe/Berlin';
  const targetDate = DateTime.fromISO('2024-01-01').setZone('UTC+1', {
    keepLocalTime: true,
  });
  const currentInterval = {
    start: DateTime.fromISO('2000-02-01T14:00:00+01:00'),
    end: DateTime.fromISO('2001-02-01T14:00:00+01:00'),
  };
  const onClose = vi.fn();

  const getRelativeInputToggle = () => screen.getByTestId('edit-by-offset-switch');
  const getDateInput = () => screen.getByLabelText('date_and_time') as HTMLInputElement;
  const getTimeZoneInput = () => screen.getByLabelText('timezone') as HTMLInputElement;
  const getCancelButton = () => screen.getByText('cancel');
  const getConfirmButton = () => screen.getByText('confirm');

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  afterAll(async () => {
    await waitFor(() => {
      // check that bits-ui body scroll-lock class is gone
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  test('should render correct values', () => {
    render(ChangeDate, { initialDate, initialTimeZone, onClose });
    expect(getDateInput().value).toBe('2024-01-01T00:00');
    expect(getTimeZoneInput().value).toBe('Europe/Berlin (+01:00)');
  });

  test('calls onConfirm with correct date on confirm', async () => {
    render(ChangeDate, {
      props: { initialDate, initialTimeZone, onClose },
    });

    await fireEvent.click(getConfirmButton());

    expect(onClose).toHaveBeenCalledWith({
      mode: 'absolute',
      date: '2024-01-01T00:00:00.000+01:00',
      dateTime: targetDate,
    });
  });

  test('calls onCancel on cancel', async () => {
    render(ChangeDate, {
      props: { initialDate, initialTimeZone, onClose },
    });

    await fireEvent.click(getCancelButton());

    expect(onClose).toHaveBeenCalled();
  });

  describe('when date is in daylight saving time', () => {
    const dstDate = DateTime.fromISO('2024-07-01');
    const targetDate = DateTime.fromISO('2024-07-01').setZone('UTC+2', {
      keepLocalTime: true,
    });
    test('should render correct timezone with offset', () => {
      render(ChangeDate, { initialDate: dstDate, initialTimeZone, onClose });

      expect(getTimeZoneInput().value).toBe('Europe/Berlin (+02:00)');
    });

    test('calls onConfirm with correct date on confirm', async () => {
      render(ChangeDate, {
        props: { initialDate: dstDate, initialTimeZone, onClose },
      });

      await fireEvent.click(getConfirmButton());

      expect(onClose).toHaveBeenCalledWith({
        mode: 'absolute',
        date: '2024-07-01T00:00:00.000+02:00',
        dateTime: targetDate,
      });
    });
  });

  test('calls onConfirm with correct offset in relative mode', async () => {
    render(ChangeDate, {
      props: { initialDate, initialTimeZone, currentInterval, onClose },
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

    expect(onClose).toHaveBeenCalledWith({
      mode: 'relative',
      duration: days * 60 * 24 + hours * 60 + minutes,
      timeZone: undefined,
    });
  });

  test('calls onConfirm with correct timeZone in relative mode', async () => {
    const user = userEvent.setup();
    render(ChangeDate, {
      props: { initialDate, initialTimeZone, currentInterval, onClose },
    });

    await user.click(getRelativeInputToggle());
    await user.type(getTimeZoneInput(), initialTimeZone);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await user.click(getConfirmButton());
    expect(onClose).toHaveBeenCalledWith({
      mode: 'relative',
      duration: 0,
      timeZone: initialTimeZone,
    });
  });

  test('correctly handles date preview', () => {
    const testCases = [
      {
        timestamp: DateTime.fromISO('2024-01-01T00:00:00.000+01:00', { setZone: true }),
        duration: 0,
        timezone: undefined,
        expectedResult: 'Jan 1, 2024, 12:00 AM GMT+01:00',
      },
      {
        timestamp: DateTime.fromISO('2024-01-01T04:00:00.000+05:00', { setZone: true }),
        duration: 0,
        timezone: undefined,
        expectedResult: 'Jan 1, 2024, 4:00 AM GMT+05:00',
      },
      {
        timestamp: DateTime.fromISO('2024-01-01T00:00:00.000+00:00', { setZone: true }),
        duration: 0,
        timezone: 'Europe/Berlin',
        expectedResult: 'Jan 1, 2024, 1:00 AM GMT+01:00',
      },
      {
        timestamp: DateTime.fromISO('2024-07-01T00:00:00.000+00:00', { setZone: true }),
        duration: 0,
        timezone: 'Europe/Berlin',
        expectedResult: 'Jul 1, 2024, 2:00 AM GMT+02:00',
      },
      {
        timestamp: DateTime.fromISO('2024-01-01T00:00:00.000+01:00', { setZone: true }),
        duration: 1440,
        timezone: undefined,
        expectedResult: 'Jan 2, 2024, 12:00 AM GMT+01:00',
      },
      {
        timestamp: DateTime.fromISO('2024-01-01T00:00:00.000+01:00', { setZone: true }),
        duration: -1440,
        timezone: undefined,
        expectedResult: 'Dec 31, 2023, 12:00 AM GMT+01:00',
      },
      {
        timestamp: DateTime.fromISO('2024-01-01T00:00:00.000-01:00', { setZone: true }),
        duration: -1440,
        timezone: 'America/Anchorage',
        expectedResult: 'Dec 30, 2023, 4:00 PM GMT-09:00',
      },
    ];

    const component = render(ChangeDate, {
      props: { initialDate, initialTimeZone, currentInterval, onClose },
    });

    for (const testCase of testCases) {
      expect(
        component.component.calcNewDate(testCase.timestamp, testCase.duration, testCase.timezone),
        JSON.stringify(testCase),
      ).toBe(testCase.expectedResult);
    }
  });
});
