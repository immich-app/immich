export const toBoolean = ({ value }: { value: string }) => {
  if (value == 'true') {
    return true;
  } else if (value == 'false') {
    return false;
  }
  return value;
};
