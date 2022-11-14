import { jest, describe, it } from '@jest/globals';
import { render, cleanup, RenderResult } from '@testing-library/svelte';
import { NotificationType } from '../notification';
import NotificationCard from '../notification-card.svelte';
import '@testing-library/jest-dom';

describe('NotificationCard component', () => {
	let sut: RenderResult<NotificationCard>;

	it('disposes timeout if already removed from the DOM', () => {
		jest.spyOn(window, 'clearTimeout');

		sut = render(NotificationCard, {
			notificationInfo: {
				id: 1234,
				message: 'Notification message',
				timeout: 1000,
				type: NotificationType.Info,
				action: { type: 'discard' }
			}
		});

		cleanup();
		expect(window.clearTimeout).toHaveBeenCalledTimes(1);
	});

	it('shows message and title', () => {
		sut = render(NotificationCard, {
			notificationInfo: {
				id: 1234,
				message: 'Notification message',
				timeout: 1000,
				type: NotificationType.Info,
				action: { type: 'discard' }
			}
		});

		expect(sut.getByTestId('title')).toHaveTextContent('Info');
		expect(sut.getByTestId('message')).toHaveTextContent('Notification message');
	});
});
