import { Selectable } from 'kysely';
import { AlbumUserTable } from 'src/schema/tables/album-user.table';
import { AlbumTable } from 'src/schema/tables/album.table';
import { AssetEditTable } from 'src/schema/tables/asset-edit.table';
import { AssetExifTable } from 'src/schema/tables/asset-exif.table';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { AssetFileTable } from 'src/schema/tables/asset-file.table';
import { AssetTable } from 'src/schema/tables/asset.table';
import { PersonTable } from 'src/schema/tables/person.table';
import { SharedLinkTable } from 'src/schema/tables/shared-link.table';
import { StackTable } from 'src/schema/tables/stack.table';
import { UserTable } from 'src/schema/tables/user.table';

export type FactoryBuilder<T, R extends T = T> = (builder: T) => R;

export type AssetLike = Partial<Selectable<AssetTable>>;
export type AssetExifLike = Partial<Selectable<AssetExifTable>>;
export type AssetEditLike = Partial<Selectable<AssetEditTable>>;
export type AssetFileLike = Partial<Selectable<AssetFileTable>>;
export type AlbumLike = Partial<Selectable<AlbumTable>>;
export type AlbumUserLike = Partial<Selectable<AlbumUserTable>>;
export type SharedLinkLike = Partial<Selectable<SharedLinkTable>>;
export type UserLike = Partial<Selectable<UserTable>>;
export type AssetFaceLike = Partial<Selectable<AssetFaceTable>>;
export type PersonLike = Partial<Selectable<PersonTable>>;
export type StackLike = Partial<Selectable<StackTable>>;
