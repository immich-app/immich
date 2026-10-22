const isWordChar = (char: string | undefined) => char !== undefined && /\w/.test(char);

/**
 * Builds the display name of a camera from its EXIF make and model.
 *
 * Many cameras (e.g. Canon) already include the manufacturer in the model
 * (`Canon EOS R6m2`), so prefixing the make again would produce "Canon Canon EOS R6m2".
 * The make is only prepended when the model does not already start with it.
 * Makes such as "NIKON CORPORATION" are compared by their first word, since the
 * model is typically "NIKON D850".
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

  const makeName = trimmedMake.split(/\s+/, 1)[0].toLocaleLowerCase();
  const lowerModel = trimmedModel.toLocaleLowerCase();
  if (lowerModel.startsWith(makeName) && !isWordChar(lowerModel[makeName.length])) {
    return trimmedModel;
  }

  return `${trimmedMake} ${trimmedModel}`;
};
