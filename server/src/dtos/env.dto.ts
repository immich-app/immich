import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsString } from 'class-validator';
import { ImmichEnvironment, LogLevel } from 'src/enum';
import { IsIPRange, Optional, ValidateBoolean } from 'src/validation';

export class EnvDto {
  @IsInt()
  @Optional()
  @Type(() => Number)
  IMMICH_API_METRICS_PORT?: number;

  @IsString()
  @Optional()
  IMMICH_BUILD_DATA?: string;

  @IsString()
  @Optional()
  IMMICH_BUILD?: string;

  @IsString()
  @Optional()
  IMMICH_BUILD_URL?: string;

  @IsString()
  @Optional()
  IMMICH_BUILD_IMAGE?: string;

  @IsString()
  @Optional()
  IMMICH_BUILD_IMAGE_URL?: string;

  @IsString()
  @Optional()
  IMMICH_CONFIG_FILE?: string;

  @IsEnum(ImmichEnvironment)
  @Optional()
  IMMICH_ENV?: ImmichEnvironment;

  @IsString()
  @Optional()
  IMMICH_HOST?: string;

  @ValidateBoolean({ optional: true })
  IMMICH_IGNORE_MOUNT_CHECK_ERRORS?: boolean;

  @IsEnum(LogLevel)
  @Optional()
  IMMICH_LOG_LEVEL?: LogLevel;

  @IsInt()
  @Optional()
  @Type(() => Number)
  IMMICH_MICROSERVICES_METRICS_PORT?: number;

  @IsInt()
  @Optional()
  @Type(() => Number)
  IMMICH_PORT?: number;

  @IsString()
  @Optional()
  IMMICH_REPOSITORY?: string;

  @IsString()
  @Optional()
  IMMICH_REPOSITORY_URL?: string;

  @IsString()
  @Optional()
  IMMICH_SOURCE_REF?: string;

  @IsString()
  @Optional()
  IMMICH_SOURCE_COMMIT?: string;

  @IsString()
  @Optional()
  IMMICH_SOURCE_URL?: string;

  @IsString()
  @Optional()
  IMMICH_TELEMETRY_INCLUDE?: string;

  @IsString()
  @Optional()
  IMMICH_TELEMETRY_EXCLUDE?: string;

  @IsString()
  @Optional()
  IMMICH_THIRD_PARTY_SOURCE_URL?: string;

  @IsString()
  @Optional()
  IMMICH_THIRD_PARTY_BUG_FEATURE_URL?: string;

  @IsString()
  @Optional()
  IMMICH_THIRD_PARTY_DOCUMENTATION_URL?: string;

  @IsString()
  @Optional()
  IMMICH_THIRD_PARTY_SUPPORT_URL?: string;

  @IsIPRange({ requireCIDR: false }, { each: true })
  @Transform(({ value }) =>
    value && typeof value === 'string'
      ? value
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : value,
  )
  @Optional()
  IMMICH_TRUSTED_PROXIES?: string[];

  @IsString()
  @Optional()
  IMMICH_WORKERS_INCLUDE?: string;

  @IsString()
  @Optional()
  IMMICH_WORKERS_EXCLUDE?: string;

  @IsString()
  @Optional()
  DB_DATABASE_NAME?: string;

  @IsString()
  @Optional()
  DB_HOSTNAME?: string;

  @IsString()
  @Optional()
  DB_PASSWORD?: string;

  @IsInt()
  @Optional()
  @Type(() => Number)
  DB_PORT?: number;

  @ValidateBoolean({ optional: true })
  DB_SKIP_MIGRATIONS?: boolean;

  @IsString()
  @Optional()
  DB_URL?: string;

  @IsString()
  @Optional()
  DB_USERNAME?: string;

  @IsEnum(['pgvector', 'pgvecto.rs'])
  @Optional()
  DB_VECTOR_EXTENSION?: 'pgvector' | 'pgvecto.rs';

  @IsString()
  @Optional()
  NO_COLOR?: string;

  @IsString()
  @Optional()
  REDIS_HOSTNAME?: string;

  @IsInt()
  @Optional()
  @Type(() => Number)
  REDIS_PORT?: number;

  @IsInt()
  @Optional()
  @Type(() => Number)
  REDIS_DBINDEX?: number;

  @IsString()
  @Optional()
  REDIS_USERNAME?: string;

  @IsString()
  @Optional()
  REDIS_PASSWORD?: string;

  @IsString()
  @Optional()
  REDIS_SOCKET?: string;

  @IsString()
  @Optional()
  REDIS_URL?: string;
}
