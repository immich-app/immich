import { UserEntity } from '@app/database';

function createUserUtils() {
  const isReadyForDeletion = (user: UserEntity): boolean => {
    if (user.deletedAt == null) return false;
    const millisecondsInDay = 86400000;
    // get this number (7 days) from some configuration perhaps ?
    const millisecondsDeleteWait = millisecondsInDay * 7;

    const millisecondsSinceDelete = new Date().getTime() - (Date.parse(user.deletedAt.toString()) ?? 0);
    return millisecondsSinceDelete >= millisecondsDeleteWait;
  };
  return { isReadyForDeletion };
}

export const userUtils = createUserUtils();
