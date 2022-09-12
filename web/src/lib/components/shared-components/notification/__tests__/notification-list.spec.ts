import { jest, describe, it } from '@jest/globals';
import { render, RenderResult, waitFor } from '@testing-library/svelte';
import { notificationController, NotificationType } from '../notification';
import { get } from 'svelte/store';
import NotificationList from '../notification-list.svelte';
import '@testing-library/jest-dom';

function _getNotificationListElement(
	sut: RenderResult<NotificationList>
): HTMLAnchorElement | null {
	return sut.container.querySelector('#notification-list');
}

describe('NotificationList component', () => {
	const sut: RenderResult<NotificationList> = render(NotificationList);

	beforeAll(() => {
		jest.useFakeTimers();
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	it('shows a notification when added and closes it automatically after the delay timeout', async () => {
		expect(_getNotificationListElement(sut)).not.toBeInTheDocument();

		notificationController.show({
			message: 'Notification',
			type: NotificationType.Info,
			timeout: 3000
		});

		await waitFor(() => expect(_getNotificationListElement(sut)).toBeInTheDocument());

		expect(_getNotificationListElement(sut)?.children).toHaveLength(1);

		jest.advanceTimersByTime(3000);
		// due to some weirdness in svelte (or testing-library) need to check if it has been removed from the store to make sure it works.
		expect(get(notificationController.notificationList)).toHaveLength(0);

		await waitFor(() => expect(_getNotificationListElement(sut)).not.toBeInTheDocument());
	});
});
