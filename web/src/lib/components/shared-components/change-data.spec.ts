import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
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

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('should render correct values', () => {
    render(ChangeDate, { initialDate, initialTimeZone, onCancel, onConfirm });
    expect(getDateInput().value).toBe('2024-01-01T00:00');
    expect(getTimeZoneInput().value).toBe('Europe/Berlin (+01:00)');
  });
});
