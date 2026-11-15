const whitespace = /\s+/;

const isWordChar = (char: string | undefined) => char !== undefined && /\w/.test(char);

/**
Builds the display name of a camera from its EXIF make and model.

Many cameras (e.g. Canon) already include the manufacturer in the model
(`Canon EOS R6m2`), so prefixing the make again would produce "Canon Canon EOS R6m2".
The make is only prepended when the model does not already start with it.
Makes made up of several words are matched word by word, since the model usually
repeats only part of them: `NIKON CORPORATION` / `NIKON D850` and
`EASTMAN KODAK COMPANY` / `KODAK EASYSHARE C875`.
*/
export const getCameraName = (make?: string | null, model?: string | null): string => {
  const trimmedMake = make?.trim() ?? '';
  const trimmedModel = model?.trim() ?? '';

  if (!trimmedMake) {
    return trimmedModel;
  }

  if (!trimmedModel) {
    return trimmedMake;
  }

  const lowerModel = trimmedModel.toLowerCase();
  const modelIncludesMake = trimmedMake
    .toLowerCase()
    .split(whitespace)
    .some((word) => lowerModel.startsWith(word) && !isWordChar(lowerModel[word.length]));

  return modelIncludesMake ? trimmedModel : `${trimmedMake} ${trimmedModel}`;
};
