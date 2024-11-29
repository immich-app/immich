import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { DateTime } from 'luxon';
import ChangeDate from './change-date.svelte';

describe('ChangeDate component', () => {
  const initialDate = DateTime.fromISO('2024-01-01');
  const initialTimeZone = 'Europe/Berlin';
  const onCancel = vi.fn();
  const onConfirm = vi.fn();

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

  test('should render correct values', () => {
    render(ChangeDate, { initialDate, initialTimeZone, onCancel, onConfirm });
    expect(getDateInput().value).toBe('2024-01-01T00:00');
    expect(getTimeZoneInput().value).toBe('Europe/Berlin (+01:00)');
  });

  test('calls onConfirm with correct date on confirm', async () => {
    render(ChangeDate, {
      props: { initialDate, initialTimeZone, onCancel, onConfirm },
    });

    await fireEvent.click(getConfirmButton());

    expect(onConfirm).toHaveBeenCalledWith('2024-01-01T00:00:00.000+01:00');
  });

  test('calls onCancel on cancel', async () => {
    render(ChangeDate, {
      props: { initialDate, initialTimeZone, onCancel, onConfirm },
    });

    await fireEvent.click(getCancelButton());

    expect(onCancel).toHaveBeenCalled();
  });

  describe('when date is in daylight saving time', () => {
    const dstDate = DateTime.fromISO('2024-07-01');

    test('should render correct timezone with offset', () => {
      render(ChangeDate, { initialDate: dstDate, initialTimeZone, onCancel, onConfirm });

      expect(getTimeZoneInput().value).toBe('Europe/Berlin (+02:00)');
    });

    test('calls onConfirm with correct date on confirm', async () => {
      render(ChangeDate, {
        props: { initialDate: dstDate, initialTimeZone, onCancel, onConfirm },
      });

      await fireEvent.click(getConfirmButton());

      expect(onConfirm).toHaveBeenCalledWith('2024-07-01T00:00:00.000+02:00');
    });
  });
});
