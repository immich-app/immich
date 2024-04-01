import {INotificationRepository} from "src/interfaces/notification.interface";

export const newNotificationRepositoryMock = (): jest.Mocked<INotificationRepository> => {
  return {
    notify: jest.fn(),
  };
};
