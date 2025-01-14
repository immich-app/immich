import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import '@testing-library/jest-dom';
import { render, waitFor, type RenderResult } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { NotificationType, notificationController } from '../notification';
import NotificationList from '../notification-list.svelte';

function _getNotificationListElement(sut: RenderResult<NotificationList>): HTMLAnchorElement | null {
  return sut.container.querySelector('#notification-list');
}

describe('NotificationList component', () => {
  beforeAll(() => {
    Element.prototype.animate = getAnimateMock();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('shows a notification when added and closes it automatically after the delay timeout', async () => {
    const sut: RenderResult<NotificationList> = render(NotificationList, { intro: false });
    const status = await sut.findAllByRole('status');

    expect(status).toHaveLength(1);
    expect(_getNotificationListElement(sut)).not.toBeInTheDocument();

    notificationController.show({
      message: 'Notification',
      type: NotificationType.Info,
      timeout: 1,
    });

    await waitFor(() => expect(_getNotificationListElement(sut)).toBeInTheDocument());
    await waitFor(() => expect(_getNotificationListElement(sut)?.children).toHaveLength(1));
    expect(get(notificationController.notificationList)).toHaveLength(1);

    await waitFor(() => expect(_getNotificationListElement(sut)).not.toBeInTheDocument());
    expect(get(notificationController.notificationList)).toHaveLength(0);
  });
});
