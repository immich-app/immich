import { ForeignKeyColumn, Index, Table } from '@immich/sql-tools';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { SharedSpacePersonTable } from 'src/schema/tables/shared-space-person.table';

@Table('shared_space_person_face')
@Index({ name: 'shared_space_person_face_assetFaceId_idx', columns: ['assetFaceId'] })
export class SharedSpacePersonFaceTable {
  @ForeignKeyColumn(() => SharedSpacePersonTable, { onDelete: 'CASCADE', primary: true, index: false })
  personId!: string;

  @ForeignKeyColumn(() => AssetFaceTable, { onDelete: 'CASCADE', primary: true })
  assetFaceId!: string;
}
