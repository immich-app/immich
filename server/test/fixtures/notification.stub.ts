import { NotificationLevel, NotificationType } from 'src/enum';

export const notificationStub = {
  albumEvent: {
    id: 'notification-album-event',
    type: NotificationType.AlbumInvite,
    description: 'You have been invited to a shared album',
    title: 'Album Invitation',
    createdAt: new Date('2024-01-01'),
    data: { albumId: 'album-id' },
    level: NotificationLevel.Success,
    readAt: null,
  },
};
