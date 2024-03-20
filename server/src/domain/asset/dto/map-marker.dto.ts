import { ValidateBoolean, ValidateDate } from 'src/validation';

export class MapMarkerDto {
  @ValidateBoolean({ optional: true })
  isArchived?: boolean;

  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateDate({ optional: true })
  fileCreatedAfter?: Date;

  @ValidateDate({ optional: true })
  fileCreatedBefore?: Date;

  @ValidateBoolean({ optional: true })
  withPartners?: boolean;
}
