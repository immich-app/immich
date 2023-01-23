export const toBoolean = ({ value }: { value: string }) => {
  console.log(value);
  if (value == 'true') {
    return true;
  } else if (value == 'false') {
    return false;
  }
  return value;
};
