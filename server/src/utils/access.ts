import { Permission } from 'src/enum';
import { setIsSuperset } from 'src/utils/set';

export type GrantedRequest = {
  requested: Permission[];
  current: Permission[];
};

export const isGranted = ({ requested, current }: GrantedRequest) => {
  if (current.includes(Permission.All)) {
    return true;
  }

  return setIsSuperset(new Set(current), new Set(requested));
};
