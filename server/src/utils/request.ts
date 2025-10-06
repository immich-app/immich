import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

export const fromChecksum = (checksum: string): Buffer => {
  return Buffer.from(checksum, checksum.length === 28 ? 'base64' : 'hex');
};

export const fromMaybeArray = <T>(param: T | T[]) => (Array.isArray(param) ? param[0] : param);

export function validateSyncOrReject<T extends object>(cls: new () => T, obj: any): T {
  const dto = plainToInstance(cls, obj, { excludeExtraneousValues: true });
  const errors = validateSync(dto);
  if (errors.length === 0) {
    return dto;
  }

  const constraints = [];
  for (const error of errors) {
    if (error.constraints) {
      constraints.push(...Object.values(error.constraints));
    }

    if (!error.children) {
      continue;
    }

    for (const child of error.children) {
      if (child.constraints) {
        constraints.push(...Object.values(child.constraints));
      }
    }
  }
  throw new BadRequestException(constraints);
}
