import { expect } from 'vitest';

export const errorDto = {
  badRequest: (message: any = null) => ({
    message: message ?? expect.anything(),
  }),
  validationError: (errors?: ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }>) => ({
    message: 'Validation failed',
    errors: errors ? expect.arrayContaining(errors.map((e) => expect.objectContaining(e))) : expect.any(Array),
  }),
};
