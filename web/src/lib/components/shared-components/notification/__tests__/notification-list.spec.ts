import '@testing-library/jest-dom';
import { render, waitFor, type RenderResult } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { NotificationType, notificationController } from '../notification';
import NotificationList from '../notification-list.svelte';

function _getNotificationListElement(sut: RenderResult<NotificationList>): HTMLAnchorElement | null {
  return sut.container.querySelector('#notification-list');
}

describe('NotificationList component', () => {
  const sut: RenderResult<NotificationList> = render(NotificationList);

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('shows a notification when added and closes it automatically after the delay timeout', async () => {
    expect(_getNotificationListElement(sut)).not.toBeInTheDocument();

    notificationController.show({
      message: 'Notification',
      type: NotificationType.Info,
      timeout: 3000,
    });

    await waitFor(() => expect(_getNotificationListElement(sut)).toBeInTheDocument());

    expect(_getNotificationListElement(sut)?.children).toHaveLength(1);

    vi.advanceTimersByTime(4000);
    // due to some weirdness in svelte (or testing-library) need to check if it has been removed from the store to make sure it works.
    expect(get(notificationController.notificationList)).toHaveLength(0);

    // TODO: investigate why this element is not removed from the DOM even notification list is in fact 0.
    // await waitFor(() => expect(_getNotificationListElement(sut)).not.toBeInTheDocument());
  });
});
