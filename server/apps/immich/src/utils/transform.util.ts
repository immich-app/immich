interface IValue {
  value?: string;
}

export const toBoolean = ({ value }: IValue) => {
  if (value == 'true') {
    return true;
  } else if (value == 'false') {
    return false;
  }
  return value;
};

export const toEmail = ({ value }: IValue) => value?.toLowerCase();
