import { ApiResponseProperty } from '@nestjs/swagger';

export class MigrationStatus {
  @ApiResponseProperty({ type: [String], example: ['file1.zip', 'file2.zip'] })
  res!: string[];
}

export class MigrationBegin {
  @ApiResponseProperty({ type: Boolean, example: true })
  success!: boolean;
}
