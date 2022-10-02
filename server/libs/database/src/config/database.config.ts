import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { DataSource } from 'typeorm';
import { AlbumEntity } from '@app/database/entities/album.entity';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { AssetAlbumEntity } from '@app/database/entities/asset-album.entity';
import { DeviceInfoEntity } from '@app/database/entities/device-info.entity';
import { ExifEntity } from '@app/database/entities/exif.entity';
import { SmartInfoEntity } from '@app/database/entities/smart-info.entity';
import { UserEntity } from '@app/database/entities/user.entity';
import { UserAlbumEntity } from '@app/database/entities/user-album.entity';

export const databaseConfig: PostgresConnectionOptions = {
  type: 'postgres',
  host: process.env.DB_HOSTNAME || 'immich_postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE_NAME,
  entities: [
    AlbumEntity,
    AssetEntity,
    AssetAlbumEntity,
    DeviceInfoEntity,
    ExifEntity,
    SmartInfoEntity,
    UserEntity,
    UserAlbumEntity,
  ],
  synchronize: false,
  migrations: [__dirname + '/../migrations/*.{js,ts}'],
  migrationsRun: true,
};

export const dataSource = new DataSource(databaseConfig);
