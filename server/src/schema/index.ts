import { immich_uuid_v7, updated_at } from 'src/schema/functions';
import { ApiKeyTable } from 'src/schema/tables/api-key.table';
import { SessionTable } from 'src/schema/tables/session.table';
import { SystemMetadataTable } from 'src/schema/tables/system-metadata.table';
import { UserTable } from 'src/schema/tables/user.table';
import { Database, Extensions, Generated, Int8 } from 'src/sql-tools';

@Extensions(['uuid-ossp', 'plpgsql', 'vector'])
@Database({ name: 'immich' })
export class ImmichDatabase {
  tables = [
    UserTable,
    SessionTable,
    ApiKeyTable,
    SystemMetadataTable,
  ];

  functions = [
    immich_uuid_v7,
    updated_at,
  ];

  enum = [];
}

export interface Migrations {
  id: Generated<number>;
  name: string;
  timestamp: Int8;
}

export interface DB {
  api_key: ApiKeyTable;
  migrations: Migrations;
  session: SessionTable;
  system_metadata: SystemMetadataTable;
  user: UserTable;
}
