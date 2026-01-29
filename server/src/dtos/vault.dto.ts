import { ApiProperty } from '@nestjs/swagger';

export class VaultStatusResponseDto {
  @ApiProperty()
  hasVault!: boolean;

  @ApiProperty()
  isUnlocked!: boolean;

  @ApiProperty({ type: 'integer', nullable: true })
  vaultVersion!: number | null;
}

export class VaultMigrationResponseDto {
  @ApiProperty()
  queuedCount!: number;
}
